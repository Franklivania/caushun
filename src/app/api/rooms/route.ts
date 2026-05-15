import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { fail, ok } from "@/lib/api-response"
import { db } from "@/db"
import { properties, rooms, tenancies } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { randomBytes } from "crypto"

const createSchema = z.object({
  propertyId: z.string().uuid(),
  roomNumber: z.string().trim().min(1),
  depositAmount: z.number().positive(),
})

function generateUniqueCode(roomNumber: string): string {
  const suffix = randomBytes(3).toString("hex").toUpperCase()
  return `${roomNumber.replace(/\s+/g, "-").toUpperCase()}-${suffix}`
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const landlordProperties = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.landlordId, session.user.id))

  if (landlordProperties.length === 0) return NextResponse.json(ok([]))

  const propertyIds = landlordProperties.map((p) => p.id)
  const data = await db.query.rooms.findMany({
    where: (r, { inArray: _inArray }) => _inArray(r.propertyId, propertyIds),
    with: {
      property: true,
      tenancies: { orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 1, with: { tenant: true } },
    },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  })

  return NextResponse.json(ok(data))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json(fail("Invalid request", parsed.error.flatten()), { status: 400 })

  // Verify ownership
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, parsed.data.propertyId),
  })
  if (!property || property.landlordId !== session.user.id) {
    return NextResponse.json(fail("Property not found or unauthorized"), { status: 403 })
  }

  const uniqueCode = generateUniqueCode(parsed.data.roomNumber)
  const [room] = await db
    .insert(rooms)
    .values({
      propertyId: parsed.data.propertyId,
      roomNumber: parsed.data.roomNumber,
      uniqueCode,
      depositAmount: parsed.data.depositAmount.toFixed(2),
    })
    .returning()

  await db.insert(tenancies).values({ roomId: room.id })
  return NextResponse.json(ok(room, "Room created"))
}

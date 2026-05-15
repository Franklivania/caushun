import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { fail, ok } from "@/lib/api-response"
import { db } from "@/db"
import { properties } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  state: z.string().trim().min(1),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const data = await db.query.properties.findMany({
    where: eq(properties.landlordId, session.user.id),
    with: { rooms: true },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })

  return NextResponse.json(ok(data.map((p) => ({ ...p, roomCount: p.rooms.length }))))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json(fail("Invalid request", parsed.error.flatten()), { status: 400 })

  const [property] = await db
    .insert(properties)
    .values({ landlordId: session.user.id, ...parsed.data })
    .returning()

  return NextResponse.json(ok(property, "Property created"))
}

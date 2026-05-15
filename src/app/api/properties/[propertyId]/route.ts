import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { properties, tenancies } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
    with: {
      rooms: {
        with: {
          tenancies: {
            limit: 1,
            orderBy: [desc(tenancies.createdAt)],
            with: { tenant: true },
          },
        },
      },
    },
  })
  if (!property) return NextResponse.json(fail("Not found"), { status: 404 })
  return NextResponse.json(ok(property))
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { propertyId } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid data", parsed.error.flatten()), { status: 400 })
  }

  const [updated] = await db
    .update(properties)
    .set(parsed.data)
    .where(eq(properties.id, propertyId))
    .returning()

  return NextResponse.json(ok(updated, "Property updated"))
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { propertyId } = await params
  await db.delete(properties).where(eq(properties.id, propertyId))
  return NextResponse.json(ok(null, "Property deleted"))
}

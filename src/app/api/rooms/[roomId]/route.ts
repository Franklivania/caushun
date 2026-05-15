import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { rooms } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"
import { z } from "zod"

const patchSchema = z.object({
  roomNumber: z.string().min(1).optional(),
  depositAmount: z.string().optional(),
  status: z.enum(["vacant", "occupied", "vacated"]).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: {
      property: true,
      tenancies: {
        limit: 1,
        orderBy: (t, { desc: d }) => [d(t.createdAt)],
        with: { tenant: true },
      },
    },
  })
  if (!room) return NextResponse.json(fail("Not found"), { status: 404 })
  return NextResponse.json(ok(room))
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { roomId } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid data", parsed.error.flatten()), { status: 400 })
  }

  const [updated] = await db
    .update(rooms)
    .set(parsed.data)
    .where(eq(rooms.id, roomId))
    .returning()

  return NextResponse.json(ok(updated, "Room updated"))
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { roomId } = await params
  await db.delete(rooms).where(eq(rooms.id, roomId))
  return NextResponse.json(ok(null, "Room deleted"))
}

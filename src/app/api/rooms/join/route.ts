import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { rooms, tenancies } from "@/db/schema"
import { eq, isNull, and } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"
import { z } from "zod"

const schema = z.object({ roomCode: z.string().trim().min(1) })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json(fail("Invalid request"), { status: 400 })

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.uniqueCode, parsed.data.roomCode.toUpperCase()),
  })
  if (!room) {
    return NextResponse.json(
      fail("Room not found. Check the code and try again."),
      { status: 404 }
    )
  }
  if (room.status !== "vacant") {
    return NextResponse.json(fail("This room is not available."), { status: 409 })
  }

  const pendingTenancy = await db.query.tenancies.findFirst({
    where: and(eq(tenancies.roomId, room.id), isNull(tenancies.tenantId)),
  })

  if (pendingTenancy) {
    await db
      .update(tenancies)
      .set({ tenantId: session.user.id })
      .where(eq(tenancies.id, pendingTenancy.id))
  } else {
    await db.insert(tenancies).values({ roomId: room.id, tenantId: session.user.id })
  }

  await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, room.id))

  return NextResponse.json(ok(null, "Joined room successfully"))
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { rooms, tenancies } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tenancyId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { tenancyId } = await params

  const tenancy = await db.query.tenancies.findFirst({
    where: eq(tenancies.id, tenancyId),
    with: { room: { with: { property: true } } },
  })

  if (!tenancy) return NextResponse.json(fail("Tenancy not found"), { status: 404 })

  if (tenancy.room.property.landlordId !== session.user.id)
    return NextResponse.json(fail("Forbidden"), { status: 403 })

  if (tenancy.escrowStatus !== "resolved")
    return NextResponse.json(fail("Escrow must be resolved before evicting"), { status: 409 })

  if (tenancy.room.status === "vacant")
    return NextResponse.json(fail("Room is already vacant"), { status: 409 })

  await db.update(rooms).set({ status: "vacant" }).where(eq(rooms.id, tenancy.roomId))

  if (!tenancy.moveOutDate) {
    await db
      .update(tenancies)
      .set({ moveOutDate: new Date() })
      .where(eq(tenancies.id, tenancyId))
  }

  return NextResponse.json(ok(null, "Tenant evicted — room is now vacant"))
}

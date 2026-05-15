import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users, properties, rooms, tenancies, disputes } from "@/db/schema"
import { count, sql, isNull } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const [
    [totalUsers],
    [totalProperties],
    [totalRooms],
    [totalTenancies],
    [openDisputes],
    escrowStatusCounts,
    monthlyVolume,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(properties),
    db.select({ count: count() }).from(rooms),
    db.select({ count: count() }).from(tenancies),
    db.select({ count: count() }).from(disputes).where(isNull(disputes.resolvedAt)),
    db
      .select({ status: tenancies.escrowStatus, count: count() })
      .from(tenancies)
      .groupBy(tenancies.escrowStatus),
    db
      .select({
        month: sql<string>`to_char(created_at, 'Mon YYYY')`,
        count: count(),
      })
      .from(tenancies)
      .groupBy(sql`to_char(created_at, 'Mon YYYY')`)
      .orderBy(sql`min(created_at)`)
      .limit(6),
  ])

  return NextResponse.json(
    ok({
      totals: {
        users: totalUsers.count,
        properties: totalProperties.count,
        rooms: totalRooms.count,
        tenancies: totalTenancies.count,
        openDisputes: openDisputes.count,
      },
      escrowStatusCounts,
      monthlyVolume,
    })
  )
}

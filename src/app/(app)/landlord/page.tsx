import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatCardSkeleton } from "@/components/skeletons/stat-card-skeleton"
import { Building2, BedDouble, Users, Wallet, Plus } from "lucide-react"
import { Suspense } from "react"
import { db } from "@/db"
import { properties, rooms, tenancies } from "@/db/schema"
import { eq, count, and } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"

async function LandlordStats({ userId }: { userId: string }) {
  const [propertiesCount, roomsCount, activeCount] = await Promise.all([
    db.select({ count: count() }).from(properties).where(eq(properties.landlordId, userId)),
    db
      .select({ count: count() })
      .from(rooms)
      .innerJoin(properties, eq(rooms.propertyId, properties.id))
      .where(eq(properties.landlordId, userId)),
    db
      .select({ count: count() })
      .from(tenancies)
      .innerJoin(rooms, eq(tenancies.roomId, rooms.id))
      .innerJoin(properties, eq(rooms.propertyId, properties.id))
      .where(and(eq(properties.landlordId, userId), eq(tenancies.escrowStatus, "funded"))),
  ])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Properties" value={propertiesCount[0].count} icon={<Building2 size={18} />} />
      <StatCard label="Rooms" value={roomsCount[0].count} icon={<BedDouble size={18} />} />
      <StatCard label="Active Escrows" value={activeCount[0].count} icon={<Wallet size={18} />} />
      <StatCard label="Tenants" value="—" icon={<Users size={18} />} />
    </div>
  )
}

async function RecentRooms({ userId }: { userId: string }) {
  const recentRooms = await db.query.rooms.findMany({
    with: {
      property: true,
      tenancies: { orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 1 },
    },
    where: (r, { inArray }) =>
      inArray(
        r.propertyId,
        db.select({ id: properties.id }).from(properties).where(eq(properties.landlordId, userId))
      ),
    limit: 5,
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  })

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Rooms
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recentRooms.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 pb-6">
            No rooms yet.{" "}
            <Link href="/landlord/properties" className="underline hover:no-underline">Add your first property.</Link>
          </p>
        ) : (
          <div className="divide-y divide-border">
            {recentRooms.map((room) => {
              const latestTenancy = room.tenancies[0]
              return (
                <Link
                  key={room.id}
                  href={`/landlord/rooms/${room.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium font-mono">{room.uniqueCode}</p>
                    <p className="text-xs text-muted-foreground">{room.property.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{Number(room.depositAmount).toFixed(0)} USDC</span>
                    {latestTenancy && <EscrowStatusBadge status={latestTenancy.escrowStatus} />}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function LandlordOverviewPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Your properties and escrow snapshot"
        actions={
          <Link href="/landlord/properties">
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus size={15} />
              Add property
            </Button>
          </Link>
        }
      />

      <Suspense fallback={<StatCardSkeleton count={4} />}>
        <LandlordStats userId={session.user.id} />
      </Suspense>

      <Suspense fallback={<div className="h-48 rounded-xl border border-border animate-pulse bg-muted/20" />}>
        <RecentRooms userId={session.user.id} />
      </Suspense>
    </div>
  )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Suspense } from "react"
import { db } from "@/db"
import { properties, rooms, tenancies, users } from "@/db/schema"
import { eq, and, isNotNull, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import Link from "next/link"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { RefreshButton } from "@/components/layout/refresh-button"

async function TenantsList({ userId }: { userId: string }) {
  const landlordProperties = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.landlordId, userId))

  const propertyIds = landlordProperties.map((p) => p.id)
  if (propertyIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No tenants yet. Invite tenants to your rooms first.
      </p>
    )
  }

  const tenantData = await db.query.tenancies.findMany({
    where: (t, { inArray, isNotNull: inn }) =>
      inArray(
        t.roomId,
        db.select({ id: rooms.id }).from(rooms).where(
          inArray(rooms.propertyId, propertyIds)
        )
      ),
    with: {
      tenant: true,
      room: { with: { property: true } },
    },
    orderBy: [desc(tenancies.createdAt)],
  })

  const activeTenants = tenantData.filter((t) => t.tenant !== null)

  if (activeTenants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No tenants have joined yet.
      </p>
    )
  }

  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activeTenants.map((tenancy) => (
            <Link
              key={tenancy.id}
              href={`/landlord/rooms/${tenancy.roomId}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {tenancy.tenant?.fullName ?? tenancy.tenant?.name ?? "Unknown"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground font-mono">
                    {tenancy.room.uniqueCode}
                  </p>
                  <span className="text-muted-foreground/40">·</span>
                  <p className="text-xs text-muted-foreground">
                    {tenancy.room.property.name}
                  </p>
                </div>
                {tenancy.tenant?.walletAddress && (
                  <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">
                    {tenancy.tenant.walletAddress.slice(0, 10)}…{tenancy.tenant.walletAddress.slice(-4)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                <EscrowStatusBadge status={tenancy.escrowStatus} />
                <p className="text-xs text-muted-foreground">
                  {new Date(tenancy.moveInDate).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function TenantsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="All tenants across your properties"
        breadcrumbs={[{ label: "Landlord", href: "/landlord" }, { label: "Tenants" }]}
        actions={<RefreshButton />}
      />
      <Suspense fallback={<TableSkeleton columns={3} rows={8} />}>
        <TenantsList userId={session.user.id} />
      </Suspense>
    </div>
  )
}

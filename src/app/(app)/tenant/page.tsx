import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent } from "@/components/ui/card"
import { RoomStatusBadge, EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { BedDouble, ArrowRight } from "lucide-react"
import Link from "next/link"
import { JoinRoomDialog } from "@/components/tenant/join-room-dialog"
import { RefreshButton } from "@/components/layout/refresh-button"

export default async function TenantPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const allTenancies = await db.query.tenancies.findMany({
    where: eq(tenancies.tenantId, session.user.id),
    orderBy: [desc(tenancies.createdAt)],
    with: {
      room: { with: { property: true } },
    },
  })

  if (allTenancies.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Rooms"
          description="All rooms you are or have been a tenant in"
          breadcrumbs={[{ label: "Tenant" }, { label: "My Rooms" }]}
          actions={<><RefreshButton /><JoinRoomDialog /></>}
        />
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <BedDouble className="mx-auto mb-4 size-10 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">No rooms yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask your landlord for an invite link to join a room.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeCount = allTenancies.filter((t) => t.escrowStatus !== "resolved").length
  const totalLocked = allTenancies
    .filter((t) => t.escrowStatus !== "resolved")
    .reduce((sum, t) => sum + Number(t.room.depositAmount), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Rooms"
        description="All rooms you are or have been a tenant in"
        breadcrumbs={[{ label: "Tenant" }, { label: "My Rooms" }]}
        actions={<><RefreshButton /><JoinRoomDialog /></>}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total rooms", value: String(allTenancies.length) },
          { label: "Active tenancies", value: String(activeCount) },
          { label: "USDC locked", value: `${totalLocked.toFixed(0)} USDC` },
        ].map(({ label, value }) => (
          <Card key={label} className="border-border">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {label}
              </p>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTenancies.map((tenancy) => (
          <Link
            key={tenancy.id}
            href={`/tenant/rooms/${tenancy.id}`}
            className="group block"
          >
            <Card className="border-border h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-semibold text-base leading-tight">
                      {tenancy.room.uniqueCode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tenancy.room.property.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 truncate max-w-45">
                      {tenancy.room.property.address}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground/40 group-hover:text-primary shrink-0 mt-0.5 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <RoomStatusBadge status={tenancy.room.status} />
                  <EscrowStatusBadge status={tenancy.escrowStatus} />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-3">
                  <span>Deposit</span>
                  <span className="font-semibold text-foreground">
                    {Number(tenancy.room.depositAmount).toFixed(0)} USDC
                  </span>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Move-in</span>
                  <span>{new Date(tenancy.moveInDate).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

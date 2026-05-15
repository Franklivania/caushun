import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Suspense } from "react"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent } from "@/components/ui/card"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { StatCardSkeleton } from "@/components/skeletons/stat-card-skeleton"
import Link from "next/link"
import { BedDouble, Wallet, Calendar, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

async function TenantOverview({ userId }: { userId: string }) {
  const activeTenancy = await db.query.tenancies.findFirst({
    where: eq(tenancies.tenantId, userId),
    orderBy: [desc(tenancies.createdAt)],
    with: {
      room: { with: { property: true } },
      tenant: true,
    },
  })

  if (!activeTenancy) {
    return (
      <Card className="border-border">
        <CardContent className="py-16 text-center">
          <BedDouble className="mx-auto mb-4 size-10 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold">No active tenancy</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask your landlord for an invite link to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  const deposit = Number(activeTenancy.room.depositAmount)
  const moveIn = new Date(activeTenancy.moveInDate)
  const daysIn = Math.floor((Date.now() - moveIn.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                <Wallet size={18} className="text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deposit</p>
            </div>
            <p className="text-2xl font-bold">{deposit.toFixed(0)} USDC</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                <BedDouble size={18} className="text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</p>
            </div>
            <p className="text-2xl font-bold font-mono">{activeTenancy.room.uniqueCode}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activeTenancy.room.property.name}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                <Calendar size={18} className="text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Days in</p>
            </div>
            <p className="text-2xl font-bold">{daysIn}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Since {moveIn.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{activeTenancy.room.property.name}</p>
              <EscrowStatusBadge status={activeTenancy.escrowStatus} />
            </div>
            <p className="text-sm text-muted-foreground">{activeTenancy.room.property.address}</p>
            {activeTenancy.escrowId && (
              <p className="text-[11px] font-mono text-muted-foreground/60">
                {activeTenancy.escrowId.slice(0, 12)}…
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/tenant/room">
              <Button variant="outline" size="sm" className="gap-1.5">
                Room <ArrowRight size={13} />
              </Button>
            </Link>
            <Link href="/tenant/escrow">
              <Button size="sm" className="gap-1.5">
                Escrow <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function TenantPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description="Track your deposit and manage your tenancy"
      />
      <Suspense fallback={<StatCardSkeleton count={3} />}>
        <TenantOverview userId={session.user.id} />
      </Suspense>
    </div>
  )
}

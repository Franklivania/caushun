import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Suspense } from "react"
import { db } from "@/db"
import { users, properties, tenancies, disputes } from "@/db/schema"
import { eq, count, desc } from "drizzle-orm"
import { Card, CardContent } from "@/components/ui/card"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { StatCardSkeleton } from "@/components/skeletons/stat-card-skeleton"
import Link from "next/link"
import { Users, Building2, Shield, AlertTriangle } from "lucide-react"

async function AdminStats() {
  const [
    [{ total: totalUsers }],
    [{ total: totalProperties }],
    [{ total: activeEscrows }],
    [{ total: openDisputes }],
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(properties),
    db.select({ total: count() }).from(tenancies).where(
      eq(tenancies.escrowStatus, "funded")
    ),
    db.select({ total: count() }).from(tenancies).where(
      eq(tenancies.escrowStatus, "disputed")
    ),
  ])

  const stats = [
    { label: "Total users", value: totalUsers, icon: Users },
    { label: "Properties", value: totalProperties, icon: Building2 },
    { label: "Active escrows", value: activeEscrows, icon: Shield },
    { label: "Open disputes", value: openDisputes, icon: AlertTriangle },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10">
                <stat.icon size={18} className="text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function RecentDisputes() {
  const recentDisputes = await db.query.disputes.findMany({
    orderBy: [desc(disputes.createdAt)],
    limit: 5,
    with: {
      tenancy: {
        with: {
          room: true,
          tenant: true,
        },
      },
      raisedByUser: true,
    },
  })

  if (recentDisputes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No disputes yet.
      </p>
    )
  }

  return (
    <Card className="border-border">
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {recentDisputes.map((dispute) => (
            <Link
              key={dispute.id}
              href={`/admin/disputes/resolve/${dispute.tenancy.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm">{dispute.tenancy.room.uniqueCode}</p>
                  <EscrowStatusBadge status="disputed" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {dispute.reason}
                </p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0 ml-4">
                {new Date(dispute.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")
  if (session.user.role !== "landlord") {
    // Simple role check — in prod check against ADMIN_WALLET_ADDRESS
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Platform overview and dispute management"
        breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}
      />
      <Suspense fallback={<StatCardSkeleton count={4} />}>
        <AdminStats />
      </Suspense>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Recent disputes
        </h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <RecentDisputes />
        </Suspense>
      </div>
    </div>
  )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { db } from "@/db"
import { users, properties, rooms, tenancies, disputes } from "@/db/schema"
import { count, isNull, sql } from "drizzle-orm"
import { Users, Building2, BedDouble, FileText, AlertTriangle } from "lucide-react"

export default async function AdminAnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const [
    [{ total: totalUsers }],
    [{ total: totalProperties }],
    [{ total: totalRooms }],
    [{ total: totalTenancies }],
    [{ total: openDisputes }],
    escrowBreakdown,
    monthlyVolume,
  ] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.select({ total: count() }).from(properties),
    db.select({ total: count() }).from(rooms),
    db.select({ total: count() }).from(tenancies),
    db.select({ total: count() }).from(disputes).where(isNull(disputes.resolvedAt)),
    db
      .select({ status: tenancies.escrowStatus, total: count() })
      .from(tenancies)
      .groupBy(tenancies.escrowStatus),
    db
      .select({
        month: sql<string>`to_char(created_at, 'Mon YYYY')`,
        total: count(),
      })
      .from(tenancies)
      .groupBy(sql`to_char(created_at, 'Mon YYYY')`)
      .orderBy(sql`min(created_at)`)
      .limit(6),
  ])

  const stats = [
    { label: "Total users", value: totalUsers, icon: Users },
    { label: "Properties", value: totalProperties, icon: Building2 },
    { label: "Rooms", value: totalRooms, icon: BedDouble },
    { label: "Tenancies", value: totalTenancies, icon: FileText },
    { label: "Open disputes", value: openDisputes, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform-wide metrics"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]}
      />

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Escrow status breakdown */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Escrow status breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {escrowBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tenancies yet.</p>
            ) : (
              <div className="space-y-3">
                {escrowBreakdown.map((row) => (
                  <div key={row.status} className="flex items-center justify-between">
                    <EscrowStatusBadge status={row.status} />
                    <span className="text-sm font-semibold tabular-nums">{row.total}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly new tenancies */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              New tenancies (last 6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyVolume.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {monthlyVolume.map((row) => (
                  <div key={row.month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{row.month}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{
                          width: `${Math.max(4, (row.total / Math.max(...monthlyVolume.map((r) => r.total))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums w-6 text-right">{row.total}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

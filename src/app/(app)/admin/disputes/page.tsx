import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { disputeColumns, type DisputeRow } from "@/components/admin/dispute-columns"
import { Suspense } from "react"
import { RefreshButton } from "@/components/layout/refresh-button"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

async function DisputesTable({ page, pageSize }: { page: number; pageSize: number }) {
  const disputed = await db.query.tenancies.findMany({
    where: eq(tenancies.escrowStatus, "disputed"),
    orderBy: [desc(tenancies.createdAt)],
    with: {
      room: { with: { property: { with: { landlord: true } } } },
      tenant: true,
      disputes: {
        orderBy: (d, { desc: descFn }) => [descFn(d.createdAt)],
        limit: 1,
      },
    },
  })

  const rows: DisputeRow[] = disputed.map((t) => ({
    tenancyId: t.id,
    disputeId: t.disputes[0]?.id ?? null,
    roomCode: t.room.uniqueCode,
    propertyName: t.room.property.name,
    reason: t.disputes[0]?.reason ?? "No reason recorded",
    tenantName: t.tenant?.fullName ?? t.tenant?.name ?? null,
    landlordName:
      t.room.property.landlord?.fullName ?? t.room.property.landlord?.name ?? null,
    raisedAt: t.disputes[0]?.createdAt ?? t.createdAt,
    resolved: false,
  }))

  const total = rows.length
  const offset = (page - 1) * pageSize
  const paged = rows.slice(offset, offset + pageSize)

  return (
    <DataTable
      columns={disputeColumns}
      data={paged}
      page={page}
      pageSize={pageSize}
      pageCount={Math.max(1, Math.ceil(total / pageSize))}
      total={total}
    />
  )
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(sp.pageSize ?? 10)))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="All disputed tenancies — click Resolve to mediate"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Disputes" }]}
        actions={<RefreshButton />}
      />
      <Suspense fallback={<TableSkeleton columns={7} rows={pageSize} />}>
        <DisputesTable page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

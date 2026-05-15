import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { disputeColumns } from "@/components/admin/dispute-columns"
import { Suspense } from "react"
import { db } from "@/db"
import { disputes } from "@/db/schema"
import { count, desc } from "drizzle-orm"

async function DisputesTable({ page, pageSize }: { page: number; pageSize: number }) {
  const offset = (page - 1) * pageSize

  const [[{ total }], data] = await Promise.all([
    db.select({ total: count() }).from(disputes),
    db.query.disputes.findMany({
      orderBy: [desc(disputes.createdAt)],
      limit: pageSize,
      offset,
      with: {
        tenancy: {
          with: {
            room: { with: { property: { with: { landlord: true } } } },
            tenant: true,
          },
        },
        raisedByUser: true,
      },
    }),
  ])

  const rows = data.map((d) => ({
    id: d.id,
    roomCode: d.tenancy.room.uniqueCode,
    reason: d.reason,
    tenantName: d.tenancy.tenant?.fullName ?? d.tenancy.tenant?.name ?? null,
    landlordWallet: d.tenancy.room.property.landlord?.walletAddress ?? null,
    raisedAt: d.createdAt,
    resolved: d.resolvedAt !== null,
  }))

  return (
    <DataTable
      columns={disputeColumns}
      data={rows}
      page={page}
      pageSize={pageSize}
      pageCount={Math.ceil(total / pageSize)}
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
      <PageHeader title="Disputes" description="All raised disputes" />
      <Suspense fallback={<TableSkeleton columns={6} rows={pageSize} />}>
        <DisputesTable page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

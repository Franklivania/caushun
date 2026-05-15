import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { tenancyColumns } from "@/components/admin/tenancy-columns"
import { Suspense } from "react"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { count, desc } from "drizzle-orm"

async function TenanciesTable({ page, pageSize }: { page: number; pageSize: number }) {
  const offset = (page - 1) * pageSize

  const [[{ total }], data] = await Promise.all([
    db.select({ total: count() }).from(tenancies),
    db.query.tenancies.findMany({
      orderBy: [desc(tenancies.createdAt)],
      limit: pageSize,
      offset,
      with: {
        room: { with: { property: true } },
        tenant: true,
      },
    }),
  ])

  const rows = data.map((t) => ({
    id: t.id,
    roomCode: t.room.uniqueCode,
    propertyName: t.room.property.name,
    tenantName: t.tenant?.fullName ?? t.tenant?.name ?? null,
    escrowStatus: t.escrowStatus,
    contractId: t.escrowId,
    moveInDate: t.moveInDate,
  }))

  return (
    <DataTable
      columns={tenancyColumns}
      data={rows}
      page={page}
      pageSize={pageSize}
      pageCount={Math.ceil(total / pageSize)}
      total={total}
    />
  )
}

export default async function AdminTenanciesPage({
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
      <PageHeader title="Tenancies" description="All room tenancies across the platform" />
      <Suspense fallback={<TableSkeleton columns={6} rows={pageSize} />}>
        <TenanciesTable page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

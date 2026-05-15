import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { propertyColumns } from "@/components/landlord/property-columns"
import { Suspense } from "react"
import { db } from "@/db"
import { properties, rooms } from "@/db/schema"
import { count, desc, eq } from "drizzle-orm"

async function PropertiesTable({ page, pageSize }: { page: number; pageSize: number }) {
  const offset = (page - 1) * pageSize

  const [[{ total }], data] = await Promise.all([
    db.select({ total: count() }).from(properties),
    db.query.properties.findMany({
      orderBy: [desc(properties.createdAt)],
      limit: pageSize,
      offset,
    }),
  ])

  const propertyIds = data.map((p) => p.id)
  const roomCounts =
    propertyIds.length > 0
      ? await Promise.all(
          propertyIds.map((id) =>
            db.select({ count: count() }).from(rooms).where(eq(rooms.propertyId, id))
          )
        )
      : []

  const rows = data.map((p, i) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    state: p.state,
    roomCount: roomCounts[i]?.[0]?.count ?? 0,
    createdAt: p.createdAt,
  }))

  return (
    <DataTable
      columns={propertyColumns}
      data={rows}
      page={page}
      pageSize={pageSize}
      pageCount={Math.ceil(total / pageSize)}
      total={total}
    />
  )
}

export default async function AdminPropertiesPage({
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
      <PageHeader title="Properties" description="All properties across the platform" />
      <Suspense fallback={<TableSkeleton columns={5} rows={pageSize} />}>
        <PropertiesTable page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

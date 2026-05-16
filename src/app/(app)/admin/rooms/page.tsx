import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { roomColumns } from "@/components/landlord/room-columns"
import { Suspense } from "react"
import { RefreshButton } from "@/components/layout/refresh-button"
import { db } from "@/db"
import { rooms } from "@/db/schema"
import { count, desc } from "drizzle-orm"

async function RoomsTable({ page, pageSize }: { page: number; pageSize: number }) {
  const offset = (page - 1) * pageSize

  const [[{ total }], data] = await Promise.all([
    db.select({ total: count() }).from(rooms),
    db.query.rooms.findMany({
      orderBy: [desc(rooms.createdAt)],
      limit: pageSize,
      offset,
      with: {
        property: true,
        tenancies: {
          orderBy: (t, { desc: d }) => [d(t.createdAt)],
          limit: 1,
          with: { tenant: true },
        },
      },
    }),
  ])

  const rows = data.map((r) => {
    const latest = r.tenancies[0]
    return {
      id: r.id,
      uniqueCode: r.uniqueCode,
      propertyName: r.property.name,
      depositAmount: r.depositAmount,
      status: r.status,
      escrowStatus: latest?.escrowStatus ?? null,
      tenantName: latest?.tenant?.fullName ?? latest?.tenant?.name ?? null,
      tenantWallet: latest?.tenant?.walletAddress ?? null,
      tenancyId: latest?.id ?? null,
      contractId: latest?.escrowId ?? null,
    }
  })

  return (
    <DataTable
      columns={roomColumns}
      data={rows}
      page={page}
      pageSize={pageSize}
      pageCount={Math.ceil(total / pageSize)}
      total={total}
    />
  )
}

export default async function AdminRoomsPage({
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
      <PageHeader title="Rooms" description="All rooms across the platform" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Rooms" }]} actions={<RefreshButton />} />
      <Suspense fallback={<TableSkeleton columns={7} rows={pageSize} />}>
        <RoomsTable page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

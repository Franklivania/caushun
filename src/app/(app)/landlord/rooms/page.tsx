import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { RoomsDataTable } from "@/components/landlord/rooms-data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { Suspense } from "react"
import { db } from "@/db"
import { properties, rooms } from "@/db/schema"
import { eq, count, desc, inArray } from "drizzle-orm"

async function RoomsTable({ userId, page, pageSize }: { userId: string; page: number; pageSize: number }) {
  const landlordProperties = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.landlordId, userId))

  const propertyIds = landlordProperties.map((p) => p.id)

  if (propertyIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No rooms yet. Add a property first.
      </p>
    )
  }

  const offset = (page - 1) * pageSize

  const [totalRes, data] = await Promise.all([
    db.select({ count: count() }).from(rooms).where(inArray(rooms.propertyId, propertyIds)),
    db.query.rooms.findMany({
      where: (r, { inArray: _in }) => _in(r.propertyId, propertyIds),
      with: {
        property: true,
        tenancies: { orderBy: (t, { desc: d }) => [d(t.createdAt)], limit: 1, with: { tenant: true } },
      },
      orderBy: [desc(rooms.createdAt)],
      limit: pageSize,
      offset,
    }),
  ])

  const total = totalRes[0].count
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
    <RoomsDataTable
      data={rows}
      page={page}
      pageSize={pageSize}
      pageCount={Math.ceil(total / pageSize)}
      total={total}
    />
  )
}

export default async function RoomsPage({
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
        title="Rooms"
        description="All rooms across your properties"
        breadcrumbs={[{ label: "Landlord", href: "/landlord" }, { label: "Rooms" }]}
      />
      <Suspense fallback={<TableSkeleton columns={7} rows={pageSize} />}>
        <RoomsTable userId={session.user.id} page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

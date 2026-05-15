import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { RoomsDataTable } from "@/components/landlord/rooms-data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { CreateRoomDialog } from "@/components/landlord/create-room-dialog"
import { Suspense } from "react"
import { db } from "@/db"
import { properties, rooms } from "@/db/schema"
import { eq, count, desc } from "drizzle-orm"
import { Card, CardContent } from "@/components/ui/card"

async function RoomsTable({
  propertyId,
  page,
  pageSize,
}: {
  propertyId: string
  page: number
  pageSize: number
}) {
  const offset = (page - 1) * pageSize

  const [totalRes, data] = await Promise.all([
    db.select({ count: count() }).from(rooms).where(eq(rooms.propertyId, propertyId)),
    db.query.rooms.findMany({
      where: eq(rooms.propertyId, propertyId),
      with: {
        tenancies: { orderBy: (t, { desc: d }) => [d(t.createdAt)], limit: 1, with: { tenant: true } },
        property: true,
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

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const { propertyId } = await params
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(sp.pageSize ?? 10)))

  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
  })

  if (!property || property.landlordId !== session.user.id) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        description={`${property.address} · ${property.state}`}
        breadcrumbs={[
          { label: "Properties", href: "/landlord/properties" },
          { label: property.name },
        ]}
        actions={<CreateRoomDialog propertyId={propertyId} />}
      />

      <Card className="border-border">
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Address</p>
            <p className="mt-1 font-medium">{property.address}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">State</p>
            <p className="mt-1 font-medium">{property.state}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Rooms</h2>
        <Suspense fallback={<TableSkeleton columns={7} rows={pageSize} />}>
          <RoomsTable propertyId={propertyId} page={page} pageSize={pageSize} />
        </Suspense>
      </div>
    </div>
  )
}

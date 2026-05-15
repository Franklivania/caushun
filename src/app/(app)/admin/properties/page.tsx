import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { db } from "@/db"
import { disputes } from "@/db/schema"
import { isNull } from "drizzle-orm"
import { AdminPropertiesTable, type PropertyRow } from "@/components/admin/admin-properties-table"

export default async function AdminPropertiesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const [allProperties, openDisputes] = await Promise.all([
    db.query.properties.findMany({
      with: {
        landlord: true,
        rooms: {
          with: {
            tenancies: {
              orderBy: (t, { desc }) => [desc(t.createdAt)],
              limit: 1,
              with: { tenant: true },
            },
          },
        },
      },
    }),
    db.query.disputes.findMany({
      where: isNull(disputes.resolvedAt),
      with: { tenancy: { with: { room: true } } },
    }),
  ])

  const disputeCountByProperty = openDisputes.reduce<Record<string, number>>((acc, d) => {
    const pid = d.tenancy.room.propertyId
    acc[pid] = (acc[pid] ?? 0) + 1
    return acc
  }, {})

  const rows: PropertyRow[] = allProperties.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    state: p.state,
    landlordId: p.landlordId,
    landlordName: p.landlord?.fullName ?? p.landlord?.name ?? "—",
    landlordWallet: p.landlord?.walletAddress ?? null,
    totalRooms: p.rooms.length,
    occupiedRooms: p.rooms.filter((r) => r.status === "occupied").length,
    escrowVolume: p.rooms.reduce((sum, r) => sum + Number(r.depositAmount), 0),
    openDisputes: disputeCountByProperty[p.id] ?? 0,
    rooms: p.rooms.map((r) => ({
      id: r.id,
      uniqueCode: r.uniqueCode,
      roomNumber: r.roomNumber,
      status: r.status,
      depositAmount: Number(r.depositAmount),
      tenantName:
        r.tenancies[0]?.tenant?.fullName ?? r.tenancies[0]?.tenant?.name ?? null,
      escrowStatus: r.tenancies[0]?.escrowStatus ?? null,
    })),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="All landlord properties across the platform"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Properties" }]}
      />
      <AdminPropertiesTable rows={rows} />
    </div>
  )
}

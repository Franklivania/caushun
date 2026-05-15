import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { PropertiesDataTable } from "@/components/landlord/properties-data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { CreatePropertyDialog } from "@/components/landlord/create-property-dialog"
import { Suspense } from "react"
import { db } from "@/db"
import { properties } from "@/db/schema"
import { eq, count, desc } from "drizzle-orm"

async function PropertiesTable({ userId, page, pageSize }: { userId: string; page: number; pageSize: number }) {
  const offset = (page - 1) * pageSize

  const [totalRes, data] = await Promise.all([
    db.select({ count: count() }).from(properties).where(eq(properties.landlordId, userId)),
    db.query.properties.findMany({
      where: eq(properties.landlordId, userId),
      with: { rooms: true },
      orderBy: [desc(properties.createdAt)],
      limit: pageSize,
      offset,
    }),
  ])

  const total = totalRes[0].count
  const rows = data.map((p) => ({ ...p, roomCount: p.rooms.length }))

  return (
    <PropertiesDataTable
      data={rows}
      page={page}
      pageSize={pageSize}
      pageCount={Math.ceil(total / pageSize)}
      total={total}
    />
  )
}

export default async function PropertiesPage({
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
        title="Properties"
        description="Manage your rental properties"
        actions={<CreatePropertyDialog />}
      />
      <Suspense fallback={<TableSkeleton columns={6} rows={pageSize} />}>
        <PropertiesTable userId={session.user.id} page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

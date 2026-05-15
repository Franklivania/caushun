import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { userColumns } from "@/components/admin/user-columns"
import { Suspense } from "react"
import { db } from "@/db"
import { users } from "@/db/schema"
import { count, desc } from "drizzle-orm"

async function UsersTable({ page, pageSize }: { page: number; pageSize: number }) {
  const offset = (page - 1) * pageSize

  const [[{ total }], data] = await Promise.all([
    db.select({ total: count() }).from(users),
    db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: pageSize,
      offset,
    }),
  ])

  const rows = data.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    walletAddress: u.walletAddress,
    role: u.role,
    onboardingComplete: u.onboardingComplete,
    createdAt: u.createdAt,
  }))

  return (
    <DataTable
      columns={userColumns}
      data={rows}
      page={page}
      pageSize={pageSize}
      pageCount={Math.ceil(total / pageSize)}
      total={total}
    />
  )
}

export default async function AdminUsersPage({
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
      <PageHeader title="Users" description="All registered users" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]} />
      <Suspense fallback={<TableSkeleton columns={6} rows={pageSize} />}>
        <UsersTable page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  )
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { count, desc, ilike, or } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 10)))
  const search = searchParams.get("search") ?? ""

  const where = search
    ? or(
        ilike(users.email, `%${search}%`),
        ilike(users.fullName, `%${search}%`),
        ilike(users.walletAddress, `%${search}%`)
      )
    : undefined

  const [total, data] = await Promise.all([
    db.select({ count: count() }).from(users).where(where),
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ])

  return NextResponse.json(
    ok({
      data,
      total: total[0].count,
      pageCount: Math.ceil(total[0].count / pageSize),
    })
  )
}

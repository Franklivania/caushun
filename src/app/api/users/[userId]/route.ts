import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { fail, ok } from "@/lib/api-response"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { userId } = await ctx.params
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return NextResponse.json(fail("Not found"), { status: 404 })

  return NextResponse.json(ok(user))
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { userId } = await ctx.params

  // Prevent self-deletion
  if (userId === session.user.id) {
    return NextResponse.json(fail("Cannot delete your own account"), { status: 400 })
  }

  try {
    await db.delete(users).where(eq(users.id, userId))
    return NextResponse.json(ok(null, "User deleted"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

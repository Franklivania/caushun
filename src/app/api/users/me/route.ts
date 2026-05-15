import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"
import { z } from "zod"

const patchSchema = z.object({
  walletAddress: z.string().length(56).nullable().optional(),
  role: z.enum(["landlord", "tenant", "admin"]).optional(),
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  onboardingComplete: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(fail("Unauthorized"), { status: 401 })
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user) return NextResponse.json(fail("User not found"), { status: 404 })

  return NextResponse.json(ok(user))
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(fail("Unauthorized"), { status: 401 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid data", parsed.error.flatten()), { status: 400 })
  }

  if (parsed.data.walletAddress) {
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.walletAddress, parsed.data.walletAddress))
    if (conflict && conflict.id !== session.user.id) {
      return NextResponse.json(
        fail("This wallet is already linked to another Caushun account. Please use a different wallet."),
        { status: 409 }
      )
    }
  }

  const [updated] = await db
    .update(users)
    .set(parsed.data)
    .where(eq(users.id, session.user.id))
    .returning()

  return NextResponse.json(ok(updated, "Profile updated"))
}

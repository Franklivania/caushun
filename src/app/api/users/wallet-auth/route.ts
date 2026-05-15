import { NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"
import { z } from "zod"

const schema = z.object({
  walletAddress: z.string().min(56).max(56),
})

// Called from the auth page wallet-connect flow
// Creates or fetches user by wallet address (no session required)
export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid wallet address"), { status: 400 })
  }

  const { walletAddress } = parsed.data

  // Check existing user
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))

  if (existing) {
    return NextResponse.json(ok({
      id: existing.id,
      role: existing.role,
      onboardingComplete: existing.onboardingComplete,
    }))
  }

  // Create new user
  const [created] = await db
    .insert(users)
    .values({ walletAddress, onboardingComplete: false })
    .returning()

  return NextResponse.json(ok({
    id: created.id,
    role: created.role,
    onboardingComplete: created.onboardingComplete,
  }), { status: 201 })
}

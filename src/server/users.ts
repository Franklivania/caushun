"use server"

import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users } from "@/db/schema"

export async function upsertUser(input: {
  walletAddress: string
  role: "landlord" | "tenant"
  fullName?: string
  phone?: string
}) {
  const existing = await db.query.users.findFirst({
    where: eq(users.walletAddress, input.walletAddress),
  })

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        role: input.role,
        fullName: input.fullName ?? existing.fullName,
        phone: input.phone ?? existing.phone,
      })
      .where(eq(users.id, existing.id))
      .returning()
    return updated
  }

  const [created] = await db.insert(users).values(input).returning()
  return created
}

export async function getUserByWallet(walletAddress: string) {
  return db.query.users.findFirst({
    where: eq(users.walletAddress, walletAddress),
  })
}

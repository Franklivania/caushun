"use server"

import { eq } from "drizzle-orm"
import { db } from "@/db"
import { disputes, tenancies, users } from "@/db/schema"

export async function createDispute(input: {
  tenancyId: string
  raisedByWallet: string
  reason: string
}) {
  const user = await db.query.users.findFirst({
    where: eq(users.walletAddress, input.raisedByWallet),
  })
  if (!user) throw new Error("User not found")

  const [dispute] = await db
    .insert(disputes)
    .values({
      tenancyId: input.tenancyId,
      raisedBy: user.id,
      reason: input.reason,
    })
    .returning()

  await db
    .update(tenancies)
    .set({ escrowStatus: "disputed" })
    .where(eq(tenancies.id, input.tenancyId))

  return dispute
}

export async function getDisputeById(disputeId: string) {
  return db.query.disputes.findFirst({
    where: eq(disputes.id, disputeId),
    with: {
      tenancy: {
        with: {
          room: { with: { property: { with: { landlord: true } } } },
          tenant: true,
          photos: true,
        },
      },
      raisedByUser: true,
    },
  })
}

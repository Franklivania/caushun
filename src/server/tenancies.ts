"use server"

import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { disputes, rooms, tenancies, users } from "@/db/schema"
import { verifyInviteToken } from "@/server/invite-token"
import { upsertUser } from "@/server/users"

export async function getTenancyById(tenancyId: string) {
  return db.query.tenancies.findFirst({
    where: eq(tenancies.id, tenancyId),
    with: {
      room: { with: { property: { with: { landlord: true } } } },
      tenant: true,
      photos: true,
      disputes: true,
    },
  })
}

export async function getTenancyByEscrow(contractId: string) {
  return db.query.tenancies.findFirst({
    where: eq(tenancies.escrowId, contractId),
    with: {
      room: { with: { property: { with: { landlord: true } } } },
      tenant: true,
      photos: true,
      disputes: true,
    },
  })
}

export async function getTenantTenancies(walletAddress: string) {
  const tenant = await db.query.users.findFirst({
    where: eq(users.walletAddress, walletAddress),
  })
  if (!tenant) return []

  return db.query.tenancies.findMany({
    where: eq(tenancies.tenantId, tenant.id),
    with: {
      room: { with: { property: { with: { landlord: true } } } },
      tenant: true,
      photos: true,
      disputes: true,
    },
  })
}

export async function onboardTenant(input: {
  token: string
  tenantWallet: string
  fullName?: string
  phone?: string
}) {
  const { roomId } = verifyInviteToken(input.token)
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: { tenancies: true },
  })
  if (!room || room.inviteToken !== input.token || room.status !== "vacant") {
    throw new Error("This invite link is invalid or has expired.")
  }

  const tenant = await upsertUser({
    walletAddress: input.tenantWallet,
    role: "tenant",
    fullName: input.fullName,
    phone: input.phone,
  })

  const tenancy = room.tenancies[0]
  if (!tenancy) throw new Error("No tenancy exists for this room")

  const [updatedTenancy] = await db
    .update(tenancies)
    .set({ tenantId: tenant.id })
    .where(eq(tenancies.id, tenancy.id))
    .returning()

  await db.update(rooms).set({ status: "occupied" }).where(eq(rooms.id, room.id))
  return updatedTenancy
}

export async function getOpenDisputes() {
  return db.query.disputes.findMany({
    orderBy: desc(disputes.createdAt),
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

"use server"

import { eq } from "drizzle-orm"
import { db } from "@/db"
import { properties, users } from "@/db/schema"
import { upsertUser } from "@/server/users"

export async function createProperty(input: {
  landlordWallet: string
  name: string
  address: string
  state: string
}) {
  const landlord = await upsertUser({
    walletAddress: input.landlordWallet,
    role: "landlord",
  })

  const [property] = await db
    .insert(properties)
    .values({
      landlordId: landlord.id,
      name: input.name,
      address: input.address,
      state: input.state,
    })
    .returning()

  return property
}

export async function getPropertiesByLandlord(walletAddress: string) {
  const landlord = await db.query.users.findFirst({
    where: eq(users.walletAddress, walletAddress),
  })
  if (!landlord) return []

  return db.query.properties.findMany({
    where: eq(properties.landlordId, landlord.id),
    with: { rooms: true },
  })
}

export async function getPropertyById(propertyId: string) {
  return db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
    with: { landlord: true, rooms: true },
  })
}

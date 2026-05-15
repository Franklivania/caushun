"use server"

import { eq } from "drizzle-orm"
import { db } from "@/db"
import { properties, rooms, tenancies, users } from "@/db/schema"
import { generateInviteToken } from "@/server/invite-token"

export async function createRoom(input: {
  landlordWallet: string
  propertyId: string
  roomNumber: string
  uniqueCode: string
  depositAmount: number
}) {
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, input.propertyId),
    with: { landlord: true },
  })

  if (!property || property.landlord.walletAddress !== input.landlordWallet) {
    throw new Error("Unauthorized")
  }

  const [room] = await db
    .insert(rooms)
    .values({
      propertyId: input.propertyId,
      roomNumber: input.roomNumber,
      uniqueCode: input.uniqueCode,
      depositAmount: input.depositAmount.toFixed(2),
    })
    .returning()

  await db.insert(tenancies).values({ roomId: room.id })
  return room
}

export async function getRoomsByLandlord(walletAddress: string) {
  const landlord = await db.query.users.findFirst({
    where: eq(users.walletAddress, walletAddress),
  })
  if (!landlord) return []

  const landlordProperties = await db.query.properties.findMany({
    where: eq(properties.landlordId, landlord.id),
  })
  const propertyIds = new Set(landlordProperties.map((property) => property.id))
  const allRooms = await db.query.rooms.findMany({
    with: {
      property: { with: { landlord: true } },
      tenancies: { with: { tenant: true } },
    },
  })
  return allRooms.filter((room) => propertyIds.has(room.propertyId))
}

export async function getRoomById(roomId: string) {
  return db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: {
      property: { with: { landlord: true } },
      tenancies: { with: { tenant: true, photos: true, disputes: true } },
    },
  })
}

export async function generateRoomInvite(input: {
  roomId: string
  landlordId: string
}) {
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, input.roomId),
    with: { property: true },
  })

  if (!room || room.property.landlordId !== input.landlordId) {
    throw new Error("Unauthorized")
  }

  const token = generateInviteToken(room.id)
  const [updated] = await db
    .update(rooms)
    .set({ inviteToken: token })
    .where(eq(rooms.id, room.id))
    .returning()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return { token, inviteUrl: `${baseUrl}/onboard/${token}`, room: updated }
}

import { z } from "zod"
import { uuidSchema, walletAddressSchema } from "@/schemas/shared"

export const roomSchema = z.object({
  landlordWallet: walletAddressSchema,
  propertyId: uuidSchema,
  roomNumber: z.string().trim().min(1),
  uniqueCode: z.string().trim().min(3),
  depositAmount: z.number().positive(),
})

export const roomInviteSchema = z.object({
  landlordWallet: walletAddressSchema,
  roomId: uuidSchema,
})

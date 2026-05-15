import { z } from "zod"
import { uuidSchema, walletAddressSchema } from "@/schemas/shared"

export const propertySchema = z.object({
  landlordWallet: walletAddressSchema,
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  state: z.string().trim().min(1),
})

export const propertyListSchema = z.object({
  landlordWallet: walletAddressSchema.optional(),
})

export const propertyIdSchema = z.object({
  propertyId: uuidSchema,
})

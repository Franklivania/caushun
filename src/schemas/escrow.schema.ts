import { z } from "zod"
import { uuidSchema, walletAddressSchema } from "@/schemas/shared"

export const deployEscrowSchema = z.object({
  landlordWallet: walletAddressSchema,
  tenantWallet: walletAddressSchema,
  roomId: uuidSchema,
})

export const fundEscrowSchema = z.object({
  contractId: z.string().min(1),
  tenantWallet: walletAddressSchema,
  amount: z.number().positive(),
  tenancyId: uuidSchema.optional(),
})

export const approveMilestoneSchema = z.object({
  contractId: z.string().min(1),
  landlordWallet: walletAddressSchema,
  tenancyId: uuidSchema,
})

export const releaseFundsSchema = z.object({
  contractId: z.string().min(1),
  tenancyId: uuidSchema,
  adminWallet: walletAddressSchema,
})

export const sendEscrowSchema = z.object({
  tenancyId: uuidSchema,
  action: z.enum(["deploy", "fund", "checkout", "approve", "dispute"]),
  contractId: z.string().min(1).optional(),
})

export const trustlineSchema = z.object({
  signer: walletAddressSchema,
})

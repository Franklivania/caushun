import { z } from "zod"
import { uuidSchema, walletAddressSchema } from "@/schemas/shared"

export const disputeSchema = z.object({
  contractId: z.string().min(1),
  signerWallet: walletAddressSchema,
  tenancyId: uuidSchema,
  reason: z.string().trim().min(1).default("Checkout dispute"),
})

export const resolveDisputeSchema = z.object({
  contractId: z.string().min(1),
  tenancyId: uuidSchema,
  disputeId: uuidSchema.optional(),
  tenantWallet: walletAddressSchema,
  landlordWallet: walletAddressSchema,
  depositAmount: z.number().positive(),
  platformFeePct: z.number().min(0).max(99),
  tenantPct: z.number().min(0).max(100).int(),
  adminWallet: walletAddressSchema,
  resolutionNotes: z.string().trim().optional(),
  forceResolve: z.boolean().optional().default(false),
})

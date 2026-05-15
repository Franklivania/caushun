import { z } from "zod"
import { uuidSchema, walletAddressSchema } from "@/schemas/shared"

export const checkoutSchema = z.object({
  contractId: z.string().min(1),
  tenantWallet: walletAddressSchema,
  moveOutPhotoUrls: z.array(z.string().url()).min(1).max(10),
  tenantPct: z.number().min(0).max(100).int(),
  tenancyId: uuidSchema,
})

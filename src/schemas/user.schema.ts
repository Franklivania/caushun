import { z } from "zod"
import { walletAddressSchema } from "@/schemas/shared"

export const userSchema = z.object({
  walletAddress: walletAddressSchema,
  role: z.enum(["landlord", "tenant"]),
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
})

import { z } from "zod"

export const walletAddressSchema = z.string().length(56)
export const uuidSchema = z.string().uuid()
export const milestoneIndexSchema = z.literal("0")

export const apiStringSchema = z.string().trim().min(1)

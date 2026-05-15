import { z } from "zod"
import { uuidSchema } from "@/schemas/shared"

export const photoPhaseSchema = z.enum(["move_in", "move_out", "damage"])

export const savePhotosSchema = z.object({
  tenancyId: uuidSchema,
  uploaderId: uuidSchema,
  urls: z.array(z.string().url()).max(10),
  phase: photoPhaseSchema,
})

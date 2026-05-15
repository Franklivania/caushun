import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { fail, ok } from "@/lib/api-response"
import { createDispute } from "@/server/disputes"
import { uuidSchema, walletAddressSchema } from "@/schemas/shared"

const saveDisputeSchema = z.object({
  tenancyId: uuidSchema,
  signerWallet: walletAddressSchema,
  reason: z.string().trim().min(1).default("Dispute raised via platform"),
})

export async function POST(req: NextRequest) {
  const parsed = saveDisputeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request"), { status: 400 })
  }
  try {
    await createDispute({
      tenancyId: parsed.data.tenancyId,
      raisedByWallet: parsed.data.signerWallet,
      reason: parsed.data.reason,
    })
    return NextResponse.json(ok(null, "Dispute record saved"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save dispute"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

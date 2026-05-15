import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { twFetch } from "@/lib/escrow/fetch-client"
import type { DisputeEscrowPayload, UnsignedTxResponse } from "@/lib/escrow/types"
import { disputeSchema } from "@/schemas/dispute.schema"
import { createDispute } from "@/server/disputes"

export async function POST(req: NextRequest) {
  const parsed = disputeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const payload: DisputeEscrowPayload = {
    contractId: parsed.data.contractId,
    signer: parsed.data.signerWallet,
  }

  console.log("[dispute] TW payload →", JSON.stringify(payload))

  try {
    const data = await twFetch<UnsignedTxResponse>(
      "/escrow/single-release/dispute-escrow",
      { method: "POST", body: payload }
    )
    await createDispute({
      tenancyId: parsed.data.tenancyId,
      raisedByWallet: parsed.data.signerWallet,
      reason: parsed.data.reason,
    })
    return NextResponse.json(ok({ unsignedTransaction: data.unsignedTransaction }, "XDR ready"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dispute failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

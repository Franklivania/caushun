import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { twFetch } from "@/lib/escrow/fetch-client"
import type { FundEscrowPayload, UnsignedTxResponse } from "@/lib/escrow/types"
import { fundEscrowSchema } from "@/schemas/escrow.schema"

export async function POST(req: NextRequest) {
  const parsed = fundEscrowSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const payload: FundEscrowPayload = {
    contractId: parsed.data.contractId,
    signer: parsed.data.tenantWallet,
    amount: parsed.data.amount,
  }

  try {
    const data = await twFetch<UnsignedTxResponse>("/escrow/single-release/fund-escrow", {
      method: "POST",
      body: payload,
    })
    return NextResponse.json(ok({ unsignedTransaction: data.unsignedTransaction }, "XDR ready"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fund failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

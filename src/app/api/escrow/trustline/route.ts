import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { twFetch } from "@/lib/escrow/fetch-client"
import type { SetTrustlinePayload, UnsignedTxResponse } from "@/lib/escrow/types"
import { trustlineSchema } from "@/schemas/escrow.schema"

export async function POST(req: NextRequest) {
  const parsed = trustlineSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const issuer = process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET
  if (!issuer) {
    return NextResponse.json(fail("USDC issuer is not configured"), { status: 500 })
  }

  const payload: SetTrustlinePayload = {
    signer: parsed.data.signer,
    trustline: { address: issuer, symbol: "USDC" },
  }

  try {
    const data = await twFetch<UnsignedTxResponse>("/helper/set-trustline", {
      method: "POST",
      body: payload,
    })
    return NextResponse.json(ok({ unsignedTransaction: data.unsignedTransaction }, "XDR ready"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trustline failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

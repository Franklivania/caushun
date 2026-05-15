import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { twPublicFetch } from "@/lib/escrow/fetch-client"
import type { SetTrustlinePayload, UnsignedTxResponse } from "@/lib/escrow/types"
import { trustlineSchema } from "@/schemas/escrow.schema"

const USDC_TESTNET_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

interface HorizonBalance {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
}

export async function POST(req: NextRequest) {
  const parsed = trustlineSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const issuer = process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET ?? USDC_TESTNET_ISSUER
  const signer = parsed.data.signer

  // Server-side idempotency check — skip TW call if trustline already exists
  const horizonRes = await fetch(
    `https://horizon-testnet.stellar.org/accounts/${signer}`
  ).catch(() => null)

  if (horizonRes?.ok) {
    const account = (await horizonRes.json()) as { balances: HorizonBalance[] }
    const alreadySet = account.balances.some(
      (b) => b.asset_code === "USDC" && b.asset_issuer === issuer
    )
    if (alreadySet) {
      return NextResponse.json(ok({ unsignedTransaction: null }, "Trustline already set"))
    }
  }

  const payload: SetTrustlinePayload = {
    signer,
    trustline: { address: issuer, symbol: "USDC" },
  }

  try {
    const data = await twPublicFetch<UnsignedTxResponse>("/helper/set-trustline", {
      method: "POST",
      body: payload,
    })
    return NextResponse.json(ok({ unsignedTransaction: data.unsignedTransaction }, "XDR ready"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Trustline failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

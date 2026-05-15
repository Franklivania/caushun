import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { fail, ok } from "@/lib/api-response"
import { twFetch, twPublicFetch } from "@/lib/escrow/fetch-client"
import type { SendTransactionResponse, UnsignedTxResponse } from "@/lib/escrow/types"
import { signWithPlatformWallet } from "@/lib/wallet/platform-signer"
import { releaseFundsSchema } from "@/schemas/escrow.schema"

export async function POST(req: NextRequest) {
  const parsed = releaseFundsSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const { contractId, tenancyId, adminWallet } = parsed.data
  if (adminWallet !== process.env.ADMIN_WALLET_ADDRESS) {
    return NextResponse.json(fail("Unauthorized"), { status: 403 })
  }

  try {
    const data = await twFetch<UnsignedTxResponse>(
      "/escrow/single-release/release-funds",
      {
        method: "POST",
        body: {
          contractId,
          releaseSigner: process.env.PLATFORM_WALLET_PUBLIC_KEY,
        },
      }
    )
    const signedXdr = signWithPlatformWallet(data.unsignedTransaction)
    const result = await twPublicFetch<SendTransactionResponse>(
      "/helper/send-transaction",
      { method: "POST", body: { signedXdr } }
    )

    await db.update(tenancies).set({ escrowStatus: "resolved" }).where(eq(tenancies.id, tenancyId))
    return NextResponse.json(ok(result, "Funds released"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Release failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

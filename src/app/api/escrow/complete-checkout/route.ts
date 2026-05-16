import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { fail, ok } from "@/lib/api-response"
import { twFetch } from "@/lib/escrow/fetch-client"
import type { SendTransactionResponse, UnsignedTxResponse } from "@/lib/escrow/types"
import { signWithPlatformWallet } from "@/lib/wallet/platform-signer"
import { z } from "zod"
import { uuidSchema } from "@/schemas/shared"

const schema = z.object({
  contractId: z.string().min(1),
  tenancyId: uuidSchema,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success)
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), { status: 400 })

  const { contractId, tenancyId } = parsed.data

  const tenancy = await db.query.tenancies.findFirst({
    where: eq(tenancies.id, tenancyId),
  })
  if (!tenancy) return NextResponse.json(fail("Tenancy not found"), { status: 404 })
  if (tenancy.escrowStatus !== "checkout" && tenancy.escrowStatus !== "active")
    return NextResponse.json(fail("Tenancy is not in checkout state"), { status: 409 })

  const platformWallet = process.env.PLATFORM_WALLET_PUBLIC_KEY
  const platformSecret = process.env.PLATFORM_WALLET_SECRET_KEY
  if (!platformWallet || !platformSecret) {
    console.error("[complete-checkout] Missing platform wallet env vars", {
      hasPlatformWallet: !!platformWallet,
      hasPlatformSecret: !!platformSecret,
    })
    return NextResponse.json(fail("Platform wallet is not configured"), { status: 500 })
  }

  try {
    // Step 1: get unsigned release XDR from TW
    // console.log("[complete-checkout] using API key prefix:", process.env.TW_API_KEY?.slice(0, 8))
    const data = await twFetch<UnsignedTxResponse>(
      "/escrow/single-release/release-funds",
      {
        method: "POST",
        body: { contractId, releaseSigner: platformWallet },
      }
    )

    // Step 2: sign with platform wallet
    const signedXdr = signWithPlatformWallet(data.unsignedTransaction)

    // Step 3: broadcast to Stellar — check result explicitly
    const sendResult = await twFetch<SendTransactionResponse>(
      "/helper/send-transaction",
      { method: "POST", body: { signedXdr } }
    )
    if (sendResult.status === "FAILED") {
      console.error("[complete-checkout] send-transaction FAILED", sendResult)
      throw new Error(sendResult.message ?? "Transaction was rejected by the network")
    }

    // Step 4: mark resolved in DB
    await db
      .update(tenancies)
      .set({ escrowStatus: "resolved" })
      .where(eq(tenancies.id, tenancyId))

    return NextResponse.json(ok(null, "Checkout complete — funds released"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Release failed"
    console.error("[complete-checkout] error:", message)
    return NextResponse.json(fail(message), { status: 500 })
  }
}

import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { fail, ok } from "@/lib/api-response"
import { twFetch, twPublicFetch } from "@/lib/escrow/fetch-client"
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
    await twPublicFetch<SendTransactionResponse>(
      "/helper/send-transaction",
      { method: "POST", body: { signedXdr } }
    )

    await db
      .update(tenancies)
      .set({ escrowStatus: "resolved" })
      .where(eq(tenancies.id, tenancyId))

    return NextResponse.json(ok(null, "Checkout complete — funds released"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Release failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

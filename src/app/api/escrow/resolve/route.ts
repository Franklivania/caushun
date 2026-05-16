import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { createElement } from "react"
import { db } from "@/db"
import { disputes, tenancies } from "@/db/schema"
import { fail, ok } from "@/lib/api-response"
import { sendMail } from "@/lib/mail"
import { DisputeResolvedEmail } from "@/emails/dispute-resolved"
import { twFetch } from "@/lib/escrow/fetch-client"
import type { SendTransactionResponse, UnsignedTxResponse } from "@/lib/escrow/types"
import { signWithPlatformWallet } from "@/lib/wallet/platform-signer"
import { resolveDisputeSchema } from "@/schemas/dispute.schema"

export async function POST(req: NextRequest) {
  const parsed = resolveDisputeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const input = parsed.data
  if (input.adminWallet !== process.env.ADMIN_WALLET_ADDRESS) {
    return NextResponse.json(fail("Unauthorized"), { status: 403 })
  }

  const distributions = [
    { address: input.tenantWallet, amount: Number((input.depositAmount * (input.tenantPct / 100)).toFixed(7)) },
    { address: input.landlordWallet, amount: Number((input.depositAmount * ((100 - input.tenantPct) / 100)).toFixed(7)) },
  ].filter((distribution) => distribution.amount > 0)

  // netAmount used only for email display — actual payout after platform fee
  const netAmount = input.depositAmount * (1 - input.platformFeePct / 100)

  const twBody = {
    contractId: input.contractId,
    disputeResolver: process.env.PLATFORM_WALLET_PUBLIC_KEY,
    distributions,
  }
  console.log("[resolve] TW payload →", JSON.stringify(twBody))

  try {
    if (!input.forceResolve) {
      const data = await twFetch<UnsignedTxResponse>(
        "/escrow/single-release/resolve-dispute",
        { method: "POST", body: twBody }
      )
      const signedXdr = signWithPlatformWallet(data.unsignedTransaction)
      await twFetch<SendTransactionResponse>(
        "/helper/send-transaction",
        { method: "POST", body: { signedXdr } }
      )
    }

    if (input.disputeId) {
      await db
        .update(disputes)
        .set({ platformVerdictPct: input.tenantPct, resolvedAt: new Date() })
        .where(eq(disputes.id, input.disputeId))
    }
    await db
      .update(tenancies)
      .set({ escrowStatus: "resolved", resolutionNotes: input.resolutionNotes })
      .where(eq(tenancies.id, input.tenancyId))

    // Fire-and-forget resolution emails
    const tenancy = await db.query.tenancies.findFirst({
      where: eq(tenancies.id, input.tenancyId),
      with: {
        room: { with: { property: { with: { landlord: true } } } },
        tenant: true,
      },
    })
    if (tenancy) {
      const tenantAmt = Number((netAmount * (input.tenantPct / 100)).toFixed(2))
      const landlordAmt = Number((netAmount - tenantAmt).toFixed(2))
      const roomCode = tenancy.room.uniqueCode
      for (const [email, role] of [
        [tenancy.tenant?.email, "tenant"],
        [tenancy.room.property.landlord?.email, "landlord"],
      ] as [string | null | undefined, "tenant" | "landlord"][]) {
        if (email) {
          sendMail({
            to: email,
            subject: `Dispute resolved — room ${roomCode}`,
            react: createElement(DisputeResolvedEmail, {
              roomCode,
              tenantAmount: tenantAmt,
              landlordAmount: landlordAmt,
              recipientRole: role,
            }),
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json(ok(null, "Dispute resolved"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resolve failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

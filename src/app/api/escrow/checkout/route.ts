import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { fail, ok } from "@/lib/api-response"
import { MILESTONE_INDEX } from "@/lib/constants"
import { twFetch } from "@/lib/escrow/fetch-client"
import type { ChangeMilestoneStatusPayload, UnsignedTxResponse } from "@/lib/escrow/types"
import { checkoutSchema } from "@/schemas/checkout.schema"

export async function POST(req: NextRequest) {
  const parsed = checkoutSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const { contractId, tenantWallet, moveOutPhotoUrls, tenantPct, tenancyId } = parsed.data
  const evidence = JSON.stringify({
    photos: moveOutPhotoUrls,
    proposedSplit: { tenantPct, landlordPct: 100 - tenantPct },
    requestedBy: "tenant",
    timestamp: new Date().toISOString(),
  })

  const payload: ChangeMilestoneStatusPayload = {
    contractId,
    milestoneIndex: MILESTONE_INDEX,
    newStatus: "checkout-requested",
    newEvidence: evidence,
    serviceProvider: tenantWallet,
  }

  try {
    const data = await twFetch<UnsignedTxResponse>(
      "/escrow/single-release/change-milestone-status",
      { method: "POST", body: payload }
    )
    await db
      .update(tenancies)
      .set({ moveOutDate: new Date(), proposedSplitPct: tenantPct })
      .where(eq(tenancies.id, tenancyId))
    return NextResponse.json(ok({ unsignedTransaction: data.unsignedTransaction }, "XDR ready"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

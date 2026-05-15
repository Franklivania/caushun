import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { MILESTONE_INDEX } from "@/lib/constants"
import { twFetch } from "@/lib/escrow/fetch-client"
import type { ApproveMilestonePayload, UnsignedTxResponse } from "@/lib/escrow/types"
import { approveMilestoneSchema } from "@/schemas/escrow.schema"

export async function POST(req: NextRequest) {
  const parsed = approveMilestoneSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const payload: ApproveMilestonePayload = {
    contractId: parsed.data.contractId,
    milestoneIndex: MILESTONE_INDEX,
    approver: parsed.data.landlordWallet,
  }

  try {
    const data = await twFetch<UnsignedTxResponse>(
      "/escrow/single-release/approve-milestone",
      { method: "POST", body: payload }
    )
    return NextResponse.json(ok({ unsignedTransaction: data.unsignedTransaction }, "XDR ready"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approve failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

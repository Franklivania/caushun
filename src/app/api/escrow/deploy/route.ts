import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { rooms } from "@/db/schema"
import { fail, ok } from "@/lib/api-response"
import { PLATFORM_FEE_PCT } from "@/lib/constants"
import { twFetch } from "@/lib/escrow/fetch-client"
import type { DeploySingleReleasePayload, UnsignedTxResponse } from "@/lib/escrow/types"
import { deployEscrowSchema } from "@/schemas/escrow.schema"

export async function POST(req: NextRequest) {
  const parsed = deployEscrowSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const { landlordWallet, tenantWallet, roomId } = parsed.data
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: { property: true },
  })
  if (!room) return NextResponse.json(fail("Room not found"), { status: 404 })

  const platformWallet = process.env.PLATFORM_WALLET_PUBLIC_KEY
  const usdcIssuer = process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET
  if (!platformWallet || !usdcIssuer) {
    return NextResponse.json(fail("Escrow environment is not configured"), {
      status: 500,
    })
  }

  const payload: DeploySingleReleasePayload = {
    signer: landlordWallet,
    engagementId: room.uniqueCode,
    title: `Caushun deposit - ${room.uniqueCode}`,
    description: `Security deposit - ${room.property.address}, Room ${room.roomNumber}`,
    roles: {
      approver: landlordWallet,
      serviceProvider: tenantWallet,
      platformAddress: platformWallet,
      releaseSigner: platformWallet,
      disputeResolver: platformWallet,
      receiver: tenantWallet,
    },
    amount: Number(room.depositAmount),
    platformFee: PLATFORM_FEE_PCT,
    trustline: { address: usdcIssuer, symbol: "USDC" },
    milestones: [{ description: "Checkout complete - refund requested" }],
  }

  try {
    const data = await twFetch<UnsignedTxResponse>("/deployer/single-release", {
      method: "POST",
      body: payload,
    })
    return NextResponse.json(ok({ unsignedTransaction: data.unsignedTransaction }, "XDR ready"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deploy failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

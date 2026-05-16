import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { fail, ok } from "@/lib/api-response"
import { sendEscrowSchema } from "@/schemas/escrow.schema"
import { sendMail } from "@/lib/mail"
import { EscrowFundedEmail } from "@/emails/escrow-funded"
import { CheckoutRequestedEmail } from "@/emails/checkout-requested"
import { DisputeRaisedEmail } from "@/emails/dispute-raised"
import { createElement } from "react"

const statusMap = {
  deploy: "pending",
  fund: "funded",
  checkout: "checkout",
  approve: "active",
  dispute: "disputed",
} as const

export async function POST(req: NextRequest) {
  const parsed = sendEscrowSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const { tenancyId, action, contractId } = parsed.data
  await db
    .update(tenancies)
    .set({
      ...(action === "deploy" && contractId ? { escrowId: contractId } : {}),
      escrowStatus: statusMap[action],
    })
    .where(eq(tenancies.id, tenancyId))

  // Fire-and-forget email notifications
  const tenancy = await db.query.tenancies.findFirst({
    where: eq(tenancies.id, tenancyId),
    with: {
      room: { with: { property: { with: { landlord: true } } } },
      tenant: true,
    },
  })

  if (tenancy) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const escrowViewerUrl = process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL ?? ""
    const deposit = Number(tenancy.room.depositAmount)
    const roomCode = tenancy.room.uniqueCode
    const landlordEmail = tenancy.room.property.landlord?.email
    const tenantEmail = tenancy.tenant?.email
    const tenantName = tenancy.tenant?.fullName ?? tenancy.tenant?.name ?? "Your tenant"

    if (action === "fund" && landlordEmail && contractId) {
      sendMail({
        to: landlordEmail,
        subject: `Deposit funded — room ${roomCode}`,
        react: createElement(EscrowFundedEmail, {
          roomCode,
          tenantName,
          depositAmount: deposit,
          contractId,
          escrowViewerUrl,
        }),
      }).catch(() => {})
    }

    if (action === "checkout" && landlordEmail) {
      sendMail({
        to: landlordEmail,
        subject: `Checkout requested — room ${roomCode}`,
        react: createElement(CheckoutRequestedEmail, {
          roomCode,
          tenantName,
          depositAmount: deposit,
          dashboardUrl: `${appUrl}/landlord/rooms/${tenancy.roomId}`,
        }),
      }).catch(() => {})
    }

    if (action === "dispute") {
      const adminEmail = process.env.ADMIN_EMAIL
      const targets = [
        ...(tenantEmail ? [{ email: tenantEmail, role: "tenant" as const }] : []),
        ...(landlordEmail ? [{ email: landlordEmail, role: "landlord" as const }] : []),
        ...(adminEmail ? [{ email: adminEmail, role: "admin" as const }] : []),
      ]
      for (const target of targets) {
        sendMail({
          to: target.email,
          subject: `Dispute raised — room ${roomCode}`,
          react: createElement(DisputeRaisedEmail, {
            roomCode,
            reason: "Dispute raised via platform",
            raisedByName: tenantName,
            depositAmount: deposit,
            recipientRole: target.role,
          }),
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json(ok(null, "Tenancy updated"))
}

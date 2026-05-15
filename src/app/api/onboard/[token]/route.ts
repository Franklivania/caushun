import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { walletAddressSchema } from "@/schemas/shared"
import { getRoomById } from "@/server/rooms"
import { verifyInviteToken } from "@/server/invite-token"
import { onboardTenant } from "@/server/tenancies"
import { z } from "zod"

const onboardSchema = z.object({
  tenantWallet: walletAddressSchema,
  fullName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
})

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await ctx.params
    const { roomId, expiry } = verifyInviteToken(token)
    const room = await getRoomById(roomId)
    if (!room || room.inviteToken !== token) {
      return NextResponse.json(fail("This invite link is invalid or has expired."), {
        status: 404,
      })
    }
    return NextResponse.json(ok({ room, expiry }))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "This invite link is invalid or has expired."
    return NextResponse.json(fail(message), { status: 400 })
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params
  const parsed = onboardSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  try {
    const tenancy = await onboardTenant({ token, ...parsed.data })
    return NextResponse.json(ok(tenancy, "Tenant onboarded"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Onboarding failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

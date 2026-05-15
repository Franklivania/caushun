import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { walletAddressSchema } from "@/schemas/shared"
import { getTenantTenancies } from "@/server/tenancies"

export async function GET(req: NextRequest) {
  const tenantWallet = req.nextUrl.searchParams.get("tenantWallet")
  if (!tenantWallet) return NextResponse.json(ok([]))

  const parsed = walletAddressSchema.safeParse(tenantWallet)
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  const tenancies = await getTenantTenancies(parsed.data)
  return NextResponse.json(ok(tenancies))
}

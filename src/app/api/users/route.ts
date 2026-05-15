import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { userSchema } from "@/schemas/user.schema"
import { getUserByWallet, upsertUser } from "@/server/users"

export async function GET(req: NextRequest) {
  const walletAddress = req.nextUrl.searchParams.get("walletAddress")
  if (!walletAddress) {
    return NextResponse.json(fail("walletAddress is required"), { status: 400 })
  }

  const user = await getUserByWallet(walletAddress)
  return NextResponse.json(ok(user ?? null))
}

export async function POST(req: NextRequest) {
  const parsed = userSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), {
      status: 400,
    })
  }

  try {
    const user = await upsertUser(parsed.data)
    return NextResponse.json(ok(user, "User saved"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "User save failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

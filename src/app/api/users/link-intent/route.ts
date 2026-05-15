import { auth } from "@/auth"
import { createHmac } from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ok, fail } from "@/lib/api-response"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(fail("Unauthorized"), { status: 401 })
  }

  const expiry = Date.now() + 5 * 60 * 1000
  const payload = `${session.user.id}:${expiry}`
  const sig = createHmac("sha256", process.env.INVITE_TOKEN_SECRET!)
    .update(payload)
    .digest("hex")

  const cookieStore = await cookies()
  cookieStore.set("caushun-link-intent", `${payload}:${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  })

  return NextResponse.json(ok(null, "OK"))
}

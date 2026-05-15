import { getUploadAuthParams } from "@imagekit/next/server"
import { NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"

export async function GET() {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    if (!privateKey || !publicKey) throw new Error("ImageKit keys are not set")

    const { token, expire, signature } = getUploadAuthParams({
      privateKey,
      publicKey,
      expire: Math.floor(Date.now() / 1000) + 30 * 60,
    })

    return NextResponse.json(
      ok({ token, expire, signature, publicKey }, "Upload credentials ready")
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate upload credentials"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

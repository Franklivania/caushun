import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import { requireEnv } from "@/lib/constants"

export function generateInviteToken(roomId: string, ttlDays = 14): string {
  const nonce = randomBytes(16).toString("hex")
  const expiryTimestamp = Date.now() + ttlDays * 24 * 60 * 60 * 1000
  const payload = `${roomId}:${expiryTimestamp}:${nonce}`
  const sig = createHmac("sha256", requireEnv("INVITE_TOKEN_SECRET"))
    .update(payload)
    .digest("hex")
  return Buffer.from(`${payload}:${sig}`).toString("base64url")
}

export function verifyInviteToken(token: string): { roomId: string; expiry: number } {
  const decoded = Buffer.from(token, "base64url").toString()
  const [roomId, expiry, nonce, sig] = decoded.split(":")
  if (!roomId || !expiry || !nonce || !sig) throw new Error("Invalid token")

  const payload = `${roomId}:${expiry}:${nonce}`
  const expected = createHmac("sha256", requireEnv("INVITE_TOKEN_SECRET"))
    .update(payload)
    .digest("hex")

  const received = Buffer.from(sig)
  const expectedBuffer = Buffer.from(expected)
  if (
    received.length !== expectedBuffer.length ||
    !timingSafeEqual(received, expectedBuffer) ||
    Date.now() > Number(expiry)
  ) {
    throw new Error("Invalid token")
  }

  return { roomId, expiry: Number(expiry) }
}

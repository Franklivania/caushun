import { NextRequest, NextResponse } from "next/server"
import { fail, ok } from "@/lib/api-response"
import { generateRoomInvite } from "@/server/rooms"
import { auth } from "@/auth"

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ roomId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(fail("Unauthorized"), { status: 401 })
  }

  const { roomId } = await ctx.params

  try {
    const invite = await generateRoomInvite({ roomId, landlordId: session.user.id })
    return NextResponse.json(ok(invite, "Invite generated"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invite failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}

import { OnboardClient } from "@/components/onboard/onboard-client"
import { AppProviders } from "@/providers/app-providers"
import { verifyInviteToken } from "@/server/invite-token"
import { getRoomById } from "@/server/rooms"

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  try {
    const { roomId } = verifyInviteToken(token)
    const room = await getRoomById(roomId)
    const tenancy = room?.tenancies[0]
    if (!room || room.inviteToken !== token || !tenancy) throw new Error("Invalid invite")

    return (
      <main className="min-h-screen bg-white px-4 py-10 text-near-black">
        <div className="mx-auto max-w-2xl rounded-lg border border-ash bg-white p-6">
          <p className="text-sm text-slate">Tenant invite</p>
          <h1 className="mt-2 text-3xl font-semibold text-navy">Room {room.uniqueCode}</h1>
          <p className="mt-2 text-slate">{room.property.address}</p>
          <p className="mt-5 text-[28px] font-semibold text-navy">{room.depositAmount} USDC</p>
          <AppProviders>
            <OnboardClient
              token={token}
              roomId={room.id}
              tenancyId={tenancy.id}
              landlordWallet={room.property.landlord.walletAddress ?? ""}
              depositAmount={Number(room.depositAmount)}
            />
          </AppProviders>
        </div>
      </main>
    )
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 text-near-black">
        <div className="max-w-md rounded-lg border border-ash p-6 text-center">
          <h1 className="text-2xl font-semibold text-navy">This invite link is invalid or has expired.</h1>
          <p className="mt-3 text-sm text-slate">Contact your landlord for a new link.</p>
        </div>
      </main>
    )
  }
}

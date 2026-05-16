import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { db } from "@/db"
import { rooms } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EscrowStatusBadge, RoomStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { InviteButton } from "@/components/landlord/invite-button"
import { DeployEscrowButton } from "@/components/landlord/deploy-escrow-button"
import { LandlordEscrowActions } from "@/components/landlord/landlord-escrow-actions"
import { LandlordRoomPhotos } from "@/components/landlord/room-photos"
import { getPhotosByTenancy } from "@/server/photos"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const { roomId } = await params

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: {
      property: true,
      tenancies: {
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit: 1,
        with: { tenant: true },
      },
    },
  })

  if (!room || room.property.landlordId !== session.user.id) notFound()

  const latestTenancy = room.tenancies[0]
  const contractId = latestTenancy?.escrowId
  const escrowViewerUrl = process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL

  const [moveInPhotos, moveOutPhotos] = latestTenancy
    ? await Promise.all([
        getPhotosByTenancy({ tenancyId: latestTenancy.id, phase: "move_in" }),
        getPhotosByTenancy({ tenancyId: latestTenancy.id, phase: "move_out" }),
      ])
    : [[], []]

  return (
    <div className="space-y-6">
      <PageHeader
        title={room.uniqueCode}
        description={`${room.property.name} · ${room.property.address}`}
        breadcrumbs={[
          { label: "Properties", href: "/landlord/properties" },
          { label: room.property.name, href: `/landlord/properties/${room.property.id}` },
          { label: room.uniqueCode },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {contractId && (
              <a href={`${escrowViewerUrl}/${contractId}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink size={14} />
                  View escrow
                </Button>
              </a>
            )}
            {!contractId && latestTenancy?.tenant?.walletAddress && (
              <DeployEscrowButton
                roomId={room.id}
                tenancyId={latestTenancy.id}
                tenantWallet={latestTenancy.tenant.walletAddress}
              />
            )}
            <InviteButton roomId={room.id} existingToken={room.inviteToken ?? undefined} />
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Room details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code</span>
              <span className="font-mono font-medium">{room.uniqueCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room number</span>
              <span className="font-medium">{room.roomNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit</span>
              <span className="font-semibold">{Number(room.depositAmount).toFixed(0)} USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <RoomStatusBadge status={room.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Current tenancy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {latestTenancy ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant</span>
                  <span className="font-medium">
                    {latestTenancy.tenant?.fullName ?? latestTenancy.tenant?.name ?? "—"}
                  </span>
                </div>
                {latestTenancy.tenant?.walletAddress && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wallet</span>
                    <span className="font-mono text-xs">
                      {latestTenancy.tenant.walletAddress.slice(0, 8)}…{latestTenancy.tenant.walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Escrow</span>
                  <EscrowStatusBadge status={latestTenancy.escrowStatus} />
                </div>
                {latestTenancy.moveInDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Move-in</span>
                    <span>{new Date(latestTenancy.moveInDate).toLocaleDateString()}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No active tenancy</p>
            )}
          </CardContent>
        </Card>
      </div>

      {latestTenancy && (
        <LandlordRoomPhotos
          tenancyId={latestTenancy.id}
          roomCode={room.uniqueCode}
          uploaderId={session.user.id}
          escrowStatus={(latestTenancy.escrowStatus ?? "pending") as "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"}
          moveInPhotos={moveInPhotos}
          moveOutPhotos={moveOutPhotos}
        />
      )}

      {latestTenancy?.escrowId && latestTenancy.escrowStatus && (
        <LandlordEscrowActions
          tenancyId={latestTenancy.id}
          contractId={latestTenancy.escrowId}
          escrowStatus={latestTenancy.escrowStatus as "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"}
          depositAmount={Number(room.depositAmount)}
          landlordId={session.user.id}
          roomCode={room.uniqueCode}
          roomStatus={room.status}
        />
      )}
    </div>
  )
}

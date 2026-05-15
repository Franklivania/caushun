import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoomStatusBadge, EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { EscrowActions } from "@/components/tenant/escrow-actions"
import { RoomCondition } from "@/components/tenant/room-condition"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { getTenancyById } from "@/server/tenancies"

export default async function TenantRoomDetailPage({
  params,
}: {
  params: Promise<{ tenancyId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const { tenancyId } = await params
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(tenancyId)) notFound()

  const tenancy = await getTenancyById(tenancyId)
  if (!tenancy || tenancy.tenantId !== session.user.id) notFound()

  const { room } = tenancy
  const escrowViewerUrl = process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL

  const moveInPhotos = tenancy.photos.filter((p) => p.phase === "move_in")
  const hasMoveInPhotos = moveInPhotos.length > 0
  const moveInAcknowledged = moveInPhotos.some((p) => p.acknowledgedAt !== null)

  return (
    <div className="space-y-6">
      <PageHeader
        title={room.uniqueCode}
        description={`${room.property.name} · ${room.property.address}`}
        breadcrumbs={[
          { label: "My Rooms", href: "/tenant" },
          { label: room.uniqueCode },
        ]}
        actions={
          tenancy.escrowId ? (
            <a
              href={`${escrowViewerUrl}/${tenancy.escrowId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink size={14} />
                View escrow
              </Button>
            </a>
          ) : undefined
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
              Property & landlord
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{room.property.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right max-w-[60%]">{room.property.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">State</span>
              <span className="font-medium">{room.property.state}</span>
            </div>
            {room.property.landlord?.walletAddress && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Landlord wallet</span>
                <span className="font-mono text-xs">
                  {room.property.landlord.walletAddress.slice(0, 8)}…
                  {room.property.landlord.walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tenancy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Escrow status</span>
              <EscrowStatusBadge status={tenancy.escrowStatus} />
            </div>
            {tenancy.moveInDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Move-in date</span>
                <span>{new Date(tenancy.moveInDate).toLocaleDateString()}</span>
              </div>
            )}
            {tenancy.moveOutDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Move-out date</span>
                <span>{new Date(tenancy.moveOutDate).toLocaleDateString()}</span>
              </div>
            )}
            {tenancy.escrowId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract ID</span>
                <span className="font-mono text-xs">
                  {tenancy.escrowId.slice(0, 12)}…{tenancy.escrowId.slice(-4)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RoomCondition
        tenancyId={tenancy.id}
        photos={moveInPhotos}
        escrowStatus={tenancy.escrowStatus}
      />

      <EscrowActions
        tenancyId={tenancy.id}
        contractId={tenancy.escrowId}
        escrowStatus={tenancy.escrowStatus}
        depositAmount={Number(room.depositAmount)}
        tenantWallet={tenancy.tenant?.walletAddress ?? null}
        landlordWallet={room.property.landlord?.walletAddress ?? null}
        roomCode={room.uniqueCode}
        moveInDate={tenancy.moveInDate?.toISOString() ?? null}
        tenantId={session.user.id}
        roomStatus={room.status}
        hasMoveInPhotos={hasMoveInPhotos}
        moveInAcknowledged={moveInAcknowledged}
      />
    </div>
  )
}

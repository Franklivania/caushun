import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoomStatusBadge, EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { BedDouble, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JoinRoomDialog } from "@/components/tenant/join-room-dialog"

export default async function TenantRoomPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const tenancy = await db.query.tenancies.findFirst({
    where: eq(tenancies.tenantId, session.user.id),
    orderBy: [desc(tenancies.createdAt)],
    with: {
      room: { with: { property: { with: { landlord: true } } } },
      tenant: true,
    },
  })

  if (!tenancy) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Room" description="Your current tenancy details" />
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="flex items-center justify-center size-14 rounded-xl bg-primary/10">
            <BedDouble size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-base">No room assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Enter the room code your landlord shared with you to get started.
            </p>
          </div>
          <JoinRoomDialog />
        </div>
      </div>
    )
  }

  const { room } = tenancy
  const escrowViewerUrl = process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL

  return (
    <div className="space-y-6">
      <PageHeader
        title={room.uniqueCode}
        description={`${room.property.name} · ${room.property.address}`}
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
    </div>
  )
}

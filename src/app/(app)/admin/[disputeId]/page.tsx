import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { PhotoComparison } from "@/components/photos/photo-comparison"
import { ResolveDisputeForm } from "@/components/admin/resolve-dispute-form"
import { getDisputeById } from "@/server/disputes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function AdminDisputePage({
  params,
}: {
  params: Promise<{ disputeId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const { disputeId } = await params
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(disputeId)) notFound()

  const dispute = await getDisputeById(disputeId)

  if (!dispute || !dispute.tenancy.escrowId || !dispute.tenancy.tenant) {
    notFound()
  }

  const escrowViewerUrl = process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL
  const moveInPhotos = dispute.tenancy.photos.filter((p) => p.phase === "move_in")
  const moveOutPhotos = dispute.tenancy.photos.filter((p) => p.phase === "move_out")
  const damagePhotos = dispute.tenancy.photos.filter((p) => p.phase === "damage")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resolve dispute"
        description={`Room ${dispute.tenancy.room.uniqueCode} · ${dispute.reason}`}
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Disputes", href: "/admin/disputes" }, { label: "Resolve" }]}
        actions={
          <a
            href={`${escrowViewerUrl}/${dispute.tenancy.escrowId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink size={14} />
              View escrow
            </Button>
          </a>
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tenancy details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room</span>
              <span className="font-mono font-medium">{dispute.tenancy.room.uniqueCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{dispute.tenancy.room.property.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit</span>
              <span className="font-semibold">
                {Number(dispute.tenancy.room.depositAmount).toFixed(0)} USDC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <EscrowStatusBadge status={dispute.tenancy.escrowStatus} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Parties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium">
                {dispute.tenancy.tenant.fullName ?? dispute.tenancy.tenant.name ?? "—"}
              </span>
            </div>
            {dispute.tenancy.tenant.walletAddress && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tenant wallet</span>
                <span className="font-mono text-xs">
                  {dispute.tenancy.tenant.walletAddress.slice(0, 8)}…
                  {dispute.tenancy.tenant.walletAddress.slice(-4)}
                </span>
              </div>
            )}
            {dispute.tenancy.room.property.landlord?.walletAddress && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Landlord wallet</span>
                <span className="font-mono text-xs">
                  {dispute.tenancy.room.property.landlord.walletAddress.slice(0, 8)}…
                  {dispute.tenancy.room.property.landlord.walletAddress.slice(-4)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Raised by</span>
              <span className="font-medium">
                {dispute.raisedByUser.fullName ?? dispute.raisedByUser.name ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {(moveInPhotos.length > 0 || moveOutPhotos.length > 0 || damagePhotos.length > 0) && (
        <PhotoComparison
          moveInPhotos={moveInPhotos}
          moveOutPhotos={moveOutPhotos}
          damagePhotos={damagePhotos}
          moveInDate={dispute.tenancy.moveInDate}
          moveOutDate={dispute.tenancy.moveOutDate ?? undefined}
        />
      )}

      <ResolveDisputeForm
        contractId={dispute.tenancy.escrowId}
        tenancyId={dispute.tenancy.id}
        disputeId={dispute.id}
        tenantWallet={dispute.tenancy.tenant.walletAddress ?? ""}
        landlordWallet={dispute.tenancy.room.property.landlord?.walletAddress ?? ""}
        depositAmount={Number(dispute.tenancy.room.depositAmount)}
        adminWallet={process.env.ADMIN_WALLET_ADDRESS ?? ""}
      />
    </div>
  )
}

import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { PhotoComparison } from "@/components/photos/photo-comparison"
import { ResolveDisputeForm } from "@/components/admin/resolve-dispute-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq } from "drizzle-orm"

export default async function AdminResolveDisputePage({
  params,
}: {
  params: Promise<{ tenancyId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const { tenancyId } = await params
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(tenancyId)) notFound()

  const tenancy = await db.query.tenancies.findFirst({
    where: eq(tenancies.id, tenancyId),
    with: {
      room: { with: { property: { with: { landlord: true } } } },
      tenant: true,
      photos: true,
      disputes: {
        orderBy: (d, { desc }) => [desc(d.createdAt)],
        limit: 1,
        with: { raisedByUser: true },
      },
    },
  })

  if (!tenancy || !tenancy.escrowId || !tenancy.tenant) notFound()

  const dispute = tenancy.disputes[0]
  const escrowViewerUrl = process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL

  const moveInPhotos = tenancy.photos.filter((p) => p.phase === "move_in")
  const moveOutPhotos = tenancy.photos.filter((p) => p.phase === "move_out")
  const damagePhotos = tenancy.photos.filter((p) => p.phase === "damage")

  const tenantWallet = tenancy.tenant.walletAddress ?? ""
  const landlordWallet = tenancy.room.property.landlord?.walletAddress ?? ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resolve dispute"
        description={`Room ${tenancy.room.uniqueCode} · ${dispute?.reason ?? "No reason recorded"}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Disputes", href: "/admin/disputes" },
          { label: "Resolve" },
        ]}
        actions={
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
              <span className="font-mono font-medium">{tenancy.room.uniqueCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{tenancy.room.property.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit</span>
              <span className="font-semibold">
                {Number(tenancy.room.depositAmount).toFixed(0)} USDC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <EscrowStatusBadge status={tenancy.escrowStatus} />
            </div>
            {dispute && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raised</span>
                <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
              </div>
            )}
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
                {tenancy.tenant.fullName ?? tenancy.tenant.name ?? "—"}
              </span>
            </div>
            {tenantWallet && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tenant wallet</span>
                <span className="font-mono text-xs">
                  {tenantWallet.slice(0, 8)}…{tenantWallet.slice(-4)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Landlord</span>
              <span className="font-medium">
                {tenancy.room.property.landlord?.fullName ??
                  tenancy.room.property.landlord?.name ??
                  "—"}
              </span>
            </div>
            {landlordWallet && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Landlord wallet</span>
                <span className="font-mono text-xs">
                  {landlordWallet.slice(0, 8)}…{landlordWallet.slice(-4)}
                </span>
              </div>
            )}
            {dispute?.raisedByUser && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raised by</span>
                <span className="font-medium">
                  {dispute.raisedByUser.fullName ?? dispute.raisedByUser.name ?? "—"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(moveInPhotos.length > 0 || moveOutPhotos.length > 0 || damagePhotos.length > 0) && (
        <PhotoComparison
          moveInPhotos={moveInPhotos}
          moveOutPhotos={moveOutPhotos}
          damagePhotos={damagePhotos}
          moveInDate={tenancy.moveInDate}
          moveOutDate={tenancy.moveOutDate ?? undefined}
        />
      )}

      <ResolveDisputeForm
        contractId={tenancy.escrowId}
        tenancyId={tenancy.id}
        disputeId={dispute?.id}
        tenantWallet={tenantWallet}
        landlordWallet={landlordWallet}
        depositAmount={Number(tenancy.room.depositAmount)}
        adminWallet={process.env.ADMIN_WALLET_ADDRESS ?? ""}
      />
    </div>
  )
}

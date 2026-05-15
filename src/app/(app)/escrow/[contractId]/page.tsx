import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { PhotoComparison } from "@/components/photos/photo-comparison"
import { EscrowStatusCard } from "@/components/escrow/escrow-status-card"
import { ApprovalActions } from "@/components/escrow/approval-actions"
import { CheckoutForm } from "@/components/escrow/checkout-form"
import { getTenancyByEscrow, getTenancyById } from "@/server/tenancies"
import { auth } from "@/auth"
import { notFound } from "next/navigation"

export default async function EscrowPage({
  params,
}: {
  params: Promise<{ contractId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const { contractId } = await params
  const tenancy =
    contractId.length === 36
      ? await getTenancyById(contractId)
      : await getTenancyByEscrow(contractId)

  if (!tenancy) notFound()

  const landlordWallet = tenancy.room.property.landlord.walletAddress ?? ""
  const tenantWallet = tenancy.tenant?.walletAddress
  const moveInPhotos = tenancy.photos.filter((p) => p.phase === "move_in")
  const moveOutPhotos = tenancy.photos.filter((p) => p.phase === "move_out")
  const damagePhotos = tenancy.photos.filter((p) => p.phase === "damage")

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Room ${tenancy.room.uniqueCode}`}
        description={tenancy.room.property.address}
      />

      <EscrowStatusCard
        roomCode={tenancy.room.uniqueCode}
        depositAmount={tenancy.room.depositAmount}
        tenantWallet={tenantWallet}
        landlordWallet={landlordWallet}
        moveInDate={tenancy.moveInDate}
        contractId={tenancy.escrowId}
        status={tenancy.escrowStatus}
      />

      {(moveInPhotos.length > 0 || moveOutPhotos.length > 0 || damagePhotos.length > 0) && (
        <PhotoComparison
          moveInPhotos={moveInPhotos}
          moveOutPhotos={moveOutPhotos}
          damagePhotos={damagePhotos}
          moveInDate={tenancy.moveInDate}
          moveOutDate={tenancy.moveOutDate ?? undefined}
        />
      )}

      {tenancy.escrowId && tenantWallet && (
        <CheckoutForm
          contractId={tenancy.escrowId}
          tenancyId={tenancy.id}
          tenantWallet={tenantWallet}
          tenantId={tenancy.tenantId ?? ""}
          roomCode={tenancy.room.uniqueCode}
          depositAmount={Number(tenancy.room.depositAmount)}
        />
      )}

      {tenancy.escrowId && (
        <ApprovalActions
          contractId={tenancy.escrowId}
          landlordWallet={landlordWallet}
          tenancyId={tenancy.id}
        />
      )}
    </div>
  )
}

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { and, eq, desc, not } from "drizzle-orm"
import { Wallet } from "lucide-react"
import { EscrowActions } from "@/components/tenant/escrow-actions"
import { RoomCondition } from "@/components/tenant/room-condition"
import { JoinRoomDialog } from "@/components/tenant/join-room-dialog"
import { getPhotosByTenancy } from "@/server/photos"

export default async function TenantEscrowPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const tenancy = await db.query.tenancies.findFirst({
    where: and(
      eq(tenancies.tenantId, session.user.id),
      not(eq(tenancies.escrowStatus, "resolved"))
    ),
    orderBy: [desc(tenancies.createdAt)],
    with: {
      room: { with: { property: { with: { landlord: true } } } },
      tenant: true,
    },
  })

  if (!tenancy) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Escrow"
          description="Your security deposit escrow"
          breadcrumbs={[{ label: "Tenant", href: "/tenant" }, { label: "Escrow" }]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="flex items-center justify-center size-14 rounded-xl bg-primary/10">
            <Wallet size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-base">No active escrow</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Join a room first using the invite link your landlord shared with you.
            </p>
          </div>
          <JoinRoomDialog />
        </div>
      </div>
    )
  }

  const moveInPhotos = await getPhotosByTenancy({ tenancyId: tenancy.id, phase: "move_in" })
  const hasMoveInPhotos = moveInPhotos.length > 0
  const moveInAcknowledged = moveInPhotos.some((p) => p.acknowledgedAt !== null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escrow"
        description={`Deposit for room ${tenancy.room.uniqueCode}`}
        breadcrumbs={[{ label: "Tenant", href: "/tenant" }, { label: "Escrow" }]}
      />
      <RoomCondition
        tenancyId={tenancy.id}
        photos={moveInPhotos}
        escrowStatus={tenancy.escrowStatus}
      />
      <EscrowActions
        tenancyId={tenancy.id}
        contractId={tenancy.escrowId}
        escrowStatus={tenancy.escrowStatus}
        depositAmount={Number(tenancy.room.depositAmount)}
        tenantWallet={tenancy.tenant?.walletAddress ?? null}
        landlordWallet={tenancy.room.property.landlord?.walletAddress ?? null}
        roomCode={tenancy.room.uniqueCode}
        moveInDate={tenancy.moveInDate?.toISOString() ?? null}
        tenantId={session.user.id}
        roomStatus={tenancy.room.status}
        hasMoveInPhotos={hasMoveInPhotos}
        moveInAcknowledged={moveInAcknowledged}
      />
    </div>
  )
}

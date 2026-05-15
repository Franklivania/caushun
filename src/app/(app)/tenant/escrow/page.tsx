import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Wallet } from "lucide-react"
import { EscrowActions } from "@/components/tenant/escrow-actions"
import { JoinRoomDialog } from "@/components/tenant/join-room-dialog"

export default async function TenantEscrowPage() {
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
        <PageHeader title="Escrow" description="Your security deposit escrow" />
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="flex items-center justify-center size-14 rounded-xl bg-primary/10">
            <Wallet size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-base">No escrow yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Join a room first using the room code your landlord shared with you.
            </p>
          </div>
          <JoinRoomDialog />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escrow"
        description={`Deposit for room ${tenancy.room.uniqueCode}`}
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
      />
    </div>
  )
}

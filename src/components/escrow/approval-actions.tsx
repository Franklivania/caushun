"use client"

import { Button } from "@/components/ui/button"
import { useApproveMilestone } from "@/hooks/escrow/use-approve-milestone"
import { useDisputeEscrow } from "@/hooks/escrow/use-dispute-escrow"

export function ApprovalActions({
  contractId,
  landlordWallet,
  tenancyId,
}: {
  contractId: string
  landlordWallet: string
  tenancyId: string
}) {
  const approve = useApproveMilestone()
  const dispute = useDisputeEscrow()
  const pending = approve.isPending || dispute.isPending

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        disabled={pending}
        onClick={() => approve.mutate({ contractId, landlordWallet, tenancyId })}
      >
        {approve.isPending ? "Approving..." : "Approve split"}
      </Button>
      <Button
        variant="destructive"
        disabled={pending}
        onClick={() =>
          dispute.mutate({
            contractId,
            signerWallet: landlordWallet,
            tenancyId,
            reason: "Landlord raised dispute",
          })
        }
      >
        {dispute.isPending ? "Opening dispute..." : "Raise dispute"}
      </Button>
      {(approve.error || dispute.error) && (
        <p className="text-sm text-red-300">
          {(approve.error ?? dispute.error)?.message}
        </p>
      )}
    </div>
  )
}

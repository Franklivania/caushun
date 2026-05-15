import Link from "next/link"
import { StatusBadge, type EscrowStatus } from "@/components/escrow/status-badge"
import { escrowViewerUrl } from "@/hooks/escrow/use-escrow"

export function EscrowStatusCard({
  roomCode,
  depositAmount,
  tenantWallet,
  landlordWallet,
  moveInDate,
  contractId,
  status,
}: {
  roomCode: string
  depositAmount: string | number
  tenantWallet?: string | null
  landlordWallet: string
  moveInDate?: Date
  contractId?: string | null
  status: EscrowStatus
}) {
  const truncate = (wallet?: string | null) =>
    wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Not set"

  return (
    <article className="rounded-lg border border-slate/60 bg-slate p-5 text-white">
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-sm text-ash">Room {roomCode}</p>
        <StatusBadge status={status} />
      </div>
      <div className="mt-5">
        <p className="text-sm text-ash">Deposit amount</p>
        <p className="mt-1 text-[28px] font-semibold leading-tight">{depositAmount} USDC</p>
      </div>
      <dl className="mt-5 grid grid-cols-1 gap-3 text-xs text-ash sm:grid-cols-2">
        <div>
          <dt>Tenant</dt>
          <dd className="font-mono">{truncate(tenantWallet)}</dd>
        </div>
        <div>
          <dt>Landlord</dt>
          <dd className="font-mono">{truncate(landlordWallet)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-[13px] text-ash">
        Move-in:{" "}
        {moveInDate
          ? new Date(moveInDate).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Not started"}
      </p>
      {contractId && (
        <Link
          href={escrowViewerUrl(contractId)}
          target="_blank"
          className="mt-4 inline-flex text-[13px] text-mint hover:underline"
        >
          View on Escrow Viewer
        </Link>
      )}
    </article>
  )
}

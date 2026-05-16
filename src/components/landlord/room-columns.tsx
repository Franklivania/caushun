"use client"

import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Trash2, Link2, Rocket, ExternalLink, Copy, CheckCircle, DoorOpen } from "lucide-react"
import { EscrowStatusBadge, RoomStatusBadge } from "@/components/dashboard/escrow-status-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useDeployEscrow } from "@/hooks/escrow/use-deploy-escrow"
import { useApproveMilestone } from "@/hooks/escrow/use-approve-milestone"
import { useWallet } from "@/hooks/wallet/use-wallet"

export type RoomRow = {
  id: string
  uniqueCode: string
  propertyName: string
  depositAmount: string
  status: "vacant" | "occupied" | "vacated"
  escrowStatus: "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved" | null
  tenantName: string | null
  tenantWallet: string | null
  tenancyId: string | null
  contractId: string | null
}

function RoomActionsDropdown({ row }: { row: RoomRow }) {
  const router = useRouter()
  const { address, connect, isConnected } = useWallet()
  const { mutate: deploy, isPending: deploying } = useDeployEscrow()
  const { mutate: approve, isPending: approving } = useApproveMilestone()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [inviting, setInviting] = useState(false)

  const canDeploy = !row.contractId && !!row.tenantWallet && !!row.tenancyId
  // "active" = on-chain approved but release not yet completed — allow retry
  const canApprove = (row.escrowStatus === "checkout" || row.escrowStatus === "active") && !!row.contractId && !!row.tenancyId
  const escrowViewerUrl = process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL

  async function handleInvite() {
    setInviting(true)
    try {
      const res = await fetch(`/api/rooms/${row.id}/invite`, { method: "POST" })
      const json = await res.json()
      if (json.status === "error") { toast.error(json.message); return }
      await navigator.clipboard.writeText(json.data.inviteUrl)
      toast.success("Invite link copied to clipboard")
    } catch {
      toast.error("Failed to generate invite")
    } finally {
      setInviting(false)
    }
  }

  async function handleApprove() {
    const walletAddress = address ?? await connect("landlord")
    const id = toast.loading("Preparing approval…")
    approve(
      {
        contractId: row.contractId!,
        landlordWallet: walletAddress,
        tenancyId: row.tenancyId!,
        onProgress: (msg) => toast.loading(msg, { id }),
      },
      {
        onSuccess: () => { toast.success("Checkout approved — deposit released to tenant", { id }); router.refresh() },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  async function handleDeploy() {
    const walletAddress = address ?? await connect("landlord")
    const id = toast.loading("Building transaction…")
    deploy(
      {
        landlordWallet: walletAddress,
        tenantWallet: row.tenantWallet!,
        roomId: row.id,
        tenancyId: row.tenancyId!,
        onProgress: (msg) => toast.loading(msg, { id }),
      },
      {
        onSuccess: () => { toast.success("Escrow deployed — tenant can now fund", { id }); router.refresh() },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  async function handleMarkVacant() {
    const res = await fetch(`/api/rooms/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "vacant" }),
    })
    const json = await res.json()
    if (json.status === "error") {
      toast.error(json.message)
    } else {
      toast.success("Room marked as vacant")
      router.refresh()
    }
  }

  async function handleForceEvict() {
    if (!row.tenancyId) return
    const id = toast.loading("Evicting tenant…")
    const res = await fetch(`/api/tenancies/${row.tenancyId}/force-evict`, { method: "POST" })
    const json = await res.json()
    if (json.status === "error") {
      toast.error(json.message, { id })
    } else {
      toast.success("Room is now vacant", { id })
      router.refresh()
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/rooms/${row.id}`, { method: "DELETE" })
    const json = await res.json()
    if (json.status === "error") {
      toast.error(json.message)
    } else {
      toast.success("Room deleted")
      router.refresh()
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/landlord/rooms/${row.id}`} className="flex items-center gap-2">
              <Eye size={14} /> View
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleInvite} disabled={inviting} className="gap-2">
            <Link2 size={14} />
            {inviting ? "Generating…" : "Generate invite link"}
          </DropdownMenuItem>
          {canDeploy && (
            <DropdownMenuItem onClick={handleDeploy} disabled={deploying} className="gap-2">
              <Rocket size={14} />
              {deploying ? "Deploying…" : !isConnected ? "Connect & deploy escrow" : "Deploy escrow"}
            </DropdownMenuItem>
          )}
          {canApprove && (
            <DropdownMenuItem onClick={handleApprove} disabled={approving} className="gap-2">
              <CheckCircle size={14} />
              {approving
                ? "Releasing…"
                : row.escrowStatus === "active"
                  ? "Release funds"
                  : "Approve checkout"}
            </DropdownMenuItem>
          )}
          {row.contractId && escrowViewerUrl && (
            <DropdownMenuItem asChild>
              <a href={`${escrowViewerUrl}/${row.contractId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <ExternalLink size={14} /> View escrow
              </a>
            </DropdownMenuItem>
          )}
          {row.status === "vacated" && (
            <DropdownMenuItem onClick={handleMarkVacant} className="gap-2">
              <DoorOpen size={14} /> Mark as vacant
            </DropdownMenuItem>
          )}
          {row.escrowStatus === "resolved" && row.status !== "vacant" && !!row.tenancyId && (
            <DropdownMenuItem
              onClick={handleForceEvict}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <DoorOpen size={14} /> Force evict tenant
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the room and all associated tenancy records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const roomColumns: ColumnDef<RoomRow>[] = [
  {
    accessorKey: "uniqueCode",
    header: "Room Code",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 group/code">
        <span className="font-mono text-sm font-medium">{row.original.uniqueCode}</span>
        <button
          type="button"
          title="Copy room code"
          onClick={(e) => {
            e.stopPropagation()
            navigator.clipboard.writeText(row.original.uniqueCode)
            toast.success("Room code copied")
          }}
          className="opacity-0 group-hover/code:opacity-100 transition-opacity"
        >
          <Copy size={12} className="text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    ),
  },
  {
    accessorKey: "propertyName",
    header: "Property",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{row.original.propertyName}</span>
    ),
  },
  {
    accessorKey: "depositAmount",
    header: "Deposit",
    cell: ({ row }) => (
      <span className="font-semibold">{Number(row.original.depositAmount).toFixed(0)} USDC</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <RoomStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "escrowStatus",
    header: "Escrow",
    cell: ({ row }) =>
      row.original.escrowStatus ? (
        <EscrowStatusBadge status={row.original.escrowStatus} />
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
  },
  {
    accessorKey: "tenantName",
    header: "Tenant",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.tenantName ?? "—"}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <RoomActionsDropdown row={row.original} />
      </div>
    ),
  },
]

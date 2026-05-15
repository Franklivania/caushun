"use client"

import { type ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, Link2, Copy } from "lucide-react"
import { EscrowStatusBadge, RoomStatusBadge } from "@/components/dashboard/escrow-status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type RoomRow = {
  id: string
  uniqueCode: string
  propertyName: string
  depositAmount: string
  status: "vacant" | "occupied" | "vacated"
  escrowStatus: "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved" | null
  tenantName: string | null
}

function DeleteRoomAction({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (json.status === "error") {
      toast.error(json.message)
    } else {
      toast.success("Room deleted")
      router.refresh()
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 size={14} />
        </Button>
      </AlertDialogTrigger>
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
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Link href={`/landlord/rooms/${row.original.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Eye size={14} />
          </Button>
        </Link>
        <Link href={`/landlord/rooms/${row.original.id}?invite=1`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Generate invite link">
            <Link2 size={14} />
          </Button>
        </Link>
        <DeleteRoomAction id={row.original.id} />
      </div>
    ),
  },
]

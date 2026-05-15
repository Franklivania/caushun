import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type EscrowStatus = "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"
type RoomStatus = "vacant" | "occupied" | "vacated"

const escrowConfig: Record<EscrowStatus, { label: string; className: string }> = {
  pending:  { label: "Pending",  className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  funded:   { label: "Funded",   className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  active:   { label: "Active",   className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  checkout: { label: "Checkout", className: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  disputed: { label: "Disputed", className: "bg-red-500/15 text-red-400 border-red-500/20" },
  resolved: { label: "Resolved", className: "bg-muted text-muted-foreground border-border" },
}

const roomConfig: Record<RoomStatus, { label: string; className: string }> = {
  vacant:   { label: "Vacant",   className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  occupied: { label: "Occupied", className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  vacated:  { label: "Vacated",  className: "bg-muted text-muted-foreground border-border" },
}

export function EscrowStatusBadge({ status }: { status: EscrowStatus }) {
  const cfg = escrowConfig[status]
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold", cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  const cfg = roomConfig[status]
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold", cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

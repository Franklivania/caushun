import { cn } from "@/lib/utils"

const styles = {
  pending: "bg-ash/40 text-slate",
  funded: "bg-mint text-forest",
  active: "bg-forest/10 text-forest",
  checkout: "bg-amber-50 text-amber-700",
  disputed: "bg-red-50 text-red-600",
  resolved: "bg-mint text-forest",
} as const

export type EscrowStatus = keyof typeof styles

export function StatusBadge({ status }: { status: EscrowStatus }) {
  return (
    <span
      className={cn(
        "rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        styles[status]
      )}
    >
      {status}
    </span>
  )
}

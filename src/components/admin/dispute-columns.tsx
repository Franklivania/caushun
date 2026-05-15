"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export interface DisputeRow {
  tenancyId: string
  disputeId: string | null
  roomCode: string
  propertyName: string
  reason: string
  tenantName: string | null
  landlordName: string | null
  raisedAt: Date
  resolved: boolean
}

export const disputeColumns: ColumnDef<DisputeRow>[] = [
  {
    accessorKey: "roomCode",
    header: "Room",
    cell: ({ row }) => (
      <div>
        <span className="font-mono text-sm">{row.original.roomCode}</span>
        <p className="text-xs text-muted-foreground">{row.original.propertyName}</p>
      </div>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ getValue }) => (
      <span className="text-sm line-clamp-2 max-w-[280px]">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "tenantName",
    header: "Tenant",
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue<string | null>() ?? "—"}</span>
    ),
  },
  {
    accessorKey: "landlordName",
    header: "Landlord",
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue<string | null>() ?? "—"}</span>
    ),
  },
  {
    accessorKey: "resolved",
    header: "Status",
    cell: ({ getValue }) => (
      <Badge
        variant="outline"
        className={
          getValue<boolean>()
            ? "bg-muted text-muted-foreground border-border text-[11px]"
            : "bg-red-500/15 text-red-400 border-red-500/20 text-[11px]"
        }
      >
        {getValue<boolean>() ? "Resolved" : "Open"}
      </Badge>
    ),
  },
  {
    accessorKey: "raisedAt",
    header: "Raised",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(getValue<Date>()).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link href={`/admin/disputes/resolve/${row.original.tenancyId}`}>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          Resolve
          <ArrowRight size={12} />
        </Button>
      </Link>
    ),
  },
]

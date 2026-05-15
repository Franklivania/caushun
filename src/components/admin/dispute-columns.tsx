"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"

export interface DisputeRow {
  id: string
  roomCode: string
  reason: string
  tenantName: string | null
  landlordWallet: string | null
  raisedAt: Date
  resolved: boolean
}

export const disputeColumns: ColumnDef<DisputeRow>[] = [
  {
    accessorKey: "roomCode",
    header: "Room",
    cell: ({ getValue }) => (
      <span className="font-mono text-sm">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ getValue }) => (
      <span className="text-sm line-clamp-2 max-w-[300px]">{getValue<string>()}</span>
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
      <Link href={`/admin/${row.original.id}`}>
        <Button variant="ghost" size="icon" className="size-8">
          <Eye size={14} />
        </Button>
      </Link>
    ),
  },
]

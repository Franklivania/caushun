"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"

type EscrowStatus = "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"

export interface TenancyRow {
  id: string
  roomCode: string
  propertyName: string
  tenantName: string | null
  escrowStatus: EscrowStatus
  contractId: string | null
  moveInDate: Date
}

export const tenancyColumns: ColumnDef<TenancyRow>[] = [
  {
    accessorKey: "roomCode",
    header: "Room",
    cell: ({ getValue }) => (
      <span className="font-mono text-sm">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "propertyName",
    header: "Property",
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue<string>()}</span>
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
    accessorKey: "escrowStatus",
    header: "Escrow",
    cell: ({ getValue }) => <EscrowStatusBadge status={getValue<EscrowStatus>()} />,
  },
  {
    accessorKey: "contractId",
    header: "Contract",
    cell: ({ getValue }) => {
      const id = getValue<string | null>()
      return id ? (
        <span className="font-mono text-xs">{id.slice(0, 10)}…</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  },
  {
    accessorKey: "moveInDate",
    header: "Move-in",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(getValue<Date>()).toLocaleDateString()}
      </span>
    ),
  },
]

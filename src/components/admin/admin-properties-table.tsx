"use client"

import { useState, useMemo } from "react"
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
  type Column,
  flexRender,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EscrowStatusBadge, RoomStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { Search, ArrowUpDown, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface RoomSummary {
  id: string
  uniqueCode: string
  roomNumber: string
  status: "vacant" | "occupied" | "vacated"
  depositAmount: number
  tenantName: string | null
  escrowStatus: string | null
}

export interface PropertyRow {
  id: string
  name: string
  address: string
  state: string
  landlordId: string
  landlordName: string
  landlordWallet: string | null
  totalRooms: number
  occupiedRooms: number
  escrowVolume: number
  openDisputes: number
  rooms: RoomSummary[]
}

function SortableHeader({
  column,
  children,
}: {
  column: Column<PropertyRow>
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown size={10} className="opacity-60" />
    </button>
  )
}

export function AdminPropertiesTable({ rows }: { rows: PropertyRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [query, setQuery] = useState("")
  const [selectedProperty, setSelectedProperty] = useState<PropertyRow | null>(null)

  const filtered = useMemo(
    () =>
      query.trim() === ""
        ? rows
        : rows.filter((r) =>
            [r.name, r.address, r.state, r.landlordName]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())
          ),
    [rows, query]
  )

  const columns: ColumnDef<PropertyRow>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Property</SortableHeader>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.address}</p>
          </div>
        ),
      },
      {
        accessorKey: "landlordName",
        header: ({ column }) => (
          <SortableHeader column={column}>Landlord</SortableHeader>
        ),
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{row.original.landlordName}</p>
            {row.original.landlordWallet && (
              <p className="text-[10px] text-muted-foreground font-mono">
                {row.original.landlordWallet.slice(0, 6)}…
                {row.original.landlordWallet.slice(-4)}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "totalRooms",
        header: ({ column }) => (
          <SortableHeader column={column}>Rooms</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.original.totalRooms}</span>
            {row.original.occupiedRooms > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20"
              >
                {row.original.occupiedRooms} occupied
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "escrowVolume",
        header: ({ column }) => (
          <SortableHeader column={column}>Escrow volume</SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm font-semibold tabular-nums">
            {getValue<number>().toFixed(0)} USDC
          </span>
        ),
      },
      {
        accessorKey: "openDisputes",
        header: ({ column }) => (
          <SortableHeader column={column}>Disputes</SortableHeader>
        ),
        cell: ({ getValue }) => {
          const n = getValue<number>()
          return n > 0 ? (
            <Badge
              variant="outline"
              className="text-[11px] bg-red-500/15 text-red-400 border-red-500/20"
            >
              {n} open
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {row.original.openDisputes > 0 && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/disputes">View disputes</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setSelectedProperty(row.original)}
              >
                View rooms
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <>
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          placeholder="Search by property, landlord, address or state…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent border-border">
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => setSelectedProperty(row.original)}
                  className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  {query ? "No properties match your search." : "No properties yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {table.getRowModel().rows.length} of {rows.length}{" "}
        {rows.length === 1 ? "property" : "properties"}
      </p>

      <Sheet
        open={selectedProperty !== null}
        onOpenChange={(open) => !open && setSelectedProperty(null)}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedProperty && (
            <div className="space-y-6">
              <SheetHeader>
                <SheetTitle>{selectedProperty.name}</SheetTitle>
                <SheetDescription>
                  {selectedProperty.address} · {selectedProperty.state}
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Landlord", value: selectedProperty.landlordName },
                  {
                    label: "Wallet",
                    value: selectedProperty.landlordWallet
                      ? `${selectedProperty.landlordWallet.slice(0, 8)}…${selectedProperty.landlordWallet.slice(-4)}`
                      : "—",
                    mono: true,
                  },
                  { label: "Total rooms", value: String(selectedProperty.totalRooms) },
                  { label: "Occupied", value: String(selectedProperty.occupiedRooms) },
                  {
                    label: "Escrow volume",
                    value: `${selectedProperty.escrowVolume.toFixed(0)} USDC`,
                  },
                  {
                    label: "Open disputes",
                    value: String(selectedProperty.openDisputes),
                    highlight: selectedProperty.openDisputes > 0,
                  },
                ].map(({ label, value, mono, highlight }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      {label}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        mono && "font-mono text-xs",
                        highlight && "text-red-400"
                      )}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Rooms ({selectedProperty.rooms.length})
                </p>
                <div className="space-y-2">
                  {selectedProperty.rooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rooms added yet.</p>
                  ) : (
                    selectedProperty.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">
                              {room.uniqueCode}
                            </span>
                            <RoomStatusBadge status={room.status} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {room.roomNumber}
                            {room.tenantName ? ` · ${room.tenantName}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {room.escrowStatus ? (
                            <EscrowStatusBadge
                              status={
                                room.escrowStatus as
                                  | "pending"
                                  | "funded"
                                  | "active"
                                  | "checkout"
                                  | "disputed"
                                  | "resolved"
                              }
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">No escrow</span>
                          )}
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {room.depositAmount.toFixed(0)} USDC
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

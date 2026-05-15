"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table/data-table"
import { roomColumns, type RoomRow } from "@/components/landlord/room-columns"
import { RoomDetailSheet } from "@/components/landlord/room-detail-sheet"

interface RoomsDataTableProps {
  data: RoomRow[]
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export function RoomsDataTable({ data, page, pageSize, pageCount, total }: RoomsDataTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <DataTable
        columns={roomColumns}
        data={data}
        page={page}
        pageSize={pageSize}
        pageCount={pageCount}
        total={total}
        onRowClick={(row) => setSelectedId(row.id)}
      />
      <RoomDetailSheet roomId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  )
}

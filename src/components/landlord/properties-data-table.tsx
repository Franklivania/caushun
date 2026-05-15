"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table/data-table"
import { propertyColumns } from "@/components/landlord/property-columns"
import { PropertyDetailSheet } from "@/components/landlord/property-detail-sheet"

type PropertyRow = {
  id: string
  name: string
  address: string
  state: string
  roomCount: number
  createdAt: Date
}

interface PropertiesDataTableProps {
  data: PropertyRow[]
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export function PropertiesDataTable({ data, page, pageSize, pageCount, total }: PropertiesDataTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <DataTable
        columns={propertyColumns}
        data={data}
        page={page}
        pageSize={pageSize}
        pageCount={pageCount}
        total={total}
        onRowClick={(row) => setSelectedId(row.id)}
      />
      <PropertyDetailSheet propertyId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  )
}

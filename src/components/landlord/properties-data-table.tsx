"use client"

import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table/data-table"
import { propertyColumns } from "@/components/landlord/property-columns"

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
  const router = useRouter()

  return (
    <DataTable
      columns={propertyColumns}
      data={data}
      page={page}
      pageSize={pageSize}
      pageCount={pageCount}
      total={total}
      onRowClick={(row) => router.push(`/landlord/properties/${row.id}`)}
    />
  )
}

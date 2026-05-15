"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback } from "react"

interface Props {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export function DataTablePagination({ page, pageSize, pageCount, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) params.set(k, v)
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams]
  )

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> results
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Rows per page
          <Select
            value={String(pageSize)}
            onValueChange={(v) => router.push(createUrl({ pageSize: v, page: "1" }))}
          >
            <SelectTrigger className="h-8 w-16 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => router.push(createUrl({ page: String(page - 1) }))}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="text-sm px-2 min-w-[60px] text-center">
            {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= pageCount}
            onClick={() => router.push(createUrl({ page: String(page + 1) }))}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

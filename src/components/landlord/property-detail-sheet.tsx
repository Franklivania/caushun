"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RoomStatusBadge, EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { Building2, BedDouble, CalendarDays, Coins } from "lucide-react"
import { format } from "date-fns"

type TenancyData = {
  id: string
  escrowStatus: "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"
  moveInDate: string | null
  moveOutDate: string | null
  tenant: { fullName: string | null; name: string | null; walletAddress: string | null } | null
}

type RoomData = {
  id: string
  uniqueCode: string
  roomNumber: string
  depositAmount: string
  status: "vacant" | "occupied" | "vacated"
  tenancies: TenancyData[]
}

type PropertyData = {
  id: string
  name: string
  address: string
  state: string
  rooms: RoomData[]
}

interface PropertyDetailSheetProps {
  propertyId: string | null
  onClose: () => void
}

export function PropertyDetailSheet({ propertyId, onClose }: PropertyDetailSheetProps) {
  const [data, setData] = useState<PropertyData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!propertyId) { setData(null); return }
    setLoading(true)
    fetch(`/api/properties/${propertyId}`)
      .then((r) => r.json())
      .then((j) => { if (j.status === "success") setData(j.data) })
      .finally(() => setLoading(false))
  }, [propertyId])

  return (
    <Sheet open={!!propertyId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {loading || !data ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-3 mt-6">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          </div>
        ) : (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Building2 size={13} />
                <span>Property</span>
              </div>
              <SheetTitle className="text-xl">{data.name}</SheetTitle>
              <SheetDescription className="text-sm">{data.address}, {data.state}</SheetDescription>
              <Badge variant="outline" className="w-fit mt-1">
                {data.rooms.length} {data.rooms.length === 1 ? "room" : "rooms"}
              </Badge>
            </SheetHeader>

            <div className="space-y-3">
              {data.rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No rooms yet.</p>
              ) : (
                data.rooms.map((room) => {
                  const tenancy = room.tenancies[0] ?? null
                  const tenantName = tenancy?.tenant?.fullName ?? tenancy?.tenant?.name ?? null
                  return (
                    <div key={room.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BedDouble size={14} className="text-muted-foreground" />
                          <span className="font-mono text-sm font-semibold">{room.uniqueCode}</span>
                        </div>
                        <RoomStatusBadge status={room.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Coins size={12} />
                          <span className="font-semibold text-foreground">{Number(room.depositAmount).toFixed(0)} USDC</span>
                        </div>
                        {tenancy && (
                          <div className="flex items-center justify-end">
                            <EscrowStatusBadge status={tenancy.escrowStatus} />
                          </div>
                        )}
                      </div>

                      {tenancy ? (
                        <div className="border-t border-border pt-2.5 space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Tenant</span>
                            <span className="text-foreground font-medium">{tenantName ?? "Unknown"}</span>
                          </div>
                          {tenancy.moveInDate && (
                            <div className="flex items-center gap-1 justify-between">
                              <div className="flex items-center gap-1">
                                <CalendarDays size={11} />
                                <span>Move-in</span>
                              </div>
                              <span className="text-foreground">{format(new Date(tenancy.moveInDate), "dd MMM yyyy")}</span>
                            </div>
                          )}
                          {tenancy.moveOutDate && (
                            <div className="flex items-center gap-1 justify-between">
                              <div className="flex items-center gap-1">
                                <CalendarDays size={11} />
                                <span>Move-out</span>
                              </div>
                              <span className="text-foreground">{format(new Date(tenancy.moveOutDate), "dd MMM yyyy")}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground border-t border-border pt-2.5">Vacant — no active tenancy</p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

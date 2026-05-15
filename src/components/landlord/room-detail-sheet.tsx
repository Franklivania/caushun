"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RoomStatusBadge, EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { BedDouble, CalendarDays, Coins, ExternalLink, Copy, Link2 } from "lucide-react"
import { DeployEscrowButton } from "@/components/landlord/deploy-escrow-button"
import { format } from "date-fns"
import { toast } from "sonner"

type RoomDetailData = {
  id: string
  uniqueCode: string
  roomNumber: string
  depositAmount: string
  status: "vacant" | "occupied" | "vacated"
  property: { name: string; address: string; state: string }
  tenancies: Array<{
    id: string
    escrowId: string | null
    escrowStatus: "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"
    moveInDate: string | null
    moveOutDate: string | null
    tenant: { fullName: string | null; name: string | null; walletAddress: string | null } | null
  }>
}

interface RoomDetailSheetProps {
  roomId: string | null
  onClose: () => void
}

export function RoomDetailSheet({ roomId, onClose }: RoomDetailSheetProps) {
  const [data, setData] = useState<RoomDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (!roomId) { setData(null); return }
    setLoading(true)
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((j) => { if (j.status === "success") setData(j.data) })
      .finally(() => setLoading(false))
  }, [roomId])

  async function handleGenerateInvite() {
    if (!roomId) return
    setInviting(true)
    try {
      const res = await fetch(`/api/rooms/${roomId}/invite`, { method: "POST" })
      const json = await res.json()
      if (json.status === "error") { toast.error(json.message); return }
      await navigator.clipboard.writeText(json.data.inviteUrl)
      toast.success("Invite link copied to clipboard")
    } catch {
      toast.error("Failed to generate invite")
    } finally {
      setInviting(false)
    }
  }

  const tenancy = data?.tenancies[0] ?? null
  const tenantName = tenancy?.tenant?.fullName ?? tenancy?.tenant?.name ?? null
  const escrowViewerUrl = tenancy?.escrowId
    ? `${process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL}/${tenancy.escrowId}`
    : null

  return (
    <Sheet open={!!roomId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {loading || !data ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-36 w-full rounded-xl mt-6" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BedDouble size={13} />
                <span>{data.property.name}</span>
              </div>
              <SheetTitle className="font-mono text-xl">{data.uniqueCode}</SheetTitle>
              <SheetDescription>{data.property.address}, {data.property.state}</SheetDescription>
            </SheetHeader>

            {/* Room info card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Room Details</p>
              <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                <span className="text-muted-foreground">Room number</span>
                <span className="font-medium text-right">{data.roomNumber}</span>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Coins size={13} />
                  <span>Deposit</span>
                </div>
                <span className="font-semibold text-right">{Number(data.depositAmount).toFixed(0)} USDC</span>

                <span className="text-muted-foreground">Status</span>
                <div className="flex justify-end">
                  <RoomStatusBadge status={data.status} />
                </div>
              </div>
            </div>

            {/* Tenancy card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Current Tenancy</p>
              {tenancy ? (
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tenant</span>
                    <span className="font-medium">{tenantName ?? "—"}</span>
                  </div>
                  {tenancy.tenant?.walletAddress && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Wallet</span>
                      <span className="font-mono text-xs">
                        {tenancy.tenant.walletAddress.slice(0, 8)}…{tenancy.tenant.walletAddress.slice(-4)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Escrow</span>
                    <EscrowStatusBadge status={tenancy.escrowStatus} />
                  </div>
                  {tenancy.moveInDate && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays size={13} />
                        <span>Move-in</span>
                      </div>
                      <span>{format(new Date(tenancy.moveInDate), "dd MMM yyyy")}</span>
                    </div>
                  )}
                  {tenancy.moveOutDate && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays size={13} />
                        <span>Move-out</span>
                      </div>
                      <span>{format(new Date(tenancy.moveOutDate), "dd MMM yyyy")}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active tenancy</p>
              )}
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-4 mt-auto p-4">
              {escrowViewerUrl && (
                <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                  <a href={escrowViewerUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} />
                    View on Escrow Explorer
                  </a>
                </Button>
              )}
              {!tenancy?.escrowId && tenancy?.tenant?.walletAddress && roomId && (
                <DeployEscrowButton
                  roomId={roomId}
                  tenancyId={tenancy.id}
                  tenantWallet={tenancy.tenant.walletAddress}
                  className="w-full"
                />
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleGenerateInvite}
                disabled={inviting}
              >
                {inviting ? <Copy size={14} className="animate-spin" /> : <Link2 size={14} />}
                {inviting ? "Generating…" : "Generate & Copy Invite Link"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

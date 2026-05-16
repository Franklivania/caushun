"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EscrowStatusBadge } from "@/components/dashboard/escrow-status-badge"
import { useFundEscrow } from "@/hooks/escrow/use-fund-escrow"
import { useCheckout } from "@/hooks/escrow/use-checkout"
import { useDisputeEscrow } from "@/hooks/escrow/use-dispute-escrow"
import { useSetTrustline } from "@/hooks/escrow/use-set-trustline"
import { useVacateRoom } from "@/hooks/tenancy/use-vacate-room"
import { toast } from "sonner"
import { PhotoUploader } from "@/components/photos/photo-uploader"
import { ExternalLink, Wallet, LogOut, AlertTriangle, Shield, RefreshCw, DoorOpen, Clock } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type EscrowStatus = "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"

interface EscrowActionsProps {
  tenancyId: string
  contractId: string | null | undefined
  escrowStatus: EscrowStatus
  depositAmount: number
  tenantWallet: string | null
  landlordWallet: string | null
  roomCode: string
  moveInDate: string | null
  tenantId: string
  roomStatus: string
  hasMoveInPhotos?: boolean
  moveInAcknowledged?: boolean
}

const escrowViewerBase = process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL ?? "https://viewer.trustlesswork.com"

export function EscrowActions({
  tenancyId,
  contractId,
  escrowStatus,
  depositAmount,
  tenantWallet,
  landlordWallet,
  roomCode,
  moveInDate,
  tenantId,
  roomStatus,
  hasMoveInPhotos = false,
  moveInAcknowledged = false,
}: EscrowActionsProps) {
  const router = useRouter()
  const [disputeReason, setDisputeReason] = useState("")
  const [moveOutPhotos, setMoveOutPhotos] = useState<string[]>([])

  const { mutate: fundEscrow, isPending: funding } = useFundEscrow()
  const { mutate: checkout, isPending: checkingOut } = useCheckout()
  const { mutate: disputeEscrow, isPending: disputing } = useDisputeEscrow()
  const { mutate: setTrustline, isPending: settingTrustline } = useSetTrustline()
  const { mutate: vacateRoom, isPending: vacating } = useVacateRoom()

  const truncate = (addr: string | null) =>
    addr ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : "Not set"

  function handleFund() {
    if (!contractId || !tenantWallet) {
      toast.error("Missing contract or wallet")
      return
    }
    const id = toast.loading("Funding escrow…")
    fundEscrow(
      { contractId, tenantWallet, amount: depositAmount, tenancyId },
      {
        onSuccess: () => { toast.success("Escrow funded", { id }); router.refresh() },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  function handleCheckout() {
    if (!contractId || !tenantWallet) {
      toast.error("Missing contract or wallet")
      return
    }
    const id = toast.loading("Requesting checkout…")
    checkout(
      { contractId, tenantWallet, moveOutPhotoUrls: moveOutPhotos, tenantPct: 100, tenancyId },
      {
        onSuccess: () => { toast.success("Checkout requested", { id }); router.refresh() },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  function handleDispute() {
    if (!contractId || !tenantWallet) {
      toast.error("Missing contract or wallet")
      return
    }
    const id = toast.loading("Raising dispute…")
    disputeEscrow(
      { contractId, signerWallet: tenantWallet, tenancyId, reason: disputeReason },
      {
        onSuccess: () => {
          toast.success("Dispute raised", { id })
          setDisputeReason("")
          router.refresh()
        },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  function handleSetTrustline() {
    if (!tenantWallet) {
      toast.error("Connect your wallet first")
      return
    }
    const id = toast.loading("Setting USDC trustline…")
    setTrustline(
      { signer: tenantWallet },
      {
        onSuccess: () => { toast.success("USDC trustline set", { id }); router.refresh() },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Status overview */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Escrow status
            </CardTitle>
            <EscrowStatusBadge status={escrowStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Room</span>
            <span className="font-mono font-medium">{roomCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit</span>
            <span className="font-semibold">{depositAmount.toFixed(0)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tenant wallet</span>
            <span className="font-mono text-xs">{truncate(tenantWallet)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Landlord wallet</span>
            <span className="font-mono text-xs">{truncate(landlordWallet)}</span>
          </div>
          {moveInDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Move-in</span>
              <span>{new Date(moveInDate).toLocaleDateString()}</span>
            </div>
          )}
          {contractId && (
            <div className="pt-1">
              <a
                href={`${escrowViewerBase}/${contractId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink size={12} />
                View on Escrow Viewer
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions — shown based on escrow state */}
      {escrowStatus === "pending" && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your deposit of <strong>{depositAmount.toFixed(0)} USDC</strong> is waiting to be funded.
              Make sure you have set the USDC trustline on your wallet first.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetTrustline}
                disabled={settingTrustline}
                className="gap-2"
              >
                <Shield size={14} />
                {settingTrustline ? "Setting…" : "Set USDC trustline"}
              </Button>
              <Button
                size="sm"
                onClick={handleFund}
                disabled={funding || !contractId || (hasMoveInPhotos && !moveInAcknowledged)}
                className="gap-2"
                title={hasMoveInPhotos && !moveInAcknowledged ? "Acknowledge the room condition above before funding" : undefined}
              >
                <Wallet size={14} />
                {funding ? "Funding…" : `Fund ${depositAmount.toFixed(0)} USDC`}
              </Button>
              {hasMoveInPhotos && !moveInAcknowledged && (
                <p className="text-xs text-amber-400 mt-1">
                  Acknowledge the room condition above before funding.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {escrowStatus === "active" && (
        <Card className="border-border">
          <CardContent className="py-6 flex items-center gap-3">
            <Clock size={18} className="text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-medium">Checkout approved</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your landlord approved checkout. The platform is releasing your funds — this may take
                a moment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {escrowStatus === "funded" && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your deposit is locked. Request checkout when you are ready to move out — your landlord
              will review and release the funds.
            </p>
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <LogOut size={14} />
                    Request checkout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Request checkout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Upload photos of the room as you&apos;re leaving. Match the same angles as
                      the move-in photos — these are compared side by side if a dispute is raised.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="px-6 pb-2">
                    <PhotoUploader
                      tenancyId={tenancyId}
                      roomCode={roomCode}
                      phase="move_out"
                      uploaderId={tenantId}
                      onUploaded={setMoveOutPhotos}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCheckout}
                      disabled={checkingOut || moveOutPhotos.length === 0}
                    >
                      {checkingOut ? "Requesting…" : "Submit checkout"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <AlertTriangle size={14} />
                    Raise dispute
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Raise a dispute?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will flag the escrow for platform review. Provide as much detail as possible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="px-6 pb-2">
                    <Textarea
                      placeholder="Describe the issue…"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDispute}
                      disabled={disputing || !disputeReason.trim()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {disputing ? "Raising…" : "Raise dispute"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {escrowStatus === "checkout" && (
        <Card className="border-border">
          <CardContent className="py-6 flex items-center gap-3">
            <RefreshCw size={18} className="text-purple-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">Checkout pending</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your request has been sent. Waiting for your landlord to approve and release funds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {escrowStatus === "disputed" && (
        <Card className="border-border">
          <CardContent className="py-6 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">Dispute under review</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The Caushun platform is reviewing the dispute. You will be notified of the outcome.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {escrowStatus === "resolved" && (
        roomStatus === "vacated" ? (
          <Card className="border-border">
            <CardContent className="py-6 flex items-center gap-3">
              <DoorOpen size={18} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">Room vacated</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have formally vacated this room. This tenancy is complete.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Escrow resolved</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Funds have been released. Formally vacate to complete this tenancy.
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="gap-2 w-full">
                    <DoorOpen size={14} />
                    Vacate room
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Vacate this room?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This marks your tenancy as complete and records today as your move-out date.
                      The room will be listed as vacant for the landlord.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={vacating}
                      onClick={() => {
                        const id = toast.loading("Vacating room…")
                        vacateRoom(tenancyId, {
                          onSuccess: () => {
                            toast.success("Room vacated successfully", { id })
                            router.refresh()
                          },
                          onError: (e) => toast.error(e.message, { id }),
                        })
                      }}
                    >
                      {vacating ? "Vacating…" : "Confirm vacate"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}

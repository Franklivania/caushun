"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PhotoUploader } from "@/components/photos/photo-uploader"
import { useApproveMilestone } from "@/hooks/escrow/use-approve-milestone"
import { useDisputeEscrow } from "@/hooks/escrow/use-dispute-escrow"
import { useWallet } from "@/hooks/wallet/use-wallet"
import { toast } from "sonner"
import { CheckCircle, AlertTriangle, Clock } from "lucide-react"
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

interface LandlordEscrowActionsProps {
  tenancyId: string
  contractId: string
  escrowStatus: EscrowStatus
  depositAmount: number
  landlordId: string
  roomCode: string
}

export function LandlordEscrowActions({
  tenancyId,
  contractId,
  escrowStatus,
  depositAmount,
  landlordId,
  roomCode,
}: LandlordEscrowActionsProps) {
  const router = useRouter()
  const { address, connect } = useWallet()
  const { mutate: approve, isPending: approving } = useApproveMilestone()
  const { mutate: dispute, isPending: disputing } = useDisputeEscrow()
  const [disputeReason, setDisputeReason] = useState("")
  const [damagePhotos, setDamagePhotos] = useState<string[]>([])

  async function handleApprove() {
    const walletAddress = address ?? await connect("landlord")
    const id = toast.loading("Preparing approval…")
    approve(
      {
        contractId,
        landlordWallet: walletAddress,
        tenancyId,
        onProgress: (msg) => toast.loading(msg, { id }),
      },
      {
        onSuccess: () => {
          toast.success("Checkout approved — deposit released to tenant", { id })
          router.refresh()
        },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  async function handleCounter() {
    const walletAddress = address ?? await connect("landlord")
    const id = toast.loading("Raising dispute…")
    dispute(
      { contractId, signerWallet: walletAddress, tenancyId, reason: disputeReason },
      {
        onSuccess: () => {
          toast.success("Dispute raised — Caushun will review and decide the split", { id })
          setDisputeReason("")
          setDamagePhotos([])
          router.refresh()
        },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  if (escrowStatus === "pending" || escrowStatus === "resolved") return null

  // Active = on-chain approved but release didn't complete — landlord can retry
  if (escrowStatus === "active") {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Landlord actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 py-1">
            <Clock size={18} className="text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-medium">Approval done — release pending</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The on-chain approval succeeded but funds weren&apos;t released yet. Tap below to
                complete the release.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled={approving}>
                <CheckCircle size={14} />
                {approving ? "Releasing…" : "Release funds"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Release funds?</AlertDialogTitle>
                <AlertDialogDescription>
                  The on-chain approval is already recorded. This will release the{" "}
                  {depositAmount.toFixed(0)} USDC deposit back to the tenant.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove} disabled={approving}>
                  {approving ? "Releasing…" : "Release"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Landlord actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {escrowStatus === "checkout" && (
          <>
            <p className="text-sm text-muted-foreground">
              The tenant has requested checkout. Approve to release the full{" "}
              <strong>{depositAmount.toFixed(0)} USDC</strong> deposit back to them, or counter if
              you have deductions to claim — Caushun will review and decide the split.
            </p>
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="gap-2" disabled={approving}>
                    <CheckCircle size={14} />
                    Approve checkout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve checkout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This releases the full {depositAmount.toFixed(0)} USDC deposit back to the
                      tenant. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove} disabled={approving}>
                      {approving ? "Approving…" : "Approve & release"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2" disabled={disputing}>
                    <AlertTriangle size={14} />
                    Counter
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Counter the checkout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This flags the escrow for Caushun platform review. Upload damage photos and
                      describe the deductions you are claiming — the platform will decide the final
                      split.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="px-6 pb-2 space-y-4">
                    <PhotoUploader
                      tenancyId={tenancyId}
                      roomCode={roomCode}
                      phase="damage"
                      uploaderId={landlordId}
                      onUploaded={setDamagePhotos}
                      existingUrls={damagePhotos}
                      maxPhotos={6}
                    />
                    <Textarea
                      placeholder="Describe the damage or deductions…"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCounter}
                      disabled={disputing || !disputeReason.trim()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {disputing ? "Submitting…" : "Submit counter"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}

        {escrowStatus === "funded" && (
          <>
            <p className="text-sm text-muted-foreground">
              The escrow is active. You can raise a dispute if there is an issue with the tenancy.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2" disabled={disputing}>
                  <AlertTriangle size={14} />
                  Raise dispute
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Raise a dispute?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This flags the escrow for Caushun platform review. Upload any supporting photos
                    and describe the issue.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="px-6 pb-2 space-y-4">
                  <PhotoUploader
                    tenancyId={tenancyId}
                    roomCode={roomCode}
                    phase="damage"
                    uploaderId={landlordId}
                    onUploaded={setDamagePhotos}
                    existingUrls={damagePhotos}
                    maxPhotos={6}
                  />
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
                    onClick={handleCounter}
                    disabled={disputing || !disputeReason.trim()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {disputing ? "Raising…" : "Raise dispute"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {escrowStatus === "disputed" && (
          <div className="flex items-center gap-3 py-2">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium">Dispute under review</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Caushun is reviewing this dispute and will decide the final split. You will be
                notified of the outcome.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

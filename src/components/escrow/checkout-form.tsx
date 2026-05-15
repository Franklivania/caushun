"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PhotoUploader } from "@/components/photos/photo-uploader"
import { useCheckout } from "@/hooks/escrow/use-checkout"
import { toast } from "sonner"

export function CheckoutForm({
  contractId,
  tenancyId,
  tenantWallet,
  tenantId,
  roomCode,
}: {
  contractId: string
  tenancyId: string
  tenantWallet: string
  tenantId: string
  roomCode: string
  depositAmount: number
}) {
  const router = useRouter()
  const [photos, setPhotos] = useState<string[]>([])
  const checkout = useCheckout()

  function handleCheckout() {
    const id = toast.loading("Requesting checkout…")
    checkout.mutate(
      {
        contractId,
        tenancyId,
        tenantWallet,
        moveOutPhotoUrls: photos,
        tenantPct: 100,
      },
      {
        onSuccess: () => { toast.success("Checkout requested", { id }); router.refresh() },
        onError: (e) => toast.error(e.message, { id }),
      }
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload photos of the room as you&apos;re leaving. Try to match the same angles as the
        move-in photos — these are compared side by side if a dispute is raised.
      </p>
      <PhotoUploader
        tenancyId={tenancyId}
        roomCode={roomCode}
        phase="move_out"
        uploaderId={tenantId}
        onUploaded={setPhotos}
      />
      <Button
        onClick={handleCheckout}
        disabled={checkout.isPending || photos.length === 0}
        className="w-full"
      >
        {checkout.isPending ? "Submitting…" : "Request checkout"}
      </Button>
      {photos.length === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          At least one photo is required before submitting.
        </p>
      )}
    </div>
  )
}

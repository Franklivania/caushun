"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PhotoUploader } from "@/components/photos/photo-uploader"
import { useCheckout } from "@/hooks/escrow/use-checkout"

export function CheckoutForm({
  contractId,
  tenancyId,
  tenantWallet,
  tenantId,
  roomCode,
  depositAmount,
}: {
  contractId: string
  tenancyId: string
  tenantWallet: string
  tenantId: string
  roomCode: string
  depositAmount: number
}) {
  const [photos, setPhotos] = useState<string[]>([])
  const [tenantPct, setTenantPct] = useState(100)
  const checkout = useCheckout()
  const tenantAmount = (depositAmount * tenantPct) / 100

  return (
    <div className="rounded-lg border border-slate/60 bg-slate p-5">
      <h2 className="text-xl font-medium">Request checkout</h2>
      <div className="mt-4">
        <PhotoUploader
          tenancyId={tenancyId}
          roomCode={roomCode}
          phase="move_out"
          uploaderId={tenantId}
          onUploaded={setPhotos}
        />
      </div>
      <label className="mt-5 block text-sm text-white">
        How much should be returned to you?
        <input
          type="range"
          min={0}
          max={100}
          value={tenantPct}
          onChange={(event) => setTenantPct(Number(event.target.value))}
          className="mt-3 h-2 w-full accent-forest"
        />
      </label>
      <p className="mt-3 text-[28px] font-semibold text-white">
        {tenantPct}% - {tenantAmount.toFixed(2)} USDC
      </p>
      <p className="text-[13px] text-ash">
        {100 - tenantPct}% - {(depositAmount - tenantAmount).toFixed(2)} USDC goes to landlord
      </p>
      {checkout.error && <p className="mt-3 text-sm text-red-300">{checkout.error.message}</p>}
      <Button
        className="mt-5"
        disabled={checkout.isPending || photos.length === 0}
        onClick={() =>
          checkout.mutate({
            contractId,
            tenancyId,
            tenantWallet,
            moveOutPhotoUrls: photos,
            tenantPct,
          })
        }
      >
        {checkout.isPending ? "Transaction pending..." : "Request checkout"}
      </Button>
    </div>
  )
}

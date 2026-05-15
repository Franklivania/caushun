"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { acknowledgePhotos } from "@/server/photos"
import { ikThumb } from "@/lib/imagekit/client"
import { toast } from "sonner"
import { CheckCircle } from "lucide-react"

type EscrowStatus = "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"

interface RoomPhoto {
  imagekitUrl: string
  createdAt: Date
  acknowledgedAt: Date | null
}

interface RoomConditionProps {
  tenancyId: string
  photos: RoomPhoto[]
  escrowStatus: EscrowStatus
}

export function RoomCondition({ tenancyId, photos, escrowStatus }: RoomConditionProps) {
  const router = useRouter()
  const [acknowledging, setAcknowledging] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  if (escrowStatus === "resolved" || escrowStatus === "pending" && photos.length === 0) return null

  const acknowledged = photos.some((p) => p.acknowledgedAt !== null)
  const acknowledgedAt = photos.find((p) => p.acknowledgedAt)?.acknowledgedAt

  async function handleAcknowledge() {
    setAcknowledging(true)
    try {
      await acknowledgePhotos({ tenancyId, phase: "move_in" })
      toast.success("Room condition acknowledged")
      router.refresh()
    } catch {
      toast.error("Failed to acknowledge — please try again")
    } finally {
      setAcknowledging(false)
    }
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Room condition
            </CardTitle>
            {acknowledged && acknowledgedAt && (
              <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/40">
                <CheckCircle size={11} className="mr-1" />
                Confirmed {new Date(acknowledgedAt).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your landlord hasn&apos;t documented the room yet. Check back after they upload
              move-in photos.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <button
                    key={photo.imagekitUrl}
                    type="button"
                    onClick={() => setLightboxUrl(photo.imagekitUrl)}
                    className="aspect-[4/3] overflow-hidden rounded-md bg-muted transition-all hover:ring-2 hover:ring-primary"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ikThumb(photo.imagekitUrl)}
                      alt={`Room photo ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>

              {!acknowledged && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Review these photos carefully. By acknowledging you confirm this is the
                    room&apos;s condition at move-in — this becomes the baseline if a dispute is
                    raised.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleAcknowledge}
                    disabled={acknowledging}
                    className="gap-2"
                  >
                    <CheckCircle size={14} />
                    {acknowledging ? "Acknowledging…" : "Acknowledge condition"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size photo"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 text-2xl font-light text-white/70 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}

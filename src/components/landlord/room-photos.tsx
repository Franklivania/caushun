"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PhotoUploader } from "@/components/photos/photo-uploader"
import { ikThumb } from "@/lib/imagekit/client"

type EscrowStatus = "pending" | "funded" | "active" | "checkout" | "disputed" | "resolved"

interface RoomPhoto {
  imagekitUrl: string
  createdAt: Date
  acknowledgedAt: Date | null
}

interface LandlordRoomPhotosProps {
  tenancyId: string
  roomCode: string
  uploaderId: string
  escrowStatus: EscrowStatus
  moveInPhotos: RoomPhoto[]
  moveOutPhotos: RoomPhoto[]
}

const canUpload = (status: EscrowStatus) =>
  status === "pending" || status === "funded" || status === "active"

const showMoveOutSection = (status: EscrowStatus) =>
  status === "checkout" || status === "disputed" || status === "resolved"

function PhotoGrid({
  photos,
  label,
  onLightbox,
}: {
  photos: RoomPhoto[]
  label: string
  onLightbox: (url: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo, i) => (
        <button
          key={photo.imagekitUrl}
          type="button"
          onClick={() => onLightbox(photo.imagekitUrl)}
          className="aspect-4/3 overflow-hidden rounded-md bg-muted transition-all hover:ring-2 hover:ring-primary"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ikThumb(photo.imagekitUrl)}
            alt={`${label} ${i + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  )
}

export function LandlordRoomPhotos({
  tenancyId,
  roomCode,
  uploaderId,
  escrowStatus,
  moveInPhotos: initialMoveIn,
  moveOutPhotos,
}: LandlordRoomPhotosProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [moveInPhotos, setMoveInPhotos] = useState<RoomPhoto[]>(initialMoveIn)

  const acknowledged = moveInPhotos.some((p) => p.acknowledgedAt !== null)
  const acknowledgedAt = moveInPhotos.find((p) => p.acknowledgedAt)?.acknowledgedAt

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Room photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* ── Move-in condition ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Move-in condition
              </p>
              {moveInPhotos.length > 0 && (
                acknowledged ? (
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/40">
                    Tenant confirmed {acknowledgedAt ? new Date(acknowledgedAt).toLocaleDateString() : ""}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/40">
                    Awaiting acknowledgement
                  </Badge>
                )
              )}
            </div>

            {moveInPhotos.length > 0 && (
              <PhotoGrid photos={moveInPhotos} label="Move-in photo" onLightbox={setLightboxUrl} />
            )}

            {canUpload(escrowStatus) && (
              <div>
                {moveInPhotos.length === 0 && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Document the room before the tenant moves in. These become the baseline for
                    any dispute.
                  </p>
                )}
                <PhotoUploader
                  tenancyId={tenancyId}
                  roomCode={roomCode}
                  phase="move_in"
                  uploaderId={uploaderId}
                  maxPhotos={10 - moveInPhotos.length}
                  onUploaded={(urls) => {
                    setMoveInPhotos((prev) => [
                      ...prev,
                      ...urls.map((u) => ({ imagekitUrl: u, createdAt: new Date(), acknowledgedAt: null })),
                    ])
                  }}
                />
              </div>
            )}

            {!canUpload(escrowStatus) && moveInPhotos.length === 0 && (
              <p className="text-xs text-muted-foreground">No move-in photos uploaded.</p>
            )}
          </div>

          {/* Divider — only shown when move-out section is relevant */}
          {showMoveOutSection(escrowStatus) && (
            <div className="border-t border-border" />
          )}

          {/* ── Move-out condition ── */}
          {showMoveOutSection(escrowStatus) && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Move-out condition
              </p>
              {moveOutPhotos.length > 0 ? (
                <PhotoGrid photos={moveOutPhotos} label="Move-out photo" onLightbox={setLightboxUrl} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Awaiting tenant move-out photos.
                </p>
              )}
            </div>
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

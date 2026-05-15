"use client"

import { useState } from "react"
import { ikThumb } from "@/lib/imagekit/client"

interface PhotoRecord {
  imagekitUrl: string
  createdAt: Date
}

interface PhotoComparisonProps {
  moveInPhotos: PhotoRecord[]
  moveOutPhotos: PhotoRecord[]
  damagePhotos?: PhotoRecord[]
  moveInDate?: Date
  moveOutDate?: Date
}

export function PhotoComparison({
  moveInPhotos,
  moveOutPhotos,
  damagePhotos = [],
  moveInDate,
  moveOutDate,
}: PhotoComparisonProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const formatDate = (date?: Date) =>
    date
      ? new Date(date).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-"

  const photoGrid = (
    photos: PhotoRecord[],
    label: string,
    date: Date | undefined,
    emptyText: string
  ) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-forest">{label}</p>
        <p className="text-[11px] text-ash">{formatDate(date)}</p>
      </div>
      {photos.length === 0 ? (
        <div className="rounded-md border border-dashed border-ash p-6 text-center">
          <p className="text-xs text-ash">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {photos.map((photo, index) => (
            <button
              key={photo.imagekitUrl}
              type="button"
              onClick={() => setLightboxUrl(photo.imagekitUrl)}
              className="aspect-[4/3] overflow-hidden rounded-md bg-ash/20 transition-all hover:ring-2 hover:ring-forest"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ikThumb(photo.imagekitUrl)}
                alt={`${label} photo ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {photoGrid(moveInPhotos, "Move-in condition", moveInDate, "No move-in photos uploaded")}
          {photoGrid(moveOutPhotos, "Move-out condition", moveOutDate, "No move-out photos uploaded yet")}
        </div>
        {damagePhotos.length > 0 && (
          <div className="border-t border-slate/40 pt-4">
            {photoGrid(damagePhotos, "Damage evidence", undefined, "No damage photos")}
          </div>
        )}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size evidence"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 text-2xl font-light text-white/70 hover:text-white"
            aria-label="Close"
          >
            x
          </button>
        </div>
      )}
    </>
  )
}

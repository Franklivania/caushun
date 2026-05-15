"use client"

import { AnimatePresence, motion } from "motion/react"
import { useCallback, useRef, useState } from "react"
import { uploadPhotos, type PhotoPhase } from "@/lib/imagekit/upload"
import { savePhotos } from "@/server/photos"

interface PhotoUploaderProps {
  tenancyId: string
  roomCode: string
  phase: PhotoPhase
  uploaderId: string
  onUploaded: (urls: string[]) => void
  existingUrls?: string[]
  maxPhotos?: number
  disabled?: boolean
}

const PHASE_LABELS: Record<PhotoPhase, string> = {
  move_in: "Move-in photos",
  move_out: "Move-out photos",
  damage: "Damage evidence",
}

const PHASE_HINTS: Record<PhotoPhase, string> = {
  move_in: "Photograph every room, wall, and fixture.",
  move_out: "Match the same angles as the move-in photos.",
  damage: "Photograph damage clearly with close-ups and wide shots.",
}

export function PhotoUploader({
  tenancyId,
  roomCode,
  phase,
  uploaderId,
  onUploaded,
  existingUrls = [],
  maxPhotos = 10,
  disabled = false,
}: PhotoUploaderProps) {
  const [previews, setPreviews] = useState<string[]>(existingUrls)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingUrls)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const validateFiles = useCallback(
    (files: File[]): string | null => {
      const remaining = maxPhotos - uploadedUrls.length
      if (files.length > remaining) return `You can upload ${remaining} more photo${remaining === 1 ? "" : "s"}.`
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          return `${file.name} is not a supported format. Use JPEG, PNG, or WEBP.`
        }
        if (file.size > 5 * 1024 * 1024) {
          return `${file.name} exceeds 5MB. Please compress it first.`
        }
      }
      return null
    },
    [maxPhotos, uploadedUrls.length]
  )

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      if (files.length === 0) return

      const validationError = validateFiles(files)
      if (validationError) {
        setError(validationError)
        return
      }

      const localPreviews = files.map((file) => URL.createObjectURL(file))
      setPreviews((prev) => [...prev, ...localPreviews])
      setError(null)
      setUploading(true)
      setProgress(0)
      abortControllerRef.current = new AbortController()

      try {
        const urls = await uploadPhotos({
          files,
          tenancyId,
          roomCode,
          phase,
          onProgress: setProgress,
          abortSignal: abortControllerRef.current.signal,
        })

        await savePhotos({ tenancyId, uploaderId, urls, phase })
        const all = [...uploadedUrls, ...urls]
        setUploadedUrls(all)
        onUploaded(all)
      } catch (err: unknown) {
        setPreviews((prev) => prev.slice(0, prev.length - files.length))
        setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [tenancyId, roomCode, phase, uploaderId, uploadedUrls, onUploaded, validateFiles]
  )

  const handleRemove = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index)
    const newUrls = uploadedUrls.filter((_, i) => i !== index)
    setPreviews(newPreviews)
    setUploadedUrls(newUrls)
    onUploaded(newUrls)
  }

  const canUploadMore = uploadedUrls.length < maxPhotos && !disabled

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-forest">
          {PHASE_LABELS[phase]}
        </p>
        <p className="mt-0.5 text-xs text-ash">{PHASE_HINTS[phase]}</p>
      </div>

      {canUploadMore && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragOver(false)
            handleFiles(event.dataTransfer.files)
          }}
          className={[
            "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            isDragOver ? "border-forest bg-mint/20" : "border-ash hover:border-forest hover:bg-mint/10",
            uploading ? "pointer-events-none opacity-60" : "",
          ].join(" ")}
        >
          <p className="text-sm text-slate">
            {uploading ? "Uploading..." : "Tap to upload or drag photos here"}
          </p>
          <p className="mt-1 text-xs text-ash">
            JPEG, PNG, WEBP, max 5MB each, {maxPhotos - uploadedUrls.length} remaining
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            className="hidden"
            onChange={(event) => event.target.files && handleFiles(event.target.files)}
          />
        </div>
      )}

      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-1 w-full overflow-hidden rounded-full bg-ash/40"
          >
            <motion.div
              className="h-full rounded-full bg-forest"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {previews.map((src, index) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-md bg-ash/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${PHASE_LABELS[phase]} ${index + 1}`} className="h-full w-full object-cover" />
              {!disabled && !uploading && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-red-600/80 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  x
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

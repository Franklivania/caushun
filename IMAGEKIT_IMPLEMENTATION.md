# Caushun — ImageKit Implementation Guide

Full implementation reference for photo upload, folder structure, and component usage.
Every file path maps directly to the project folder structure in `AGENT.md`.

---

## Install

```bash
bun add @imagekit/next
```

That's the only package needed. It covers both the server auth helper and the client upload function.

---

## Folder structure for ImageKit files

```
src/
├── app/
│   └── api/
│       └── photos/
│           └── upload-auth/
│               └── route.ts        ← generates one-time upload credentials
├── lib/
│   └── imagekit/
│       ├── client.ts               ← ImageKit URL helper (for rendering images)
│       └── upload.ts               ← uploadPhoto() function used in components
├── server/
│   └── photos.ts                   ← server action: saves URLs to Neon DB
└── components/
    └── photos/
        ├── PhotoUploader.tsx        ← upload UI with progress + preview grid
        └── PhotoComparison.tsx      ← side-by-side move-in vs move-out view
```

---

## Environment variables required

```bash
# .env.local
IMAGEKIT_PRIVATE_KEY=private_abc123...          # server only — never expose
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_abc123...
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/youraccountid
```

Get all three from: https://imagekit.io/dashboard/developer/api-keys

---

## How the upload flow works

```
PhotoUploader (client)
  │
  ├── 1. fetch("/api/photos/upload-auth")
  │         └── route.ts calls getUploadAuthParams() with IMAGEKIT_PRIVATE_KEY
  │             returns: { token, expire, signature, publicKey }
  │
  ├── 2. upload(file, { folder, token, expire, signature, publicKey })
  │         └── file goes directly to ImageKit CDN
  │             returns: { url: "https://ik.imagekit.io/..." }
  │
  └── 3. onUploaded(urls[]) fires
            └── parent form calls savePhotos() server action
                └── URLs saved to property_photos table in Neon DB
                └── URLs also passed as evidence to TW changeMilestoneStatus
```

---

## Folder path convention

Every photo is stored at a deterministic path:

```
/caushun/tenancies/{tenancyId}/{phase}/{filename}
```

Examples:
```
/caushun/tenancies/ten_abc123/move_in/NSK-001-R02-move_in-1715623000000.jpg
/caushun/tenancies/ten_abc123/move_out/NSK-001-R02-move_out-1715899200000.jpg
/caushun/tenancies/ten_abc123/damage/NSK-001-R02-damage-1715899201000.jpg
```

Rules:
- **Always prefix `/caushun/`** — isolates all app files in the ImageKit dashboard.
- **Segment by `tenancyId`** — one folder per tenancy, tenancies never share photo buckets.
- **Segment by `phase`** — `move_in | move_out | damage` are always separate subdirectories.

ImageKit creates folders automatically on first upload. No manual setup needed.

---

## File 1 — `src/app/api/photos/upload-auth/route.ts`

Server route that generates one-time upload credentials.
The client calls this before every upload batch.

```typescript
import { getUploadAuthParams } from "@imagekit/next/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Optional: add wallet address validation here to ensure
    // only authenticated Caushun users can get upload credentials
    const { token, expire, signature } = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
      expire: 30 * 60, // credentials valid for 30 minutes
    })

    return NextResponse.json({
      token,
      expire,
      signature,
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    })
  } catch (error) {
    console.error("[upload-auth] Failed to generate auth params:", error)
    return NextResponse.json(
      { error: "Failed to generate upload credentials" },
      { status: 500 }
    )
  }
}
```

---

## File 2 — `src/lib/imagekit/client.ts`

URL helper for rendering stored images. Used in PhotoComparison and any
place you display a photo by its stored path (not the full URL).

```typescript
// Constructs a CDN URL from a stored ImageKit path
// Use this if you ever store the path instead of the full URL.
// For Caushun we store full URLs from upload response, so this is
// mainly used for transformations (resize, etc.)

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!

/**
 * Build an ImageKit URL with optional transformations.
 *
 * @param path  - ImageKit path, e.g. "/caushun/tenancies/abc/move_in/photo.jpg"
 * @param width - Optional: resize width in px
 * @param height - Optional: resize height in px
 */
export function ikUrl(path: string, width?: number, height?: number): string {
  if (!width && !height) {
    return `${urlEndpoint}${path}`
  }

  const transforms: string[] = []
  if (width)  transforms.push(`w-${width}`)
  if (height) transforms.push(`h-${height}`)

  // ImageKit transformation format: /tr:w-400,h-300/path
  return `${urlEndpoint}/tr:${transforms.join(",")},fo-auto${path}`
  // fo-auto = smart focus/crop — preserves important areas of the image
}

/**
 * Thumbnail helper — used in the photo preview grid.
 * Returns a 400×300 optimised version of any stored photo.
 */
export function ikThumb(url: string): string {
  // url is already the full IK URL — insert transformation segment
  return url.replace(urlEndpoint, `${urlEndpoint}/tr:w-400,h-300,fo-auto,q-80`)
}
```

---

## File 3 — `src/lib/imagekit/upload.ts`

The core upload function. Called by `PhotoUploader`. Handles auth fetch,
folder path construction, filename generation, and progress tracking.

```typescript
"use client"

import { upload } from "@imagekit/next"

export type PhotoPhase = "move_in" | "move_out" | "damage"

export interface UploadPhotoParams {
  file: File
  tenancyId: string
  roomCode: string         // e.g. "NSK-001-R02" — used in filename
  phase: PhotoPhase
  onProgress?: (pct: number) => void
  abortSignal?: AbortSignal
}

export interface UploadPhotoResult {
  url: string              // full ImageKit CDN URL
  fileId: string           // ImageKit file ID (useful for deletion later)
  name: string             // stored filename
}

/**
 * Uploads a single photo to ImageKit under the correct Caushun folder path.
 * Fetches one-time auth credentials from our server before uploading.
 *
 * Folder structure: /caushun/tenancies/{tenancyId}/{phase}/
 */
export async function uploadPhoto({
  file,
  tenancyId,
  roomCode,
  phase,
  onProgress,
  abortSignal,
}: UploadPhotoParams): Promise<UploadPhotoResult> {
  // 1. Get one-time auth credentials from our server
  const authRes = await fetch("/api/photos/upload-auth", {
    signal: abortSignal,
  })

  if (!authRes.ok) {
    throw new Error("Failed to get upload credentials. Please try again.")
  }

  const { token, expire, signature, publicKey } = await authRes.json()

  // 2. Build folder path and filename
  const folder = `/caushun/tenancies/${tenancyId}/${phase}`
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const fileName = `${roomCode}-${phase}-${Date.now()}.${ext}`

  // 3. Upload directly to ImageKit
  const response = await upload({
    file,
    fileName,
    folder,
    publicKey,
    signature,
    expire,
    token,
    tags: [tenancyId, roomCode, phase],
    // useUniqueFileName: false — we control the filename ourselves
    useUniqueFileName: false,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const pct = Math.round((event.loaded / event.total) * 100)
        onProgress(pct)
      }
    },
  })

  return {
    url: response.url,
    fileId: response.fileId,
    name: response.name,
  }
}

/**
 * Upload multiple photos in sequence.
 * Reports aggregate progress across all files.
 *
 * @returns Array of CDN URLs in the same order as input files
 */
export async function uploadPhotos({
  files,
  tenancyId,
  roomCode,
  phase,
  onProgress,
  abortSignal,
}: Omit<UploadPhotoParams, "file"> & { files: File[] }): Promise<string[]> {
  const urls: string[] = []
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    const result = await uploadPhoto({
      file,
      tenancyId,
      roomCode,
      phase,
      abortSignal,
      onProgress: (filePct) => {
        // aggregate: completed files + current file's progress
        const aggregate = Math.round(((i + filePct / 100) / total) * 100)
        onProgress?.(aggregate)
      },
    })

    urls.push(result.url)
  }

  return urls
}
```

---

## File 4 — `src/server/photos.ts`

Server action. Called after upload completes to persist URLs to the DB.
Also used to fetch photos for display and to record acknowledgments.

```typescript
"use server"

import { db } from "@/db"
import { property_photos } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { PhotoPhase } from "@/lib/imagekit/upload"

/**
 * Persist uploaded photo URLs to the property_photos table.
 * Called immediately after a successful upload batch.
 */
export async function savePhotos({
  tenancyId,
  uploaderId,
  urls,
  phase,
}: {
  tenancyId: string
  uploaderId: string
  urls: string[]
  phase: PhotoPhase
}): Promise<void> {
  if (urls.length === 0) return

  await db.insert(property_photos).values(
    urls.map((imagekit_url) => ({
      tenancyId,
      uploaderId,
      imagekit_url,
      phase,
      // acknowledged_at is null until the other party confirms
    }))
  )
}

/**
 * Fetch all photos for a tenancy, optionally filtered by phase.
 */
export async function getPhotosByTenancy({
  tenancyId,
  phase,
}: {
  tenancyId: string
  phase?: PhotoPhase
}) {
  if (phase) {
    return db
      .select()
      .from(property_photos)
      .where(
        and(
          eq(property_photos.tenancyId, tenancyId),
          eq(property_photos.phase, phase)
        )
      )
  }

  return db
    .select()
    .from(property_photos)
    .where(eq(property_photos.tenancyId, tenancyId))
}

/**
 * Mark photos as acknowledged by the viewing party.
 * Called when tenant confirms they've seen the move-in photos,
 * or landlord confirms they've seen the move-out photos.
 *
 * Records the timestamp as on-chain-verifiable proof of acknowledgment.
 */
export async function acknowledgePhotos({
  tenancyId,
  phase,
}: {
  tenancyId: string
  phase: PhotoPhase
}): Promise<void> {
  await db
    .update(property_photos)
    .set({ acknowledged_at: new Date() })
    .where(
      and(
        eq(property_photos.tenancyId, tenancyId),
        eq(property_photos.phase, phase)
      )
    )
}
```

---

## File 5 — `src/components/photos/PhotoUploader.tsx`

Full upload UI component. Drop zone, camera input (mobile), progress bar,
preview grid, and error state. Used in:

- Move-in form (landlord uploads before escrow deploy)
- Move-in acknowledgment (tenant uploads their own move-in photos)
- Checkout form (tenant uploads move-out photos)
- Landlord approval panel (landlord uploads damage evidence)

```typescript
"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { uploadPhotos, PhotoPhase } from "@/lib/imagekit/upload"
import { savePhotos } from "@/server/photos"

interface PhotoUploaderProps {
  tenancyId: string
  roomCode: string
  phase: PhotoPhase
  uploaderId: string           // wallet address of the uploading party
  onUploaded: (urls: string[]) => void
  existingUrls?: string[]      // already uploaded photos for this phase
  maxPhotos?: number
  disabled?: boolean
}

const PHASE_LABELS: Record<PhotoPhase, string> = {
  move_in:  "Move-in photos",
  move_out: "Move-out photos",
  damage:   "Damage evidence",
}

const PHASE_HINTS: Record<PhotoPhase, string> = {
  move_in:  "Photograph every room, wall, and fixture. This is your baseline record.",
  move_out: "Match the same angles as the move-in photos for a clear comparison.",
  damage:   "Photograph any damage clearly. Include close-ups and wide shots.",
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

  const validateFiles = (files: File[]): string | null => {
    const remaining = maxPhotos - uploadedUrls.length
    if (files.length > remaining) {
      return `You can upload ${remaining} more photo${remaining === 1 ? "" : "s"}.`
    }
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        return `${file.name} is not a supported format. Use JPEG, PNG, or WEBP.`
      }
      if (file.size > 5 * 1024 * 1024) {
        return `${file.name} exceeds 5MB. Please compress it first.`
      }
    }
    return null
  }

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      if (files.length === 0) return

      const validationError = validateFiles(files)
      if (validationError) {
        setError(validationError)
        return
      }

      // Show local previews immediately
      const localPreviews = files.map((f) => URL.createObjectURL(f))
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

        // Persist to DB
        await savePhotos({ tenancyId, uploaderId, urls, phase })

        const all = [...uploadedUrls, ...urls]
        setUploadedUrls(all)
        onUploaded(all)
      } catch (err: unknown) {
        // Remove the local previews that failed
        setPreviews((prev) => prev.slice(0, prev.length - files.length))
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again."
        setError(message)
      } finally {
        setUploading(false)
        setProgress(0)
      }
    },
    [tenancyId, roomCode, phase, uploaderId, uploadedUrls, onUploaded]
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

      {/* Phase label + hint */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-forest">
          {PHASE_LABELS[phase]}
        </p>
        <p className="text-xs text-ash mt-0.5">{PHASE_HINTS[phase]}</p>
      </div>

      {/* Drop zone */}
      {canUploadMore && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={[
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
            "transition-colors duration-150",
            isDragOver
              ? "border-forest bg-mint/20"
              : "border-ash hover:border-forest hover:bg-mint/10",
            uploading ? "pointer-events-none opacity-60" : "",
          ].join(" ")}
        >
          {uploading ? (
            <p className="text-sm text-slate">Uploading...</p>
          ) : (
            <>
              <p className="text-sm text-slate">
                Tap to upload or drag photos here
              </p>
              <p className="text-xs text-ash mt-1">
                JPEG · PNG · WEBP · max 5MB each ·{" "}
                {maxPhotos - uploadedUrls.length} remaining
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"  // opens camera on mobile
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Progress bar */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-1 w-full bg-ash/40 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-forest rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className="relative aspect-[4/3] rounded-md overflow-hidden bg-ash/20 group"
            >
              <img
                src={src}
                alt={`${PHASE_LABELS[phase]} ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Remove button — only show if not disabled and upload is done */}
              {!disabled && !uploading && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(i) }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/80
                             text-white text-xs flex items-center justify-center
                             opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Count indicator */}
      {uploadedUrls.length > 0 && (
        <p className="text-xs text-ash">
          {uploadedUrls.length} / {maxPhotos} photos uploaded
        </p>
      )}
    </div>
  )
}
```

---

## File 6 — `src/components/photos/PhotoComparison.tsx`

Side-by-side view of move-in vs move-out photos. Used in:
- Landlord approval panel (`/landlord/room/[roomId]`)
- Admin dispute resolution page (`/admin/[disputeId]`)

```typescript
"use client"

import { useState } from "react"
import { ikThumb } from "@/lib/imagekit/client"

interface PhotoComparisonProps {
  moveInPhotos: { imagekit_url: string; created_at: Date }[]
  moveOutPhotos: { imagekit_url: string; created_at: Date }[]
  damagePhotos?: { imagekit_url: string; created_at: Date }[]
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

  const formatDate = (d?: Date) =>
    d ? new Date(d).toLocaleDateString("en-NG", {
          day: "numeric", month: "short", year: "numeric"
        })
      : "—"

  const PhotoGrid = ({
    photos,
    label,
    date,
    emptyText,
  }: {
    photos: { imagekit_url: string }[]
    label: string
    date?: Date
    emptyText: string
  }) => (
    <div className="flex flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-forest uppercase tracking-wide">
          {label}
        </p>
        <p className="text-[11px] text-ash">{formatDate(date)}</p>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-md border border-dashed border-ash p-6 text-center">
          <p className="text-xs text-ash">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {photos.map((photo, i) => (
            <button
              key={photo.imagekit_url}
              type="button"
              onClick={() => setLightboxUrl(photo.imagekit_url)}
              className="aspect-[4/3] rounded-md overflow-hidden bg-ash/20
                         hover:ring-2 hover:ring-forest transition-all"
            >
              <img
                src={ikThumb(photo.imagekit_url)}
                alt={`${label} photo ${i + 1}`}
                className="w-full h-full object-cover"
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
        {/* Move-in vs Move-out — two columns on md+, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhotoGrid
            photos={moveInPhotos}
            label="Move-in condition"
            date={moveInDate}
            emptyText="No move-in photos uploaded"
          />
          <PhotoGrid
            photos={moveOutPhotos}
            label="Move-out condition"
            date={moveOutDate}
            emptyText="No move-out photos uploaded yet"
          />
        </div>

        {/* Damage evidence — full width below, only if present */}
        {damagePhotos.length > 0 && (
          <div className="border-t border-slate/40 pt-4">
            <PhotoGrid
              photos={damagePhotos}
              label="Damage evidence"
              emptyText="No damage photos"
            />
          </div>
        )}
      </div>

      {/* Lightbox — click any photo to view full size */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-navy/95 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Full size photo"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white
                       text-2xl font-light"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
```

---

## Usage examples

### Move-in form (landlord)

```typescript
// In /landlord/room/new/page.tsx or wherever landlord sets up a room
import { PhotoUploader } from "@/components/photos/PhotoUploader"

// Inside your form component:
const [moveInPhotoUrls, setMoveInPhotoUrls] = useState<string[]>([])

<PhotoUploader
  tenancyId={tenancyId}           // created before this step
  roomCode={room.uniqueCode}      // e.g. "NSK-001-R02"
  phase="move_in"
  uploaderId={landlordWalletAddress}
  onUploaded={setMoveInPhotoUrls}
  maxPhotos={10}
/>
```

### Checkout form (tenant)

```typescript
// In /tenant/checkout/[tenancyId]/page.tsx
const [moveOutUrls, setMoveOutUrls] = useState<string[]>([])

<PhotoUploader
  tenancyId={params.tenancyId}
  roomCode={tenancy.room.uniqueCode}
  phase="move_out"
  uploaderId={tenantWalletAddress}
  onUploaded={setMoveOutUrls}
  maxPhotos={10}
/>

// On submit — pass URLs as TW milestone evidence:
const evidence = JSON.stringify({
  photos: moveOutUrls,
  proposedSplit: { tenantPct, landlordPct },
  requestedBy: "tenant",
  timestamp: new Date().toISOString(),
})
// → passed to changeMilestoneStatus as newEvidence field
```

### Landlord approval panel

```typescript
// In /landlord/room/[roomId]/page.tsx
import { PhotoComparison } from "@/components/photos/PhotoComparison"
import { getPhotosByTenancy } from "@/server/photos"

// In your server component:
const allPhotos = await getPhotosByTenancy({ tenancyId })
const moveInPhotos  = allPhotos.filter((p) => p.phase === "move_in")
const moveOutPhotos = allPhotos.filter((p) => p.phase === "move_out")
const damagePhotos  = allPhotos.filter((p) => p.phase === "damage")

// Render:
<PhotoComparison
  moveInPhotos={moveInPhotos}
  moveOutPhotos={moveOutPhotos}
  damagePhotos={damagePhotos}
  moveInDate={tenancy.move_in_date}
  moveOutDate={tenancy.move_out_date ?? undefined}
/>
```

### Landlord uploading damage evidence (in approval flow)

```typescript
const [damageUrls, setDamageUrls] = useState<string[]>([])

<PhotoUploader
  tenancyId={tenancyId}
  roomCode={room.uniqueCode}
  phase="damage"
  uploaderId={landlordWalletAddress}
  onUploaded={setDamageUrls}
  maxPhotos={10}
/>
```

---

## How photo URLs become TW on-chain evidence

When tenant submits the checkout form, the uploaded ImageKit URLs are
serialised into the `newEvidence` field of the TW milestone update call.
This means the photo record is verifiable both in your DB and on-chain.

```typescript
// src/app/api/escrow/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { twClient } from "@/lib/escrow/client"
import { checkoutSchema } from "@/schemas/checkout.schema"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = checkoutSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { contractId, serviceProvider, moveOutPhotoUrls, tenantPct } = parsed.data

  // Build evidence string — this goes on-chain
  const newEvidence = JSON.stringify({
    photos: moveOutPhotoUrls,           // ← ImageKit CDN URLs
    proposedSplit: {
      tenantPct,
      landlordPct: 100 - tenantPct,
    },
    requestedBy: "tenant",
    timestamp: new Date().toISOString(),
  })

  const { data } = await twClient.post(
    "/escrow/single-release/change-milestone-status",
    {
      contractId,
      milestoneIndex: "0",
      newStatus: "checkout-requested",
      newEvidence,
      serviceProvider,
    }
  )

  // Return unsigned XDR to client for signing
  return NextResponse.json({ unsignedTransaction: data.unsignedTransaction })
}
```

```typescript
// src/schemas/checkout.schema.ts
import { z } from "zod"

export const checkoutSchema = z.object({
  contractId: z.string().min(1),
  serviceProvider: z.string().min(56).max(56), // Stellar address length
  moveOutPhotoUrls: z
    .array(z.string().url())
    .min(1, "At least one move-out photo is required")
    .max(10),
  tenantPct: z
    .number()
    .min(0)
    .max(100)
    .refine((v) => Number.isInteger(v), "Must be a whole number"),
})
```

---

## Quick reference

| What | Where |
|---|---|
| Auth endpoint | `GET /api/photos/upload-auth` |
| Upload function | `src/lib/imagekit/upload.ts` → `uploadPhoto()` / `uploadPhotos()` |
| Save to DB | `src/server/photos.ts` → `savePhotos()` |
| Render images | `src/lib/imagekit/client.ts` → `ikUrl()` / `ikThumb()` |
| Upload UI | `src/components/photos/PhotoUploader.tsx` |
| Side-by-side view | `src/components/photos/PhotoComparison.tsx` |
| Folder pattern | `/caushun/tenancies/{tenancyId}/{phase}/` |
| File naming | `{roomCode}-{phase}-{timestamp}.{ext}` |
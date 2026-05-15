"use client"

import { upload } from "@imagekit/next"
import type { ApiResponse } from "@/lib/api-response"

export type PhotoPhase = "move_in" | "move_out" | "damage"

export interface UploadPhotoParams {
  file: File
  tenancyId: string
  roomCode: string
  phase: PhotoPhase
  onProgress?: (pct: number) => void
  abortSignal?: AbortSignal
}

export interface UploadPhotoResult {
  url: string
  fileId: string
  name: string
}

interface UploadAuth {
  token: string
  expire: number
  signature: string
  publicKey: string
}

export async function uploadPhoto({
  file,
  tenancyId,
  roomCode,
  phase,
  onProgress,
  abortSignal,
}: UploadPhotoParams): Promise<UploadPhotoResult> {
  const authRes = await fetch("/api/photos/upload-auth", {
    signal: abortSignal,
  })
  const authJson = (await authRes.json()) as ApiResponse<UploadAuth>
  if (authJson.status === "error") {
    throw new Error(authJson.message)
  }

  const { token, expire, signature, publicKey } = authJson.data
  const folder = `/caushun/tenancies/${tenancyId}/${phase}`
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const fileName = `${roomCode}-${phase}-${Date.now()}.${ext}`

  const response = await upload({
    file,
    fileName,
    folder,
    publicKey,
    signature,
    expire,
    token,
    tags: [tenancyId, roomCode, phase],
    useUniqueFileName: false,
    abortSignal,
    onProgress: (event: ProgressEvent) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    },
  })

  return {
    url: response.url ?? "",
    fileId: response.fileId ?? "",
    name: response.name ?? fileName,
  }
}

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

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i]
    if (!file) continue

    const result = await uploadPhoto({
      file,
      tenancyId,
      roomCode,
      phase,
      abortSignal,
      onProgress: (filePct) => {
        onProgress?.(Math.round(((i + filePct / 100) / total) * 100))
      },
    })

    urls.push(result.url)
  }

  return urls
}

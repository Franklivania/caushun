"use server"

import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { propertyPhotos } from "@/db/schema"
import type { PhotoPhase } from "@/lib/imagekit/upload"

export async function savePhotos(input: {
  tenancyId: string
  uploaderId: string
  urls: string[]
  phase: PhotoPhase
}): Promise<void> {
  if (input.urls.length === 0) return

  await db.insert(propertyPhotos).values(
    input.urls.map((imagekitUrl) => ({
      tenancyId: input.tenancyId,
      uploaderId: input.uploaderId,
      imagekitUrl,
      phase: input.phase,
    }))
  )
}

export async function getPhotosByTenancy(input: {
  tenancyId: string
  phase?: PhotoPhase
}) {
  if (input.phase) {
    return db
      .select()
      .from(propertyPhotos)
      .where(
        and(
          eq(propertyPhotos.tenancyId, input.tenancyId),
          eq(propertyPhotos.phase, input.phase)
        )
      )
  }

  return db
    .select()
    .from(propertyPhotos)
    .where(eq(propertyPhotos.tenancyId, input.tenancyId))
}

export async function acknowledgePhotos(input: {
  tenancyId: string
  phase: PhotoPhase
}): Promise<void> {
  await db
    .update(propertyPhotos)
    .set({ acknowledgedAt: new Date() })
    .where(
      and(
        eq(propertyPhotos.tenancyId, input.tenancyId),
        eq(propertyPhotos.phase, input.phase)
      )
    )
}

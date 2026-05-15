import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"
import { z } from "zod"

const patchSchema = z.object({
  escrowStatus: z.enum(["pending", "funded", "active", "checkout", "disputed", "resolved"]).optional(),
  moveOutDate: z.string().datetime().optional().transform((v) => v ? new Date(v) : undefined),
  proposedSplitPct: z.number().min(0).max(100).optional(),
  resolutionNotes: z.string().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenancyId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { tenancyId } = await params
  const [tenancy] = await db.select().from(tenancies).where(eq(tenancies.id, tenancyId))
  if (!tenancy) return NextResponse.json(fail("Not found"), { status: 404 })
  return NextResponse.json(ok(tenancy))
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tenancyId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(fail("Unauthorized"), { status: 401 })

  const { tenancyId } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(fail("Invalid data", parsed.error.flatten()), { status: 400 })
  }

  const [updated] = await db
    .update(tenancies)
    .set(parsed.data)
    .where(eq(tenancies.id, tenancyId))
    .returning()

  return NextResponse.json(ok(updated, "Tenancy updated"))
}

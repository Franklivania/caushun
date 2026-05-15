/**
 * Force-closes an active tenancy without an on-chain transaction.
 * Use when the escrow is broken (e.g. wrong platformFee) and the tenant
 * needs to be freed to join a new room.
 *
 * Run:
 *   bun scripts/reset-tenancy.ts <walletAddress>
 *   bun scripts/reset-tenancy.ts <tenancyId>
 *
 * Both identifiers are accepted. The script resolves the tenancy and
 * marks the room as vacant.
 */

import { db } from "@/db"
import { rooms, tenancies, users } from "@/db/schema"
import { eq, or } from "drizzle-orm"

const arg = process.argv[2]
if (!arg) {
  console.error("Usage: bun scripts/reset-tenancy.ts <walletAddress|tenancyId>")
  process.exit(1)
}

// Determine if arg is a UUID (tenancyId) or a Stellar address (wallet)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = UUID_RE.test(arg)

let tenancyId: string
let roomId: string

if (isUuid) {
  const tenancy = await db.query.tenancies.findFirst({
    where: eq(tenancies.id, arg),
    with: { room: true, tenant: true },
  })
  if (!tenancy) {
    console.error("No tenancy found for ID:", arg)
    process.exit(1)
  }
  console.log(`Found tenancy: ${tenancy.id}`)
  console.log(`  Tenant : ${tenancy.tenant?.fullName ?? tenancy.tenant?.name ?? "unknown"}`)
  console.log(`  Room   : ${tenancy.room.uniqueCode}`)
  console.log(`  Status : ${tenancy.escrowStatus}`)
  tenancyId = tenancy.id
  roomId = tenancy.roomId
} else {
  // Treat as wallet address — find the user, then their latest active tenancy
  const user = await db.query.users.findFirst({
    where: eq(users.walletAddress, arg),
  })
  if (!user) {
    console.error("No user found with wallet address:", arg)
    process.exit(1)
  }

  const activeTenancy = await db.query.tenancies.findFirst({
    where: eq(tenancies.tenantId, user.id),
    with: { room: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })
  if (!activeTenancy) {
    console.error("No tenancy found for user:", user.walletAddress)
    process.exit(1)
  }
  console.log(`Found tenancy: ${activeTenancy.id}`)
  console.log(`  Tenant : ${user.fullName ?? user.name ?? user.walletAddress}`)
  console.log(`  Room   : ${activeTenancy.room.uniqueCode}`)
  console.log(`  Status : ${activeTenancy.escrowStatus}`)
  tenancyId = activeTenancy.id
  roomId = activeTenancy.roomId
}

console.log("\nResetting…")

await db
  .update(tenancies)
  .set({ escrowStatus: "resolved", resolutionNotes: "Force-closed by admin (broken escrow)" })
  .where(eq(tenancies.id, tenancyId))

await db
  .update(rooms)
  .set({ status: "vacant" })
  .where(eq(rooms.id, roomId))

console.log("Done.")
console.log("  Tenancy escrowStatus → resolved")
console.log("  Room status          → vacant")
console.log("")
console.log("The tenant can now accept a new invite link.")

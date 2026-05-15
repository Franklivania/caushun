import { relations } from "drizzle-orm"
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

export const userRoleEnum = pgEnum("user_role", ["landlord", "tenant", "admin"])
export const roomStatusEnum = pgEnum("room_status", [
  "vacant",
  "occupied",
  "vacated",
])
export const escrowStatusEnum = pgEnum("escrow_status", [
  "pending",
  "funded",
  "active",
  "checkout",
  "disputed",
  "resolved",
])
export const photoPhaseEnum = pgEnum("photo_phase", [
  "move_in",
  "move_out",
  "damage",
])

// ── Users ─────────────────────────────────────────────────────────────
// walletAddress and role are nullable — OAuth users set these during onboarding
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  // NextAuth required fields
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  // Caushun fields
  walletAddress: text("wallet_address").unique(),
  role: userRoleEnum("role"),
  fullName: text("full_name"),
  phone: text("phone"),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// ── NextAuth adapter tables ────────────────────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
)

// ── Properties ────────────────────────────────────────────────────────
export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  landlordId: uuid("landlord_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  state: text("state").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// ── Rooms ─────────────────────────────────────────────────────────────
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  roomNumber: text("room_number").notNull(),
  uniqueCode: text("unique_code").notNull().unique(),
  depositAmount: numeric("deposit_amount", { precision: 12, scale: 2 }).notNull(),
  status: roomStatusEnum("status").default("vacant").notNull(),
  inviteToken: text("invite_token").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// ── Tenancies ─────────────────────────────────────────────────────────
export const tenancies = pgTable("tenancies", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").notNull().references(() => rooms.id),
  tenantId: uuid("tenant_id").references(() => users.id),
  escrowId: text("escrow_id"),
  escrowStatus: escrowStatusEnum("escrow_status").default("pending").notNull(),
  moveInDate: timestamp("move_in_date", { withTimezone: true }).defaultNow().notNull(),
  moveOutDate: timestamp("move_out_date", { withTimezone: true }),
  proposedSplitPct: integer("proposed_split_pct"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// ── Property Photos ───────────────────────────────────────────────────
export const propertyPhotos = pgTable("property_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenancyId: uuid("tenancy_id").notNull().references(() => tenancies.id),
  uploaderId: uuid("uploader_id").notNull().references(() => users.id),
  imagekitUrl: text("imagekit_url").notNull(),
  phase: photoPhaseEnum("phase").notNull(),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// ── Disputes ──────────────────────────────────────────────────────────
export const disputes = pgTable("disputes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenancyId: uuid("tenancy_id").notNull().references(() => tenancies.id),
  raisedBy: uuid("raised_by").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  platformVerdictPct: integer("platform_verdict_pct"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// ── Relations ─────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  properties: many(properties),
  tenancies: many(tenancies),
  photos: many(propertyPhotos),
  disputes: many(disputes),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  landlord: one(users, {
    fields: [properties.landlordId],
    references: [users.id],
  }),
  rooms: many(rooms),
}))

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  tenancies: many(tenancies),
}))

export const tenanciesRelations = relations(tenancies, ({ one, many }) => ({
  room: one(rooms, {
    fields: [tenancies.roomId],
    references: [rooms.id],
  }),
  tenant: one(users, {
    fields: [tenancies.tenantId],
    references: [users.id],
  }),
  photos: many(propertyPhotos),
  disputes: many(disputes),
}))

export const propertyPhotosRelations = relations(propertyPhotos, ({ one }) => ({
  tenancy: one(tenancies, {
    fields: [propertyPhotos.tenancyId],
    references: [tenancies.id],
  }),
  uploader: one(users, {
    fields: [propertyPhotos.uploaderId],
    references: [users.id],
  }),
}))

export const disputesRelations = relations(disputes, ({ one }) => ({
  tenancy: one(tenancies, {
    fields: [disputes.tenancyId],
    references: [tenancies.id],
  }),
  raisedByUser: one(users, {
    fields: [disputes.raisedBy],
    references: [users.id],
  }),
}))

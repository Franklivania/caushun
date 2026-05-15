import { loadEnvConfig } from "@next/env"
import { neon } from "@neondatabase/serverless"

loadEnvConfig(process.cwd())

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error("DATABASE_URL is not set")

const sql = neon(databaseUrl)

// Phase 1: create enums and base tables (idempotent)
const baseStatements = [
  "DO $$ BEGIN CREATE TYPE user_role AS ENUM ('landlord', 'tenant'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE room_status AS ENUM ('vacant', 'occupied', 'vacated'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE escrow_status AS ENUM ('pending', 'funded', 'active', 'checkout', 'disputed', 'resolved'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE photo_phase AS ENUM ('move_in', 'move_out', 'damage'); EXCEPTION WHEN duplicate_object THEN null; END $$",

  // users — created first with only the columns that always existed
  // columns added in phase 2 if they're missing
  `CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address text,
    role user_role,
    full_name text,
    phone text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id uuid NOT NULL REFERENCES users(id),
    name text NOT NULL,
    address text NOT NULL,
    state text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES properties(id),
    room_number text NOT NULL,
    unique_code text NOT NULL,
    deposit_amount numeric(12, 2) NOT NULL,
    status room_status NOT NULL DEFAULT 'vacant',
    invite_token text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS tenancies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES rooms(id),
    tenant_id uuid REFERENCES users(id),
    escrow_id text,
    escrow_status escrow_status NOT NULL DEFAULT 'pending',
    move_in_date timestamptz NOT NULL DEFAULT now(),
    move_out_date timestamptz,
    proposed_split_pct integer,
    resolution_notes text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS property_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenancy_id uuid NOT NULL REFERENCES tenancies(id),
    uploader_id uuid NOT NULL REFERENCES users(id),
    imagekit_url text NOT NULL,
    phase photo_phase NOT NULL,
    acknowledged_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE IF NOT EXISTS disputes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenancy_id uuid NOT NULL REFERENCES tenancies(id),
    raised_by uuid NOT NULL REFERENCES users(id),
    reason text NOT NULL,
    platform_verdict_pct integer,
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  // NextAuth adapter tables
  `CREATE TABLE IF NOT EXISTS accounts (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    CONSTRAINT accounts_provider_provider_account_id_pk PRIMARY KEY (provider, provider_account_id)
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    session_token text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires timestamptz NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamptz NOT NULL,
    CONSTRAINT verification_tokens_identifier_token_pk PRIMARY KEY (identifier, token)
  )`,

  "CREATE INDEX IF NOT EXISTS properties_landlord_id_idx ON properties(landlord_id)",
  "CREATE INDEX IF NOT EXISTS rooms_property_id_idx ON rooms(property_id)",
  "CREATE INDEX IF NOT EXISTS tenancies_room_id_idx ON tenancies(room_id)",
  "CREATE INDEX IF NOT EXISTS tenancies_tenant_id_idx ON tenancies(tenant_id)",
  "CREATE INDEX IF NOT EXISTS tenancies_escrow_id_idx ON tenancies(escrow_id)",
  "CREATE INDEX IF NOT EXISTS property_photos_tenancy_id_idx ON property_photos(tenancy_id)",
  "CREATE INDEX IF NOT EXISTS disputes_tenancy_id_idx ON disputes(tenancy_id)",
]

// Phase 2: alter existing tables to add new columns + constraints (idempotent via IF NOT EXISTS / exceptions)
const alterStatements = [
  // Drop NOT NULL on columns that are now nullable (no-op if already nullable)
  "ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL",
  "ALTER TABLE users ALTER COLUMN role DROP NOT NULL",

  // Add new NextAuth columns to users (idempotent)
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS name text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS email text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified timestamptz",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS image text",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false",

  // Add admin to the user_role enum (idempotent in PG 12+)
  "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin'",

  // Add unique constraints (swallow duplicate errors)
  "DO $$ BEGIN ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE(email); EXCEPTION WHEN duplicate_table THEN null; END $$",
  "DO $$ BEGIN ALTER TABLE users ADD CONSTRAINT users_wallet_address_unique UNIQUE(wallet_address); EXCEPTION WHEN duplicate_table THEN null; END $$",
  "DO $$ BEGIN ALTER TABLE rooms ADD CONSTRAINT rooms_unique_code_unique UNIQUE(unique_code); EXCEPTION WHEN duplicate_table THEN null; END $$",
  "DO $$ BEGIN ALTER TABLE rooms ADD CONSTRAINT rooms_invite_token_unique UNIQUE(invite_token); EXCEPTION WHEN duplicate_table THEN null; END $$",
]

console.log("Running base statements…")
for (const statement of baseStatements) {
  await sql.query(statement)
}

console.log("Running alter statements…")
for (const statement of alterStatements) {
  await sql.query(statement)
}

console.log(`✓ Migration complete (${baseStatements.length + alterStatements.length} statements).`)

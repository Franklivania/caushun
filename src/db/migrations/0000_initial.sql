DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('landlord', 'tenant');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE room_status AS ENUM ('vacant', 'occupied', 'vacated');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE escrow_status AS ENUM ('pending', 'funded', 'active', 'checkout', 'disputed', 'resolved');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE photo_phase AS ENUM ('move_in', 'move_out', 'damage');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL UNIQUE,
  role user_role NOT NULL,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  address text NOT NULL,
  state text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_number text NOT NULL,
  unique_code text NOT NULL UNIQUE,
  deposit_amount numeric(12, 2) NOT NULL,
  status room_status NOT NULL DEFAULT 'vacant',
  invite_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenancies (
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
);

CREATE TABLE IF NOT EXISTS property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id uuid NOT NULL REFERENCES tenancies(id),
  uploader_id uuid NOT NULL REFERENCES users(id),
  imagekit_url text NOT NULL,
  phase photo_phase NOT NULL,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id uuid NOT NULL REFERENCES tenancies(id),
  raised_by uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  platform_verdict_pct integer,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS properties_landlord_id_idx ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS rooms_property_id_idx ON rooms(property_id);
CREATE INDEX IF NOT EXISTS tenancies_room_id_idx ON tenancies(room_id);
CREATE INDEX IF NOT EXISTS tenancies_tenant_id_idx ON tenancies(tenant_id);
CREATE INDEX IF NOT EXISTS tenancies_escrow_id_idx ON tenancies(escrow_id);
CREATE INDEX IF NOT EXISTS property_photos_tenancy_id_idx ON property_photos(tenancy_id);
CREATE INDEX IF NOT EXISTS disputes_tenancy_id_idx ON disputes(tenancy_id);

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Caushun

This file is the authoritative reference for any AI coding agent (Claude, Cursor, Copilot) working on the Caushun codebase. Read this entire file before writing any code. Do not guess at conventions — if something isn't specified here, ask before proceeding.

---

## Project identity

**Caushun** is a rental security deposit escrow platform built on Trustless Work (Stellar testnet). Landlords initialise escrows per room. Tenants fund them. At end of tenancy, either party triggers checkout. Caushun (the platform wallet) releases or resolves.

It is a **Next.js 16 fullstack app**. There is no separate backend service. All server logic lives in API routes (`src/app/api/`) and server actions (`src/server/`). The web3 layer lives entirely in `src/lib/escrow/` and `src/lib/wallet/`.

---

## Key reference links

Always consult these before implementing any escrow, wallet, or Stellar-related feature:

- **Trustless Work docs:** https://docs.trustlesswork.com
- **Developer hub:** https://www.trustlesswork.com/developers
- **BackOffice dApp (test escrow flows manually):** https://dapp.trustlesswork.com
- **Escrow Viewer (live on-chain state):** https://viewer.trustlesswork.com
- **API key request:** https://docs.trustlesswork.com/trustless-work/introduction/developer-resources/request-api-key
- **MCP server:** https://mcp.trustlesswork.com/mcp
- **Trustless Work GitHub:** https://github.com/Trustless-Work
- **Boundless (hackathon org):** https://boundlessfi.xyz
- **Next.js docs:** https://nextjs.org/docs

---

## Stack

| Tool | Version / notes |
|---|---|
| Next.js | 16, App Router, fullstack |
| Bun | Package manager and runtime |
| TypeScript | Strict mode on |
| TailwindCSS | v4 |
| Motion | Animation (previously Framer Motion) |
| Zustand | Client state (wallet, tenancy) |
| Zod | All form and API input validation |
| TanStack Query | `@tanstack/react-query` — all client-side data fetching and mutations |
| Drizzle ORM | Type-safe queries |
| Neon | Serverless Postgres |
| ImageKit | Photo upload and CDN |
| `@creit.tech/stellar-wallets-kit` | Wallet connection (Freighter) |
| `@stellar/stellar-sdk` | Server-side XDR signing (platform wallet only) |

**There is no axios in this project. All HTTP is native `fetch`.**

---

## Absolute rules

1. **Never use `any` in TypeScript.** Type everything. TW payload types live in `src/lib/escrow/types.ts` — use them.
2. **Never expose `PLATFORM_WALLET_SECRET_KEY` to the client.** It lives in server-only files. Any file that imports from `src/lib/wallet/platform-signer.ts` must have `"use server"` or live in an API route.
3. **Never call TW write endpoints directly from client components.** All TW API calls on the client go through the fetch client in `src/lib/escrow/fetch-client.ts` and are exposed as TanStack Query hooks from `src/hooks/escrow/`. Platform-signed actions (`release`, `resolve`) go through API routes on the server only.
4. **Never commit `.env.local`.** The `.env.example` file is the only env file committed to the repo.
5. **Always validate with Zod** before any DB write or TW API call. Schemas live in `src/schemas/`.
6. **Always handle the full XDR flow.** TW write endpoints return `{ unsignedTransaction: string }`. You must: (1) extract it, (2) sign it with the correct wallet, (3) POST the signed XDR to `/helper/send-transaction`. Never skip step 2 or assume a transaction is submitted without step 3.
7. **Escrow type is Single-Release throughout.** Never use multi-release endpoints for Caushun.
8. **One escrow per room occupancy.** A new escrow is deployed each time a new tenant occupies a room. The old `contractId` is historical data only.
9. **No axios. No axios. No axios.** If you reach for axios, stop. Use the fetch client at `src/lib/escrow/fetch-client.ts`.

---

## Project structure

```
caushun/
└── src/
    ├── app/
    │   ├── (landing)/              ← light theme, public
    │   ├── (app)/                  ← navy theme, wallet-gated
    │   │   ├── landlord/
    │   │   ├── tenant/
    │   │   ├── escrow/[contractId]/
    │   │   └── admin/
    │   ├── onboard/[token]/        ← public invite link
    │   ├── connect/
    │   └── api/
    │       ├── escrow/
    │       │   ├── deploy/route.ts
    │       │   ├── fund/route.ts
    │       │   ├── checkout/route.ts
    │       │   ├── approve/route.ts
    │       │   ├── dispute/route.ts
    │       │   ├── release/route.ts       ← platform-signed
    │       │   ├── resolve/route.ts       ← platform-signed
    │       │   └── send/route.ts
    │       ├── properties/route.ts
    │       ├── rooms/route.ts
    │       ├── rooms/[roomId]/invite/route.ts
    │       ├── tenancies/route.ts
    │       ├── onboard/[token]/route.ts
    │       ├── photos/upload-auth/route.ts
    │       └── users/route.ts
    ├── lib/
    │   ├── api-response.ts         ← ok() / fail() helpers, ApiResponse<T> type
    │   ├── escrow/
    │   │   ├── fetch-client.ts     ← native fetch wrapper with x-api-key header
    │   │   ├── deploy.ts
    │   │   ├── fund.ts
    │   │   ├── milestone.ts
    │   │   ├── dispute.ts
    │   │   ├── release.ts          ← SERVER ONLY
    │   │   ├── query.ts
    │   │   ├── trustline.ts
    │   │   ├── errors.ts
    │   │   └── types.ts
    │   ├── wallet/
    │   │   ├── kit.ts              ← StellarWalletsKit + signTransaction()
    │   │   └── platform-signer.ts  ← SERVER ONLY: signs with PLATFORM_SECRET_KEY
    │   ├── imagekit/
    │   │   ├── client.ts
    │   │   └── upload.ts
    │   ├── utils.ts
    │   └── constants.ts
    ├── hooks/
    │   ├── escrow/
    │   │   ├── use-deploy-escrow.ts      ← useMutation wrapping deploy flow
    │   │   ├── use-fund-escrow.ts        ← useMutation wrapping fund flow
    │   │   ├── use-checkout.ts           ← useMutation wrapping changeMilestoneStatus
    │   │   ├── use-approve-milestone.ts  ← useMutation wrapping approveMilestone
    │   │   ├── use-dispute-escrow.ts     ← useMutation wrapping disputeEscrow
    │   │   ├── use-release-funds.ts      ← useMutation → POST /api/escrow/release
    │   │   ├── use-resolve-dispute.ts    ← useMutation → POST /api/escrow/resolve
    │   │   └── use-escrow.ts             ← useQuery for reading escrow state
    │   └── wallet/
    │       └── use-wallet.ts             ← wallet connect/disconnect
    ├── providers/
    │   ├── query-provider.tsx      ← QueryClientProvider wrapper
    │   └── wallet-provider.tsx     ← WalletContext provider
    ├── db/
    │   ├── index.ts
    │   ├── schema.ts
    │   └── migrations/
    ├── server/
    │   ├── properties.ts
    │   ├── rooms.ts
    │   ├── tenancies.ts
    │   ├── photos.ts
    │   ├── disputes.ts
    │   └── users.ts
    ├── store/
    │   ├── wallet.store.ts
    │   └── tenancy.store.ts
    ├── schemas/
    │   ├── property.schema.ts
    │   ├── room.schema.ts
    │   ├── checkout.schema.ts
    │   └── dispute.schema.ts
    └── components/
        ├── ui/
        ├── escrow/
        ├── wallet/
        ├── photos/
        └── layout/
```

---

## The XDR signing flow — implement this exactly

Every TW write operation follows this 4-step pattern without exception.
The fetch client handles steps 1 and 4. Steps 2 and 3 always happen in the calling hook.

```typescript
// Step 1: POST to TW API via fetch client → get unsigned XDR
const { unsignedTransaction } = await twFetch<UnsignedTxResponse>(
  '/deployer/single-release',
  { method: 'POST', body: payload }
)

// Step 2: Sign with the correct wallet (client-side)
const signedXdr = await signTransaction({ unsignedTransaction, address })

// Step 3: POST signed XDR to /helper/send-transaction (no API key needed)
const result = await twPublicFetch<SendTransactionResponse>(
  '/helper/send-transaction',
  { method: 'POST', body: { signedXdr } }
)

// Step 4: Return result — contains contractId and full escrow state
```

For platform-signed actions (`release`, `resolve`), the browser never signs.
The API route calls `signWithPlatformWallet()` on the server:

```typescript
// src/lib/wallet/platform-signer.ts — SERVER ONLY
import { Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk'

export function signWithPlatformWallet(unsignedXdr: string): string {
  const keypair = Keypair.fromSecret(process.env.PLATFORM_WALLET_SECRET_KEY!)
  const tx = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET)
  tx.sign(keypair)
  return tx.toXDR()
}
```

---

## Fetch + TanStack Query architecture

### The fetch client (`src/lib/escrow/fetch-client.ts`)

Two thin wrappers around native `fetch`. No axios. No external HTTP libraries.

```typescript
// twFetch — server-side or API routes only (carries x-api-key)
export async function twFetch<T>(endpoint: string, options: TwFetchOptions): Promise<T>

// twPublicFetch — client-safe (no API key, used for /helper/send-transaction)
export async function twPublicFetch<T>(endpoint: string, options: TwFetchOptions): Promise<T>
```

### The hooks layer (`src/hooks/escrow/`)

Every escrow operation is exposed as a TanStack Query hook.
Write operations are `useMutation`. Read operations are `useQuery`.

```typescript
// Pattern for all write hooks (mutations)
export function useDeployEscrow() {
  return useMutation({
    mutationFn: async (params: DeployEscrowParams) => {
      // 1. fetch unsigned XDR from your Next.js API route
      // 2. sign with wallet
      // 3. submit signed XDR
      // returns SendTransactionResponse
    },
    onSuccess: (data) => {
      // invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['tenancy', ...] })
    }
  })
}

// Pattern for all read hooks (queries)
export function useEscrow(contractId: string) {
  return useQuery({
    queryKey: ['escrow', contractId],
    queryFn: () => getEscrowByContractId(contractId),
    enabled: !!contractId,
    staleTime: 30_000,
  })
}
```

### Using hooks in components

```typescript
// In a component:
const { mutate: deployEscrow, isPending, error } = useDeployEscrow()
const { data: escrow, isLoading } = useEscrow(contractId)

// Trigger a mutation:
deployEscrow({ landlordWallet, tenantWallet, roomId }, {
  onSuccess: (data) => {
    // data.contractId is the new escrow address
  }
})
```

Never call `twFetch` directly from a component. Always use a hook.

---

## Trustless Work API — key facts

Base URL (testnet): `https://dev.api.trustlesswork.com`
Auth header: `x-api-key: <token>` — NOT `Authorization: Bearer`

| Action | Method | Endpoint | Signer |
|---|---|---|---|
| Deploy escrow | POST | `/deployer/single-release` | Landlord wallet |
| Fund escrow | POST | `/escrow/single-release/fund-escrow` | Tenant wallet |
| Checkout | POST | `/escrow/single-release/change-milestone-status` | Tenant wallet (serviceProvider only) |
| Approve milestone | POST | `/escrow/single-release/approve-milestone` | Landlord wallet (approver only) |
| Dispute escrow | POST | `/escrow/single-release/dispute-escrow` | Tenant or landlord |
| Release funds | POST | `/escrow/single-release/release-funds` | Platform wallet (server) |
| Resolve dispute | POST | `/escrow/single-release/resolve-dispute` | Platform wallet (server) |
| Set trustline | POST | `/helper/set-trustline` | User wallet |
| Send transaction | POST | `/helper/send-transaction` | N/A (takes signedXdr) |
| Get escrow | GET | `/indexer/get-escrows-by-contract-ids` | None |
| Get by role | GET | `/indexer/get-escrows-by-role` | None |

API typo: `trusline` (not `trustline`) in the single-release deploy payload — confirmed from live docs.

---

## Deploy payload — exact schema

```typescript
{
  signer: landlord.walletAddress,
  engagementId: room.uniqueCode,
  title: `Caushun deposit – ${room.uniqueCode}`,
  description: `Security deposit – ${property.address}, Room ${room.number}`,
  roles: {
    approver: landlord.walletAddress,
    serviceProvider: tenant.walletAddress,
    platformAddress: process.env.PLATFORM_WALLET_PUBLIC_KEY,
    releaseSigner: process.env.PLATFORM_WALLET_PUBLIC_KEY,
    disputeResolver: process.env.PLATFORM_WALLET_PUBLIC_KEY,
    receiver: tenant.walletAddress,
  },
  amount: room.depositAmount,
  platformFee: 1,
  trusline: {                          // NOTE: TW spells it "trusline"
    address: process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET,
    symbol: 'USDC'
  },
  milestones: [
    { description: 'Checkout complete — refund requested' }
  ]
}
```

---

## Resolve dispute — how splits work

```typescript
// distributions must sum to deposit amount AFTER platform fee deduction
const netAmount = depositAmount * (1 - platformFeePct / 100)
const tenantAmount = netAmount * (tenantPct / 100)
const landlordAmount = netAmount * ((100 - tenantPct) / 100)

// POST /escrow/single-release/resolve-dispute
{
  contractId,
  disputeResolver: PLATFORM_WALLET_PUBLIC_KEY,
  milestoneIndex: "0",
  distributions: [
    { address: tenantWallet, amount: tenantAmount },
    { address: landlordWallet, amount: landlordAmount },
  ].filter(d => d.amount > 0)  // TW rejects amounts <= 0
}
```

---

## Database tables

All defined in `src/db/schema.ts` using Drizzle ORM.

**users** — `id, wallet_address (unique), role (landlord|tenant), full_name, phone, created_at`
**properties** — `id, landlord_id → users, name, address, state, created_at`
**rooms** — `id, property_id → properties, room_number, unique_code (unique), deposit_amount, status (vacant|occupied|vacated), invite_token (unique)`
**tenancies** — `id, room_id → rooms, tenant_id → users, escrow_id, escrow_status (pending|funded|active|checkout|disputed|resolved), move_in_date, move_out_date, proposed_split_pct, resolution_notes`
**property_photos** — `id, tenancy_id → tenancies, uploader_id → users, imagekit_url, phase (move_in|move_out|damage), acknowledged_at, created_at`
**disputes** — `id, tenancy_id → tenancies, raised_by → users, reason, platform_verdict_pct, resolved_at`

---

## Environment variables

```bash
# Trustless Work / Stellar
TW_API_KEY=                            # server only — from dapp.trustlesswork.com
NEXT_PUBLIC_TW_API_BASE=https://dev.api.trustlesswork.com
PLATFORM_WALLET_PUBLIC_KEY=            # server only
PLATFORM_WALLET_SECRET_KEY=            # server only — NEVER expose to client
NEXT_PUBLIC_USDC_ISSUER_TESTNET=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_ESCROW_VIEWER_URL=https://viewer.trustlesswork.com

# Database
DATABASE_URL=

# ImageKit
IMAGEKIT_PRIVATE_KEY=
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
INVITE_TOKEN_SECRET=
ADMIN_WALLET_ADDRESS=
```

---

## Constants (`src/lib/constants.ts`)

```typescript
export const NETWORK_PASSPHRASE = {
  testnet: 'Test SDF Network ; September 2015',
  mainnet: 'Public Global Stellar Network ; September 2015'
}

export const USDC_ISSUER = {
  testnet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  mainnet: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
}

export const PLATFORM_FEE_PCT = 1
export const CHECKOUT_WINDOW_DAYS = 5
export const ESCROW_TYPE = 'single-release'
```

---

## Invite token spec

```typescript
// Generate — server only
import { createHmac, randomBytes } from 'crypto'
const nonce = randomBytes(16).toString('hex')
const payload = `${roomId}:${expiryTimestamp}:${nonce}`
const sig = createHmac('sha256', process.env.INVITE_TOKEN_SECRET!).update(payload).digest('hex')
const token = Buffer.from(`${payload}:${sig}`).toString('base64url')

// Verify — server only
const decoded = Buffer.from(token, 'base64url').toString()
const [roomId, expiry, nonce, sig] = decoded.split(':')
const expected = createHmac('sha256', process.env.INVITE_TOKEN_SECRET!).update(`${roomId}:${expiry}:${nonce}`).digest('hex')
if (sig !== expected || Date.now() > Number(expiry)) throw new Error('Invalid token')
```

---

## Coding conventions

- **File naming:** kebab-case for all files.
- **Component naming:** PascalCase exports.
- **Server actions:** Mark with `"use server"`. Import only in server components or via `startTransition`.
- **Client components:** Mark with `"use client"`. Keep them thin — fetch data in server components and pass as props where possible.
- **API routes:** Every route validates input with Zod before processing. Every route returns the standard response shape — no exceptions.
- **Hooks:** Every escrow operation has a dedicated hook in `src/hooks/escrow/`. No raw fetch in components.
- **Error handling:** Never swallow errors silently. All escrow hooks surface errors through TanStack Query's `error` state.
- **Imports:** Use `@/` path alias throughout.

---

## Standard API response shape

**Every single API route in this project returns this shape. No exceptions.**

```typescript
// src/lib/api-response.ts

export type ApiStatus = "success" | "error"

export interface ApiResponse<T> {
  status: ApiStatus
  data: T
  message: string
}

// Success helper
export function ok<T>(data: T, message = "OK"): ApiResponse<T> {
  return { status: "success", data, message }
}

// Error helper
export function fail<T = null>(
  message: string,
  data: T = null as T
): ApiResponse<T> {
  return { status: "error", data, message }
}
```

Usage in every route:

```typescript
import { ok, fail } from "@/lib/api-response"
import { NextResponse } from "next/server"

// Success
return NextResponse.json(ok(result, "Escrow deployed"))

// Validation error
return NextResponse.json(fail("Invalid request", parsed.error.flatten()), { status: 400 })

// Server error
return NextResponse.json(fail(error.message), { status: 500 })

// Unauthorized
return NextResponse.json(fail("Unauthorized"), { status: 403 })
```

Shapes by use case:

```typescript
// Single object
{ status: "success", data: { contractId: "C...", escrow: {...} }, message: "Escrow deployed" }

// Array
{ status: "success", data: [{ id: "...", ... }], message: "OK" }

// Empty / action-only
{ status: "success", data: null, message: "Tenancy updated" }

// Error
{ status: "error", data: null, message: "Only the approver can change milestone flag" }

// Validation error
{ status: "error", data: { fieldErrors: {...} }, message: "Invalid request" }
```

Hooks read `response.data` when `response.status === "success"` and throw `response.message` when `response.status === "error"`:

```typescript
const res = await fetch("/api/escrow/deploy", { method: "POST", ... })
const json = await res.json() as ApiResponse<{ unsignedTransaction: string }>

if (json.status === "error") {
  throw new Error(humanizeEscrowError(json.message))
}

const { unsignedTransaction } = json.data
```

---

## What NOT to build

- Multi-release escrow flows
- Email/SMS notifications
- Any mainnet transactions
- Landlord-initiated early termination
- A generic escrow platform
- Any UI that allows the platform wallet to be user-selected
- Axios (do not install it, do not use it)

---

## Demo Day checklist

Before May 16:

- [ ] Platform wallet funded with testnet XLM (via Friendbot)
- [ ] Platform wallet has USDC trustline set
- [ ] At least one full demo tenancy seeded on testnet: deployed → funded → checkout → resolved
- [ ] Escrow Viewer link verified: `https://viewer.trustlesswork.com/{contractId}`
- [ ] All 5 escrow status states visible in the shared dashboard
- [ ] Landing page mobile-tested on an actual phone
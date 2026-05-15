# Caushun — Trustless Work Implementation Reference

Complete implementation guide for the Trustless Work REST API integration.
Sources: https://docs.trustlesswork.com/trustless-work/api-rest/deploy (Single Release)

**No axios. All HTTP is native `fetch`.**
TanStack Query hooks are the public interface for all escrow operations.

---

## Install

```bash
bun add @tanstack/react-query @creit.tech/stellar-wallets-kit @stellar/stellar-sdk
```

---

## Critical facts

| Thing | Correct value |
|---|---|
| Auth header | `x-api-key: <token>` — NOT `Authorization: Bearer` |
| Base URL (testnet) | `https://dev.api.trustlesswork.com` |
| Every write endpoint returns | `{ unsignedTransaction: "AAAAAg..." }` |
| Send signed XDR to | `POST /helper/send-transaction` with `{ signedXdr }` only |
| API typo | `trusline` (missing 't') in single-release deploy payload — confirmed from live docs |
| Distributions sum | Must equal deposit amount **after** platform fee, not gross |
| HTTP library | Native `fetch` only — no axios |

---

## Architecture overview

```
Component
  └── calls hook from src/hooks/escrow/
        └── useMutation / useQuery (TanStack Query)
              ├── write: fetch(/api/escrow/*) → sign → twPublicFetch(/helper/send-transaction)
              └── read:  twFetch(TW indexer endpoint) → return data
```

The fetch client in `src/lib/escrow/fetch-client.ts` is the only place
`fetch` is called for TW operations. Hooks compose on top of it.
Components never call the fetch client directly.

---

## File 1 — `src/lib/escrow/fetch-client.ts`

Two thin `fetch` wrappers. No axios, no external HTTP libraries.

```typescript
const TW_BASE = process.env.NEXT_PUBLIC_TW_API_BASE!
// https://dev.api.trustlesswork.com

interface FetchOptions {
  method: "GET" | "POST" | "PUT"
  body?: unknown
  params?: Record<string, string>
}

/**
 * Authenticated TW fetch — carries x-api-key.
 * SERVER ONLY. Import only in API routes and server actions.
 * Never import in client components.
 */
export async function twFetch<T>(
  endpoint: string,
  options: FetchOptions
): Promise<T> {
  const apiKey = process.env.TW_API_KEY
  if (!apiKey) throw new Error("TW_API_KEY is not set")

  const url = buildUrl(`${TW_BASE}${endpoint}`, options.params)

  const res = await fetch(url, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err?.message ?? `TW API error ${res.status}`)
  }

  return res.json() as Promise<T>
}

/**
 * Public TW fetch — no API key. Safe to call from the browser.
 * Used exclusively for POST /helper/send-transaction.
 */
export async function twPublicFetch<T>(
  endpoint: string,
  options: FetchOptions
): Promise<T> {
  const url = buildUrl(`${TW_BASE}${endpoint}`, options.params)

  const res = await fetch(url, {
    method: options.method,
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err?.message ?? `TW error ${res.status}`)
  }

  return res.json() as Promise<T>
}

function buildUrl(base: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return base
  return `${base}?${new URLSearchParams(params).toString()}`
}
```

---

## File 2 — `src/lib/escrow/types.ts`

All TypeScript types matching TW payload and response schemas exactly.

```typescript
// ─── Shared ───────────────────────────────────────────────────────────────────

export interface TrustlinePayload {
  address: string
  symbol: string
}

export interface EscrowRoles {
  approver: string
  serviceProvider: string
  platformAddress: string
  releaseSigner: string
  disputeResolver: string
  receiver: string
}

export interface MilestoneInput {
  description: string
  // Do NOT include approved or status on single-release deploy
}

export interface MilestoneState {
  description: string
  status: string
  approved: boolean
  evidence: string
}

export interface EscrowFlags {
  disputed: boolean
  released: boolean
  resolved: boolean
}

// ─── Deploy ───────────────────────────────────────────────────────────────────

export interface DeploySingleReleasePayload {
  signer: string
  engagementId: string
  title: string
  description: string
  roles: EscrowRoles
  amount: number
  platformFee: number
  milestones: MilestoneInput[]
  trusline: TrustlinePayload   // NOTE: TW API spells it "trusline" (missing t)
}

// ─── Fund ─────────────────────────────────────────────────────────────────────

export interface FundEscrowPayload {
  contractId: string
  signer: string
  amount: number
}

// ─── Change Milestone Status ──────────────────────────────────────────────────

export interface ChangeMilestoneStatusPayload {
  contractId: string
  milestoneIndex: string   // always "0" for Caushun
  newEvidence: string      // JSON.stringify({ photos, proposedSplit, requestedBy, timestamp })
  newStatus: string
  serviceProvider: string  // ONLY serviceProvider can call this
}

// ─── Approve Milestone ────────────────────────────────────────────────────────

export interface ApproveMilestonePayload {
  contractId: string
  milestoneIndex: string
  approver: string         // ONLY approver can call this
}

// ─── Dispute ──────────────────────────────────────────────────────────────────

export interface DisputeEscrowPayload {
  contractId: string
  milestoneIndex: string
  signer: string           // tenant or landlord — NOT the platform wallet
}

// ─── Release Funds ────────────────────────────────────────────────────────────

export interface ReleaseFundsPayload {
  contractId: string
  releaseSigner: string
}

// ─── Resolve Dispute ──────────────────────────────────────────────────────────

export interface Distribution {
  address: string
  amount: number
}

export interface ResolveDisputePayload {
  contractId: string
  disputeResolver: string
  milestoneIndex: string
  distributions: Distribution[]
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface UnsignedTxResponse {
  status: "SUCCESS" | "FAILED"
  unsignedTransaction: string
}

export interface SendTransactionResponse {
  status: "SUCCESS" | "FAILED"
  message: string
  contractId: string
  escrow: EscrowState
}

export interface EscrowState {
  amount: number
  roles: EscrowRoles
  flags: EscrowFlags
  description: string
  engagementId: string
  milestones: MilestoneState[]
  platformFee: number
  title: string
  trustline: TrustlinePayload
}
```

---

## File 2.5 — `src/lib/api-response.ts`

**Every API route returns this shape. No exceptions.**

```typescript
export type ApiStatus = "success" | "error"

export interface ApiResponse<T> {
  status: ApiStatus
  data: T
  message: string
}

/** Successful response */
export function ok<T>(data: T, message = "OK"): ApiResponse<T> {
  return { status: "success", data, message }
}

/** Error response */
export function fail<T = null>(
  message: string,
  data: T = null as T
): ApiResponse<T> {
  return { status: "error", data, message }
}
```

Examples of every shape this produces:

```typescript
// Single object
{ status: "success", data: { unsignedTransaction: "AAAA..." }, message: "OK" }

// Array
{ status: "success", data: [{ id: "...", roomNumber: "R01" }], message: "OK" }

// Empty / action result
{ status: "success", data: null, message: "Tenancy updated" }

// Validation error (data carries field errors)
{ status: "error", data: { fieldErrors: { roomId: ["Required"] } }, message: "Invalid request" }

// Server / business logic error
{ status: "error", data: null, message: "Only the approver can change milestone flag" }
```

---

## File 3 — `src/lib/wallet/kit.ts`

Stellar Wallets Kit + `signTransaction`. Client-side only.

```typescript
"use client"

import {
  StellarWalletsKit,
  WalletNetwork,
  FREIGHTER_ID,
  FreighterModule,
  AlbedoModule,
} from "@creit.tech/stellar-wallets-kit"

export const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  selectedWalletId: FREIGHTER_ID,
  modules: [new FreighterModule(), new AlbedoModule()],
})

export async function signTransaction({
  unsignedTransaction,
  address,
}: {
  unsignedTransaction: string
  address: string
}): Promise<string> {
  const { signedTxXdr } = await kit.signTransaction(unsignedTransaction, {
    address,
    networkPassphrase: WalletNetwork.TESTNET,
  })
  return signedTxXdr
}
```

---

## File 4 — `src/lib/wallet/platform-signer.ts`

**SERVER ONLY.** Signs with platform secret key. Import only in API routes.

```typescript
import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk"

export function signWithPlatformWallet(unsignedXdr: string): string {
  const secret = process.env.PLATFORM_WALLET_SECRET_KEY
  if (!secret) throw new Error("PLATFORM_WALLET_SECRET_KEY not set")
  const keypair = Keypair.fromSecret(secret)
  const tx = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET)
  tx.sign(keypair)
  return tx.toXDR()
}
```

---

## File 5 — `src/lib/escrow/errors.ts`

```typescript
export function humanizeEscrowError(message: string): string {
  const map: Record<string, string> = {
    "Only the approver can change milestone flag":
      "Only the landlord can approve this checkout.",
    "Only the service provider can change milestone status":
      "Only the tenant can request a checkout.",
    "Milestone already in dispute":
      "A dispute is already open on this tenancy.",
    "The milestone must be completed to release funds":
      "The landlord must approve checkout before funds can be released.",
    "Only the release signer can release the escrow funds":
      "Funds can only be released by the Caushun platform.",
    "Only the dispute resolver can execute this function":
      "Disputes can only be resolved by the Caushun platform.",
    "You cannot approve a milestone that has already been approved previously":
      "This checkout has already been approved.",
    "Escrow already initialized":
      "An escrow already exists for this room.",
    "Amount cannot be zero":
      "Deposit amount must be greater than zero.",
  }
  return map[message] ?? `Transaction failed: ${message}. Please try again.`
}
```

---

## File 6 — `src/providers/query-provider.tsx`

```typescript
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 1 },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

Root layout wrapping:

```typescript
// src/app/layout.tsx
import { QueryProvider } from "@/providers/query-provider"
import { WalletProvider } from "@/providers/wallet-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <WalletProvider>{children}</WalletProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
```

---

## Hooks — write operations (mutations)

All write hooks follow the same shape:
1. `fetch` to your Next.js API route → returns `ApiResponse<{ unsignedTransaction: string }>`
2. Check `json.status === "error"` and throw if so
3. Sign with wallet
4. `twPublicFetch` to `/helper/send-transaction`
5. Invalidate relevant queries on success

Reading the standard response shape in every hook:

```typescript
const res = await fetch("/api/escrow/deploy", { ... })
const json = await res.json() as ApiResponse<{ unsignedTransaction: string }>

if (json.status === "error") {
  throw new Error(humanizeEscrowError(json.message))
}

const { unsignedTransaction } = json.data
```

### `src/hooks/escrow/use-deploy-escrow.ts`

```typescript
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { twPublicFetch } from "@/lib/escrow/fetch-client"
import { signTransaction } from "@/lib/wallet/kit"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { SendTransactionResponse } from "@/lib/escrow/types"
import { ApiResponse } from "@/lib/api-response"

interface DeployParams {
  landlordWallet: string
  tenantWallet: string
  roomId: string
  tenancyId: string
}

export function useDeployEscrow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ landlordWallet, tenantWallet, roomId, tenancyId }: DeployParams) => {
      const res = await fetch("/api/escrow/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landlordWallet, tenantWallet, roomId }),
      })
      const json = await res.json() as ApiResponse<{ unsignedTransaction: string }>
      if (json.status === "error") {
        throw new Error(humanizeEscrowError(json.message))
      }
      const { unsignedTransaction } = json.data

      const signedXdr = await signTransaction({ unsignedTransaction, address: landlordWallet })

      const result = await twPublicFetch<SendTransactionResponse>(
        "/helper/send-transaction",
        { method: "POST", body: { signedXdr } }
      )

      // Persist contractId to DB
      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyId, action: "deploy", contractId: result.contractId }),
      })

      return result
    },
    onSuccess: (_, { tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
```

### `src/hooks/escrow/use-fund-escrow.ts`

```typescript
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { twPublicFetch } from "@/lib/escrow/fetch-client"
import { signTransaction } from "@/lib/wallet/kit"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { SendTransactionResponse } from "@/lib/escrow/types"
import { ApiResponse } from "@/lib/api-response"

export function useFundEscrow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contractId, tenantWallet, amount, tenancyId,
    }: { contractId: string; tenantWallet: string; amount: number; tenancyId: string }) => {
      const res = await fetch("/api/escrow/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, tenantWallet, amount }),
      })
      const json = await res.json() as ApiResponse<{ unsignedTransaction: string }>
      if (json.status === "error") {
        throw new Error(humanizeEscrowError(json.message))
      }
      const { unsignedTransaction } = json.data

      const signedXdr = await signTransaction({ unsignedTransaction, address: tenantWallet })

      const result = await twPublicFetch<SendTransactionResponse>(
        "/helper/send-transaction",
        { method: "POST", body: { signedXdr } }
      )

      await fetch("/api/escrow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenancyId, action: "fund" }),
      })

      return result
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
```

### `src/hooks/escrow/use-checkout.ts`

```typescript
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { twPublicFetch } from "@/lib/escrow/fetch-client"
import { signTransaction } from "@/lib/wallet/kit"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { SendTransactionResponse } from "@/lib/escrow/types"
import { ApiResponse } from "@/lib/api-response"

export function useCheckout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contractId, tenantWallet, moveOutPhotoUrls, tenantPct, tenancyId,
    }: {
      contractId: string
      tenantWallet: string
      moveOutPhotoUrls: string[]
      tenantPct: number
      tenancyId: string
    }) => {
      const res = await fetch("/api/escrow/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, tenantWallet, moveOutPhotoUrls, tenantPct, tenancyId }),
      })
      const json = await res.json() as ApiResponse<{ unsignedTransaction: string }>
      if (json.status === "error") {
        throw new Error(humanizeEscrowError(json.message))
      }
      const { unsignedTransaction } = json.data

      const signedXdr = await signTransaction({ unsignedTransaction, address: tenantWallet })

      return twPublicFetch<SendTransactionResponse>(
        "/helper/send-transaction",
        { method: "POST", body: { signedXdr } }
      )
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
```

### `src/hooks/escrow/use-approve-milestone.ts`

```typescript
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { twPublicFetch } from "@/lib/escrow/fetch-client"
import { signTransaction } from "@/lib/wallet/kit"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { SendTransactionResponse } from "@/lib/escrow/types"
import { ApiResponse } from "@/lib/api-response"

export function useApproveMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contractId, landlordWallet, tenancyId,
    }: { contractId: string; landlordWallet: string; tenancyId: string }) => {
      const res = await fetch("/api/escrow/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, landlordWallet, tenancyId }),
      })
      const json = await res.json() as ApiResponse<{ unsignedTransaction: string }>
      if (json.status === "error") {
        throw new Error(humanizeEscrowError(json.message))
      }
      const { unsignedTransaction } = json.data

      const signedXdr = await signTransaction({ unsignedTransaction, address: landlordWallet })

      return twPublicFetch<SendTransactionResponse>(
        "/helper/send-transaction",
        { method: "POST", body: { signedXdr } }
      )
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
```

### `src/hooks/escrow/use-dispute-escrow.ts`

```typescript
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { twPublicFetch } from "@/lib/escrow/fetch-client"
import { signTransaction } from "@/lib/wallet/kit"
import { humanizeEscrowError } from "@/lib/escrow/errors"
import { SendTransactionResponse } from "@/lib/escrow/types"
import { ApiResponse } from "@/lib/api-response"

export function useDisputeEscrow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contractId, signerWallet, tenancyId,
    }: { contractId: string; signerWallet: string; tenancyId: string }) => {
      const res = await fetch("/api/escrow/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, signerWallet, tenancyId }),
      })
      const json = await res.json() as ApiResponse<{ unsignedTransaction: string }>
      if (json.status === "error") {
        throw new Error(humanizeEscrowError(json.message))
      }
      const { unsignedTransaction } = json.data

      const signedXdr = await signTransaction({ unsignedTransaction, address: signerWallet })

      return twPublicFetch<SendTransactionResponse>(
        "/helper/send-transaction",
        { method: "POST", body: { signedXdr } }
      )
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
```

### `src/hooks/escrow/use-release-funds.ts`

Platform-only. No client signing. Calls the API route which signs server-side.

```typescript
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SendTransactionResponse } from "@/lib/escrow/types"
import { ApiResponse } from "@/lib/api-response"

export function useReleaseFunds() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contractId, tenancyId, adminWallet,
    }: { contractId: string; tenancyId: string; adminWallet: string }) => {
      const res = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, tenancyId, adminWallet }),
      })
      const json = await res.json() as ApiResponse<SendTransactionResponse>
      if (json.status === "error") {
        throw new Error(json.message)
      }
      return json.data
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
  })
}
```

### `src/hooks/escrow/use-resolve-dispute.ts`

```typescript
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SendTransactionResponse } from "@/lib/escrow/types"
import { ApiResponse } from "@/lib/api-response"

interface ResolveParams {
  contractId: string
  tenancyId: string
  disputeId: string
  tenantWallet: string
  landlordWallet: string
  depositAmount: number
  platformFeePct: number
  tenantPct: number
  adminWallet: string
}

export function useResolveDispute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: ResolveParams) => {
      const res = await fetch("/api/escrow/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      const json = await res.json() as ApiResponse<SendTransactionResponse>
      if (json.status === "error") {
        throw new Error(json.message)
      }
      return json.data
    },
    onSuccess: (_, { contractId, tenancyId }) => {
      queryClient.invalidateQueries({ queryKey: ["escrow", contractId] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
      queryClient.invalidateQueries({ queryKey: ["disputes"] })
    },
  })
}
```

---

## Hooks — read operations (queries)

### `src/hooks/escrow/use-escrow.ts`

```typescript
"use client"

import { useQuery } from "@tanstack/react-query"
import { twFetch } from "@/lib/escrow/fetch-client"
import { EscrowState } from "@/lib/escrow/types"

async function fetchEscrow(contractId: string): Promise<EscrowState | null> {
  try {
    const data = await twFetch<EscrowState[]>(
      "/indexer/get-escrows-by-contract-ids",
      { method: "GET", params: { contractIds: JSON.stringify([contractId]) } }
    )
    return data?.[0] ?? null
  } catch {
    return null
  }
}

export function useEscrow(contractId: string | undefined) {
  return useQuery({
    queryKey: ["escrow", contractId],
    queryFn: () => fetchEscrow(contractId!),
    enabled: !!contractId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function escrowViewerUrl(contractId: string): string {
  return `${process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL}/${contractId}`
}
```

---

## API Routes

### `src/app/api/escrow/deploy/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { twFetch } from "@/lib/escrow/fetch-client"
import { DeploySingleReleasePayload, UnsignedTxResponse } from "@/lib/escrow/types"
import { ok, fail } from "@/lib/api-response"
import { db } from "@/db"
import { rooms } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  landlordWallet: z.string().length(56),
  tenantWallet: z.string().length(56),
  roomId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), { status: 400 })

  const { landlordWallet, tenantWallet, roomId } = parsed.data

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: { property: true },
  })
  if (!room)
    return NextResponse.json(fail("Room not found"), { status: 404 })

  const payload: DeploySingleReleasePayload = {
    signer: landlordWallet,
    engagementId: room.uniqueCode,
    title: `Caushun deposit — ${room.uniqueCode}`,
    description: `Security deposit for ${room.property.address}, Room ${room.roomNumber}`,
    roles: {
      approver: landlordWallet,
      serviceProvider: tenantWallet,
      platformAddress: process.env.PLATFORM_WALLET_PUBLIC_KEY!,
      releaseSigner: process.env.PLATFORM_WALLET_PUBLIC_KEY!,
      disputeResolver: process.env.PLATFORM_WALLET_PUBLIC_KEY!,
      receiver: tenantWallet,
    },
    amount: Number(room.depositAmount),
    platformFee: 1,
    milestones: [{ description: "Checkout complete — refund requested" }],
    trusline: {
      address: process.env.NEXT_PUBLIC_USDC_ISSUER_TESTNET!,
      symbol: "USDC",
    },
  }

  try {
    const data = await twFetch<UnsignedTxResponse>("/deployer/single-release", {
      method: "POST",
      body: payload,
    })
    return NextResponse.json(ok({ unsignedTransaction: data.unsignedTransaction }, "XDR ready"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deploy failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}
```

### `src/app/api/escrow/send/route.ts`

Saves contractId / status updates to DB after successful transactions.

```typescript
import { NextRequest, NextResponse } from "next/server"
import { ok, fail } from "@/lib/api-response"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  tenancyId: z.string().uuid(),
  action: z.enum(["deploy", "fund", "checkout", "approve", "dispute"]),
  contractId: z.string().optional(),
})

const statusMap: Record<string, string> = {
  deploy: "pending",
  fund: "funded",
  checkout: "checkout",
  approve: "checkout",
  dispute: "disputed",
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), { status: 400 })

  const { tenancyId, action, contractId } = parsed.data

  await db
    .update(tenancies)
    .set({
      ...(action === "deploy" && contractId ? { escrowId: contractId } : {}),
      escrowStatus: statusMap[action],
    })
    .where(eq(tenancies.id, tenancyId))

  return NextResponse.json(ok(null, "Tenancy updated"))
}
```

### `src/app/api/escrow/release/route.ts`

Platform-signed. Server signs, no client wallet interaction.

```typescript
import { NextRequest, NextResponse } from "next/server"
import { twFetch } from "@/lib/escrow/fetch-client"
import { signWithPlatformWallet } from "@/lib/wallet/platform-signer"
import { ok, fail } from "@/lib/api-response"
import { db } from "@/db"
import { tenancies } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  contractId: z.string().min(1),
  tenancyId: z.string().uuid(),
  adminWallet: z.string().length(56),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), { status: 400 })

  const { contractId, tenancyId, adminWallet } = parsed.data

  if (adminWallet !== process.env.ADMIN_WALLET_ADDRESS)
    return NextResponse.json(fail("Unauthorized"), { status: 403 })

  try {
    const { unsignedTransaction } = await twFetch<{ unsignedTransaction: string }>(
      "/escrow/single-release/release-funds",
      { method: "POST", body: { contractId, releaseSigner: process.env.PLATFORM_WALLET_PUBLIC_KEY! } }
    )

    const signedXdr = signWithPlatformWallet(unsignedTransaction)

    const result = await twFetch("/helper/send-transaction", {
      method: "POST",
      body: { signedXdr },
    })

    await db.update(tenancies).set({ escrowStatus: "resolved" }).where(eq(tenancies.id, tenancyId))

    return NextResponse.json(ok(result, "Funds released"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Release failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}
```

### `src/app/api/escrow/resolve/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { twFetch } from "@/lib/escrow/fetch-client"
import { signWithPlatformWallet } from "@/lib/wallet/platform-signer"
import { ok, fail } from "@/lib/api-response"
import { db } from "@/db"
import { tenancies, disputes } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  contractId: z.string().min(1),
  tenancyId: z.string().uuid(),
  disputeId: z.string().uuid(),
  tenantWallet: z.string().length(56),
  landlordWallet: z.string().length(56),
  depositAmount: z.number().positive(),
  platformFeePct: z.number().min(0).max(99),
  tenantPct: z.number().min(0).max(100).int(),
  adminWallet: z.string().length(56),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json(fail("Invalid request", parsed.error.flatten()), { status: 400 })

  const {
    contractId, tenancyId, disputeId,
    tenantWallet, landlordWallet,
    depositAmount, platformFeePct, tenantPct,
    adminWallet,
  } = parsed.data

  if (adminWallet !== process.env.ADMIN_WALLET_ADDRESS)
    return NextResponse.json(fail("Unauthorized"), { status: 403 })

  const net = depositAmount * (1 - platformFeePct / 100)
  const distributions = [
    { address: tenantWallet, amount: parseFloat((net * (tenantPct / 100)).toFixed(7)) },
    { address: landlordWallet, amount: parseFloat((net * ((100 - tenantPct) / 100)).toFixed(7)) },
  ].filter((d) => d.amount > 0)

  try {
    const { unsignedTransaction } = await twFetch<{ unsignedTransaction: string }>(
      "/escrow/single-release/resolve-dispute",
      {
        method: "POST",
        body: {
          contractId,
          disputeResolver: process.env.PLATFORM_WALLET_PUBLIC_KEY!,
          milestoneIndex: "0",
          distributions,
        },
      }
    )

    const signedXdr = signWithPlatformWallet(unsignedTransaction)
    const result = await twFetch("/helper/send-transaction", { method: "POST", body: { signedXdr } })

    await db.update(disputes).set({ platformVerdictPct: tenantPct, resolvedAt: new Date() }).where(eq(disputes.id, disputeId))
    await db.update(tenancies).set({ escrowStatus: "resolved" }).where(eq(tenancies.id, tenancyId))

    return NextResponse.json(ok(result, "Dispute resolved"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resolve failed"
    return NextResponse.json(fail(message), { status: 500 })
  }
}
```

---

## Usage in components

```typescript
// Approval page — landlord
const { mutate: approve, isPending, error } = useApproveMilestone()

<button onClick={() => approve({ contractId, landlordWallet, tenancyId })} disabled={isPending}>
  {isPending ? "Approving..." : "Approve checkout"}
</button>
{error && <p className="text-sm text-red-500">{error.message}</p>}

// Shared escrow dashboard
const { data: escrow, isLoading } = useEscrow(contractId)
{isLoading && <EscrowSkeleton />}
{escrow && <EscrowStatusCard escrow={escrow} />}

// Checkout form
const { mutate: checkout, isPending } = useCheckout()
checkout({ contractId, tenantWallet, moveOutPhotoUrls, tenantPct, tenancyId })
```

---

## Response shape reference

Every Caushun API route returns this structure, always. Never deviate.

```typescript
// Success
{ status: "success", data: <T>, message: "OK" }

// Error — validation
{ status: "error", data: { fieldErrors: {...} }, message: "Invalid request" }

// Error — business logic / server
{ status: "error", data: null, message: "Only the approver can change milestone flag" }

// Error — auth
{ status: "error", data: null, message: "Unauthorized" }
```

Hooks always check `json.status === "error"` first, then read `json.data`.
Never check `res.ok` alone — the status field is the source of truth.

---

## Escrow lifecycle states

```
DB escrowStatus   TW flags state          What happened
──────────────────────────────────────────────────────────
"pending"         no flags                Deployed, not yet funded
"funded"          no flags                Tenant funded, tenancy active
"active"          no flags                Both parties acknowledged move-in
"checkout"        no flags                Checkout requested
"disputed"        disputed: true          Dispute raised
"resolved"        released/resolved: true Funds distributed
```

---

## Complete endpoint map

| Action | TW Endpoint | Method | Signer | Where |
|---|---|---|---|---|
| Deploy | `/deployer/single-release` | POST | Landlord | `/api/escrow/deploy` → hook signs |
| Fund | `/escrow/single-release/fund-escrow` | POST | Tenant | `/api/escrow/fund` → hook signs |
| Checkout | `/escrow/single-release/change-milestone-status` | POST | Tenant | `/api/escrow/checkout` → hook signs |
| Approve | `/escrow/single-release/approve-milestone` | POST | Landlord | `/api/escrow/approve` → hook signs |
| Dispute | `/escrow/single-release/dispute-escrow` | POST | Tenant or Landlord | `/api/escrow/dispute` → hook signs |
| Release | `/escrow/single-release/release-funds` | POST | Platform (server) | `/api/escrow/release` — server signs |
| Resolve | `/escrow/single-release/resolve-dispute` | POST | Platform (server) | `/api/escrow/resolve` — server signs |
| Get escrow | `/indexer/get-escrows-by-contract-ids` | GET | None | `useEscrow()` hook |
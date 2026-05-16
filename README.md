# Caushun

**Blockchain-secured rental deposits — no middlemen, no disputes left unresolved.**

---

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logoColor=black)
![Neon](https://img.shields.io/badge/Neon_Postgres-00E5BF?style=flat-square)
![Stellar](https://img.shields.io/badge/Stellar-7B61FF?style=flat-square&logo=stellar&logoColor=white)
![Trustless Work](https://img.shields.io/badge/Trustless_Work-orange?style=flat-square)
![ImageKit](https://img.shields.io/badge/ImageKit-blue?style=flat-square)
![Resend](https://img.shields.io/badge/Resend-000000?style=flat-square)

---

## What is Caushun?

Caushun is a rental security deposit escrow platform built on [Trustless Work](https://trustlesswork.com) and the Stellar testnet.

The rental industry has a trust problem: tenants hand over hundreds in deposits with no guarantee they'll get it back, and landlords have no on-chain record of the agreement. Caushun fixes this by locking the deposit in a smart contract — not a bank account, not a landlord's wallet — and only releasing it when both parties agree, or a platform mediator steps in.

---

## How it works

### The lifecycle of a deposit

```
Landlord creates room
       ↓
Landlord generates invite link → sends to tenant
       ↓
Tenant joins room via link → tenancy created
       ↓
Landlord deploys escrow contract (signs with Freighter)
       ↓
Tenant funds escrow with USDC (signs with Freighter)
       ↓
           ┌──────────────────────────────────────┐
           │  Tenant requests checkout            │
           │  Landlord approves → funds released  │
           │           OR                         │
           │  Either party raises a dispute       │
           │  Admin mediates → split decided      │
           └──────────────────────────────────────┘
       ↓
Escrow resolved on-chain
       ↓
Tenant formally vacates → room becomes vacant again
```

### Three roles

| Role | What they do |
|---|---|
| **Landlord** | Creates properties & rooms, generates invite links, deploys escrow contracts, approves checkouts |
| **Tenant** | Joins rooms via invite, funds escrow deposits, requests checkout, raises disputes |
| **Admin (Caushun)** | Mediates disputes, decides fund splits, resolves escrow via platform wallet |

### The escrow

Each room occupancy gets its own **single-release escrow** on Stellar via Trustless Work. The deposit sits on-chain until one of three outcomes:

- **Checkout approved** — landlord signs off, tenant gets the deposit back
- **Dispute resolved** — admin sets a split (e.g. 70% tenant / 30% landlord) and the platform wallet releases
- **Force-closed** — admin marks as resolved in the DB for broken/legacy contracts

Move-in and move-out photos are stored via ImageKit and shown side-by-side when a dispute is being reviewed.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, fullstack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui |
| Animations | Motion (Framer Motion v11) |
| Data fetching | TanStack Query |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle |
| Auth | NextAuth v5 (Google OAuth) |
| Wallet | `@creit.tech/stellar-wallets-kit` (Freighter) |
| Escrow | Trustless Work API + `@stellar/stellar-sdk` |
| Photo storage | ImageKit |
| Email | Resend |
| Package manager | Bun |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/caushun.git
cd caushun
bun install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Auth (NextAuth v5)
NEXTAUTH_SECRET=          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Trustless Work / Stellar
TW_API_KEY=               # https://docs.trustlesswork.com → Request API key
PLATFORM_WALLET_PUBLIC_KEY=
PLATFORM_WALLET_SECRET_KEY=
PLATFORM_WALLET_RECOVERY_PHRASE=

NEXT_PUBLIC_TW_API_BASE=https://dev.api.trustlesswork.com
NEXT_PUBLIC_USDC_ISSUER_TESTNET=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_ESCROW_VIEWER_URL=https://viewer.trustlesswork.com

# Database (Neon)
DATABASE_URL=

# ImageKit
IMAGEKIT_PRIVATE_KEY=
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
INVITE_TOKEN_SECRET=      # any long random string
ADMIN_WALLET_ADDRESS=     # Stellar public key of your platform wallet
```

### 3. Platform wallet

Create a Stellar testnet keypair, fund it with [Friendbot](https://friendbot.stellar.org), and set a USDC trustline:

```bash
# Generate a keypair via Stellar Laboratory or:
# https://laboratory.stellar.org/#account-creator?network=test

# Then fund with Friendbot:
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

The platform wallet needs XLM for transaction fees and a USDC trustline to receive platform fees.

### 4. Database

```bash
bun db:push        # apply schema to Neon
```

### 5. Run

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key resources

- [Trustless Work docs](https://docs.trustlesswork.com)
- [Escrow Viewer](https://viewer.trustlesswork.com) — inspect live on-chain escrow state
- [Trustless Work BackOffice](https://dapp.trustlesswork.com) — manually test escrow flows
- [Stellar Laboratory](https://laboratory.stellar.org) — create and fund testnet wallets

---

## Cheers

Built for the [Boundless](https://boundlessfi.xyz) hackathon.

Powered by [Trustless Work](https://trustlesswork.com) — making on-chain escrow accessible to everyone.

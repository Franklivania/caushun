# Caushun — Product Requirements Document

**Version:** 1.0  
**Hackathon:** Boundless × Trustless Work — May 13–16, 2025  
**Track:** Core Trustless Work Applications  
**Demo Day:** May 16, The Block Hive, 25 University Road, Nsukka, Enugu State  

---

## 1. Problem Statement

In Nigeria, tenants routinely pay 1–2 years' rent upfront plus a "caution fee" (security deposit) that landlords almost never refund at the end of a tenancy. The landlord holds the cash. The tenant has moved out. There is no enforceable mechanism, no neutral third party, and no paper trail that matters.

The problem is structural: **whoever holds the money wins**. Inaction by the landlord defaults to the landlord keeping everything. There is no auto-refund. There is no transparent record of the property's condition at move-in vs. move-out. And there is no arbitration process that doesn't require expensive, slow legal action.

Caushun inverts this power structure using programmable escrow on Stellar.

---

## 2. Solution

Caushun is a web application that places rental security deposits into a non-custodial escrow smart contract on Stellar's testnet, powered by the Trustless Work API.

- The **landlord** initialises the escrow when setting up a room. The deposit amount, roles, and conditions are locked on-chain.
- The **tenant** funds the escrow after accepting an invite link. Funds leave their wallet and sit in the contract — not in the landlord's account.
- At end of tenancy, **either party** can trigger the checkout process. Both upload photographic evidence. The tenant proposes a refund split.
- The **landlord** approves, counter-proposes, or disputes. If they do nothing for 5 days, an auto-refund fires.
- **Caushun** (the platform wallet) acts as Release Signer and Dispute Resolver — the only neutral party that can move funds.
- Every state transition is visible on-chain via the Trustless Work Escrow Viewer.

---

## 3. Users

### Landlord
- Owns one or more properties in Nigeria
- Currently holds caution fees in personal accounts
- Has no structured way to document property condition
- Wants protection against genuine tenant damage claims
- Needs a simple web interface — not a blockchain product

### Tenant
- Pays a caution fee upfront with no guarantee of return
- Has no verifiable record of the property's move-in condition
- Wants assurance their money is safe and the process is fair
- Likely mobile-first, low blockchain literacy

### Caushun Platform (admin)
- Resolves disputes using photographic evidence from both parties
- Earns a 1% platform fee on each resolved escrow
- Controls the platform wallet: `releaseSigner` and `disputeResolver`

---

## 4. Escrow Role Mapping

| TW Role | Caushun Actor | Action |
|---|---|---|
| Signer (deploy) | Landlord wallet | Signs the escrow initialisation transaction |
| Depositor / Funder | Tenant wallet | Funds the escrow with USDC |
| Service Provider | Tenant wallet | Marks checkout milestone, attaches evidence |
| Approver | Landlord wallet | Approves or disputes the checkout |
| Release Signer | Platform wallet | Triggers fund release after approval |
| Dispute Resolver | Platform wallet | Calls resolveDispute with final split |
| Receiver | Tenant wallet (default) | Receives refund; landlord receives damage deduction |
| Platform Address | Platform wallet | Receives 1% platform fee |

Escrow type: **Single-Release**. One deposit per occupancy, one resolution at end of tenancy.

---

## 5. Functional Requirements

### 5.1 Landlord flows

**F-L-01 — Property registration**  
Landlord connects Freighter wallet and creates a property with name, address, and state.

**F-L-02 — Room creation**  
Landlord adds rooms to a property. Each room has a number, unique code (e.g. `NSK-001-R02`), and a deposit amount in USDC.

**F-L-03 — Invite link generation**  
Each room generates a unique, HMAC-signed invite link. Format: `{APP_URL}/onboard/{token}`. The token encodes the room ID and an expiry timestamp. Link deactivates once a tenant has funded the escrow.

**F-L-04 — Move-in photo upload**  
Before escrow initialisation, landlord uploads photos of the room (via ImageKit). Photos are timestamped and tagged as `phase: move_in`.

**F-L-05 — Escrow initialisation**  
When tenant accepts invite, the platform calls `POST /deployer/single-release` with the landlord's wallet as signer. The landlord signs the unsigned XDR via Freighter. On confirmation, `contractId` is stored in the tenancy record.

**F-L-06 — Checkout response**  
Landlord receives notification when tenant triggers checkout. Landlord views side-by-side move-in vs. move-out photos, uploads damage evidence if any, and either:
- (a) Approves the proposed split → calls `approveMilestone`
- (b) Raises dispute → calls `disputeEscrow`

**F-L-07 — Auto-refund timer**  
If landlord takes no action within 5 days of a checkout request, the platform auto-triggers full refund to tenant.

### 5.2 Tenant flows

**F-T-01 — Invite link onboarding**  
Tenant opens invite link. Sees room details, deposit amount, landlord profile, and move-in photos. Connects Freighter wallet. Account is created, linked to the room.

**F-T-02 — Trustline setup**  
Before funding, the platform checks whether the tenant's wallet has a USDC trustline. If not, it calls `POST /helper/set-trustline` and the tenant signs.

**F-T-03 — Move-in photo acknowledgment**  
Tenant views landlord's move-in photos and must click "Confirm move-in condition". This is recorded in the DB with a timestamp. Tenant may also upload their own move-in photos.

**F-T-04 — Escrow funding**  
Tenant calls `POST /escrow/single-release/fund-escrow`. Signs the XDR via Freighter. On confirmation, tenancy status updates to `active`.

**F-T-05 — Checkout trigger**  
Tenant clicks "Request Checkout". Uploads move-out photos. Sets an intended move-out date. Proposes a refund split percentage (0–100% back to tenant) using a slider. Calls `changeMilestoneStatus` with photo URLs and proposed split encoded in `newEvidence`.

**F-T-06 — Dispute acceptance or escalation**  
If landlord counter-proposes a different split, tenant can accept (calls `approveMilestone`) or escalate to full dispute (calls `disputeEscrow`).

### 5.3 Platform / admin flows

**F-A-01 — Release funds**  
After milestone is approved (by landlord), the platform server calls `POST /escrow/single-release/release-funds` signed with `PLATFORM_WALLET_SECRET_KEY`. Funds release to tenant wallet. Platform fee deducted automatically.

**F-A-02 — Resolve dispute**  
Admin views disputed tenancy on `/admin/[disputeId]`. Reviews both parties' photo evidence. Sets a final split percentage. Platform server calls `POST /escrow/single-release/resolve-dispute` with `distributions` array. Funds split to tenant and landlord wallets.

**F-A-03 — Dispute queue**  
`/admin` page lists all tenancies with `escrow_status: disputed`, ordered by dispute date. Accessible only to the platform wallet address.

### 5.4 Shared

**F-S-01 — Live escrow dashboard**  
Both parties see a shared escrow view at `/escrow/[contractId]` showing: on-chain balance, milestone status, move-in photos, a link to viewer.trustlesswork.com/[contractId].

**F-S-02 — Escrow Viewer link**  
Every tenancy card links directly to the live Escrow Viewer. This is the primary demo mechanism on Demo Day.

---

## 6. Non-Functional Requirements

**Performance** — All pages must be interactive within 3s on a 4G mobile connection.

**Mobile responsiveness** — Landing page and all app pages are fully responsive. The primary user device in the Nigerian market is mobile.

**Security** — `PLATFORM_WALLET_SECRET_KEY` must never be exposed to the client. Invite tokens must be HMAC-signed. All API routes must validate the caller's wallet address against the expected role before processing.

**Testnet only** — All transactions are on Stellar testnet (`https://dev.api.trustlesswork.com`). No mainnet transactions during the hackathon.

**No custody** — Caushun never holds user funds. The platform wallet only signs release/resolve transactions; it cannot unilaterally withdraw from escrows.

---

## 7. Out of scope (hackathon)

- Email or SMS notifications (use in-app state only)
- Mobile native app
- Multi-currency support (USDC only)
- Mainnet deployment
- Landlord-initiated early termination flow
- Full legal contract generation

---

## 8. Success criteria for Demo Day

1. Landlord registers a property and room on testnet live on stage.
2. Tenant onboards via invite link, funds escrow.
3. Escrow state is visible in the Trustless Work Escrow Viewer with correct wallet addresses, USDC amount, and milestone status.
4. Checkout flow is demonstrated: tenant requests refund, landlord approves, platform releases.
5. Dispute flow is demonstrated (or shown via a pre-seeded state): platform calls `resolveDispute`, funds split.

---

## 9. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, fullstack) |
| Runtime / PM | Bun |
| Styling | TailwindCSS |
| Animation | Motion (prev. Framer Motion) |
| State | Zustand |
| Validation | Zod |
| Database | Neon (Postgres, serverless) |
| ORM | Drizzle |
| File storage | ImageKit |
| Wallet | Stellar Wallets Kit (`@creit.tech/stellar-wallets-kit`) + Freighter |
| Escrow | Trustless Work REST API (testnet) |
| Blockchain | Stellar Soroban (testnet) |

---

## 10. Timeline

| Day | Focus |
|---|---|
| May 13 (Day 1) | Scaffold, DB schema, landlord property + room creation, invite link generation, wallet connect |
| May 14 (Day 2) | Tenant onboarding, trustline setup, escrow deploy + fund, shared escrow dashboard |
| May 15 (Day 3) | Checkout flow, approve/dispute, release/resolve, admin page, landing page, Motion polish |
| May 16 (Demo Day) | Final seed data, Escrow Viewer demo prep, submission |
# Caushun — DESIGN.md

Design system, visual language, and component specifications for the Caushun web application.

---

## Brand

**Name:** Caushun  
**Tagline:** Your caution fee. Protected.  
**Voice:** Direct, trustworthy, Nigerian-native. No jargon. No blockchain speak. Talk about money, fairness, and peace of mind — not smart contracts.

---

## Colour palette

| Token | Hex | Usage |
|---|---|---|
| `navy` | `#011638` | Primary brand colour. Navigation backgrounds, section fills, text on light surfaces. |
| `slate` | `#364156` | Card backgrounds in the app shell. Secondary surfaces. |
| `ash` | `#CDCDCD` | Borders, dividers, input strokes, disabled states. |
| `mint` | `#DFF8EB` | Success fills. Funded badge. Approved state. Released state. Trust signals. |
| `forest` | `#214E34` | Primary CTAs. Confirmed action buttons. Active states. Text on mint. |
| `white` | `#FFFFFF` | Landing page background. Form surfaces. |
| `near-black` | `#0D0D0D` | Body text on light backgrounds. |

### Usage rules

- The **landing page** is light-themed: white background, navy text, forest CTAs, ash borders.
- The **app shell** (landlord/tenant dashboards, escrow view, admin) is dark-themed: navy background, slate cards, mint success states, forest action buttons.
- **Never use mint as a background for interactive elements** — it is a state colour only (success/funded/approved). CTAs are always forest on white or white on forest.
- **Ash** is purely structural — borders, strokes, and disabled text only. Never a fill.

---

## Typography

**Font:** System font stack — `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`  
Use a web font only if it significantly improves the brand. If added, use a single variable font loaded via `next/font`.

| Role | Size | Weight | Line height |
|---|---|---|---|
| Display heading | 48px / 3rem | 600 | 1.1 |
| Section heading | 32px / 2rem | 600 | 1.2 |
| Card heading | 20px / 1.25rem | 500 | 1.3 |
| Body | 16px / 1rem | 400 | 1.6 |
| Label / meta | 13px / 0.8125rem | 400 | 1.4 |
| Caption | 11px / 0.6875rem | 500 | 1.3 |

**Rules:**
- Sentence case on all UI text. Never ALL CAPS except badge labels (all caps, tracked).
- No mid-sentence bold. Bold is for headings and data values.
- Numerics (USDC amounts, room codes) use `font-variant-numeric: tabular-nums`.

---

## Spacing

Base unit: `4px`. All spacing in multiples of 4.

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Icon gaps, tight internal padding |
| `sm` | 8px | Component internal padding (small) |
| `md` | 12px | Component internal padding (standard) |
| `lg` | 16px | Card padding, section gaps |
| `xl` | 24px | Section padding, card grid gaps |
| `2xl` | 32px | Section margins |
| `3xl` | 48px | Page section vertical rhythm |

---

## Border radius

| Token | Value | Use |
|---|---|---|
| `sm` | 6px | Badges, chips, small pills |
| `md` | 10px | Inputs, buttons |
| `lg` | 14px | Cards |
| `xl` | 20px | Modal sheets, large containers |
| `full` | 9999px | Avatars, status dots |

---

## Tailwind config additions

use the latest v4 config for tailind and modify the style.css

---

## Component specifications

### Button

```
Primary:     bg-forest text-white         hover:bg-forest/90   border-none
Secondary:   bg-white text-navy           hover:bg-ash/30      border border-ash
Ghost:       bg-transparent text-forest   hover:bg-mint        border-none
Danger:      bg-red-600 text-white        hover:bg-red-700     border-none
Disabled:    bg-ash text-white cursor-not-allowed opacity-60

Size md:     px-5 py-2.5 text-sm rounded-md font-medium
Size lg:     px-6 py-3   text-base rounded-md font-medium
Size sm:     px-3 py-1.5 text-xs  rounded-md font-medium

Loading:     Show spinner (Motion animate-spin) + disabled state
```

### Input

```
Base:        border border-ash rounded-md px-4 py-2.5 text-sm bg-white text-near-black
Focus:       border-slate outline-none ring-2 ring-slate/20
Error:       border-red-400 ring-2 ring-red-200
Label:       text-xs font-500 text-slate uppercase tracking-wide mb-1
Error text:  text-xs text-red-500 mt-1
```

### Card

```
App shell:   bg-slate border border-slate/60 rounded-lg p-4
Landing:     bg-white border border-ash rounded-lg p-5 shadow-none
Data card:   bg-navy border border-slate rounded-lg p-4 (escrow amounts, room IDs)
```

### Badge / status chip

```
Pending:     bg-ash/40      text-slate    text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm
Funded:      bg-mint        text-forest   text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm
Active:      bg-forest/10   text-forest   text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm
Checkout:    bg-amber-50    text-amber-700 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm
Disputed:    bg-red-50      text-red-600  text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm
Resolved:    bg-mint        text-forest   text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm
```

---

## Landing page spec

The landing page is **light-themed**. It must be fully mobile responsive. Primary CTA is "Get started as landlord" and secondary is "I'm a tenant".

### Sections (top to bottom)

**1. Navbar**
- Logo: "Caushun" in navy, 20px 600
- Right: "Connect Wallet" button (secondary style)
- Mobile: hamburger → slide drawer
- Background: white, border-bottom ash

**2. Hero**
- Headline (48px, 600, navy): "Your caution fee. Protected."
- Sub (18px, 400, slate): "Nigeria's first on-chain security deposit platform. Funds held in a smart contract — not in your landlord's account."
- Two CTAs side by side: "Landlord — get started" (primary forest) + "Tenant — see how it works" (secondary)
- Mobile: stack CTAs vertically
- Motion: hero text fades up on load (0.4s, ease-out, stagger 0.1s between lines)

**3. How it works**
- Section label: "HOW IT WORKS" in ash, 11px uppercase tracked
- Three cards side by side (stack on mobile):
  - Landlord: "Set up your room. Generate a deposit link."
  - Tenant: "Accept the link. Fund the escrow."
  - Resolution: "Checkout. Funds return fairly."
- Each card: number (forest, 32px, 600) + title (navy, 16px, 500) + body (slate, 14px)

**4. The trust problem**
- Full-width section, navy background
- Headline (white): "The landlord holds the money. You lose."
- Body (ash): Single paragraph on how caution fees are lost in Nigeria.
- Stats block: "₦ billions lost annually to withheld deposits" (mint text, large)

**5. For landlords / For tenants** (two-column feature split)
- Left: landlord features (mint checkmarks)
- Right: tenant features (mint checkmarks)
- Mobile: stack

**6. CTA footer strip**
- navy background, mint accent line
- "Protect your deposit today."
- Single CTA: "Get started" (forest button, white text)

**7. Footer**
- Logo + tagline
- Links: Trustless Work, Escrow Viewer, GitHub
- "Built on Trustless Work × Boundless | Stellar testnet"

---

## App shell layout

The app shell (all authenticated pages) uses:

```
bg-navy min-h-screen
├── Navbar: bg-navy/95 backdrop-blur border-b border-slate/40 sticky top-0
└── Main: max-w-5xl mx-auto px-4 py-6
```

### Navbar (app)
- Left: "Caushun" logo (mint, 18px, 600)
- Center: role badge — "Landlord" or "Tenant" (ash chip)
- Right: truncated wallet address (ash, monospace, 13px) + disconnect button

---

## Escrow status card spec

The primary UI element for both landlord and tenant dashboards.

```
Card: bg-slate border border-slate/60 rounded-lg p-5

┌─────────────────────────────────────┐
│ Room NSK-001-R02            [FUNDED] │  ← room code (mono, ash, sm) + status badge
│                                     │
│ Deposit amount                      │
│ 500 USDC                            │  ← 28px, 600, white
│                                     │
│ Tenant    G...abc          Landlord  │  ← truncated wallet addresses, ash, 12px mono
│                                     │
│ Move-in: May 13, 2025               │  ← ash, 13px
│                                     │
│ [View on Escrow Viewer →]           │  ← link, mint, 13px
└─────────────────────────────────────┘
```

Status badge colours follow the badge spec above.

---

## Photo uploader spec

Used at move-in, move-out, and for damage evidence.

```
Drop zone:      border-2 border-dashed border-ash rounded-lg p-8 text-center
                hover: border-forest bg-mint/20
Upload state:   Motion progress bar (forest fill on ash track)
Preview grid:   3-column grid (2-col mobile), each photo 120×90px, rounded-md
                Hover: overlay with remove button (red/60)
Phase label:    Shown above uploader — "Move-in photos" / "Move-out photos" / "Damage evidence"
Max photos:     10 per phase
Max file size:  5MB per image
Accepted types: image/jpeg, image/png, image/webp
```

---

## Side-by-side photo comparison spec

Used in the landlord approval panel and admin dispute page.

```
Two-column grid (stack on mobile)

Left column:  "Move-in condition" (forest, 13px, 500 label)
              Photo grid: same as uploader preview
              Date: "Uploaded May 13, 2025" (ash, 11px)

Right column: "Move-out condition" (forest, 13px, 500 label)  
              Photo grid
              Date: "Uploaded May 15, 2025" (ash, 11px)

Below:        Action buttons — "Approve split" (forest) | "Raise dispute" (red outline)
```

---

## Refund split slider spec

Used in the tenant checkout form.

```
Label:    "How much should be returned to you?" (navy/white, 14px)
Slider:   Tailwind range input, forest thumb, ash track, mint fill
Value:    Large numeric display — "80% — 400 USDC" (28px, 600, white/navy)
Sub:      "20% — 100 USDC goes to landlord" (ash, 13px)

Validation:
  - Min 0%, max 100%
  - Value must result in clean USDC amounts (no fractional cents)
  - Zod: z.number().min(0).max(100)
```

---

## Motion animation guidelines

Use Motion (Framer Motion) for all transitions. Keep them functional — they should communicate state, not entertain.

```typescript
// Page enter (all authenticated pages)
initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.25, ease: 'easeOut' }

// Card appear (staggered lists)
initial: { opacity: 0, y: 12 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.2, ease: 'easeOut', delay: index * 0.05 }

// Status badge change (escrow state transitions)
initial: { scale: 0.9, opacity: 0 }
animate: { scale: 1, opacity: 1 }
transition: { type: 'spring', stiffness: 300, damping: 20 }

// Success confirmation (deposit funded, funds released)
Animate the USDC amount from grey → mint over 0.6s
Follow with a brief scale pulse (scale: 1 → 1.03 → 1, 0.3s)

// Loading states
Use motion.div with animate={{ opacity: [0.4, 1, 0.4] }}
transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }
```

**Never animate layout shifts.** Don't animate width/height — use opacity and transform only.  
**Respect prefers-reduced-motion** — wrap all animations in a check or use Motion's `useReducedMotion()`.

---

## Mobile responsiveness rules

- All layouts are mobile-first. Desktop is an enhancement.
- Minimum supported width: 320px.
- Grid breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`.
- Touch targets: minimum 44×44px for all interactive elements.
- The photo uploader must work with the camera on mobile (`accept="image/*" capture="environment"` on the file input).
- The split percentage slider must be thumb-friendly on mobile (track height min 6px, thumb min 28px).
- Wallet address display: always truncate to first 6 + last 4 chars on mobile. `G...4QH3` format.
- Navigation on mobile: bottom tab bar with 3 items (Home, Escrow, Profile) or hamburger depending on role.

---

## Escrow Viewer integration

Every escrow card must show a direct link to the public Escrow Viewer.

```typescript
const viewerUrl = `${process.env.NEXT_PUBLIC_ESCROW_VIEWER_URL}/${contractId}`
```

Display as: `"View on Escrow Viewer →"` in mint, 13px. Opens in a new tab.

On Demo Day this link is the primary evidence that the escrow is real and on-chain. Make it prominent.

---

## Empty states

Every list view must have a thoughtful empty state.

```
Landlord dashboard (no properties):
  Icon: house outline
  Heading: "No properties yet"
  Body: "Add your first property to generate a deposit link."
  CTA: "Add property" (forest)

Tenant dashboard (no active tenancy):
  Icon: key outline
  Heading: "No active tenancy"
  Body: "Ask your landlord for an invite link to get started."
  CTA: none

Admin dispute queue (no disputes):
  Icon: check circle
  Heading: "No open disputes"
  Body: "All tenancies are resolving smoothly."
```

---

## Error states

```
API error (escrow call failed):
  Red banner at top of form
  "Transaction failed: {message}. Please try again."
  Retry button

Wallet not connected (accessing app page):
  Redirect to /connect — do not show partial UI

Invalid invite link:
  Full-page error state
  "This invite link is invalid or has expired."
  "Contact your landlord for a new link."

Transaction pending:
  Disable all action buttons
  Show "Transaction pending — please wait..." in ash, 13px
  Motion pulse on the status badge
```
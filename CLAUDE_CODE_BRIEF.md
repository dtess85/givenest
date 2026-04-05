# Givenest — Claude Code Project Brief

> This document is written for Claude Code. It contains everything needed to build
> the Givenest platform from scratch — business context, data models, UI specs,
> API contracts, and implementation priorities. Read it fully before writing any code.

---

## What You're Building

Givenest is a licensed Arizona real estate brokerage where every home sale funds a
charity. At closing, Givenest donates 30% of the brokerage commission to a 501(c)(3) of the
client's choice — 100% of it, no deductions, no admin fees, nothing extra from the
client. The giving comes out of the standard commission structure that was always there.

The platform serves four audiences:
- **Buyers & sellers** — search homes, see their exact giving amount, choose a charity
- **Agents** — join the brokerage, build a brand around the giving story, pay monthly fees
- **Charities** — receive Givenest donations, claim a free profile, grow visibility
- **Admin** — Dustin and Kyndall manage closings, distributions, agents, and operations

---

## Business Model — Understand This First

### The giving math (never change these constants)

```js
// utils/commission.js
export const COMMISSION_RATE  = 0.025;  // brokerage commission (2.5%)
export const GIVING_POOL_RATE = 0.30;   // 30% of commission → charity
export const calcCommission   = (price) => price * COMMISSION_RATE;
export const calcGivingPool   = (price) => calcCommission(price) * GIVING_POOL_RATE;
export const calcDistribution = (price) => calcGivingPool(price); // 100% donated directly to charity
```

The giving pool is **always 30% of the brokerage commission**. Never 1% of home price.
Never a fixed dollar amount. Never less than 100% to Givenest. These are not
configurable — they are the brand promise.

### Agent model — 70/30 split

Every agent at Givenest operates on a 70/30 split:
- **70%** → agent keeps
- **30%** → Givenest (charity), calculated on **gross commission before any
  team splits**

The 30% to charity is calculated on gross commission **first**, always. Team leader
overrides and splits apply only to the remaining 70%.

**Team example on a $550K closing ($13,750 commission):**
- Charity receives: $4,125 (30% of gross — fixed)
- Remaining: $9,625 (70%)
- Team leader override (e.g. 20% of gross): $2,750
- New agent keeps: $6,875 (50% of gross)

### Revenue model — monthly agent fees

Givenest earns no cut of the commission. Revenue comes from:
- **Agent monthly subscriptions** — $99/mo standard, team tiers TBD
- **Ancillary platform revenue** — mortgage referrals, title partnerships, insurance leads
  (Phase 2)
- **AZ direct brokerage income** — Dustin and Kyndall's own closings fund Phase 1
  operations

### Partner agents vs. brokerage agents

**Brokerage agents** — licensed under Givenest, pay $99/mo, operate on 70/30 split,
appear in agent directory, receive platform leads.

**Partner agents (legacy/referral model)** — external agents who receive referred
clients, pay a 30% referral fee at closing via per-transaction agreement. The referral
fee = the giving pool. Givenest earns $0 on partner deals. Partner agents do NOT pay
monthly fees.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for SEO, API routes for backend |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS + CSS variables | Design tokens below |
| Database | PostgreSQL via Prisma ORM | |
| Auth | Clerk | Handles agent, admin, and charity logins |
| MLS Data | ATTOM Data API | Fallback: mock data for dev |
| Charity Search | Every.org API | 1.8M+ nonprofits |
| Email | Resend | Transactional only |
| E-signature | DocuSign SDK | Partner referral agreements |
| Hosting | Vercel (frontend + API) | |
| Storage | Vercel Blob or S3 | Agent/charity profile photos |
| Analytics | Vercel Analytics | |

---

## Design System

Apply these tokens as CSS variables globally. Never use hardcoded hex values in
components — always reference tokens.

```css
/* globals.css */
:root {
  --color-pampas:    #F4F3EE;  /* primary bg — nav, hero, page */
  --color-warm-1:    #ECEAE3;  /* secondary sections */
  --color-warm-2:    #E8E6DF;  /* panels, cards, forms */
  --color-cloudy:    #B1ADA1;  /* muted text, borders */
  --color-coral:     #E36858;  /* signature accent — NEVER change */
  --color-black:     #0C0D0D;  /* body text */
  --color-muted:     #6B6860;  /* secondary text */
  --color-border:    #E3DED6;  /* dividers, card outlines */
  --color-white:     #FFFFFF;  /* card surfaces */
}
```

**Typography:**
- Headings: Lora (Google Fonts) — weights 500, 600. Italic for accent words.
- Body: DM Sans (Google Fonts) — weights 300, 400, 500.
- Load via `next/font/google`.

**Wordmark:** `give` in Lora regular (near-black) + `nest` in Lora italic (coral).
`give` is never italic. `nest` is always italic and always coral.

```tsx
function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span style={{ fontFamily: "Lora, serif", fontSize: size }}>
      <span style={{ color: "var(--color-black)", fontStyle: "normal" }}>give</span>
      <span style={{ color: "var(--color-coral)", fontStyle: "italic" }}>nest</span>
    </span>
  )
}
```

---

## Database Schema (Prisma)

```prisma
// schema.prisma

model Agent {
  id              String    @id @default(cuid())
  clerkId         String    @unique
  name            String
  email           String    @unique
  licenseNumber   String
  licenseState    String    @default("AZ")
  brokerage       String?   // for partner agents only
  type            AgentType // BROKERAGE | PARTNER
  status          AgentStatus @default(PENDING)
  markets         String[]  // ["Phoenix", "Scottsdale", "Gilbert"]
  bio             String?
  photoUrl        String?
  monthlyFee      Int       @default(99) // dollars
  subscriptionActive Boolean @default(false)
  teamLeaderId    String?
  teamLeader      Agent?    @relation("TeamMembers", fields: [teamLeaderId], references: [id])
  teamMembers     Agent[]   @relation("TeamMembers")
  teamOverridePct Float?    // e.g. 0.20 = team leader takes 20% of gross
  closings        Closing[]
  referralAgreements ReferralAgreement[]
  createdAt       DateTime  @default(now())
}

enum AgentType   { BROKERAGE PARTNER }
enum AgentStatus { PENDING ACTIVE SUSPENDED }

model Closing {
  id              String    @id @default(cuid())
  agentId         String
  agent           Agent     @relation(fields: [agentId], references: [id])
  address         String
  city            String
  state           String
  zipCode         String
  salePrice       Int       // cents
  commission      Int       // cents — calculated at closing
  givingPool      Int       // cents — always commission * 0.30
  charityId       String
  charity         Charity   @relation(fields: [charityId], references: [id])
  designationLockedAt DateTime? // set when Givenest locks the designation on the backend
  distributionSentAt  DateTime?
  // matching removed from MVP — handled via FAQ
  clientEmail     String?
  clientName      String?
  status          ClosingStatus @default(PENDING)
  createdAt       DateTime  @default(now())
}

enum ClosingStatus { PENDING DESIGNATION_OPEN LOCKED DISTRIBUTED }

model Charity {
  id              String    @id @default(cuid())
  ein             String    @unique
  name            String
  category        String
  location        String
  description     String?
  website         String?
  photoUrl        String?
  missionStatement String?
  status          CharityStatus @default(UNCLAIMED)
  tier            CharityTier   @default(BASIC)
  totalReceived   Int       @default(0) // cents
  closingCount    Int       @default(0)
  closings        Closing[]
  inviteSentAt    DateTime?
  claimedAt       DateTime?
  createdAt       DateTime  @default(now())
}

enum CharityStatus { UNCLAIMED INVITED CLAIMED VERIFIED }
enum CharityTier   { BASIC STANDARD FEATURED SPOTLIGHT }

model ReferralAgreement {
  id              String    @id @default(cuid())
  agentId         String
  agent           Agent     @relation(fields: [agentId], references: [id])
  clientName      String
  clientEmail     String
  propertyAddress String
  referralFeePct  Float     @default(0.30)
  docusignEnvelopeId String?
  status          AgreementStatus @default(DRAFT)
  signedAt        DateTime?
  createdAt       DateTime  @default(now())
}

enum AgreementStatus { DRAFT SENT SIGNED VOIDED }

model Designation {
  id              String    @id @default(cuid())
  closingId       String    @unique
  charityId       String
  selectedAt      DateTime  @default(now())
  changedAt       DateTime?
  lockedAt        DateTime?
  token           String    @unique // for post-closing confirmation email
}
```

---

## File Structure

```
givenest/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Home — impact stats, how it works, feed
│   │   ├── buy/
│   │   │   ├── page.tsx          # Property search
│   │   │   └── [address]/
│   │   │       └── page.tsx      # Property detail + Giving Panel
│   │   ├── sell/
│   │   │   └── page.tsx          # Seller estimate + charity selection
│   │   ├── charities/
│   │   │   ├── page.tsx          # Charity showcase
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Charity profile
│   │   ├── agents/
│   │   │   └── page.tsx          # Join as agent / partner
│   │   └── give/
│   │       └── [token]/
│   │           └── page.tsx      # Post-closing confirmation page
│   ├── (agent)/
│   │   └── dashboard/
│   │       ├── page.tsx          # Agent home — closings, giving impact
│   │       ├── closings/
│   │       │   └── page.tsx      # Closing history + new closing form
│   │       ├── agreements/
│   │       │   └── page.tsx      # Referral agreements
│   │       └── profile/
│   │           └── page.tsx      # Agent profile editor
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx          # Admin overview
│   │       ├── agents/page.tsx   # Agent management
│   │       ├── closings/page.tsx # Closing management + distribution
│   │       ├── charities/page.tsx # Charity management
│   │       └── foundation/page.tsx # Givenest donation records
│   └── api/
│       ├── agents/route.ts
│       ├── closings/route.ts
│       ├── charities/
│       │   ├── route.ts
│       │   └── search/route.ts   # Proxies Every.org API
│       ├── properties/
│       │   └── search/route.ts   # Proxies ATTOM API
│       ├── agreements/route.ts
│       ├── designations/
│       │   └── [token]/route.ts  # Designation confirmation endpoint
│       └── webhooks/
│           └── docusign/route.ts # DocuSign envelope status
├── components/
│   ├── ui/                       # Base components (Button, Input, Card, etc.)
│   ├── Wordmark.tsx
│   ├── Nav.tsx
│   ├── Footer.tsx
│   ├── GivingPanel.tsx           # The core giving calculation component
│   ├── CharitySearch.tsx         # Typeahead search — used everywhere
│   ├── PropertyCard.tsx
│   ├── ClosingFeed.tsx           # Live impact feed on homepage
│   ├── ImpactStats.tsx           # Cumulative stats bar
│   └── AgentCard.tsx
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── commission.ts             # calcCommission, calcGivingPool, calcDistribution
│   ├── every-org.ts              # Every.org API client
│   ├── attom.ts                  # ATTOM API client
│   ├── resend.ts                 # Email sending
│   ├── docusign.ts               # DocuSign SDK wrapper
│   └── utils.ts                  # fmt (currency formatter), cn, etc.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # Dev seed data
└── public/
    └── fonts/                    # Self-host Lora + DM Sans if needed
```

---

## Pages — Detailed Specs

### `/` — Home

**Purpose:** Establish trust, explain the model, show live impact, drive CTAs.

**Sections in order:**
1. **Nav** — Wordmark left, links (Buy, Sell, Charities, Agents), CTA button (Get Started)
2. **Hero** — Headline: "Every home funds a cause you choose." Subhead: one sentence on
   how it works. Two CTAs: Browse Homes / Estimate Your Giving. No hero image — clean
   type on Pampas background.
3. **Impact bar** — Four live stats pulled from DB: Total homes closed, Total given to
   charity ($), Charities supported, Cities served. Updates in real time.
4. **How it works** — Three steps on sage (#B7B9A8) background:
   - 01 Find your home
   - 02 Choose a charity
   - 03 Close and give
   Math strip below: $550K × 2.5% × 30% = $4,125 → 100% to charity
5. **Live closing feed** — Last 10 closings from DB. Each card: city, giving amount,
   charity name. Anonymous — no client names. Auto-refreshes every 60s.
6. **Featured charities** — 3–4 charity cards from FEATURED/SPOTLIGHT tier.
7. **Agent recruitment band** — "Join as an agent. Build a brand worth talking about."
   Brief pitch + CTA to agent signup.
8. **CTA band** — "Your next home could fund a cause." Coral background.
   Two buttons: Browse Homes / Get a Selling Estimate.
9. **Footer** — Wordmark, nav links, legal, Givenest giving note.

### `/buy` — Property Search

**Purpose:** MLS search → property detail with giving panel.

**Behavior:**
- Address/city search bar → calls ATTOM API → returns property cards
- Each card shows: address, list price, giving amount (calculated), charity placeholder
- Filter by: price range, beds/baths, city
- Click → `/buy/[address]` (property detail)
- If ATTOM unavailable: display mock properties clearly marked as examples

### `/buy/[address]` — Property Detail

**Purpose:** Show property + Giving Panel. This is the emotional core of the product.

**Layout:** Two-column on desktop (property info left, Giving Panel sticky right).

**Property info:** Photos, address, list price, beds/baths/sqft, listing details.

**Giving Panel (right column, sticky):**
```
┌─────────────────────────────────┐
│  Giving panel                   │
│                                 │
│  List price          $550,000   │
│  Brokerage commission (2.5%)   $13,750    │
│  Giving pool (30%)   $4,125     │  ← coral, large
│                                 │
│  100% to charity — no deductions│
│                                 │
│  [Charity search typeahead    ] │
│  → St. Mary's Food Bank   ✓    │
│                                 │
│  Want to double the impact?     │
│  Add a personal match at closing│
│  (tax-deductible)               │
│                                 │
│  [Get matched with an agent]    │
└─────────────────────────────────┘
```

**Charity search behavior:**
- Typeahead calls `/api/charities/search?q=` which proxies Every.org
- Results show: name, category, location, EIN
- If charity has a Givenest profile, show badge + total received
- Selection saved to localStorage pending agent match submission

### `/sell` — Seller Estimate

**Purpose:** Seller inputs home value, sees giving estimate, selects charity, gets matched.

**Flow:**
1. Input: estimated home value (slider + text input)
2. Auto-calculate and display: commission → giving pool → Givenest donation
3. Charity search — same component as buyer panel
4. Optional match prompt
5. CTA: "Get matched with a Givenest agent" → collect name, email, phone, timeline
6. Confirmation: "We'll connect you with an agent within 24 hours"

### `/charities` — Charity Showcase

**Purpose:** Directory of charities that have received Givenest donations.

**Layout:** Search/filter bar + grid of charity cards.

**Filters:** Category (Food, Housing, Animals, Education, etc.), Location, Sort by
(distributions received, closing count, alphabetical).

**Charity card shows:**
- Name, category, location
- Total received from Givenest
- Number of closings that have supported them
- FEATURED/SPOTLIGHT: larger card, mission statement, impact story

**Only show CLAIMED or VERIFIED charities.** UNCLAIMED charities are not listed — they
receive distributions but haven't created a profile yet.

### `/charities/[id]` — Charity Profile

- Full profile: name, logo, mission, EIN, website
- Impact stats: total received, closing count, distribution history (dates + amounts,
  no client names)
- Donor wall: "31 Givenest closings have supported this charity" — anonymous
- CTA: "Buy or sell with Givenest — fund this charity"
- FEATURED+: impact stories, co-branded content

### `/agents` — Agent / Partner Signup

**Two tabs:**

**Tab 1: Join as a Brokerage Agent**
- Pitch: "Build a brand worth talking about. $99/month. 70% commission split."
- How it works: you close homes, 30% goes to charity, clients love you for it
- Signup form: name, license number, AZ license required, markets served, email
- After submit: pending review — Dustin approves manually in admin

**Tab 2: Join as a Partner Agent**
- Pitch: "Receive qualified leads. Pay a standard 30% referral fee at closing."
- No monthly fee. Per-transaction referral agreement only.
- Signup form: name, license number, brokerage, markets, email
- After submit: auto-approved, welcome email sent

### `/dashboard` — Agent Dashboard (authenticated)

**Access:** Clerk auth, role = AGENT or TEAM_LEADER.

**Sections:**
- Impact summary: total given to charity across all your closings, charities supported
- Active closings: status tracker per closing
- Referral agreements: pending signatures, completed
- New closing form: record a closing, enter client details, trigger designation flow
- Profile editor: bio, photo, markets, giving story

**New closing form fields:**
- Property address, sale price, closing date
- Client name + email (for post-closing email)
- Charity designation (charity search component)
- Commission confirmation (auto-calculated, editable)

**On closing submission:**
1. Record in DB
2. Calculate giving pool (always gross commission × 30%)
3. Send client post-closing confirmation email with designation summary
4. Queue Givenest donation — timing managed on the backend

### `/admin` — Admin Dashboard (Dustin + Kyndall only)

**Access:** Clerk auth, role = ADMIN.

**Sections:**

**Overview:** Total agents, total closings, total distributed, pending distributions,
monthly subscription revenue, agent count trend.

**Agents:** Table of all agents — status, type, subscription status, closing count,
total given. Actions: approve, suspend, view profile.

**Closings:** All closings across all agents — status pipeline. Filter by status.
Actions: mark distributed, override charity, contact client.

**Charities:** All charities in DB — claimed vs unclaimed, tier, total received.
Actions: upgrade tier, send invite, verify EIN.

**Giving:** Donation queue — closings pending payment to charity.
Batch approve + export for Givenest donation processing.

---

## Key Components

### `GivingPanel`

The most important component in the codebase. Used on property detail, seller estimate,
and agent dashboard. Must be pixel-perfect and always show accurate math.

```tsx
interface GivingPanelProps {
  price: number           // list price in dollars
  charityId?: string      // pre-selected charity
  onCharitySelect: (charity: Charity) => void
  onAgentMatch?: () => void
  showMatchPrompt?: boolean
  variant?: 'property' | 'seller' | 'dashboard'
}
```

Internal calculations must always use `lib/commission.ts` — never inline the math.

### `CharitySearch`

Typeahead search used on property detail, seller estimate, agent new closing form.

```tsx
interface CharitySearchProps {
  value?: Charity
  onChange: (charity: Charity) => void
  placeholder?: string
}
```

- Debounce 300ms
- Calls `/api/charities/search?q={query}`
- Shows name, category, location in results
- If charity has Givenest profile: show badge
- Minimum 2 characters to search

### `ClosingFeed`

Live feed on homepage. Polls `/api/closings/recent` every 60s.

```tsx
// Each item shows:
interface FeedItem {
  city: string
  givingAmount: number   // dollars
  charityName: string
  closedAt: Date
}
// No client names. No agent names. Just the giving moment.
```

---

## API Routes

### `GET /api/properties/search`
Params: `q` (address/city), `minPrice`, `maxPrice`, `beds`, `baths`
Proxies ATTOM API. Returns array of properties with giving amount calculated.
Cache responses 5 minutes.

### `GET /api/charities/search`
Params: `q` (charity name)
Proxies Every.org `/search/` endpoint.
Returns: `{ id, name, ein, category, location, hasGivenestProfile, totalReceived }`

### `POST /api/closings`
Auth: Agent only.
Body: `{ address, salePrice, commission, charityId, clientName, clientEmail, closingDate }`
- Creates Closing record
- Creates Designation record with unique token
- Sends post-closing email to client via Resend
- Returns closing record

### `GET /api/designations/[token]`
Public — accessed via email link.
Returns: charity designation details and confirmation status

### `PATCH /api/designations/[token]`
Backend-managed — charity designation changes handled by Givenest.
Body: `{ charityId }`
- Updates Designation
- Sends confirmation email
- Returns updated designation

### `POST /api/agreements`
Auth: Agent only.
Body: `{ clientName, clientEmail, propertyAddress, agentId }`
- Creates ReferralAgreement record
- Sends DocuSign envelope to agent + client
- Returns agreement record

### `POST /api/webhooks/docusign`
Receives DocuSign envelope completed webhook.
Updates ReferralAgreement status to SIGNED.

---

## Email Templates (Resend)

All emails sent from `foundation@givenest.com`.

### 1. Post-Closing Client Email
**To:** client
**Subject:** "Your closing just funded [Charity Name]"
**Body:**
- Closing address
- Giving amount (large, coral)
- Charity name + brief description
- Designation confirmation details
- Optional: "Want to add a personal contribution?" — links to FAQ page
- Footer: Givenest contact, giving amount confirmation

### 2. Designation Change Confirmation
**To:** client
**Subject:** "Your charity designation has been updated"
**Body:** New charity name, amount, lock date.

### 3. Charity First Distribution Invite
**To:** charity (if email known) or general contact
**Subject:** "A Givenest closing just funded [Charity Name]"
**Body:**
- Amount received
- What Givenest is (one paragraph)
- CTA: Claim your free profile on Givenest
- No obligation — distribution happens regardless

### 4. Agent Welcome — Brokerage
**To:** new agent
**Subject:** "Welcome to Givenest"
**Body:** Next steps, dashboard link, first closing guide.

### 5. Agent Welcome — Partner
**To:** new partner agent
**Subject:** "You're now a Givenest partner agent"
**Body:** How leads work, what to expect, referral agreement process.

---

## Environment Variables

```bash
# Database
DATABASE_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# APIs
ATTOM_API_KEY=
EVERY_ORG_API_KEY=
RESEND_API_KEY=
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_SECRET_KEY=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_BASE_URL=

# App
NEXT_PUBLIC_APP_URL=https://givenest.com
FOUNDATION_EMAIL=foundation@givenest.com
ADMIN_EMAILS=dustin@givenest.com,kyndall@givenest.com
```

---

## Build Order

Build in this sequence. Each phase should be fully working before starting the next.

### Phase 1 — Public Site (Week 1–2)
1. Next.js project scaffold with TypeScript, Tailwind, design tokens
2. Fonts (Lora + DM Sans via next/font)
3. Wordmark, Nav, Footer components
4. `lib/commission.ts` with tests
5. Home page — static content, mock impact stats, mock closing feed
6. GivingPanel component — takes price prop, shows math, no charity search yet
7. `/buy` — mock property cards with giving amounts
8. `/buy/[address]` — property detail + GivingPanel (mock property data)
9. `/sell` — estimate calculator with GivingPanel
10. `/charities` — mock charity showcase
11. `/agents` — static pitch pages with signup forms (no backend yet)
12. Deploy to Vercel

### Phase 2 — Database + Auth (Week 2–3)
1. Prisma schema + PostgreSQL setup
2. Clerk auth — sign in/up pages, middleware
3. Agent roles in Clerk metadata
4. Seed script with dev data (10 agents, 50 closings, 20 charities)
5. `/api/closings/recent` → powers live closing feed
6. `/api/charities` → powers showcase page
7. Impact stats from real DB data

### Phase 3 — Charity Search (Week 3)
1. Every.org API client
2. `/api/charities/search` route
3. CharitySearch typeahead component
4. Wire into GivingPanel on property detail
5. Wire into seller estimate page

### Phase 4 — Agent Dashboard (Week 3–4)
1. Agent auth flow via Clerk
2. `/dashboard` — impact summary from real data
3. New closing form
4. Post-closing email via Resend
5. Designation token generation
6. `/give/[token]` — Post-closing confirmation page
7. Designation change email

### Phase 5 — MLS Integration (Week 4–5)
1. ATTOM API client
2. `/api/properties/search` route
3. Wire into `/buy` search
4. Property detail page with real data
5. Handle ATTOM errors gracefully with mock fallback

### Phase 6 — Partner Agreements (Week 5)
1. DocuSign SDK setup
2. ReferralAgreement model
3. `/api/agreements` route
4. Agreement generation + envelope send
5. DocuSign webhook handler
6. Agreement status in agent dashboard

### Phase 7 — Admin Dashboard (Week 6)
1. Admin role in Clerk
2. `/admin` overview
3. Agent management — approve/suspend
4. Closing management — distribution queue
5. Charity management — tier upgrades, EIN verification
6. Givenest donation export (CSV)

### Phase 8 — Charity Profiles (Week 6–7)
1. Charity claim flow — invite email → signup → profile editor
2. `/charities/[id]` — full profile page
3. Charity auth via Clerk (separate role)
4. Profile editor — bio, photo, mission statement

---

## Rules — Never Violate These

1. **30% of gross commission to charity — always.** Calculated before any team splits.
   Never calculated on net. Never less than 100% donated to charity.

2. **The Wordmark.** `give` is Lora regular, never italic. `nest` is Lora italic, always
   coral. Never vary this.

3. **Design tokens only.** No hardcoded hex values in components. Always use CSS
   variables or Tailwind tokens mapped to them.

4. **`lib/commission.ts` is the single source of truth** for all giving calculations.
   Never inline commission math in a component or API route.

5. **No client names in the public closing feed.** Ever. The feed shows city, amount,
   charity — nothing that identifies the buyer or seller.

6. **Matching is optional and never pre-checked.** The match prompt is always an
   invitation. Never a default. Never pre-filled.

7. **Designation locking.** After closing, the charity designation is locked and managed on the backend by Givenest. No client-facing change window is shown in the UI.

8. **Givenest donations are not Givenest revenue.** Never show them in revenue
   dashboards. They are pass-through — donated directly to charity.

9. **Always lowercase "givenest."** The brand name is never capitalized — not at the
   start of a sentence, not in headings, not anywhere. Always `givenest`.

---

## Guiding Principles

- The giving panel is the emotional core of every page. Give it space and make the
  dollar amount prominent. It should never feel like a footnote.
- Lead with dollar amounts, never percentages. "$4,125 to St. Mary's Food Bank" not
  "30% of the brokerage commission."
- Performance matters — buyers search on mobile. Property pages must load fast.
- The admin dashboard is an internal tool — prioritize function over form.
- Every automated email represents Givenest. Tone is warm, precise, and grateful.
- When in doubt: simple over clever. The model is already distinctive — the platform
  does not need to be.

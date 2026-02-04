# Knights & Kings

## Run locally

1. Install Node.js 20+ and pnpm.
2. Copy the example env file and adjust if needed:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Start Postgres + Redis:

   ```bash
   pnpm db:up
   ```

5. Run Prisma migrations and seed data:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

6. Start the development servers:

   ```bash
   pnpm dev
   ```

## Knights & Kings — Technical Constitution + Engineering Setup (Codex Authority)

Status: Canonical / Implementation Authority
Audience: Codex Agent + Engineers
Purpose: This document defines the world rules, invariants, MVP scope, and engineering constraints. Codex must implement to spec and must ask before making assumptions.

### 1) Product Thesis

Knights & Kings is a persistent, real-time medieval realm simulator on a real-earth geographic map (terrain only; no modern borders). The player’s goal is not to “win,” but to rise, dominate, decline, recover, and write history. Power is earned through legitimacy and institutional stability, not pure conquest.

Core design intent:

- The experience should feel like tending and steering a living realm over real time.
- “Victory” is survival, continuity, prestige, and influence—not a match end screen.
- The map is a strategic layer for neighbors/distance/terrain, but politics and borders are emergent and legitimacy-driven.

### 2) Timeless World Constraints

- No tech tree / no eras / no technological advancement.
- The world remains a medieval equilibrium permanently.
- The game runs in real time (no turns).
- All progression, decay, governance cycles, and crises happen over actual elapsed time.

### 3) Core Concepts (Non-Negotiables)

#### 3.1 Institutions = Chess Pieces (per realm)

Institutions are the “organs” of the realm, modeled on chess pieces:

- Pawn — labor/population foundation
- Knight — military force projection and raiding capability
- Rook — infrastructure, logistics, fortification, and defensive readiness
- Bishop — faith, culture, ideology, moral authority
- Queen — administration/diplomacy; paired with King (not independent in MVP)
- King — sovereignty; legitimacy anchor; collapse trigger

Institutions are persistent structures once established and can be vacant or staffed.

#### 3.2 Cards = Heads of Institutions (characters)

Cards are people who lead institutions—not buffs/spells.
Each installed head provides:

- benefits and downsides
- pressures that affect legitimacy pillars
- a term of office
- lingering consequences (the realm is changed by who governed it)

#### 3.3 Legitimacy is the prime currency

Legitimacy governs:

- sovereignty and recognition
- the stability of government
- (future scope) claims, diplomacy, casus belli, war outcomes

Losing legitimacy primarily damages authority/stability, not just territory.

#### 3.4 Slow collapse

Instability is telegraphed and erodes over time unless corrected. Collapse is rarely instant.

#### 3.5 No permanent win/lose

Realms are not deleted by “defeat.” A realm may:

- dominate then decline
- be dominated then recover
- fade into obscurity and return later

### 4) Time & Terms

#### 4.1 Real-time governance (no turns)

The game is always-on, asynchronous. The simulation advances via scheduled ticks. Players interact whenever they choose; the world continues regardless.

#### 4.2 Default terms

- Non-sovereign institution heads: default 30 real days per term
- King + Queen: default 60 real days per reign

The Queen’s term is directly coupled to the King’s term.

Installing/replacing a King implicitly installs/replaces the Queen within that reign.

#### 4.3 Term modifiers

Term length may be shortened or extended based on:

- legitimacy balance
- vacancies and instability
- crises and external/internal pressure
- governance strain from repeated reappointments

Terms are never purchase-extendable in a way that breaks balance. Real money cannot extend terms or bypass instability rules.

### 5) Government Stability & King-Fall Reset (Sacred Rule)

#### 5.1 Peaceful transfer (full reign completed)

If a King completes the full 60-day term:

- Transfer of power is peaceful
- Non-sovereign institutions remain staffed
- Stability improves slightly (small positive stabilization effect)
- Dynasty succession option may appear (see dynasties)

#### 5.2 Premature end triggers Government Collapse

If a King’s reign ends early for any reason (death, deposition, revolt, legitimacy collapse, foreign enforcement, etc.):

Government Collapse triggers immediately:

- ALL institutional head cards are removed (vacated) across the government (Pawn/Knight/Rook/Bishop/Queen).
- The realm enters Interregnum:
  - high instability
  - legitimacy shock
  - accelerated erosion
- the player must scramble to reinstall leadership at great cost

This rule is sacred: the crown is load-bearing (chess “king captured” analogue).
There are no exceptions, including for legendary rulers.

### 6) Legitimacy Model (Hybrid: Visible Score + Hidden Balance)

#### 6.1 What the player sees

- Legitimacy Score (0–100) + Tier label
- Clear warnings when imbalance is growing or collapse is approaching

#### 6.2 What drives legitimacy (7 pillars)

Legitimacy emerges from balancing:

- Institutions (health/coverage/staffing)
- Wealth
- Population
- Culture
- Faith
- Victory / Prestige
- Time / Stability

#### 6.3 Balance cap rule (anti min-max)

Legitimacy cannot exceed the weakest pillar by more than a limited margin.
This prevents min-maxing and enforces “harmony” governance.

#### 6.4 Slow drift

Legitimacy changes are slow—drifting toward a computed target. No twitchy spikes.

### 7) Conflict Model (MVP Scope)

#### 7.1 Pre-sovereignty conflict = Raids only

Before sovereignty is established:

- players may initiate raids
- raids yield loot/resources
- raids do not yield land/population/borders

Raids impose strain:

- legitimacy/stability pressure
- retaliation/defensive readiness consequences

#### 7.2 Sovereignty expands depth later

Sovereignty unlocks deeper politics (claims/casus belli/war), but MVP requires only:

- raids
- consequences/instability
- signals of defensive preparedness

### 8) Card System Rules (Leadership, Fatigue, Obscurity)

#### 8.1 Installation is required

A card only affects the realm if installed as head of an institution.

#### 8.2 Reappointment

A head may be reinstated for a second consecutive term, but:

- costs more in in-game wealth
- imposes additional strain
- may shorten the subsequent term

#### 8.3 Two-term limit → obscurity

After two consecutive terms, the card:

- becomes unavailable in that region for 6–12 months real time
- “disappears into obscurity” (region cooldown)
- cannot be immediately reused even by the same realm

### 9) Dynasties (King-only)

#### 9.1 Normal kings can produce heirs

When a normal King’s reign ends peacefully, succession may include:

- Crown the Heir (son) as a candidate option

Heir traits are hidden until installed. The heir may be:

- promising
- average
- a “stinker” that destabilizes the realm

Heir quality is biased by the stability/balance of the prior reign (not purely random), but never guaranteed.

#### 9.2 Legendary kings do NOT produce crownable heirs

Legendary rulers are one-and-done for bloodline succession:

- no playable heir option directly from a legendary ruler
- legendary reigns end the bloodline mechanically

However, legendary reigns may leave Legacy Echoes:

- persistent probabilistic influence shaping future kings’ tendencies
- not guaranteed bonuses
- cannot be traded

### 10) Card Rarity, Acquisition, and Anti-Pay-to-Win Rules (Canonical)

#### 10.1 Rarity classes

- Common
- Uncommon
- Rare
- Ultra Rare
- Legendary

#### 10.2 Acquisition sources by rarity (hard rule)

Common & Uncommon obtainable via:

- Regional Draft Pools (in-game)
- Sold Physical Booster Packs (real money)

Rare & Ultra Rare obtainable ONLY via:

- In-game Banquet for Nobles event

Cannot appear in:

- physical packs
- regional drafts

Legendary obtainable ONLY (rarely) via:

- Sold Physical Booster Packs (real money “hunts”)

Cannot appear in:

- banquets
- regional drafts
- any in-game random system

#### 10.3 Critical anti-pay-to-win constraint

Owning a physical card does not grant automatic in-game power.
All cards—especially legendary—must be:

- imported (if physical)
- then installed using in-game wealth
- and still obey all legitimacy/instability/term rules

Legendary installation cost is intentionally very high (significant in-game wealth) to prevent pay-to-win. A legendary is an opportunity, not a shortcut.

#### 10.4 Regional draft pool intent

Draft pools provide:

- frequent, low-cost options
- culturally aligned leaders
- stable governance choices

Draft leaders should generally be more legitimacy-stable than pack commons/uncommons.

#### 10.5 Pack common/uncommon intent

Pack common/uncommon leaders are usable but should be framed as:

- outsiders / itinerant officials / mercenaries
- often less culturally aligned
- good for emergency vacancies and flexibility
- not optimal for long-term legitimacy compared to strong local governance

### 11) Banquet for Nobles (Rare/Ultra Rare Acquisition)

The banquet is an in-game event:

- costs substantial in-game wealth
- reveals a small, randomized selection of candidates
- produces strain (political cost / resentment / intrigue)
- yields rare and ultra-rare candidates only

Banquets embody: wealth buys opportunity, not certainty.

### 12) Legendary Cards (Historical Legends + Manifestations)

#### 12.1 Legends are historical figures

Examples: Richard the Lionheart, Charlemagne, etc. (public domain figures; original art required)

#### 12.2 Manifestations (multiple versions of the same legend)

There are multiple printed cards per legend, each with:

- unique art
- slightly different stats/attributes
- different secondary traits
- different story flavor and rarity

This allows multiple players to play “Richard” while preserving uniqueness and collectibility. No single manifestation is strictly best.

#### 12.3 Legendary design intent

Legendary rulers are:

- powerful but demanding
- high-risk / high-burden
- can destabilize fledgling realms
- never immune to collapse mechanics

History does not bend for money.

### 13) Physical Cards, QR Import, and Secondary Market Rules

#### 13.1 QR binding

Physical cards include a unique QR code.
Scanning imports the card into the player account as a digital “artifact reference.”

Rules:

- a QR may be redeemed once, ever
- redemption changes the card state (see lifecycle states)
- all redemptions must be server-verified and tamper-resistant

#### 13.2 Legendary lifecycle states (hard rule)

Legendary cards exist in exactly one of:

- Unbound (Unused)
  - never redeemed
  - freely tradable on secondary markets
- Bound (Redeemed/Linked)
  - QR redeemed and bound to an account (and later a realm)
  - cannot be transferred
  - requires in-game wealth to install
  - may govern for one legal reign
- Canonized (Retired)
  - reign completed
  - permanently unusable in-game
  - may be sold as an inert artifact with immutable history/provenance

#### 13.3 Secondary market allowed behavior

- Unbound cards may be bought/sold/traded freely
- Bound cards cannot be transferred
- Canonized cards may be sold, but are inert in-game and exist as historical artifacts only

### 14) Canonization & Chronicle System (Forward-Compatible Phase)

If/when the company can support it:

After a legendary reign is completed, the owner may submit the physical card for “grading/certification”

Certification includes a Chronicle of the reign, packaged and beautiful

Chronicle is immutable, permanent provenance attached to that card’s artifact ID

This helps secondary buyers understand the card’s history and its in-game retirement

Canonization:

- does not restore usability
- reinforces that history has finality

### 15) MVP Success Criteria (What “fun” must be true)

The MVP is successful if players feel:

- tension from expiring leadership terms
- pride from completing a sovereign reign
- fear of early King loss (collapse + scramble)
- meaningful strategic choices without turns
- “history happened to me” stories
- temptation to raid vs commitment to stability
- desire to plan, wait, and time major moves

### 16) Engineering Invariants (Implementation Rules)

#### 16.1 Authoritative server

The server is authoritative; client never resolves outcomes.

Clients only request actions; server validates and applies.

#### 16.2 Scheduled simulation ticks (hourly)

Simulation uses scheduled ticks and must be:

- idempotent
- never double-apply a tick
- always compute by elapsed time
- safe to retry
- safe across worker restarts

#### 16.3 Pure “Game Engine”

The “Game Engine” is pure logic (no DB calls), invoked by:

- API layer (player actions)
- Tick worker (scheduled progression)

#### 16.4 Layer separation (required)

- API layer: auth, validation, routing
- Engine layer: deterministic rules and computations
- Persistence layer: DB queries, transactions, locking
- Worker layer: orchestration for ticks, batching, retries

#### 16.5 Anti-cheat / integrity

- QR redemption must be secure (one-time token, server-signed)
- Installation must always check in-game wealth
- Legendary activation must never bypass cost or rules

## What to set up before writing code (GitHub + tools)

### 1) GitHub repo setup (do this first)

Create a new GitHub repo (private is fine) with:

Branch protection on main:

- require PRs
- require status checks (CI) to pass
- block force-push

Labels:

- bug
- feature
- design
- backend
- frontend
- infra
- balance
- security

Issues enabled (acts like backlog even if solo)

Add baseline files immediately:

- README.md (paste THIS document + short “Run locally”)
- LICENSE (MIT common)
- .gitignore (Node + env)
- CONTRIBUTING.md (branch naming + PR rules)
- SECURITY.md (no secrets in repo)

### 2) Project structure (recommended)

Use a monorepo so web/API/worker stay in sync:

- /apps/web → Next.js UI (map + realm screens)
- /apps/api → API server (Next API routes or separate service)
- /apps/worker → Tick worker (BullMQ processor)
- /packages/engine → Pure game logic (sacred)
- /packages/shared → Types/schemas/constants (Zod DTOs, enums)

Tooling:

- pnpm (fast, deterministic)
- Turborepo (optional but helpful)

### 3) Dev environment essentials

Install/configure:

- Docker Desktop (local Postgres + Redis)
- Postgres via Docker
- Redis via Docker
- Node 20+ and pnpm
- VS Code extensions:
  - ESLint
  - Prettier
  - Prisma
  - EditorConfig

Create .env.example with all required vars (no secrets).

### 4) CI/CD (set it up early)

GitHub Actions workflows:

ci.yml:

- install deps
- lint
- typecheck
- test (even minimal)
- build web + api + worker

Optional prisma.yml:

- validate schema
- generate client
- run migrations against temp Postgres service

### 5) Database & migrations discipline

Use Prisma migrations from day 1.

Never hot-edit prod DB.

Conventions:

- all schema changes go through migrations
- seed scripts for local dev (prisma/seed.ts)
- staging schema mirrors prod

### 6) Hosting choices (solid from day 1)

- Neon (Postgres) for staging/prod
- Fly.io (or Render) for:
  - API service
  - Worker service
- Upstash Redis for queues (or Fly Redis)

This avoids serverless cron pitfalls and provides reliable background processing.

### 7) Minimum observability (do not skip)

Before launch, add:

- structured logs (JSON)
- request IDs
- metrics: tick duration, realms processed, failures, retry counts
- error tracking (Sentry)

End of Document

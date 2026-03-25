# ShipProof — Project Instructions

## What is ShipProof
ShipProof (shipproof.io) is a Launch Content + Social Proof platform for indie hackers.
Two core features forming a flywheel: Ship (AI-generated launch copy) → Collect (gather community praise) → Display (embed widget / Wall page).
Full PRD: `docs/PRD.md`

## Tech Stack
- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui → Vercel
- **Backend**: Go + Chi router → Railway (Docker)
- **Database**: PostgreSQL (Railway) + sqlc (type-safe queries) + golang-migrate (migrations)
- **Auth**: Clerk (Google OAuth + Email/Password, webhook sync to our DB)
- **AI**: Anthropic Claude Sonnet API (launch content generation)
- **Storage**: Cloudflare R2 (proof screenshots)
- **Payments**: Stripe (3 plans: Free / Pro $12/mo / Business $29/mo)
- **Email**: Resend (future notifications)

## Project Structure
```
shipproof/
├── .claude/CLAUDE.md
├── docs/PRD.md
├── frontend/                 # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/  # Public pages (landing, pricing, launchready)
│   │   │   ├── (dashboard)/  # Authenticated dashboard pages
│   │   │   ├── (auth)/       # Clerk sign-in / sign-up
│   │   │   ├── w/[slug]/     # Public Wall pages (SSR)
│   │   │   ├── embed/[slug]/ # Widget embed (iframe content)
│   │   │   ├── terms/        # Terms of Service
│   │   │   └── privacy/      # Privacy Policy
│   │   ├── components/       # Shared components (Logo, UI, etc.)
│   │   └── lib/              # Utils, API client, types
│   ├── public/               # favicon.svg, og-image, etc.
│   ├── tailwind.config.ts
│   └── package.json
├── backend/                  # Go API server
│   ├── cmd/server/main.go    # Entry point
│   ├── internal/
│   │   ├── handler/          # HTTP handlers (health, product, launch, proof, widget, wall, stripe, webhook, public)
│   │   ├── middleware/        # Auth (Clerk JWT), logging (slog), CORS
│   │   ├── model/            # Domain types
│   │   ├── db/               # sqlc generated code + queries
│   │   └── service/          # Business logic (plan limits, AI generation, R2 upload)
│   ├── migrations/           # golang-migrate SQL files
│   ├── sqlc.yaml
│   ├── Dockerfile
│   └── go.mod
└── railway.toml
```

## Completed Phases
- **Phase 1**: Infrastructure — Next.js + Go + Clerk + DB schema + Product CRUD + Health endpoint
- **Phase 2**: Launch Content Generator — Claude API integration, Draft/Version workflow, launch_notes field, platform-specific generation
- **Phase 3**: Proof Collection + Widget + Wall — Proof CRUD, Tag system, R2 image upload, horizontal scrollable Widget, Masonry Wall page, public endpoints
- **Phase 4**: Stripe + Landing Page + Deploy — Stripe checkout/webhook/portal, plan limit enforcement, pricing page, landing page with flywheel animation, deploy prep
- **Phase 5**: UX Polish — Platform-level discard for drafts, Save Draft preview mode, Tag input enhancement (existing tags + manual input)

## Current Status: MVP Live
All core features implemented. Currently in launch phase (dogfooding ShipProof to launch ShipProof).

## Code Conventions

### Go Backend
- Router: Chi. Group routes by domain (`/api/products`, `/api/proofs`, `/api/walls`, `/api/stripe`).
- Database queries: sqlc. Write SQL in `backend/internal/db/queries/`, run `sqlc generate`.
- Migrations: golang-migrate. Files in `backend/migrations/` named `NNNNNN_description.up.sql` / `.down.sql`.
- Logging: `log/slog` with JSON handler. Every request logged via middleware (method, path, status, duration_ms, request_id, user_id). Sensitive data (API keys, tokens) NEVER logged.
- Error handling: Return structured JSON `{"error": "message"}` with appropriate HTTP status codes.
- Auth: Clerk JWT verification middleware. Extract user_id from Clerk token. Clerk webhook at `POST /api/webhooks/clerk` syncs user to our DB.
- Health endpoint: `GET /api/health` returns `{"status":"ok","version":"...","uptime":"..."}`.
- Plan limits: Checked in handlers via `service/plan.go`. Free: 1 product, 5 proofs, 3 generations/mo, 3 versions, Wall+Widget enabled, badge always shown. Pro: 1 product, unlimited proofs/generations/versions, badge always shown. Business: 10 products, unlimited everything, badge removable.
- Environment variables via `.env` (never committed). Use `os.Getenv()` with clear defaults.
- UUID for all primary keys. Use `github.com/google/uuid`.
- pgx/v5 for PostgreSQL driver.

### Next.js Frontend
- TypeScript strict mode.
- App Router: Server Components by default. Mark `"use client"` only for interactive components (forms, buttons, state).
- Dashboard pages are all `"use client"` (SPA behind auth).
- Landing page, Wall public pages, and LaunchReady use Server Components (SSR for SEO).
- Styling: Tailwind CSS + shadcn/ui components. Dark theme as default.
- API calls: fetch to `NEXT_PUBLIC_API_URL` with Clerk token attached via `useAuth().getToken()`.
- Clerk: `@clerk/nextjs` package. `<ClerkProvider>` in root layout. `<UserButton>` with custom menu items (Dashboard, Upgrade, Settings, Sign out).
- Logo component: `components/Logo.tsx` — `<LogoIcon>` and `<LogoFull>` (C3 Bold check design, Indigo bg + white speech bubble + bold checkmark).

### Design System (Dark Theme)
- Background: `#0F0F10` (base), `#1A1A1F` (surface/cards), `#242429` (elevated)
- Brand: `#6366F1` (Indigo primary), `#818CF8` (hover), gradient `#6366F1 → #8B5CF6`
- Text: `#F1F1F3` (primary), `#9CA3AF` (secondary), `#6B7280` (tertiary)
- Border: `#2A2A30` (default), `#3F3F46` (hover)
- Status: `#22C55E` (success), `#F59E0B` (warning), `#EF4444` (error)
- Font: Inter. Code: JetBrains Mono.
- Cards: `bg-[#1A1A1F] rounded-xl border border-[#2A2A30] p-6`
- Max width: `max-w-6xl` (1152px).

### Dashboard Layout
- Product page: Left sidebar nav (Content / Proofs / Embed Widget) + right content area (testimonial.to style)
- Top nav: Logo (links to /dashboard) + Avatar dropdown (Dashboard / Upgrade / Settings / Sign out)
- Product header: Product name + [Edit product] button

## Data Model Reference
See PRD Section 4 for complete schema:
- User, Product, LaunchDraft (with launch_notes), LaunchVersion (with launch_notes, version_label)
- Proof (with status, collection_method fields for V2 extensibility), ProofTag
- Wall, WallProof, WidgetConfig

## API Reference
See PRD Section 4 for complete endpoint list. Key groups:
- `/api/health` — Health check
- `/api/products/*` — Product CRUD + Launch Content + Proofs + Widget + Walls
- `/api/proofs/*` — Proof edit/delete/featured/tags
- `/api/walls/*` — Wall detail/edit/proofs
- `/api/public/*` — Public endpoints for Widget and Wall (no auth)
- `/api/stripe/*` — Checkout, portal, webhook
- `/api/webhooks/clerk` — Clerk user sync

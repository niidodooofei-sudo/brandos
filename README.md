# BrandOS

AI-powered brand asset generation platform. Upload your brand guidelines once. Generate every marketing asset in seconds.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Database | PostgreSQL + Prisma |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Canvas | node-canvas |
| Queue | BullMQ + Redis |
| Styling | Tailwind CSS v4 |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` from [clerk.com](https://clerk.com)
- `ANTHROPIC_API_KEY` from [console.anthropic.com](https://console.anthropic.com)
- `DATABASE_URL` — your PostgreSQL URL

### 3. Start infrastructure

```bash
npm run docker:up        # PostgreSQL + Redis via Docker
```

### 4. Set up database

```bash
npm run db:push          # push schema
npm run db:generate      # generate Prisma client
npm run db:seed          # seed demo data (optional)
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Sign in / Sign up
│   ├── (dashboard)/      # All authenticated pages
│   │   ├── dashboard/    # Home dashboard
│   │   ├── create/       # Asset creation (type picker + form)
│   │   ├── library/      # Asset library
│   │   ├── campaigns/    # Campaign management
│   │   ├── brand/        # Brand DNA setup
│   │   ├── analytics/    # Analytics dashboard
│   │   ├── admin/        # Blueprint builder + user mgmt
│   │   └── settings/     # Org settings
│   ├── api/              # Route handlers
│   │   ├── generate/     # Core generation endpoint
│   │   ├── ai/           # Copy suggestions
│   │   ├── brand-dna/    # Brand DNA CRUD
│   │   ├── brands/       # Brand management
│   │   ├── assets/       # Asset library API
│   │   ├── export/       # Export engine
│   │   └── webhooks/clerk/ # Clerk webhook (creates DB user)
│   └── onboarding/       # First-run flow
├── components/
│   ├── ui/               # Button, Input, Badge, ScoreRing, ImageUpload…
│   ├── layout/           # Sidebar, Topbar
│   ├── brand/            # BrandDNAForm, BrandUploadZone
│   └── create/           # CreateForm, VariationSelector, ExportModal
├── lib/
│   ├── db.ts             # Prisma singleton
│   ├── ai.ts             # Claude integration
│   ├── canvas-renderer.ts # Blueprint layout engine
│   ├── storage.ts        # node-canvas asset renderer
│   └── utils.ts          # Utilities
└── types/index.ts        # Shared types + OUTPUT_TYPES registry
```

## Generation Pipeline

```
POST /api/generate
  ├── Validate input (headline required)
  ├── Load Brand DNA for brand
  ├── canvas-renderer: selectBlueprints() → top 4 layouts scored
  ├── storage: generateAssetVariations() → render each via node-canvas
  ├── ai: scoreBrandCompliance() → Claude scores each variation
  └── Return { assetId, variations[] } to client
```

## Clerk Webhook

In Clerk dashboard → Webhooks → add endpoint:
```
https://your-domain/api/webhooks/clerk
```
Events: `user.created`, `user.updated`

This auto-creates User + Org + Brand in DB on signup.

## Output Types (18 total)

| Category | Formats |
|---|---|
| Social | Instagram Post, Story, Carousel, Reel Cover, LinkedIn, X Post, Facebook |
| Print | Flyer, Poster, Brochure, Roll-up Banner |
| Web | Hero Banner, Display Ad, Landing Page Block |
| Corporate | Proposal Cover, Presentation Slide, Report Cover, Event Material |

## Key npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema to DB |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run docker:up` | Start PostgreSQL + Redis |
| `npm run setup` | Full setup (docker + db) |

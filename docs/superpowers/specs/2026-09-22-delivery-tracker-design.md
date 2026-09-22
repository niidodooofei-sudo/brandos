# Delivery Tracker — Design Spec

Date: 2026-09-22
Author: Nii Ofei Dodoo (spec), Claude (design writeup)

## Overview & Goals

A new "Delivery Tracker" module inside the existing BrandOS dashboard
(brandos-gamma.vercel.app), separate from the AI asset-generation side
(Create / Library / Campaigns / Brand DNA). It rides on the same
Next.js app, same auth, same database, but is otherwise self-contained.

Purpose: log freelance/personal deliverables, mark them delivered with
proof attached (which automatically builds a searchable Asset Bank),
force a logged reason the moment something goes late, and get
automatic weekly/monthly reports with zero manual compilation.

Five things it must do well:
1. Fast capture — logging a new deliverable takes seconds.
2. Binary tracking — Not Started / In Progress / Delivered / Delayed.
   No story points, no sprints, no subtask trees.
3. Proof of delivery — marking delivered requires attaching file(s);
   those files automatically populate the Asset Bank.
4. Delay accountability — a missed due date can't stay open silently;
   a reason is required before the item can move on.
5. Automatic reporting — weekly and monthly reports land with zero
   manual compilation.

## Core Concepts

| Term | Meaning |
|---|---|
| Client / Entity | Who the work is for — a freelance client (`ClientType.FREELANCE`) or a personal project (`ClientType.PERSONAL`). Name + color. |
| Work Item | The atomic unit of tracked work. Title, client, category, due date, status. Flat — no subtasks, no dependencies. |
| Status | `NOT_STARTED → IN_PROGRESS → DELIVERED`, or `→ DELAYED`. Delayed blocks closing the item until a reason is on file. `CANCELLED` also exists for abandoned items. |
| Delivery Check | The act of marking an item Delivered — timestamp, who did it, and the required file(s) proving it. |
| Delay Reason | Mandatory categorized + free-text explanation, logged the moment a due date passes with the item still open, or whenever manually flagged Delayed. |
| Asset Bank | Not a separate upload feature — the automatic byproduct of every Delivery Check. Every file attached to a delivered item lands here, filterable by client/date/category/item. |
| Report | Auto-generated weekly (Mon–Sun) and monthly (calendar month) snapshot of what was delivered, what was delayed and why, and on-time rate. |

## Decisions Resolved During Brainstorming

The original spec (pasted by the user, itself written as a build plan
for "Google Antigravity") assumed eventual cPanel self-hosting. The
live app is actually deployed on Vercel with Postgres today. The
following decisions were made to reconcile the two before writing this
spec:

1. **Hosting target: build for Vercel now, stay portable to cPanel later.**
   - **Storage**: a `DeliveryStorageAdapter` interface
     (`save(file) → {url, path}`, `delete(path)`) with two
     implementations — `VercelBlobAdapter` (active now, via
     `@vercel/blob`, needs adding to `package.json`) and
     `LocalDiskAdapter` (for a future cPanel move, unused for now).
     Selected via `STORAGE_DRIVER` env var, defaulting to
     `vercel-blob`. Everything downstream (`DeliveryFile.fileUrl`)
     only ever sees a URL string.
   - **Report scheduling**: one secured endpoint,
     `POST /api/delivery/reports/generate?period=weekly|monthly`,
     gated by a bearer token compared against
     `env.DELIVERY_REPORTS_SECRET`. `vercel.json` gets two cron
     entries (Monday 00:05 and 1st-of-month 00:05, Africa/Accra)
     calling it. A future cPanel move just swaps the trigger
     (cPanel Cron + curl) for the same endpoint — no code change.
     No BullMQ/Redis involved, despite being in the stack already.
   - **Database**: stays PostgreSQL (already live). No MySQL hedging.

2. **Personal bucket**: `ClientType.PERSONAL` is included alongside
   `FREELANCE`, so unpaid side projects (ProdFlow, the Bible character
   app) can live in the same tracker as billable client work.

3. **Auto-delay timing**: immediate, no grace period. Because the
   quick-add UI only captures a date (no time picker), `dueDate` is
   normalized to `23:59:59` Africa/Accra on save, so "immediate" means
   the moment that deadline instant passes — not the start of the due
   calendar day.

4. **Report delivery**: both in-app (Reports page) and an email
   summary via nodemailer (already a dependency) to
   niidodooofei@gmail.com, with a link into the Reports page, on every
   auto-generation.

5. **Checklist depth**: adopted as originally specified — optional
   free-text sub-items on a work item (e.g. "Draft sent / Feedback
   received / Final approved"), a memory aid with no due dates or
   independent tracking. Explicitly not a subtask system. Storage:
   the original spec's schema omitted a field for this — added
   `checklist Json?` to `DeliveryItem`, holding an array of
   `{ text: string; done: boolean }` objects.

## Data Model (Prisma Schema Additions)

Six new models/enums, sharing only `Organization` and `User` with the
existing AI-generation side:

```prisma
enum DeliveryStatus {
  NOT_STARTED
  IN_PROGRESS
  DELIVERED
  DELAYED
  CANCELLED
}

enum DeliveryCategory {
  DESIGN
  WEB
  PHOTOGRAPHY
  VIDEO
  CONTENT
  BRANDING
  OTHER
}

enum ClientType {
  FREELANCE
  PERSONAL
}

enum DelayReasonCategory {
  CLIENT_FEEDBACK_PENDING
  WAITING_ON_ASSETS
  SCOPE_CHANGE
  OVERLOADED
  TECHNICAL_ISSUE
  PERSONAL
  OTHER
}

enum ReportPeriod {
  WEEKLY
  MONTHLY
  CUSTOM
}

model DeliveryClient {
  id        String     @id @default(cuid())
  orgId     String
  name      String
  type      ClientType @default(FREELANCE)
  color     String     @default("#8b5cf6")
  isActive  Boolean    @default(true)
  createdAt DateTime   @default(now())

  org   Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  items DeliveryItem[]

  @@map("delivery_clients")
}

model DeliveryItem {
  id           String           @id @default(cuid())
  orgId        String
  clientId     String
  createdById  String
  title        String
  description  String?
  category     DeliveryCategory @default(OTHER)
  status       DeliveryStatus   @default(NOT_STARTED)
  dueDate      DateTime
  deliveredAt  DateTime?
  checklist    Json?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  org       Organization   @relation(fields: [orgId], references: [id], onDelete: Cascade)
  client    DeliveryClient @relation(fields: [clientId], references: [id])
  createdBy User           @relation(fields: [createdById], references: [id])
  files     DeliveryFile[]
  delays    DelayLog[]

  @@index([orgId, status])
  @@index([dueDate])
  @@map("delivery_items")
}

model DeliveryFile {
  id             String   @id @default(cuid())
  deliveryItemId String
  fileName       String
  fileUrl        String
  fileType       String?
  thumbnailUrl   String?
  uploadedById   String
  uploadedAt     DateTime @default(now())

  item DeliveryItem @relation(fields: [deliveryItemId], references: [id], onDelete: Cascade)

  @@index([deliveryItemId])
  @@map("delivery_files")
}

model DelayLog {
  id             String              @id @default(cuid())
  deliveryItemId String
  reasonCategory DelayReasonCategory
  reason         String
  daysLate       Int
  loggedAt       DateTime            @default(now())
  resolvedAt     DateTime?

  item DeliveryItem @relation(fields: [deliveryItemId], references: [id], onDelete: Cascade)

  @@map("delay_logs")
}

model DeliveryReport {
  id          String       @id @default(cuid())
  orgId       String
  periodType  ReportPeriod
  periodStart DateTime
  periodEnd   DateTime
  generatedAt DateTime     @default(now())
  summary     Json

  org Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("delivery_reports")
}
```

`Organization` gains `deliveryClients`, `deliveryItems`,
`deliveryReports` reverse relations; `User` gains
`createdDeliveryItems`. Nothing existing is removed.

The Asset Bank is not its own table — it's `DeliveryFile` joined to
`DeliveryItem` and `DeliveryClient`. `DeliveryReport.summary` is a
snapshot at generation time so historic reports stay stable even if
items are logged retroactively into a past window.

## Screens & UI

New sidebar entry — **Delivery** — visually separated from the
AI-generation tools (e.g. under a "Workspace" divider). Four sub-views:

- **Board** (default): four columns (Not Started / In Progress /
  Delivered / Delayed). Cards show title, color-coded client badge,
  category icon, due date (red if overdue). Quick-add bar above the
  columns: title, client dropdown, category dropdown, due date, Enter
  to submit — under 10 seconds, description optional and added later.
  Clicking a card opens the detail drawer. Moving a card between
  columns just changes status directly — no workflow gating, except:
  moving into Delivered requires the file-upload flow, and Delayed
  requires the reason form.
- **Item detail drawer**: title, client, category, description, due
  date, status selector, optional free-text checklist, file upload
  zone, and — only visible/required when status is Delayed — the
  delay reason fields (category dropdown + free text).
- **Asset Bank**: grid of delivered files with thumbnails, filters for
  client/category/date range, search against parent item title. Each
  file links back to its work item.
- **Reports**: list of generated reports (weekly/monthly, newest
  first), each opening into delivered count, delayed count with
  reasons, on-time %, and linked file list for that window. "Generate
  report" button for an ad-hoc custom range (`periodType: CUSTOM`).

Visual style borrows BrandOS's existing dark sidebar and violet accent
(#8b5cf6 / #a78bfa).

## File Storage

BrandOS's existing upload component
(`src/components/ui/image-upload.tsx`) converts files to base64 data
URLs client-side — fine for AI-generation previews, not viable for a
growing proof-of-delivery archive (PDFs, video, DB bloat).

New `POST /api/delivery/files` upload route handles uploads
server-side through the `DeliveryStorageAdapter` described above
(Vercel Blob today), saving the resulting URL into `DeliveryFile`. The
rest of the app only ever deals with `fileUrl` — storage backend is an
implementation detail behind the adapter.

## Automated Weekly/Monthly Reports

- **Weekly**: every Monday, computed over the prior Mon 00:00–Sun
  23:59 (Africa/Accra).
- **Monthly**: on the 1st of the month, computed over the prior
  calendar month.
- **Computation**: query `DeliveryItem` for the window (by
  `deliveredAt` for completions, `dueDate` for what was owed), join
  `DelayLog` for reasons, join `DeliveryFile` for counts/links, compute
  on-time rate (delivered on/before due date ÷ total due).
- **Storage**: write to `DeliveryReport.summary` as a snapshot.
- **Scheduling**: `vercel.json` cron entries hit
  `POST /api/delivery/reports/generate?period=weekly|monthly`, secured
  by a bearer token against `env.DELIVERY_REPORTS_SECRET`. Portable to
  cPanel Cron + curl later with no endpoint changes.
- **Delivery**: nodemailer sends a short summary email to
  niidodooofei@gmail.com with a link into the Reports page, on every
  auto-generation.
- **Ad-hoc reports**: "Generate now" computes the same summary for a
  custom range, saved with `periodType: CUSTOM`, without disturbing
  the scheduled cadence.

## Integration with Existing BrandOS Codebase

- **Auth**: reuse `getAuthId()` (`src/lib/auth-helper.ts`) and the
  existing `Organization`/`OrgMember` model — scoped per-org exactly
  like Brands/Campaigns/Assets.
- **Database**: reuse the `db` Prisma singleton in `src/lib/db.ts`.
- **Routing**: new pages under `src/app/(dashboard)/delivery/`
  (`page.tsx` for Board, `asset-bank/page.tsx`, `reports/page.tsx`),
  following the `library/`/`campaigns/`/`analytics/` route-group
  convention.
- **API**: new routes under `src/app/api/delivery/` —
  `items/route.ts` (CRUD), `items/[id]/route.ts` (status/delay
  updates), `files/route.ts` (upload via `DeliveryStorageAdapter`),
  `reports/route.ts` (list + generate-now),
  `reports/generate/route.ts` (secured cron target). Mirrors
  `src/app/api/assets/route.ts`.
- **UI components**: new components under `src/components/delivery/`
  (`Board`, `ItemCard`, `ItemDrawer`, `DelayReasonForm`,
  `AssetBankGrid`, `ReportView`), reusing existing primitives from
  `src/components/ui/`.
- **Nav**: one addition to `navItems` in
  `src/components/layout/sidebar.tsx`.
- **Next.js 16 / Prisma 7 caveats already confirmed in this repo**:
  middleware lives in `proxy.ts` (named export `proxy`, not
  `middleware.ts`/default export); Prisma has no `url` in the schema
  datasource block — uses `prisma.config.ts` +
  `@prisma/adapter-pg` in the `PrismaClient` constructor. New delivery
  routes follow these same conventions, not Next 14/15 patterns.

## Build Order

Each step independently testable before moving to the next:

1. Schema: six new models/enums + reverse relations, `db:push` +
   `db:generate`.
2. File storage: `DeliveryStorageAdapter` + `VercelBlobAdapter`,
   `POST /api/delivery/files` — test with a throwaway upload.
3. Core API: `DeliveryClient` + `DeliveryItem` CRUD routes.
4. Board UI: sidebar entry, four-column board, quick-add bar, cards —
   wired to step 3.
5. Item detail + delivery flow: drawer, "Mark Delivered" upload
   requirement, wiring to step 2.
6. Delay flow: auto-flip-to-Delayed check (lightweight query on page
   load initially), required-reason form.
7. Asset Bank page: filtered grid over `DeliveryFile`.
8. Reports: computation logic as a testable function first, then the
   secured generate endpoint + `vercel.json` cron entries, then the
   Reports UI, then the nodemailer summary email.
9. Polish: empty states, mobile responsiveness, seed a handful of real
   `DeliveryClient` rows via `prisma/seed.ts` so the board isn't empty
   on first load.

## Out of Scope

- BullMQ/Redis-based scheduling (cron-hit-endpoint is sufficient at
  this volume).
- `LocalDiskAdapter` activation (built as a class for portability, not
  wired up or used until an actual cPanel migration happens).
- MySQL schema variant.
- Subtask due dates, dependencies between work items, or any
  Asana/Trello-style workflow logic.

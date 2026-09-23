# Delivery Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained Delivery Tracker module (clients, work items, delivery proof, delay accountability, weekly/monthly reports) to the existing BrandOS dashboard.

**Architecture:** New Prisma models sharing only `Organization`/`User` with the AI-generation side; new API routes under `src/app/api/delivery/`; new pages under `src/app/(dashboard)/delivery/`; new components under `src/components/delivery/`. File uploads go through a pluggable storage adapter (Vercel Blob today). Reports are computed by a pure-ish function and served by one secured endpoint that Vercel Cron (and later cPanel Cron) can hit.

**Tech Stack:** Next.js 16.2.9 (App Router, Route Handlers), Prisma 7 + `@prisma/adapter-pg` (PostgreSQL), Clerk v7, `@vercel/blob`, nodemailer, Tailwind v4 (CSS-variable design tokens already in `globals.css`), Vitest (new — introduced in this plan for pure-logic unit tests only; see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-09-22-delivery-tracker-design.md`

## Global Constraints

- Next.js 16 route handlers take `{ params }: { params: Promise<{ id: string }> }` — always `await params`. Confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` in this repo (do not use the Next 14/15 synchronous-params pattern).
- Prisma 7 in this repo has no `url` in the `datasource` block — the client is constructed with `@prisma/adapter-pg` in `src/lib/db.ts`. Always import the shared singleton `db` from `@/lib/db`; never `new PrismaClient()` outside scripts.
- `src/proxy.ts` (not `middleware.ts`) already returns 401 for any unauthenticated `/api/*` request. Route handlers still call `getAuthId()` themselves (matching `src/app/api/assets/route.ts` / `src/app/api/brands/route.ts`) to get the userId value for queries, not to re-implement the redirect.
- Africa/Accra has no DST and sits at UTC+0 year-round, so "Africa/Accra time" in this feature is implemented with plain UTC `Date` arithmetic — no timezone library is added.
- Vercel Cron's built-in auth convention is used as-is: an env var named exactly `CRON_SECRET`, sent by Vercel as `Authorization: Bearer <CRON_SECRET>`. Verified against Vercel's current docs (`vercel.com/docs/cron-jobs/manage-cron-jobs`, "Securing cron jobs" section) during planning. Vercel Cron always issues a `GET` request to the configured path — the scheduled-report endpoint is a `GET` handler for this reason.
- **No test framework exists in this repo today** (no jest/vitest config, no `*.test.*` files). This plan introduces Vitest, scoped narrowly to pure functions with no Prisma/Next/React dependency (date math, on-time-rate math, the local-disk storage adapter). API routes, React components, and anything touching Prisma or Clerk are verified manually against a running `next dev` server (documented per-task with exact `curl` commands and expected output, or a browser check) rather than inventing a Prisma/Clerk mocking harness this codebase has no precedent for. Every task still ends with a concrete, runnable verification step — "manual" does not mean "skipped."
- Follow existing UI conventions exactly: Tailwind utility classes plus inline `style={{ color: 'var(--fg)' }}`-style CSS variable references (see `src/components/ui/card.tsx`, `src/app/(dashboard)/campaigns/page.tsx`), violet accents (`--brand: #7c3aed`, `--brand-light: #a78bfa`), `rounded-xl`/`rounded-lg`, `Card`/`Button`/`Badge`/`Select`/`Input`/`Textarea` from `src/components/ui/`.
- **Board interaction is a status `<select>` per card, not drag-and-drop.** The spec never mandates drag-and-drop, no DnD library exists in this project, and the spec's own framing ("blunter" than Asana/Trello) supports the simpler control. Selecting `DELIVERED` or `DELAYED` opens the item drawer instead of committing directly, because both transitions have required side effects (a file, a reason).
- Design-spec deviation already reconciled: `DeliveryItem.checklist Json?` was added to the schema during brainstorming self-review (the original spec described a checklist UI with no backing field). This plan's schema task includes that field.

---

## Phase 1 — Foundations

### Task 1: Dependencies and environment variables

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `@vercel/blob` package available for Task 7; `vitest` available for Tasks 3–6; new env vars (`STORAGE_DRIVER`, `BLOB_READ_WRITE_TOKEN`, `DELIVERY_LOCAL_STORAGE_DIR`, `CRON_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `DELIVERY_REPORT_EMAIL_TO`) documented for later tasks to read via `process.env`.

- [ ] **Step 1: Install dependencies**

```bash
cd "/Users/derekdodoo/brand support/brandos"
npm install @vercel/blob
npm install -D vitest
```

- [ ] **Step 2: Add scripts to `package.json`**

Add to the `"scripts"` block (after `"lint"`):

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 3: Append new env var section to `.env.example`**

```bash
# ─── Delivery Tracker ─────────────────────────────────────────────────────────
# vercel-blob (default, active) or local-disk (future cPanel migration, unused for now)
STORAGE_DRIVER=vercel-blob
# Auto-populated by Vercel when Blob storage is attached to the project
BLOB_READ_WRITE_TOKEN=
# Only read when STORAGE_DRIVER=local-disk
DELIVERY_LOCAL_STORAGE_DIR=./storage/delivery
# Vercel's own cron-auth convention: Vercel sends Authorization: Bearer $CRON_SECRET automatically
CRON_SECRET=change-me-generate-with-openssl-rand-hex-32
# nodemailer SMTP transport for the weekly/monthly report email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="BrandOS Delivery <no-reply@brandos.io>"
DELIVERY_REPORT_EMAIL_TO=niidodooofei@gmail.com
```

- [ ] **Step 4: Verify install**

Run: `npm run build 2>&1 | tail -20`
Expected: build still succeeds (no new TS errors) — the new dependency and scripts don't touch any existing code path yet.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "delivery: add @vercel/blob and vitest, document new env vars"
```

---

### Task 2: Prisma schema additions

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `DeliveryStatus`, `DeliveryCategory`, `ClientType`, `DelayReasonCategory`, `ReportPeriod` enums; `DeliveryClient`, `DeliveryItem`, `DeliveryFile`, `DelayLog`, `DeliveryReport` models; `Organization.deliveryClients/deliveryItems/deliveryReports`, `User.createdDeliveryItems` reverse relations. All later tasks query these via `db.deliveryClient`, `db.deliveryItem`, `db.deliveryFile`, `db.delayLog`, `db.deliveryReport`.

- [ ] **Step 1: Append the new enums and models**

Add at the end of `prisma/schema.prisma` (after the `AnalyticsEvent` model):

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

  org   Organization   @relation(fields: [orgId], references: [id], onDelete: Cascade)
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

- [ ] **Step 2: Add reverse relations to `Organization` and `User`**

In the `Organization` model, add to the relations block (after `brands  Brand[]`):

```prisma
  deliveryClients DeliveryClient[]
  deliveryItems   DeliveryItem[]
  deliveryReports DeliveryReport[]
```

In the `User` model, add to the relations block (after `campaigns   Campaign[]`):

```prisma
  createdDeliveryItems DeliveryItem[]
```

- [ ] **Step 3: Push schema and regenerate client**

```bash
cd "/Users/derekdodoo/brand support/brandos"
npm run db:push
npm run db:generate
```

Expected: `db:push` reports the five new tables created (`delivery_clients`, `delivery_items`, `delivery_files`, `delay_logs`, `delivery_reports`), no errors.

- [ ] **Step 4: Verify the client exposes the new models**

```bash
npx tsx -e "
import { db } from './src/lib/db'
async function main() {
  const count = await db.deliveryClient.count()
  console.log('deliveryClient.count() ->', count)
}
main().then(() => process.exit(0))
"
```

Expected: prints `deliveryClient.count() -> 0` with no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "delivery: add Prisma schema for Delivery Tracker"
```

---

### Task 3: Vitest config and shared TypeScript types

**Files:**
- Create: `vitest.config.ts`
- Create: `src/types/delivery.ts`

**Interfaces:**
- Produces: `DeliveryStatus`, `DeliveryCategory`, `ClientType`, `DelayReasonCategory`, `ReportPeriod` string-union types; `ChecklistItem { text: string; done: boolean }`; `DeliveryClientDTO`, `DeliveryItemDTO`, `DeliveryFileDTO`, `DelayLogDTO` interfaces used by every API route and component from here on.

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Create `src/types/delivery.ts`**

```ts
export type DeliveryStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DELIVERED' | 'DELAYED' | 'CANCELLED'
export type DeliveryCategory = 'DESIGN' | 'WEB' | 'PHOTOGRAPHY' | 'VIDEO' | 'CONTENT' | 'BRANDING' | 'OTHER'
export type ClientType = 'FREELANCE' | 'PERSONAL'
export type DelayReasonCategory =
  | 'CLIENT_FEEDBACK_PENDING'
  | 'WAITING_ON_ASSETS'
  | 'SCOPE_CHANGE'
  | 'OVERLOADED'
  | 'TECHNICAL_ISSUE'
  | 'PERSONAL'
  | 'OTHER'
export type ReportPeriod = 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

export interface ChecklistItem {
  text: string
  done: boolean
}

export interface DeliveryClientDTO {
  id: string
  name: string
  type: ClientType
  color: string
  isActive: boolean
}

export interface DeliveryFileDTO {
  id: string
  fileName: string
  fileUrl: string
  fileType: string | null
  thumbnailUrl: string | null
  uploadedAt: string
}

export interface DelayLogDTO {
  id: string
  reasonCategory: DelayReasonCategory
  reason: string
  daysLate: number
  loggedAt: string
  resolvedAt: string | null
}

export interface DeliveryItemDTO {
  id: string
  title: string
  description: string | null
  category: DeliveryCategory
  status: DeliveryStatus
  dueDate: string
  deliveredAt: string | null
  checklist: ChecklistItem[] | null
  client: DeliveryClientDTO
  files: DeliveryFileDTO[]
  delays: DelayLogDTO[]
}

export const DELIVERY_CATEGORY_LABELS: Record<DeliveryCategory, string> = {
  DESIGN: 'Design',
  WEB: 'Web',
  PHOTOGRAPHY: 'Photography',
  VIDEO: 'Video',
  CONTENT: 'Content',
  BRANDING: 'Branding',
  OTHER: 'Other',
}

export const DELAY_REASON_LABELS: Record<DelayReasonCategory, string> = {
  CLIENT_FEEDBACK_PENDING: 'Waiting on client feedback',
  WAITING_ON_ASSETS: 'Waiting on assets',
  SCOPE_CHANGE: 'Scope change',
  OVERLOADED: 'Overloaded',
  TECHNICAL_ISSUE: 'Technical issue',
  PERSONAL: 'Personal',
  OTHER: 'Other',
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors referencing `src/types/delivery.ts`.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts src/types/delivery.ts
git commit -m "delivery: add vitest config and shared delivery types"
```

---

## Phase 2 — Pure logic (TDD)

### Task 4: Date and report-math calculations

**Files:**
- Create: `src/lib/delivery/calc.ts`
- Test: `src/lib/delivery/calc.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no imports beyond built-ins).
- Produces: `normalizeDueDateEndOfDay(input: string | Date): Date`, `isOverdue(dueDate: Date, now?: Date): boolean`, `daysLate(dueDate: Date, now?: Date): number`, `calculateOnTimeRate(onTimeCount: number, totalDueCount: number): number`, `getPriorWeekWindow(now?: Date): { start: Date; end: Date }`, `getPriorMonthWindow(now?: Date): { start: Date; end: Date }`. Used by Task 10 (item create), Task 11 (delay flip), Task 22 (report computation), Task 24 (scheduled generation).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/delivery/calc.test.ts
import { describe, it, expect } from 'vitest'
import {
  normalizeDueDateEndOfDay,
  isOverdue,
  daysLate,
  calculateOnTimeRate,
  getPriorWeekWindow,
  getPriorMonthWindow,
} from './calc'

describe('normalizeDueDateEndOfDay', () => {
  it('sets the time to 23:59:59.999 UTC on the given date', () => {
    const result = normalizeDueDateEndOfDay('2026-09-25')
    expect(result.toISOString()).toBe('2026-09-25T23:59:59.999Z')
  })

  it('keeps the same calendar date when given a Date with an earlier time', () => {
    const result = normalizeDueDateEndOfDay(new Date('2026-01-05T08:30:00.000Z'))
    expect(result.toISOString()).toBe('2026-01-05T23:59:59.999Z')
  })
})

describe('isOverdue', () => {
  it('is false before the deadline instant', () => {
    const due = new Date('2026-09-25T23:59:59.999Z')
    expect(isOverdue(due, new Date('2026-09-25T12:00:00.000Z'))).toBe(false)
  })

  it('is true the instant after the deadline', () => {
    const due = new Date('2026-09-25T23:59:59.999Z')
    expect(isOverdue(due, new Date('2026-09-26T00:00:00.000Z'))).toBe(true)
  })
})

describe('daysLate', () => {
  it('is 0 when not yet overdue', () => {
    const due = new Date('2026-09-25T23:59:59.999Z')
    expect(daysLate(due, new Date('2026-09-25T12:00:00.000Z'))).toBe(0)
  })

  it('rounds up partial days late', () => {
    const due = new Date('2026-09-25T23:59:59.999Z')
    expect(daysLate(due, new Date('2026-09-27T01:00:00.000Z'))).toBe(2)
  })
})

describe('calculateOnTimeRate', () => {
  it('returns 100 when nothing was due', () => {
    expect(calculateOnTimeRate(0, 0)).toBe(100)
  })

  it('rounds to one decimal place', () => {
    expect(calculateOnTimeRate(2, 3)).toBe(66.7)
  })

  it('handles a perfect record', () => {
    expect(calculateOnTimeRate(5, 5)).toBe(100)
  })
})

describe('getPriorWeekWindow', () => {
  it('returns the prior Mon 00:00 - Sun 23:59:59.999 when run on a Monday', () => {
    const { start, end } = getPriorWeekWindow(new Date('2026-09-28T06:00:00.000Z')) // a Monday
    expect(start.toISOString()).toBe('2026-09-21T00:00:00.000Z') // prior Monday
    expect(end.toISOString()).toBe('2026-09-27T23:59:59.999Z') // prior Sunday
  })
})

describe('getPriorMonthWindow', () => {
  it('returns the full prior calendar month when run on the 1st', () => {
    const { start, end } = getPriorMonthWindow(new Date('2026-10-01T06:00:00.000Z'))
    expect(start.toISOString()).toBe('2026-09-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-09-30T23:59:59.999Z')
  })

  it('rolls back across a year boundary', () => {
    const { start, end } = getPriorMonthWindow(new Date('2027-01-01T06:00:00.000Z'))
    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z')
    expect(end.toISOString()).toBe('2026-12-31T23:59:59.999Z')
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/lib/delivery/calc.test.ts`
Expected: FAIL — `Cannot find module './calc'`.

- [ ] **Step 3: Implement `src/lib/delivery/calc.ts`**

```ts
export function normalizeDueDateEndOfDay(input: string | Date): Date {
  const d = new Date(input)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999))
}

export function isOverdue(dueDate: Date, now: Date = new Date()): boolean {
  return now.getTime() > dueDate.getTime()
}

export function daysLate(dueDate: Date, now: Date = new Date()): number {
  const diffMs = now.getTime() - dueDate.getTime()
  return Math.max(0, Math.ceil(diffMs / 86_400_000))
}

export function calculateOnTimeRate(onTimeCount: number, totalDueCount: number): number {
  if (totalDueCount === 0) return 100
  return Math.round((onTimeCount / totalDueCount) * 1000) / 10
}

export function getPriorWeekWindow(now: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  end.setUTCDate(end.getUTCDate() - 1) // yesterday (Sunday, when run on a Monday)
  end.setUTCHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  start.setUTCHours(0, 0, 0, 0)
  return { start, end }
}

export function getPriorMonthWindow(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999))
  return { start, end }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/lib/delivery/calc.test.ts`
Expected: PASS, all 10 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/delivery/calc.ts src/lib/delivery/calc.test.ts
git commit -m "delivery: add date and on-time-rate calculations"
```

---

### Task 5: Storage adapter (Vercel Blob + local-disk)

**Files:**
- Create: `src/lib/delivery/storage.ts`
- Test: `src/lib/delivery/storage.test.ts`

**Interfaces:**
- Consumes: `process.env.STORAGE_DRIVER`, `process.env.DELIVERY_LOCAL_STORAGE_DIR`, `process.env.BLOB_READ_WRITE_TOKEN` (Task 1).
- Produces: `interface DeliveryStorageAdapter { save(fileName: string, data: Buffer, contentType: string): Promise<{ url: string; path: string }>; delete(path: string): Promise<void> }`, `class LocalDiskAdapter`, `class VercelBlobAdapter`, `getStorageAdapter(): DeliveryStorageAdapter`. Used by Task 12 (upload route).

- [ ] **Step 1: Write the failing tests (LocalDiskAdapter only — VercelBlobAdapter needs a network call and isn't unit-testable here)**

```ts
// src/lib/delivery/storage.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LocalDiskAdapter, getStorageAdapter } from './storage'

describe('LocalDiskAdapter', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  })

  it('writes the file to disk and returns a url pointing at it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'delivery-storage-'))
    dirs.push(dir)
    const adapter = new LocalDiskAdapter(dir)

    const result = await adapter.save('proof.pdf', Buffer.from('hello'), 'application/pdf')

    expect(result.path.endsWith('proof.pdf')).toBe(true)
    expect(existsSync(join(dir, result.path))).toBe(true)
    expect(readFileSync(join(dir, result.path), 'utf8')).toBe('hello')
    expect(result.url).toContain(result.path)
  })

  it('deletes a file it previously saved', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'delivery-storage-'))
    dirs.push(dir)
    const adapter = new LocalDiskAdapter(dir)
    const { path } = await adapter.save('to-delete.txt', Buffer.from('x'), 'text/plain')

    await adapter.delete(path)

    expect(existsSync(join(dir, path))).toBe(false)
  })
})

describe('getStorageAdapter', () => {
  it('returns a LocalDiskAdapter when STORAGE_DRIVER=local-disk', () => {
    const prev = process.env.STORAGE_DRIVER
    process.env.STORAGE_DRIVER = 'local-disk'
    try {
      expect(getStorageAdapter()).toBeInstanceOf(LocalDiskAdapter)
    } finally {
      process.env.STORAGE_DRIVER = prev
    }
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run src/lib/delivery/storage.test.ts`
Expected: FAIL — `Cannot find module './storage'`.

- [ ] **Step 3: Implement `src/lib/delivery/storage.ts`**

```ts
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

export interface DeliveryStorageAdapter {
  save(fileName: string, data: Buffer, contentType: string): Promise<{ url: string; path: string }>
  delete(path: string): Promise<void>
}

function safeFileName(fileName: string): string {
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : ''
  return `${randomUUID()}${ext}`
}

/**
 * Unused in production until a cPanel migration happens (see design spec's
 * "Decisions Resolved During Brainstorming" §1). Kept fully implemented and
 * tested now so switching STORAGE_DRIVER later is a config change, not new code.
 */
export class LocalDiskAdapter implements DeliveryStorageAdapter {
  constructor(private readonly rootDir: string) {}

  async save(fileName: string, data: Buffer, _contentType: string): Promise<{ url: string; path: string }> {
    const path = safeFileName(fileName)
    const fullPath = join(this.rootDir, path)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, data)
    return { url: `/uploads/delivery/${path}`, path }
  }

  async delete(path: string): Promise<void> {
    await unlink(join(this.rootDir, path)).catch(() => {})
  }
}

export class VercelBlobAdapter implements DeliveryStorageAdapter {
  async save(fileName: string, data: Buffer, contentType: string): Promise<{ url: string; path: string }> {
    const { put } = await import('@vercel/blob')
    const path = `delivery/${safeFileName(fileName)}`
    const blob = await put(path, data, { access: 'public', contentType })
    return { url: blob.url, path }
  }

  async delete(path: string): Promise<void> {
    const { del } = await import('@vercel/blob')
    await del(path)
  }
}

export function getStorageAdapter(): DeliveryStorageAdapter {
  const driver = process.env.STORAGE_DRIVER ?? 'vercel-blob'
  if (driver === 'local-disk') {
    return new LocalDiskAdapter(process.env.DELIVERY_LOCAL_STORAGE_DIR ?? './storage/delivery')
  }
  return new VercelBlobAdapter()
}
```

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run src/lib/delivery/storage.test.ts`
Expected: PASS, all 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add src/lib/delivery/storage.ts src/lib/delivery/storage.test.ts
git commit -m "delivery: add pluggable file storage adapter (Vercel Blob + local-disk)"
```

---

## Phase 3 — Backend: scope helper and CRUD routes

### Task 6: Org-scoping helper

**Files:**
- Create: `src/lib/delivery/scope.ts`

**Interfaces:**
- Consumes: `db` (`@/lib/db`), a Clerk `clerkId` string.
- Produces: `getOrgIdForClerkUser(clerkId: string): Promise<{ userId: string; orgId: string } | null>`. Used by every route in Tasks 7–13.

- [ ] **Step 1: Implement**

```ts
// src/lib/delivery/scope.ts
import { db } from '@/lib/db'

/**
 * Resolves the org a Delivery Tracker request should be scoped to: the
 * caller's earliest org membership, matching the pattern already used in
 * src/app/api/brands/route.ts. Returns null if the Clerk user has no
 * BrandOS user/org yet (they haven't been provisioned by visiting an
 * AI-generation page first).
 */
export async function getOrgIdForClerkUser(
  clerkId: string
): Promise<{ userId: string; orgId: string } | null> {
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const membership = await db.orgMember.findFirst({
    where: { userId: user.id },
    orderBy: { org: { createdAt: 'asc' } },
  })
  if (!membership) return null

  return { userId: user.id, orgId: membership.orgId }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/delivery/scope.ts
git commit -m "delivery: add org-scoping helper for API routes"
```

---

### Task 7: Delivery clients API

**Files:**
- Create: `src/app/api/delivery/clients/route.ts`

**Interfaces:**
- Consumes: `getAuthId` (`@/lib/auth-helper`), `getOrgIdForClerkUser` (Task 6), `db` (`@/lib/db`).
- Produces: `GET /api/delivery/clients` → `{ clients: DeliveryClientDTO[] }`; `POST /api/delivery/clients` (body `{ name: string; type?: ClientType; color?: string }`) → `{ client: DeliveryClientDTO }`. Consumed by Task 18 (quick-add bar) and Task 19 (board).

- [ ] **Step 1: Implement**

```ts
// src/app/api/delivery/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { db } from '@/lib/db'

export async function GET() {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ clients: [] })

  const clients = await db.deliveryClient.findMany({
    where: { orgId: scope.orgId, isActive: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ clients })
}

export async function POST(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  let body: { name?: string; type?: string; color?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const client = await db.deliveryClient.create({
    data: {
      orgId: scope.orgId,
      name,
      type: body.type === 'PERSONAL' ? 'PERSONAL' : 'FREELANCE',
      color: body.color ?? '#8b5cf6',
    },
  })
  return NextResponse.json({ client }, { status: 201 })
}
```

- [ ] **Step 2: Start the dev server and verify manually**

```bash
npm run dev &
sleep 3
curl -s -X POST http://localhost:3000/api/delivery/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Elior Braiding Studio"}' \
  -b "$CLERK_DEV_SESSION_COOKIE" # sign in via the browser first if this returns 401
curl -s http://localhost:3000/api/delivery/clients -b "$CLERK_DEV_SESSION_COOKIE"
```

Expected: POST returns `201` with `{"client":{"id":"...","name":"Elior Braiding Studio",...}}`; GET returns that client in `clients`. (If unauthenticated, both return `{"error":"Unauthorized"}` with 401 — confirms the auth check works; sign in through the browser at `localhost:3000` and re-run with real cookies to confirm the happy path.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/delivery/clients/route.ts
git commit -m "delivery: add DeliveryClient CRUD API"
```

---

### Task 8: Delivery items list/create API (with auto-delay flip)

**Files:**
- Create: `src/lib/delivery/auto-delay.ts`
- Create: `src/app/api/delivery/items/route.ts`

**Interfaces:**
- Consumes: `isOverdue` (Task 4), `getOrgIdForClerkUser` (Task 6), `db`.
- Produces: `flipOverdueItemsToDelayed(orgId: string): Promise<number>` (returns count flipped); `GET /api/delivery/items` → `{ items: DeliveryItemDTO[] }` (runs the flip first); `POST /api/delivery/items` (body `{ title, clientId, category?, dueDate, description? }`) → `{ item: DeliveryItemDTO }` with `dueDate` normalized via `normalizeDueDateEndOfDay`. Consumed by Task 19 (board).

- [ ] **Step 1: Implement the auto-delay check**

```ts
// src/lib/delivery/auto-delay.ts
import { db } from '@/lib/db'
import { isOverdue } from './calc'

/**
 * Runs on every board load (per design spec §Build Order step 6: "lightweight
 * query on page load, doesn't need BullMQ on day one"). Flips any open item
 * whose dueDate has passed to DELAYED. Does NOT create a DelayLog — the UI
 * requires the user to file a reason before the item can move again; a
 * DELAYED item with no DelayLog rows is exactly "reason pending".
 */
export async function flipOverdueItemsToDelayed(orgId: string): Promise<number> {
  const now = new Date()
  const candidates = await db.deliveryItem.findMany({
    where: {
      orgId,
      status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
    },
    select: { id: true, dueDate: true },
  })

  const overdueIds = candidates.filter((c) => isOverdue(c.dueDate, now)).map((c) => c.id)
  if (overdueIds.length === 0) return 0

  await db.deliveryItem.updateMany({
    where: { id: { in: overdueIds } },
    data: { status: 'DELAYED' },
  })
  return overdueIds.length
}
```

- [ ] **Step 2: Implement the items route**

```ts
// src/app/api/delivery/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { flipOverdueItemsToDelayed } from '@/lib/delivery/auto-delay'
import { normalizeDueDateEndOfDay } from '@/lib/delivery/calc'
import { db } from '@/lib/db'
import type { DeliveryCategory } from '@/types/delivery'

const ITEM_INCLUDE = {
  client: true,
  files: { orderBy: { uploadedAt: 'desc' as const } },
  delays: { orderBy: { loggedAt: 'desc' as const } },
}

export async function GET() {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ items: [] })

  await flipOverdueItemsToDelayed(scope.orgId)

  const items = await db.deliveryItem.findMany({
    where: { orgId: scope.orgId },
    include: ITEM_INCLUDE,
    orderBy: { dueDate: 'asc' },
  })
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  let body: { title?: string; clientId?: string; category?: DeliveryCategory; dueDate?: string; description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = (body.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!body.clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
  if (!body.dueDate) return NextResponse.json({ error: 'dueDate is required' }, { status: 400 })

  const client = await db.deliveryClient.findFirst({ where: { id: body.clientId, orgId: scope.orgId } })
  if (!client) return NextResponse.json({ error: 'Unknown client' }, { status: 400 })

  const item = await db.deliveryItem.create({
    data: {
      orgId: scope.orgId,
      clientId: body.clientId,
      createdById: scope.userId,
      title,
      description: body.description?.trim() || null,
      category: body.category ?? 'OTHER',
      dueDate: normalizeDueDateEndOfDay(body.dueDate),
    },
    include: ITEM_INCLUDE,
  })
  return NextResponse.json({ item }, { status: 201 })
}
```

- [ ] **Step 3: Verify manually**

```bash
CLIENT_ID=$(curl -s http://localhost:3000/api/delivery/clients -b "$CLERK_DEV_SESSION_COOKIE" | python3 -c "import json,sys; print(json.load(sys.stdin)['clients'][0]['id'])")
curl -s -X POST http://localhost:3000/api/delivery/items \
  -H "Content-Type: application/json" \
  -b "$CLERK_DEV_SESSION_COOKIE" \
  -d "{\"title\":\"Booking bug fix\",\"clientId\":\"$CLIENT_ID\",\"dueDate\":\"2026-09-20\"}"
curl -s http://localhost:3000/api/delivery/items -b "$CLERK_DEV_SESSION_COOKIE"
```

Expected: POST returns `201` with the item, `dueDate` ending in `T23:59:59.999Z`. Since `2026-09-20` is in the past relative to today (2026-09-22), the follow-up GET must show `"status":"DELAYED"` for that item, confirming the auto-flip ran on the GET.

- [ ] **Step 4: Commit**

```bash
git add src/lib/delivery/auto-delay.ts src/app/api/delivery/items/route.ts
git commit -m "delivery: add DeliveryItem list/create API with auto-delay flip"
```

---

### Task 9: Delivery item status/mark-delivered API

**Files:**
- Create: `src/app/api/delivery/items/[id]/route.ts`

**Interfaces:**
- Consumes: `getOrgIdForClerkUser` (Task 6), `db`.
- Produces: `PATCH /api/delivery/items/[id]` (body `{ status?, description?, checklist? }`) → `{ item: DeliveryItemDTO }`. Rejects `status: 'DELIVERED'` with 400 if the item has zero `DeliveryFile` rows. Setting status to `'DELIVERED'` sets `deliveredAt: new Date()`; setting away from `'DELIVERED'` clears it. Consumed by Task 20 (item drawer) and Task 19 (board's status select for non-gated transitions).

- [ ] **Step 1: Implement**

```ts
// src/app/api/delivery/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { db } from '@/lib/db'
import type { ChecklistItem, DeliveryStatus } from '@/types/delivery'
import type { Prisma } from '@prisma/client'

const ITEM_INCLUDE = {
  client: true,
  files: { orderBy: { uploadedAt: 'desc' as const } },
  delays: { orderBy: { loggedAt: 'desc' as const } },
}

const VALID_STATUSES: DeliveryStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'DELIVERED', 'DELAYED', 'CANCELLED']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const existing = await db.deliveryItem.findFirst({
    where: { id, orgId: scope.orgId },
    include: { files: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: { status?: string; description?: string; checklist?: ChecklistItem[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data: {
    status?: DeliveryStatus
    deliveredAt?: Date | null
    description?: string | null
    checklist?: Prisma.InputJsonValue
  } = {}

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as DeliveryStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    if (body.status === 'DELIVERED' && existing.files.length === 0) {
      return NextResponse.json(
        { error: 'Attach at least one file before marking this item Delivered' },
        { status: 400 }
      )
    }
    data.status = body.status as DeliveryStatus
    data.deliveredAt = body.status === 'DELIVERED' ? new Date() : null
  }

  if (body.description !== undefined) data.description = body.description.trim() || null
  if (body.checklist !== undefined) data.checklist = body.checklist as unknown as Prisma.InputJsonValue

  const item = await db.deliveryItem.update({
    where: { id },
    data,
    include: ITEM_INCLUDE,
  })
  return NextResponse.json({ item })
}
```

- [ ] **Step 2: Verify manually**

```bash
ITEM_ID=$(curl -s http://localhost:3000/api/delivery/items -b "$CLERK_DEV_SESSION_COOKIE" | python3 -c "import json,sys; print(json.load(sys.stdin)['items'][0]['id'])")
curl -s -X PATCH http://localhost:3000/api/delivery/items/$ITEM_ID \
  -H "Content-Type: application/json" -b "$CLERK_DEV_SESSION_COOKIE" \
  -d '{"status":"DELIVERED"}'
```

Expected: `400` with `{"error":"Attach at least one file before marking this item Delivered"}` (no files yet — this is the correct behavior; re-run after Task 12's upload route attaches a file and confirm it then returns `200` with `"status":"DELIVERED"` and a `deliveredAt` timestamp).

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/delivery/items/[id]/route.ts"
git commit -m "delivery: add item status update API with mark-delivered file requirement"
```

---

### Task 10: Delay reason API

**Files:**
- Create: `src/app/api/delivery/items/[id]/delay/route.ts`

**Interfaces:**
- Consumes: `daysLate` (Task 4), `getOrgIdForClerkUser` (Task 6), `db`.
- Produces: `POST /api/delivery/items/[id]/delay` (body `{ reasonCategory: DelayReasonCategory; reason: string }`) → `{ item: DeliveryItemDTO }`. Creates a `DelayLog` row, sets item status to `DELAYED` if not already. Consumed by Task 20 (item drawer's delay form).

- [ ] **Step 1: Implement**

```ts
// src/app/api/delivery/items/[id]/delay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { daysLate } from '@/lib/delivery/calc'
import { db } from '@/lib/db'
import type { DelayReasonCategory } from '@/types/delivery'

const ITEM_INCLUDE = {
  client: true,
  files: { orderBy: { uploadedAt: 'desc' as const } },
  delays: { orderBy: { loggedAt: 'desc' as const } },
}

const VALID_REASONS: DelayReasonCategory[] = [
  'CLIENT_FEEDBACK_PENDING',
  'WAITING_ON_ASSETS',
  'SCOPE_CHANGE',
  'OVERLOADED',
  'TECHNICAL_ISSUE',
  'PERSONAL',
  'OTHER',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const existing = await db.deliveryItem.findFirst({ where: { id, orgId: scope.orgId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: { reasonCategory?: string; reason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const reason = (body.reason ?? '').trim()
  if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 })
  if (!body.reasonCategory || !VALID_REASONS.includes(body.reasonCategory as DelayReasonCategory)) {
    return NextResponse.json({ error: 'Invalid reasonCategory' }, { status: 400 })
  }

  await db.delayLog.create({
    data: {
      deliveryItemId: id,
      reasonCategory: body.reasonCategory as DelayReasonCategory,
      reason,
      daysLate: daysLate(existing.dueDate),
    },
  })

  const item = await db.deliveryItem.update({
    where: { id },
    data: { status: 'DELAYED' },
    include: ITEM_INCLUDE,
  })
  return NextResponse.json({ item })
}
```

- [ ] **Step 2: Verify manually**

```bash
curl -s -X POST http://localhost:3000/api/delivery/items/$ITEM_ID/delay \
  -H "Content-Type: application/json" -b "$CLERK_DEV_SESSION_COOKIE" \
  -d '{"reasonCategory":"WAITING_ON_ASSETS","reason":"Client hasn'"'"'t sent the logo files yet"}'
```

Expected: `200`, `item.status` is `"DELAYED"`, `item.delays` contains one entry with `reasonCategory: "WAITING_ON_ASSETS"` and a positive `daysLate`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/delivery/items/[id]/delay/route.ts"
git commit -m "delivery: add delay reason API"
```

---

### Task 11: File upload API

**Files:**
- Create: `src/app/api/delivery/files/route.ts`

**Interfaces:**
- Consumes: `getStorageAdapter` (Task 5), `getOrgIdForClerkUser` (Task 6), `db`.
- Produces: `POST /api/delivery/files` (multipart form-data: `file`, `deliveryItemId`) → `{ file: DeliveryFileDTO }`. Consumed by Task 20 (upload zone in the item drawer).

- [ ] **Step 1: Implement**

```ts
// src/app/api/delivery/files/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { getStorageAdapter } from '@/lib/delivery/storage'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file')
  const deliveryItemId = formData.get('deliveryItemId')

  if (!(file instanceof File)) return NextResponse.json({ error: 'file is required' }, { status: 400 })
  if (typeof deliveryItemId !== 'string' || !deliveryItemId) {
    return NextResponse.json({ error: 'deliveryItemId is required' }, { status: 400 })
  }

  const item = await db.deliveryItem.findFirst({ where: { id: deliveryItemId, orgId: scope.orgId } })
  if (!item) return NextResponse.json({ error: 'Unknown deliveryItemId' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const adapter = getStorageAdapter()
  const { url } = await adapter.save(file.name, buffer, file.type || 'application/octet-stream')

  const isImage = (file.type || '').startsWith('image/')
  const record = await db.deliveryFile.create({
    data: {
      deliveryItemId,
      fileName: file.name,
      fileUrl: url,
      fileType: file.type || null,
      thumbnailUrl: isImage ? url : null,
      uploadedById: scope.userId,
    },
  })
  return NextResponse.json({ file: record }, { status: 201 })
}
```

- [ ] **Step 2: Verify manually**

```bash
echo "test proof" > /tmp/proof.txt
curl -s -X POST http://localhost:3000/api/delivery/files \
  -b "$CLERK_DEV_SESSION_COOKIE" \
  -F "deliveryItemId=$ITEM_ID" \
  -F "file=@/tmp/proof.txt"
```

Expected: `201` with a `file` object whose `fileUrl` is a real Vercel Blob URL (`https://*.public.blob.vercel-storage.com/...`) — requires `BLOB_READ_WRITE_TOKEN` to be set in `.env` (from a Blob store attached in the Vercel dashboard) for this to succeed against the real adapter; if it's not set yet, note that as a deployment prerequisite rather than a code defect. Then re-run Task 9's `PATCH .../DELIVERED` call and confirm it now returns `200`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/delivery/files/route.ts
git commit -m "delivery: add file upload API wired to storage adapter"
```

---

### Task 12: Asset Bank list API

**Files:**
- Create: `src/app/api/delivery/asset-bank/route.ts`

**Interfaces:**
- Consumes: `getOrgIdForClerkUser` (Task 6), `db`.
- Produces: `GET /api/delivery/asset-bank?clientId=&category=&from=&to=&q=` → `{ files: (DeliveryFileDTO & { item: { id: string; title: string; category: DeliveryCategory }; client: DeliveryClientDTO })[] }`. Consumed by Task 21 (Asset Bank page).

- [ ] **Step 1: Implement**

```ts
// src/app/api/delivery/asset-bank/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { db } from '@/lib/db'
import type { Prisma, DeliveryCategory as PrismaDeliveryCategory } from '@prisma/client'

export async function GET(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ files: [] })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const category = searchParams.get('category')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const q = searchParams.get('q')

  const itemWhere: Prisma.DeliveryItemWhereInput = { orgId: scope.orgId }
  if (clientId) itemWhere.clientId = clientId
  if (category) itemWhere.category = category as PrismaDeliveryCategory
  if (q) itemWhere.title = { contains: q, mode: 'insensitive' }

  const uploadedAt: Prisma.DateTimeFilter = {}
  if (from) uploadedAt.gte = new Date(from)
  if (to) uploadedAt.lte = new Date(to)

  const files = await db.deliveryFile.findMany({
    where: {
      item: itemWhere,
      ...(from || to ? { uploadedAt } : {}),
    },
    include: {
      item: { select: { id: true, title: true, category: true, client: true } },
    },
    orderBy: { uploadedAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ files })
}
```

- [ ] **Step 2: Verify manually**

```bash
curl -s http://localhost:3000/api/delivery/asset-bank -b "$CLERK_DEV_SESSION_COOKIE"
curl -s "http://localhost:3000/api/delivery/asset-bank?q=booking" -b "$CLERK_DEV_SESSION_COOKIE"
```

Expected: first call returns the file uploaded in Task 11 with `item.title` and `item.client` populated; second call filters to only items whose title contains "booking" (case-insensitive).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/delivery/asset-bank/route.ts
git commit -m "delivery: add Asset Bank filtered list API"
```

---

## Phase 4 — Sidebar and Board UI

### Task 13: Sidebar navigation entry

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: a "Delivery" link visible in the sidebar's existing "Workspace" section (the section already used for Admin/Settings/All Brands — already visually separated from the AI-generation `navItems` per the design spec, so no new divider is introduced).

- [ ] **Step 1: Add the icon import and the nav entry**

In `src/components/layout/sidebar.tsx`, add `PackageCheck` to the `lucide-react` import list (line 8–23):

```ts
  Layers,
  PackageCheck,
} from 'lucide-react'
```

Change the `bottomItems` array (line 35–38) to:

```ts
const bottomItems = [
  { href: '/delivery', label: 'Delivery', icon: PackageCheck },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
]
```

- [ ] **Step 2: Verify in the browser**

Run `npm run dev`, open `http://localhost:3000/dashboard`, confirm "Delivery" appears in the sidebar's Workspace section above Admin/Settings, and clicking it navigates to `/delivery` (a 404 is expected until Task 17 adds the page — confirm the link itself renders and is clickable).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "delivery: add Delivery sidebar nav entry"
```

---

### Task 14: Sheet (slide-over drawer) UI primitive

**Files:**
- Create: `src/components/ui/sheet.tsx`

**Interfaces:**
- Consumes: `@radix-ui/react-dialog` (already a dependency), `cn` (`@/lib/utils`).
- Produces: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetClose` — a right-side slide-over panel. Consumed by Task 20 (item detail drawer). This fills a gap: the codebase depends on `@radix-ui/react-dialog` but has no `dialog.tsx`/`sheet.tsx` wrapper yet.

- [ ] **Step 1: Implement**

```tsx
// src/components/ui/sheet.tsx
'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = Dialog.Root
const SheetClose = Dialog.Close

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className="fixed inset-0 z-40 animate-fade-up"
        style={{ background: 'rgba(10, 6, 30, 0.35)' }}
      />
      <Dialog.Content
        className={cn(
          'fixed right-0 top-0 z-50 h-screen w-full max-w-[480px] overflow-y-auto bg-white p-6',
          className
        )}
        style={{ boxShadow: 'var(--shadow-xl)' }}
        {...props}
      >
        <Dialog.Close
          className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-muted)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" style={{ color: 'var(--fg-muted)' }} />
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 pr-8', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      className={cn('text-lg font-semibold tracking-tight', className)}
      style={{ color: 'var(--fg)' }}
      {...props}
    />
  )
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose }
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/sheet.tsx
git commit -m "delivery: add Sheet slide-over UI primitive"
```

---

### Task 15: Item card component

**Files:**
- Create: `src/components/delivery/item-card.tsx`

**Interfaces:**
- Consumes: `DeliveryItemDTO`, `DELIVERY_CATEGORY_LABELS` (`@/types/delivery`), `Badge`, `Select` (`@/components/ui`), `formatDate` (`@/lib/utils`).
- Produces: `<ItemCard item={DeliveryItemDTO} onOpen={() => void} onStatusChange={(status: DeliveryStatus) => void} />`. Consumed by Task 17 (board).

- [ ] **Step 1: Implement**

```tsx
// src/components/delivery/item-card.tsx
'use client'

import { formatDate, cn } from '@/lib/utils'
import { DELIVERY_CATEGORY_LABELS, type DeliveryItemDTO, type DeliveryStatus } from '@/types/delivery'

const MOVABLE_STATUSES: { value: DeliveryStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

interface ItemCardProps {
  item: DeliveryItemDTO
  onOpen: () => void
  onStatusChange: (status: DeliveryStatus) => void
}

export function ItemCard({ item, onOpen, onStatusChange }: ItemCardProps) {
  const isOverdue = item.status !== 'DELIVERED' && item.status !== 'CANCELLED' && new Date(item.dueDate) < new Date()

  return (
    <div
      className="rounded-lg bg-white p-3.5 cursor-pointer lift-card"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-snug" style={{ color: 'var(--fg)' }}>
          {item.title}
        </p>
        <span
          className="h-2 w-2 shrink-0 rounded-full mt-1"
          style={{ background: item.client.color }}
          title={item.client.name}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: 'var(--fg-muted)' }}>
        <span>{DELIVERY_CATEGORY_LABELS[item.category]}</span>
        <span className={cn(isOverdue && 'font-semibold')} style={isOverdue ? { color: 'var(--rose)' } : undefined}>
          {formatDate(item.dueDate)}
        </span>
      </div>

      {item.status === 'DELAYED' && item.delays.length === 0 && (
        <p className="mt-2 text-[11px] font-medium" style={{ color: 'var(--rose)' }}>
          Reason required
        </p>
      )}

      <select
        className="mt-3 w-full rounded-md border px-2 py-1 text-[11px]"
        style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
        value={item.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(e.target.value as DeliveryStatus)}
      >
        {MOVABLE_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/delivery/item-card.tsx
git commit -m "delivery: add ItemCard component"
```

---

### Task 16: Quick-add bar component

**Files:**
- Create: `src/components/delivery/quick-add-bar.tsx`

**Interfaces:**
- Consumes: `DeliveryClientDTO`, `DELIVERY_CATEGORY_LABELS` (`@/types/delivery`), `Input`, `Select`, `Button` (`@/components/ui`).
- Produces: `<QuickAddBar clients={DeliveryClientDTO[]} onSubmit={(input: { title: string; clientId: string; category: DeliveryCategory; dueDate: string }) => Promise<void>} />`. Consumed by Task 17 (board).

- [ ] **Step 1: Implement**

```tsx
// src/components/delivery/quick-add-bar.tsx
'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DELIVERY_CATEGORY_LABELS, type DeliveryCategory, type DeliveryClientDTO } from '@/types/delivery'

interface QuickAddBarProps {
  clients: DeliveryClientDTO[]
  onSubmit: (input: { title: string; clientId: string; category: DeliveryCategory; dueDate: string }) => Promise<void>
}

export function QuickAddBar({ clients, onSubmit }: QuickAddBarProps) {
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [category, setCategory] = useState<DeliveryCategory>('OTHER')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = title.trim().length > 0 && clientId && dueDate && !submitting

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), clientId, category, dueDate })
      setTitle('')
      setDueDate('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 mb-5"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <Input
        className="flex-1 min-w-[200px]"
        placeholder="What do you owe someone?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
      />
      <Select
        className="w-auto"
        options={clients.map((c) => ({ value: c.id, label: c.name }))}
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <Select
        className="w-auto"
        options={Object.entries(DELIVERY_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        value={category}
        onChange={(e) => setCategory(e.target.value as DeliveryCategory)}
      />
      <input
        type="date"
        className="rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border)' }}
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <Button variant="brand" size="sm" className="gap-1.5" disabled={!canSubmit} onClick={submit}>
        <Plus className="h-4 w-4" /> Add
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/delivery/quick-add-bar.tsx
git commit -m "delivery: add QuickAddBar component"
```

---

### Task 17: Board component and page

**Files:**
- Create: `src/components/delivery/board.tsx`
- Create: `src/app/(dashboard)/delivery/page.tsx`

**Interfaces:**
- Consumes: `ItemCard` (Task 15), `QuickAddBar` (Task 16), `DeliveryItemDTO`, `DeliveryClientDTO` (`@/types/delivery`).
- Produces: `<Board />` — fetches `/api/delivery/items` and `/api/delivery/clients`, renders four columns, wires quick-add (`POST /api/delivery/items`) and status changes (`PATCH /api/delivery/items/[id]`). Selecting `DELIVERED`/`DELAYED` from a card is deferred to Task 20's drawer (opens it instead of PATCHing directly, per Global Constraints). `src/app/(dashboard)/delivery/page.tsx` renders `<Board />` as the default `/delivery` view.

- [ ] **Step 1: Implement the board**

```tsx
// src/components/delivery/board.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { ItemCard } from './item-card'
import { QuickAddBar } from './quick-add-bar'
import { ItemDrawer } from './item-drawer'
import type { DeliveryCategory, DeliveryClientDTO, DeliveryItemDTO, DeliveryStatus } from '@/types/delivery'

const COLUMNS: { status: DeliveryStatus; label: string }[] = [
  { status: 'NOT_STARTED', label: 'Not Started' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'DELIVERED', label: 'Delivered' },
  { status: 'DELAYED', label: 'Delayed' },
]

export function Board() {
  const [items, setItems] = useState<DeliveryItemDTO[]>([])
  const [clients, setClients] = useState<DeliveryClientDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [itemsRes, clientsRes] = await Promise.all([
      fetch('/api/delivery/items').then((r) => r.json()),
      fetch('/api/delivery/clients').then((r) => r.json()),
    ])
    setItems(itemsRes.items ?? [])
    setClients(clientsRes.clients ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createItem = async (input: { title: string; clientId: string; category: DeliveryCategory; dueDate: string }) => {
    await fetch('/api/delivery/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    await load()
  }

  const changeStatus = async (id: string, status: DeliveryStatus) => {
    if (status === 'DELIVERED' || status === 'DELAYED') {
      setOpenItemId(id)
      return
    }
    await fetch(`/api/delivery/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  if (loading) return null

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-muted)' }}>
          <PackageCheck className="h-8 w-8" style={{ color: 'var(--fg-subtle)' }} />
        </div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--fg)' }}>No clients yet</p>
        <p className="text-sm max-w-sm" style={{ color: 'var(--fg-muted)' }}>
          Add a client via the API or seed script before logging your first deliverable.
        </p>
      </div>
    )
  }

  return (
    <>
      <QuickAddBar clients={clients} onSubmit={createItem} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnItems = items.filter((i) => i.status === col.status)
          return (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
                  {col.label}
                </p>
                <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>{columnItems.length}</span>
              </div>
              <div className="space-y-2.5">
                {columnItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onOpen={() => setOpenItemId(item.id)}
                    onStatusChange={(status) => changeStatus(item.id, status)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {openItemId && (
        <ItemDrawer
          itemId={openItemId}
          onClose={() => setOpenItemId(null)}
          onChanged={load}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Implement the page**

```tsx
// src/app/(dashboard)/delivery/page.tsx
import { Board } from '@/components/delivery/board'

export default function DeliveryPage() {
  return (
    <div className="max-w-[1400px] animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Delivery</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
          Log what you owe, prove what you delivered, explain what's late.
        </p>
      </div>
      <Board />
    </div>
  )
}
```

Note: `Board` imports `ItemDrawer` from `./item-drawer`, which does not exist until Task 18. This is intentional — Task 18 is the very next task and the two are one feature; `npx tsc --noEmit` will show one "Cannot find module" error until then, which is expected and resolved in Step 3 of Task 18, not a regression to fix here.

- [ ] **Step 3: Commit**

```bash
git add src/components/delivery/board.tsx "src/app/(dashboard)/delivery/page.tsx"
git commit -m "delivery: add Board component and /delivery page"
```

---

## Phase 5 — Item detail drawer and delivery flow

### Task 18: Item detail drawer (checklist, upload, delay form)

**Files:**
- Create: `src/components/delivery/item-drawer.tsx`

**Interfaces:**
- Consumes: `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle` (Task 14), `DeliveryItemDTO`, `ChecklistItem`, `DELAY_REASON_LABELS` (`@/types/delivery`), `Textarea`, `Select`, `Button`, `Badge` (`@/components/ui`).
- Produces: `<ItemDrawer itemId={string} onClose={() => void} onChanged={() => void} />` — full item detail: description, checklist, file upload (calling `POST /api/delivery/files` then `PATCH .../DELIVERED`), and — only when `status === 'DELAYED'` — the delay reason form (calling `POST .../delay`). Consumed by Task 17 (`Board`), closing the loop opened there.

- [ ] **Step 1: Implement**

```tsx
// src/components/delivery/item-drawer.tsx
'use client'

import { useEffect, useState } from 'react'
import { Upload, Check, Plus, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DELAY_REASON_LABELS,
  DELIVERY_CATEGORY_LABELS,
  type ChecklistItem,
  type DelayReasonCategory,
  type DeliveryItemDTO,
} from '@/types/delivery'

interface ItemDrawerProps {
  itemId: string
  onClose: () => void
  onChanged: () => void
}

export function ItemDrawer({ itemId, onClose, onChanged }: ItemDrawerProps) {
  const [item, setItem] = useState<DeliveryItemDTO | null>(null)
  const [newChecklistText, setNewChecklistText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [reasonCategory, setReasonCategory] = useState<DelayReasonCategory>('OTHER')
  const [reasonText, setReasonText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/delivery/items').then((r) => r.json())
    const found = (res.items as DeliveryItemDTO[]).find((i) => i.id === itemId)
    setItem(found ?? null)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  if (!item) return null

  const needsReason = item.status === 'DELAYED' && item.delays.length === 0

  const toggleChecklistItem = async (index: number) => {
    const checklist = [...(item.checklist ?? [])]
    checklist[index] = { ...checklist[index], done: !checklist[index].done }
    await patch({ checklist })
  }

  const addChecklistItem = async () => {
    const text = newChecklistText.trim()
    if (!text) return
    const checklist: ChecklistItem[] = [...(item.checklist ?? []), { text, done: false }]
    setNewChecklistText('')
    await patch({ checklist })
  }

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/delivery/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      return
    }
    setError(null)
    setItem(json.item)
    onChanged()
  }

  const handleUploadAndDeliver = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        form.append('deliveryItemId', itemId)
        const res = await fetch('/api/delivery/files', { method: 'POST', body: form })
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error ?? 'Upload failed')
        }
      }
      await patch({ status: 'DELIVERED' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const submitDelayReason = async () => {
    const reason = reasonText.trim()
    if (!reason) return
    const res = await fetch(`/api/delivery/items/${itemId}/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCategory, reason }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      return
    }
    setError(null)
    setReasonText('')
    setItem(json.item)
    onChanged()
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{item.title}</SheetTitle>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="brand">{item.client.name}</Badge>
            <Badge variant="secondary">{DELIVERY_CATEGORY_LABELS[item.category]}</Badge>
          </div>
        </SheetHeader>

        {error && (
          <div className="mb-4 rounded-lg px-3 py-2 text-xs" style={{ background: '#fef2f2', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        <Textarea
          label="Description"
          placeholder="Optional details"
          defaultValue={item.description ?? ''}
          onBlur={(e) => patch({ description: e.target.value })}
        />

        <div className="mt-5">
          <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>Checklist</p>
          <div className="space-y-1.5">
            {(item.checklist ?? []).map((c, i) => (
              <button
                key={i}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--surface-muted)]"
                onClick={() => toggleChecklistItem(i)}
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  style={{ borderColor: 'var(--border)', background: c.done ? 'var(--brand)' : 'transparent' }}
                >
                  {c.done && <Check className="h-3 w-3 text-white" />}
                </span>
                <span style={c.done ? { textDecoration: 'line-through', color: 'var(--fg-subtle)' } : undefined}>
                  {c.text}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-lg border px-2.5 py-1.5 text-sm"
              style={{ borderColor: 'var(--border)' }}
              placeholder="e.g. Draft sent"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
            />
            <Button variant="outline" size="sm" onClick={addChecklistItem}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {needsReason && (
          <div className="mt-5 rounded-lg p-3.5" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>This item is overdue — a reason is required</p>
            <Select
              className="mb-2"
              options={Object.entries(DELAY_REASON_LABELS).map(([value, label]) => ({ value, label }))}
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value as DelayReasonCategory)}
            />
            <Textarea
              placeholder="What happened?"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
            <Button variant="destructive" size="sm" className="mt-2" onClick={submitDelayReason}>
              Log delay reason
            </Button>
          </div>
        )}

        {item.status === 'DELAYED' && item.delays.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>Delay reason</p>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              {DELAY_REASON_LABELS[item.delays[0].reasonCategory]} — {item.delays[0].reason}
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>Proof of delivery</p>
          {item.files.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {item.files.map((f) => (
                <a
                  key={f.id}
                  href={f.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm underline"
                  style={{ color: 'var(--brand)' }}
                >
                  {f.fileName}
                </a>
              ))}
            </div>
          )}
          {item.status !== 'DELIVERED' && (
            <label
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 cursor-pointer transition-colors hover:bg-[var(--surface-muted)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <input type="file" multiple className="sr-only" onChange={(e) => handleUploadAndDeliver(e.target.files)} />
              <Upload className="h-5 w-5" style={{ color: 'var(--fg-subtle)' }} />
              <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
                {uploading ? 'Uploading…' : 'Attach file(s) to mark Delivered'}
              </p>
            </label>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors — this also resolves the `./item-drawer` import in Task 17's `board.tsx`.

- [ ] **Step 3: Verify in the browser**

`npm run dev`, sign in, go to `/delivery`, use the quick-add bar to create an item due yesterday, confirm it lands in the "Delayed" column (auto-flip), click it, fill the delay reason form, confirm it saves and the card no longer shows "Reason required". Create a second item due today, open it, upload a file, confirm it moves to the "Delivered" column and the file link opens the uploaded file.

- [ ] **Step 4: Commit**

```bash
git add src/components/delivery/item-drawer.tsx
git commit -m "delivery: add ItemDrawer with checklist, delay reason form, and delivery upload flow"
```

---

## Phase 6 — Asset Bank UI

### Task 19: Asset Bank grid and page

**Files:**
- Create: `src/components/delivery/asset-bank-grid.tsx`
- Create: `src/app/(dashboard)/delivery/asset-bank/page.tsx`

**Interfaces:**
- Consumes: `GET /api/delivery/asset-bank` (Task 12), `GET /api/delivery/clients` (Task 7), `DELIVERY_CATEGORY_LABELS` (`@/types/delivery`), `Select`, `Input` (`@/components/ui`).
- Produces: `<AssetBankGrid />` — filterable grid; `/delivery/asset-bank` page rendering it.

- [ ] **Step 1: Implement the grid**

```tsx
// src/components/delivery/asset-bank-grid.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DELIVERY_CATEGORY_LABELS, type DeliveryCategory, type DeliveryClientDTO } from '@/types/delivery'

interface AssetBankFile {
  id: string
  fileName: string
  fileUrl: string
  thumbnailUrl: string | null
  uploadedAt: string
  item: { id: string; title: string; category: DeliveryCategory; client: DeliveryClientDTO }
}

export function AssetBankGrid() {
  const [files, setFiles] = useState<AssetBankFile[]>([])
  const [clients, setClients] = useState<DeliveryClientDTO[]>([])
  const [clientId, setClientId] = useState('')
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/delivery/clients').then((r) => r.json()).then((json) => setClients(json.clients ?? []))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (clientId) params.set('clientId', clientId)
    if (category) params.set('category', category)
    if (q) params.set('q', q)
    fetch(`/api/delivery/asset-bank?${params}`).then((r) => r.json()).then((json) => setFiles(json.files ?? []))
  }, [clientId, category, q])

  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.id, label: c.name })), [clients])
  const categoryOptions = useMemo(
    () => Object.entries(DELIVERY_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
    []
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--fg-subtle)' }} />
          <Input className="pl-9" placeholder="Search by item title…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select className="w-auto" placeholder="All clients" options={clientOptions} value={clientId} onChange={(e) => setClientId(e.target.value)} />
        <Select className="w-auto" placeholder="All categories" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-8 w-8 mb-3" style={{ color: 'var(--fg-subtle)' }} />
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>No delivered files match these filters yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {files.map((f) => (
            <a
              key={f.id}
              href={f.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg overflow-hidden bg-white lift-card"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="aspect-square flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
                {f.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.thumbnailUrl} alt={f.fileName} className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-8 w-8" style={{ color: 'var(--fg-subtle)' }} />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--fg)' }}>{f.item.title}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>{f.item.client.name}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Implement the page**

```tsx
// src/app/(dashboard)/delivery/asset-bank/page.tsx
import { AssetBankGrid } from '@/components/delivery/asset-bank-grid'

export default function AssetBankPage() {
  return (
    <div className="max-w-[1400px] animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Asset Bank</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
          Every file you've ever delivered, automatically indexed.
        </p>
      </div>
      <AssetBankGrid />
    </div>
  )
}
```

- [ ] **Step 3: Verify in the browser**

Navigate to `/delivery/asset-bank`, confirm the file uploaded in Task 18's manual check appears, and that the client/category filters and search box narrow the grid correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/delivery/asset-bank-grid.tsx "src/app/(dashboard)/delivery/asset-bank/page.tsx"
git commit -m "delivery: add Asset Bank page"
```

---

## Phase 7 — Reports

### Task 20: Report computation function

**Files:**
- Create: `src/lib/delivery/report.ts`

**Interfaces:**
- Consumes: `calculateOnTimeRate` (Task 4), `db`.
- Produces: `interface DeliveryReportSummary { periodStart: string; periodEnd: string; onTimeCount: number; totalDueCount: number; onTimeRate: number; delivered: {...}[]; delayed: {...}[] }`, `computeDeliveryReport(orgId: string, periodStart: Date, periodEnd: Date): Promise<DeliveryReportSummary>`. Consumed by Task 22 (generate endpoint) and Task 23 (ad-hoc/list endpoint).

- [ ] **Step 1: Implement**

```ts
// src/lib/delivery/report.ts
import { db } from '@/lib/db'
import { calculateOnTimeRate } from './calc'

export interface DeliveryReportSummary {
  periodStart: string
  periodEnd: string
  onTimeCount: number
  totalDueCount: number
  onTimeRate: number
  delivered: {
    id: string
    title: string
    clientName: string
    deliveredAt: string
    fileUrls: string[]
  }[]
  delayed: {
    id: string
    title: string
    clientName: string
    reasonCategory: string
    reason: string
    daysLate: number
  }[]
}

/**
 * "What was owed" = items due in the window (by dueDate), used for the
 * on-time rate denominator. "What got done" = items delivered in the window
 * (by deliveredAt) — these can differ, e.g. an item due last week but
 * delivered this week counts as owed-last-week, delivered-this-week.
 * Matches design spec §Automated Weekly/Monthly Reports.
 */
export async function computeDeliveryReport(
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<DeliveryReportSummary> {
  const [itemsDue, deliveredItems, delayLogs] = await Promise.all([
    db.deliveryItem.findMany({
      where: { orgId, dueDate: { gte: periodStart, lte: periodEnd } },
      select: { id: true, dueDate: true, deliveredAt: true },
    }),
    db.deliveryItem.findMany({
      where: { orgId, deliveredAt: { gte: periodStart, lte: periodEnd } },
      include: { client: true, files: true },
    }),
    db.delayLog.findMany({
      where: { item: { orgId }, loggedAt: { gte: periodStart, lte: periodEnd } },
      include: { item: { include: { client: true } } },
    }),
  ])

  const onTimeCount = itemsDue.filter((i) => i.deliveredAt && i.deliveredAt <= i.dueDate).length
  const totalDueCount = itemsDue.length

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    onTimeCount,
    totalDueCount,
    onTimeRate: calculateOnTimeRate(onTimeCount, totalDueCount),
    delivered: deliveredItems.map((i) => ({
      id: i.id,
      title: i.title,
      clientName: i.client.name,
      deliveredAt: i.deliveredAt!.toISOString(),
      fileUrls: i.files.map((f) => f.fileUrl),
    })),
    delayed: delayLogs.map((d) => ({
      id: d.item.id,
      title: d.item.title,
      clientName: d.item.client.name,
      reasonCategory: d.reasonCategory,
      reason: d.reason,
      daysLate: d.daysLate,
    })),
  }
}
```

- [ ] **Step 2: Verify manually against seeded data**

```bash
npx tsx -e "
import { db } from './src/lib/db'
import { computeDeliveryReport } from './src/lib/delivery/report'

async function main() {
  const org = await db.organization.findFirst()
  if (!org) { console.log('No org found — run npm run db:seed first'); return }
  const summary = await computeDeliveryReport(org.id, new Date('2020-01-01'), new Date())
  console.log(JSON.stringify(summary, null, 2))
}
main().then(() => process.exit(0))
"
```

Expected: prints a JSON summary; `totalDueCount`/`delivered.length`/`delayed.length` reflect whatever items exist for that org (0s are fine on a fresh DB — this confirms the query shape is correct, not specific numbers).

- [ ] **Step 3: Commit**

```bash
git add src/lib/delivery/report.ts
git commit -m "delivery: add report computation function"
```

---

### Task 21: Report email

**Files:**
- Create: `src/lib/delivery/mailer.ts`

**Interfaces:**
- Consumes: `DeliveryReportSummary` (Task 20), `nodemailer` (already a dependency), `process.env.SMTP_*`, `process.env.DELIVERY_REPORT_EMAIL_TO` (Task 1).
- Produces: `sendDeliveryReportEmail(summary: DeliveryReportSummary, periodType: 'WEEKLY' | 'MONTHLY', reportUrl: string): Promise<void>`. Consumed by Task 22 (generate endpoint).

- [ ] **Step 1: Implement**

```ts
// src/lib/delivery/mailer.ts
import nodemailer from 'nodemailer'
import type { DeliveryReportSummary } from './report'

export async function sendDeliveryReportEmail(
  summary: DeliveryReportSummary,
  periodType: 'WEEKLY' | 'MONTHLY',
  reportUrl: string
): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST not configured — skipping delivery report email')
    return
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })

  const label = periodType === 'WEEKLY' ? 'Weekly' : 'Monthly'
  const subject = `${label} Delivery Report — ${summary.onTimeRate}% on-time`

  const html = `
    <h2>${label} Delivery Report</h2>
    <p>${summary.periodStart.slice(0, 10)} – ${summary.periodEnd.slice(0, 10)}</p>
    <p><strong>${summary.delivered.length}</strong> delivered, <strong>${summary.delayed.length}</strong> delayed,
       <strong>${summary.onTimeRate}%</strong> on-time (${summary.onTimeCount}/${summary.totalDueCount} due).</p>
    <p><a href="${reportUrl}">View full report</a></p>
  `

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.DELIVERY_REPORT_EMAIL_TO ?? 'niidodooofei@gmail.com',
    subject,
    html,
  })
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors. (No automated test — sending real email requires live SMTP credentials; verified end-to-end in Task 22's manual check once `SMTP_HOST` etc. are set in `.env`.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/delivery/mailer.ts
git commit -m "delivery: add report email sender"
```

---

### Task 22: Scheduled report generation endpoint

**Files:**
- Create: `src/app/api/delivery/reports/generate/route.ts`

**Interfaces:**
- Consumes: `getPriorWeekWindow`, `getPriorMonthWindow` (Task 4), `computeDeliveryReport` (Task 20), `sendDeliveryReportEmail` (Task 21), `process.env.CRON_SECRET`, `db`.
- Produces: `GET /api/delivery/reports/generate?period=weekly|monthly` — secured by `Authorization: Bearer <CRON_SECRET>`, idempotent per `(orgId, periodType, periodStart)`, generates a `DeliveryReport` row per org and emails the summary. Triggered by Vercel Cron (Task 24) or, later, cPanel Cron via curl with the same header.

- [ ] **Step 1: Implement**

```ts
// src/app/api/delivery/reports/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPriorWeekWindow, getPriorMonthWindow } from '@/lib/delivery/calc'
import { computeDeliveryReport } from '@/lib/delivery/report'
import { sendDeliveryReportEmail } from '@/lib/delivery/mailer'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const period = new URL(request.url).searchParams.get('period')
  if (period !== 'weekly' && period !== 'monthly') {
    return NextResponse.json({ error: 'period must be weekly or monthly' }, { status: 400 })
  }

  const { start, end } = period === 'weekly' ? getPriorWeekWindow() : getPriorMonthWindow()
  const periodType = period === 'weekly' ? 'WEEKLY' : 'MONTHLY'

  const orgs = await db.organization.findMany({
    where: { deliveryItems: { some: {} } },
    select: { id: true },
  })

  const results: { orgId: string; reportId: string; reused: boolean }[] = []

  for (const org of orgs) {
    const existing = await db.deliveryReport.findFirst({
      where: { orgId: org.id, periodType, periodStart: start, periodEnd: end },
    })
    if (existing) {
      results.push({ orgId: org.id, reportId: existing.id, reused: true })
      continue
    }

    const summary = await computeDeliveryReport(org.id, start, end)
    const report = await db.deliveryReport.create({
      data: {
        orgId: org.id,
        periodType,
        periodStart: start,
        periodEnd: end,
        summary: summary as unknown as Prisma.InputJsonValue,
      },
    })

    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/delivery/reports`
    await sendDeliveryReportEmail(summary, periodType, reportUrl).catch((err) =>
      console.error('Failed to send delivery report email:', err)
    )

    results.push({ orgId: org.id, reportId: report.id, reused: false })
  }

  return NextResponse.json({ period, periodStart: start.toISOString(), periodEnd: end.toISOString(), results })
}
```

- [ ] **Step 2: Verify manually**

```bash
curl -s "http://localhost:3000/api/delivery/reports/generate?period=weekly" -H "Authorization: Bearer wrong-secret"
curl -s "http://localhost:3000/api/delivery/reports/generate?period=weekly" -H "Authorization: Bearer $CRON_SECRET"
curl -s "http://localhost:3000/api/delivery/reports/generate?period=weekly" -H "Authorization: Bearer $CRON_SECRET"
```

Expected: first call `401`; second call `200` with a `results` array (empty if no org has any `DeliveryItem` yet — create one via the board first to see a non-empty result); third call (same request repeated) returns the *same* `reportId` with `"reused": true`, confirming idempotency.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/delivery/reports/generate/route.ts"
git commit -m "delivery: add secured scheduled report generation endpoint"
```

---

### Task 23: Reports list + ad-hoc custom report API

**Files:**
- Create: `src/app/api/delivery/reports/route.ts`

**Interfaces:**
- Consumes: `computeDeliveryReport` (Task 20), `getOrgIdForClerkUser` (Task 6), `db`.
- Produces: `GET /api/delivery/reports` → `{ reports: DeliveryReport[] }` (newest first, normal Clerk auth); `POST /api/delivery/reports` (body `{ periodStart: string; periodEnd: string }`) → `{ report: DeliveryReport }` with `periodType: 'CUSTOM'`. Consumed by Task 24 (Reports page).

- [ ] **Step 1: Implement**

```ts
// src/app/api/delivery/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { computeDeliveryReport } from '@/lib/delivery/report'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET() {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ reports: [] })

  const reports = await db.deliveryReport.findMany({
    where: { orgId: scope.orgId },
    orderBy: { generatedAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ reports })
}

export async function POST(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  let body: { periodStart?: string; periodEnd?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.periodStart || !body.periodEnd) {
    return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
  }

  const periodStart = new Date(body.periodStart)
  const periodEnd = new Date(body.periodEnd)
  const summary = await computeDeliveryReport(scope.orgId, periodStart, periodEnd)

  const report = await db.deliveryReport.create({
    data: {
      orgId: scope.orgId,
      periodType: 'CUSTOM',
      periodStart,
      periodEnd,
      summary: summary as unknown as Prisma.InputJsonValue,
    },
  })
  return NextResponse.json({ report }, { status: 201 })
}
```

- [ ] **Step 2: Verify manually**

```bash
curl -s -X POST http://localhost:3000/api/delivery/reports \
  -H "Content-Type: application/json" -b "$CLERK_DEV_SESSION_COOKIE" \
  -d '{"periodStart":"2026-09-01","periodEnd":"2026-09-22"}'
curl -s http://localhost:3000/api/delivery/reports -b "$CLERK_DEV_SESSION_COOKIE"
```

Expected: POST returns `201` with `report.periodType: "CUSTOM"`; GET lists it plus any report Task 22 generated, newest first.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/delivery/reports/route.ts
git commit -m "delivery: add reports list and ad-hoc custom report API"
```

---

### Task 24: Vercel Cron configuration

**Files:**
- Create or modify: `vercel.json`

**Interfaces:**
- Consumes: `GET /api/delivery/reports/generate` (Task 22).
- Produces: two scheduled invocations — Monday 00:05 UTC (=Accra) for the weekly report, 1st-of-month 00:05 UTC for the monthly report.

- [ ] **Step 1: Check whether `vercel.json` already exists**

```bash
cat "/Users/derekdodoo/brand support/brandos/vercel.json" 2>/dev/null || echo "does not exist"
```

- [ ] **Step 2a: If it doesn't exist, create it**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    { "path": "/api/delivery/reports/generate?period=weekly", "schedule": "5 0 * * 1" },
    { "path": "/api/delivery/reports/generate?period=monthly", "schedule": "5 0 1 * *" }
  ]
}
```

- [ ] **Step 2b: If it already exists, merge the `crons` array into it** — read the file first with the Read tool, then add these two entries to its existing `crons` array (creating that key if absent) without removing any existing configuration.

- [ ] **Step 3: Set `CRON_SECRET` in the Vercel project**

This is a one-time manual dashboard step, documented here rather than scripted since it touches production infrastructure: in the Vercel project settings → Environment Variables, add `CRON_SECRET` with a value generated by `openssl rand -hex 32`, matching what's in the local `.env`. Confirm with the user before doing this if acting with dashboard/CLI access — it's a production credential change.

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "delivery: add Vercel Cron entries for weekly/monthly report generation"
```

---

### Task 25: Report view component and Reports page

**Files:**
- Create: `src/components/delivery/report-view.tsx`
- Create: `src/app/(dashboard)/delivery/reports/page.tsx`

**Interfaces:**
- Consumes: `GET /api/delivery/reports`, `POST /api/delivery/reports` (Task 23), `DELAY_REASON_LABELS` (`@/types/delivery`), `Button`, `Badge`, `Input` (`@/components/ui`).
- Produces: `<ReportView report={...} />`, the `/delivery/reports` page listing reports with a "Generate now" custom-range form.

- [ ] **Step 1: Implement the report view**

```tsx
// src/components/delivery/report-view.tsx
'use client'

import { DELAY_REASON_LABELS, type DelayReasonCategory } from '@/types/delivery'
import type { DeliveryReportSummary } from '@/lib/delivery/report'
import { Badge } from '@/components/ui/badge'

interface ReportRecord {
  id: string
  periodType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  generatedAt: string
  summary: DeliveryReportSummary
}

export function ReportView({ report }: { report: ReportRecord }) {
  const { summary } = report
  return (
    <div className="rounded-xl bg-white p-5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <Badge variant={report.periodType === 'CUSTOM' ? 'secondary' : 'brand'}>{report.periodType}</Badge>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            {summary.periodStart.slice(0, 10)} – {summary.periodEnd.slice(0, 10)}
          </p>
        </div>
        <p className="text-2xl font-bold" style={{ color: summary.onTimeRate >= 80 ? 'var(--emerald)' : 'var(--rose)' }}>
          {summary.onTimeRate}%
        </p>
      </div>

      <p className="text-sm mb-3" style={{ color: 'var(--fg-muted)' }}>
        {summary.onTimeCount}/{summary.totalDueCount} due items delivered on time ·{' '}
        {summary.delivered.length} delivered · {summary.delayed.length} delayed
      </p>

      {summary.delayed.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--fg-muted)' }}>Delayed</p>
          <ul className="space-y-1 text-sm">
            {summary.delayed.map((d) => (
              <li key={d.id} style={{ color: 'var(--fg)' }}>
                <strong>{d.title}</strong> ({d.clientName}) — {DELAY_REASON_LABELS[d.reasonCategory as DelayReasonCategory]}, {d.daysLate}d late
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.delivered.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--fg-muted)' }}>Delivered</p>
          <ul className="space-y-1 text-sm">
            {summary.delivered.map((d) => (
              <li key={d.id} style={{ color: 'var(--fg)' }}>
                <strong>{d.title}</strong> ({d.clientName}){' '}
                {d.fileUrls.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="underline ml-1" style={{ color: 'var(--brand)' }}>
                    file{d.fileUrls.length > 1 ? ` ${i + 1}` : ''}
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Implement the page**

```tsx
// src/app/(dashboard)/delivery/reports/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { ReportView } from '@/components/delivery/report-view'
import { Button } from '@/components/ui/button'

interface ReportRecord {
  id: string
  periodType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  generatedAt: string
  summary: import('@/lib/delivery/report').DeliveryReportSummary
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [generating, setGenerating] = useState(false)

  const load = () => fetch('/api/delivery/reports').then((r) => r.json()).then((json) => setReports(json.reports ?? []))

  useEffect(() => {
    load()
  }, [])

  const generateNow = async () => {
    if (!from || !to) return
    setGenerating(true)
    try {
      await fetch('/api/delivery/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: from, periodEnd: to }),
      })
      await load()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-[900px] animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
          Weekly and monthly delivery snapshots, plus ad-hoc custom ranges.
        </p>
      </div>

      <div
        className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 mb-6"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--fg-muted)' }}>From</label>
          <input type="date" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--fg-muted)' }}>To</label>
          <input type="date" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="brand" size="sm" disabled={generating || !from || !to} onClick={generateNow}>
          Generate now
        </Button>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>No reports yet.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <ReportView key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in the browser**

Navigate to `/delivery/reports`, confirm any report generated in Tasks 22/23's manual checks is listed with correct counts, then generate a custom range covering today and confirm it appears at the top of the list.

- [ ] **Step 4: Commit**

```bash
git add src/components/delivery/report-view.tsx "src/app/(dashboard)/delivery/reports/page.tsx"
git commit -m "delivery: add Reports page with ad-hoc generation"
```

---

## Phase 8 — Seed data

### Task 26: Seed demo delivery clients

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `db.deliveryClient.upsert` (Task 2's schema), the `org` created earlier in `seed.ts`.
- Produces: a handful of `DeliveryClient` rows so the board isn't empty on first load, per design spec's Build Order step 9.

- [ ] **Step 1: Add demo clients to `prisma/seed.ts`**

Insert before the final `console.log('Seed complete ✓')` block:

```ts
  // Demo delivery clients
  const deliveryClientData = [
    { name: 'Elior Braiding Studio', type: 'FREELANCE' as const, color: '#8b5cf6' },
    { name: 'Braids by Portia', type: 'FREELANCE' as const, color: '#f59e0b' },
    { name: 'ProdFlow', type: 'PERSONAL' as const, color: '#10b981' },
  ]
  for (const c of deliveryClientData) {
    await db.deliveryClient.upsert({
      where: { id: `seed-${c.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { id: `seed-${c.name.toLowerCase().replace(/\s+/g, '-')}`, orgId: org.id, ...c },
    })
  }
  console.log('  Delivery clients:', deliveryClientData.length)
```

- [ ] **Step 2: Run the seed and verify**

```bash
npm run db:seed
```

Expected: log line `Delivery clients: 3` with no errors; re-running is idempotent (upsert, no duplicates).

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "delivery: seed demo delivery clients"
```

---

## Final verification (after all tasks)

- [ ] Run `npx tsc --noEmit` — zero errors across the whole repo.
- [ ] Run `npm run build` — succeeds.
- [ ] Run `npx vitest run` — all unit tests pass (`calc.test.ts`, `storage.test.ts`).
- [ ] Manual end-to-end pass in the browser: sign in → `/delivery` → quick-add an item due today → open it → upload a file → confirm it moves to Delivered and appears in `/delivery/asset-bank` → quick-add an item due yesterday → confirm it auto-flips to Delayed on next load → log a delay reason → confirm the card no longer shows "Reason required" → go to `/delivery/reports` → generate a custom report covering today → confirm it lists the delivered and delayed items with the correct on-time rate.

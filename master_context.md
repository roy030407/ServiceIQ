# ServiceIQ — Master Context Document
# Share this with every team member before they read their track doc.

---

## What we are building

ServiceIQ is a field service and AMC management platform for companies that service equipment under contract: air conditioning, lifts, generators, fire safety, washing machines, and any other equipment category.

The platform serves three types of users on one system:

**Org admins and dispatchers** get a web dashboard to manage customers, equipment, contracts, tickets, and job assignments.

**Technicians** get a mobile-first web view to see their assigned jobs, update status, upload photos, capture signatures, and complete checklists.

**Marketplace** (future): technicians can register independently and be assigned jobs across multiple service organisations. The schema supports this now. We do not build the marketplace-facing UI in this phase.

The two core value propositions:

1. **Dispatch and execution**: Replace the WhatsApp group and paper job sheets with a structured flow from complaint to closed job.
2. **Contract intelligence**: Track which contracts expire when, generate preventive maintenance visits automatically, and tell the technician on site whether a part is covered under AMC or chargeable.

---

## Tech stack (commit to this, do not change)

| Layer | Technology |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email magic link) |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query (React Query v5) |
| File storage | Supabase Storage |
| Notifications | Meta WhatsApp Business API |
| Hosting | Vercel |
| Edge functions | Supabase Edge Functions (Deno) |

---

## Project setup (Person A does this, everyone else pulls)

```bash
npx create-next-app@14 serviceiq --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd serviceiq
npx shadcn@latest init
npx shadcn@latest add button card input label select badge dialog sheet table tabs sonner
npm install @supabase/supabase-js @supabase/ssr @tanstack/react-query date-fns lucide-react
```

Vercel env vars needed (all team members add these to `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_VERIFY_TOKEN=
```

---

## Folder structure (everyone follows this exactly)

```
src/
  app/
    (auth)/
      login/page.tsx
      signup/page.tsx
      onboard/page.tsx          -- first org setup after signup
    (org)/
      layout.tsx                -- auth guard + OrgContext provider
      dispatch/page.tsx
      tickets/
        page.tsx
        new/page.tsx
        [id]/page.tsx
      jobs/
        page.tsx
        [id]/page.tsx
      equipment/
        page.tsx
        [id]/page.tsx
      contracts/
        page.tsx
        new/page.tsx
        [id]/page.tsx
      parts/page.tsx
      technicians/page.tsx
      renewals/page.tsx
      dashboard/page.tsx
      settings/page.tsx
    (tech)/
      layout.tsx                -- mobile-first layout, technician role only
      page.tsx                  -- my jobs list
      jobs/
        [id]/page.tsx
        [id]/close/page.tsx
    api/
      whatsapp/webhook/route.ts
      jobs/[id]/assign/route.ts
      jobs/[id]/transition/route.ts
      contracts/[id]/activate/route.ts
  components/
    ui/                         -- shadcn, do not edit
    layout/
      sidebar.tsx
      header.tsx
      mobile-nav.tsx
    dispatch/
      dispatch-board.tsx
      technician-column.tsx
      job-card.tsx
    tickets/
      ticket-form.tsx
      ticket-list.tsx
      ticket-detail.tsx
    jobs/
      job-status-badge.tsx
      assignment-modal.tsx
      job-part-form.tsx
    equipment/
      category-tree.tsx
      unit-form.tsx
    contracts/
      contract-form.tsx
      coverage-rule-editor.tsx
      renewal-card.tsx
    tech/
      job-list-item.tsx
      checklist-form.tsx
      photo-upload.tsx
      signature-pad.tsx
  lib/
    supabase/
      client.ts                 -- browser Supabase client
      server.ts                 -- server Supabase client (for Server Components and API routes)
      types.ts                  -- generated types (run: supabase gen types typescript)
    whatsapp.ts                 -- WhatsApp send helper
    entitlement.ts              -- calls fn_check_entitlement RPC
    utils.ts
  hooks/
    use-org.ts                  -- current org from context
    use-person.ts               -- current person from Supabase Auth
    use-realtime.ts             -- Supabase realtime subscription helper
  types/
    index.ts                    -- shared TypeScript types
```

---

## Supabase client patterns (copy these exactly)

### Browser client — `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server client — `src/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}
```

### Calling an RPC function
```typescript
const { data, error } = await supabase
  .rpc('fn_check_entitlement', {
    p_unit_id: unitId,
    p_part_category: 'compressor',
    p_scope: 'part_category'
  })
```

### Realtime subscription
```typescript
const channel = supabase
  .channel('jobs')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'job',
    filter: `org_id=eq.${orgId}`
  }, (payload) => {
    // handle change
  })
  .subscribe()

// Clean up
return () => { supabase.removeChannel(channel) }
```

---

## Auth and session pattern

On every protected page/layout, check session server-side:
```typescript
// In a Server Component or layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/login')
```

After login, the `person` row is fetched using `auth.uid()` server-side. The current org is stored in a React context (`OrgContext`) populated in `(org)/layout.tsx`. Do not fetch the org on every page; read it from context.

---

## OrgContext — `src/hooks/use-org.ts`

Person A builds this. Everyone else imports from it.

```typescript
// Shape of what OrgContext provides
interface OrgContextValue {
  org: Organisation
  membership: OrgMembership
  person: Person
  isOwner: boolean
  isDispatcher: boolean
  isTechnician: boolean
}
```

Usage in any client component:
```typescript
import { useOrg } from '@/hooks/use-org'
const { org, person, isDispatcher } = useOrg()
```

---

## Database conventions everyone must follow

1. Always pass `org_id` on every insert. RLS enforces it but the type checker will also catch you.
2. Never call `supabase.from('audit_log').insert(...)` directly. The trigger handles audit automatically.
3. Job status transitions must go through the API route `POST /api/jobs/[id]/transition` so the `job_status_event` row is always written.
4. File uploads go to Supabase Storage bucket `job-attachments`, path `{org_id}/{job_id}/{filename}`.
5. Never use `select *` in production queries. Always list the columns you need.

---

## Key database functions (available as RPCs)

| Function | What it does |
|---|---|
| `fn_check_entitlement(unit_id, part_category, scope)` | Returns JSON: covered, source, explanation |
| `fn_generate_pm_visits(contract_id)` | Generates PM visit rows. Called automatically on contract activation. |
| `fn_create_org(full_name, phone, org_name, org_type)` | Onboarding. Creates person, org, owner membership and default job types in one call. Use this, never insert into those tables from the client. |
| `fn_seed_org(org_id)` | Creates default job types and workflow states. Called inside fn_create_org; do not call directly. |
| `fn_daily_checks()` | Nightly: marks breached jobs and PM visits, expires contracts, refreshes materialised views. Run by pg_cron. |
| `fn_append_attachment(job_id, url)` | Appends a photo URL to a job. |

Read dashboards from the filtered views `v_renewal_pipeline` and `v_technician_performance`. The raw `mv_*` materialised views are locked down because Postgres does not apply RLS to them.
| `fn_my_org_ids()` | Returns org IDs the current user belongs to. Used internally by RLS. |

---

## Entities at a glance

| Entity | What it represents |
|---|---|
| `person` | Any human with a login. Global, not org-scoped. |
| `organisation` | A company using ServiceIQ. |
| `org_membership` | Person's role inside an org. One person can belong to multiple orgs. |
| `skill` | A named capability. Global master list. |
| `person_skill` | A person's skill with level and optional certification expiry. |
| `party` | A customer, dealer, vendor, or brand that the org deals with. |
| `site` | A physical location belonging to a party. |
| `equipment_category` | Self-referencing hierarchy: Appliances > Laundry > Washing Machine. |
| `product_model` | A make/model of equipment with specs. |
| `equipment_unit` | One physical unit installed at a site, with serial number and warranty. |
| `contract` | An AMC agreement between the org and a customer party. |
| `contract_equipment` | Which units a contract covers, with PM visit frequency. |
| `coverage_rule` | What a contract covers: part categories, labour, travel. Priority-ordered. |
| `pm_visit` | One scheduled preventive maintenance visit, auto-generated on contract activation. |
| `job_type` | Configurable type: Breakdown, PM, Installation. Each has a workflow. |
| `workflow_state` | A state in a job type's state machine. Holds allowed next states. |
| `ticket` | An inbound complaint. Source can be phone, WhatsApp, portal, etc. |
| `job` | One technician visit, linked to a ticket or a PM visit. |
| `job_assignment` | A technician assigned to a job with a time slot. Enforces no double-booking. |
| `job_status_event` | Immutable log of every status change with timestamp and GPS. |
| `job_part` | A part used in a job, with entitlement decision recorded inline. |
| `part` | A spare part stocked by the org with sell price. |
| `audit_log` | Append-only record of every INSERT/UPDATE/DELETE on key tables. |

---

## Track ownership summary

| Track | Person | Pages and features owned |
|---|---|---|
| A | Person 1 | Schema, auth, org setup, shared layout, routing, deployment |
| B | Person 2 | Equipment catalogue, contracts, coverage rules, PM visits, renewal pipeline |
| C | Person 3 | Tickets, dispatch board, job assignment, SLA display |
| D | Person 4 | Technician mobile view, job close flow, photo upload, signature, offline queue |
| E | Person 5 | WhatsApp integration, owner dashboard, notifications, Edge Functions |

---

## What NOT to build (defer to post-launch)

- Inventory and stock management
- Payroll or accounting
- PDF invoice generation (export to Tally instead)
- Android/iOS native app
- Multi-language UI (English only for now)
- Payment collection inside the app
- Marketplace technician discovery UI (schema supports it, UI deferred)


---

## Version gotchas

- We pin Next.js 14. Newer Next versions make `cookies()` and route `params` async, which breaks the snippets in these docs. Do not upgrade mid-week.
- The Supabase SSR snippets use the older `get/set/remove` cookie callbacks. If Cursor or the Supabase docs suggest `getAll/setAll`, use that instead, and prefer `supabase.auth.getUser()` over `getSession()` for server-side auth checks.
- `product_model` now has an `org_id` column. Pass it on insert like every other table.
- `ticket` has a `public_token`. Customer-facing links use it, never the sequential `ticket_no`.
- `job` has a `unit_id` (set from the ticket's unit, or from the PM visit's equipment for PM jobs).

## Git workflow (read before your first commit)

- `main` is protected. Nobody pushes to it directly. Every change is a pull request, merged when the Vercel preview deploy is green and one teammate has looked at it.
- Branch names: `track-a/<thing>`, `track-b/<thing>`, and so on. Keep PRs small and merge daily. Long-lived branches are how five people on a one-week clock lose a day to merge conflicts.
- Track A merges the scaffold first (Next.js app, Supabase clients, OrgContext, layouts, nav stubs), ideally within the first two hours. Until then B to E write queries, types and components against their own docs, then rebase onto the scaffold.
- Schema changes: only Track A applies them. Everyone else sends SQL as a new file `supabase/migrations/000N_name.sql` in a PR. One shared Supabase project for development; never edit tables by hand in the dashboard.
- Never commit secrets. `.env.local` is gitignored. The service role key and the WhatsApp token bypass all security, so share them through a password manager or Vercel env settings, never in the repo or a chat.
- Repo layout: `docs/` (these files), `supabase/migrations/`, `src/` as per the folder structure above.

## Known gaps accepted for launch (fix after the first pilot)

- Roles are enforced in the UI only. At the database level any member of an org can read and write all of that org's rows, so a technician could edit a contract through the API. Add per-role policies before onboarding a second customer.
- `job-attachments` is a public bucket. Photos and signatures are hidden only by hard-to-guess URLs. Move to a private bucket with signed URLs.
- `person_skill` can be edited by any member of a shared org, including the verification field. Restrict verification to owners before the marketplace goes live.
- The marketplace (cross-org assignment) is supported by the schema but no UI exercises it yet.

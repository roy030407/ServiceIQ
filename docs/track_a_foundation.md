# ServiceIQ — Track A: Foundation
# You own: schema, auth, org setup, shared layout, routing, Vercel deployment.
# Read master_context.md first. This doc covers only what is specific to your track.

---

## Your deliverables (in order)

1. Supabase project created and schema running
2. Next.js project created and pushed to GitHub
3. Vercel deployment live at a public URL
4. Auth flow: signup, login, magic link
5. Org onboarding: create org, invite members
6. OrgContext provider and useOrg hook
7. Shared layout: sidebar (desktop) + bottom nav (mobile)
8. Role-based routing guard
9. TypeScript types generated from schema
10. Seed script: call fn_seed_org after org creation

---

## Step 1: Supabase setup

1. Create a new Supabase project at supabase.com. Name it `serviceiq`.
2. Go to SQL Editor, paste the full contents of `schema.sql`, and run it. Commit the same file to the repo as `supabase/migrations/0001_init.sql`; every later schema change is a new numbered file there, and only you apply it.
3. Go to Storage, create a bucket called `job-attachments`. Set it to public.
4. Go to Authentication > Settings: enable Email magic link, disable email confirmation for development.
5. Copy the project URL and anon key into `.env.local`.

---

## Step 2: Next.js project

Run the commands from master_context.md. Then create the Supabase client files exactly as shown there.

Add to `src/types/index.ts`:
```typescript
export type UserRole = 'owner' | 'dispatcher' | 'technician' | 'accounts'
export type OrgType = 'retailer' | 'wholesaler' | 'service_centre' | 'brand' | 'facility'
export type JobStatus = 'open' | 'assigned' | 'en_route' | 'on_site' | 'awaiting_parts' | 'closed' | 'cancelled'
export type Priority = 'P1' | 'P2' | 'P3'
export type TicketSource = 'phone' | 'whatsapp' | 'email' | 'portal' | 'walk_in'
export type ContractType = 'comprehensive' | 'non_comprehensive' | 'labour_only'
export type EngagementType = 'employee' | 'contractor' | 'marketplace'
```

---

## Step 3: Auth pages

### `src/app/(auth)/login/page.tsx`

Client component. Show email input, submit calls `supabase.auth.signInWithOtp({ email })`. On success show "Check your email for a magic link." After the user clicks the link they land at `/auth/callback`.

### `src/app/(auth)/signup/page.tsx`

Same as login. Supabase magic link works for both signup and login with the same call. After first login, middleware checks if the user has a `person` row and an `org_membership`. If not, redirect to `/onboard`.

### `src/app/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/dispatch', request.url))
}
```

### `src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  await supabase.auth.getSession()
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/callback).*)'],
}
```

---

## Step 4: Org onboarding — `src/app/(auth)/onboard/page.tsx`

Client component. This runs after a user's first login if they have no org membership.

Flow: collect full name, phone, org name and org type, then make ONE call to the database function `fn_create_org`. It creates the person, the organisation, the owner membership and the default job types atomically. Do NOT insert into `person`, `organisation` or `org_membership` directly from the client: row level security blocks it (a brand new user is a member of nothing, so no policy can allow creating the first org). Then redirect to `/dispatch`.

```typescript
async function onboard(fullName: string, phone: string, orgName: string, orgType: string) {
  const supabase = createClient()
  const { data: orgId, error } = await supabase.rpc('fn_create_org', {
    p_full_name: fullName,
    p_phone: phone,
    p_org_name: orgName,
    p_org_type: orgType,
  })
  if (error) throw error
  return orgId as string
}
```

---

## Step 5: OrgContext — `src/hooks/use-org.ts`

This is the most important shared piece. Every other track imports from this.

```typescript
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OrgContextValue {
  org: any
  membership: any
  person: any
  isOwner: boolean
  isDispatcher: boolean
  isTechnician: boolean
  isAccounts: boolean
  loading: boolean
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = useState<OrgContextValue | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: person } = await supabase
        .from('person')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      const { data: membership } = await supabase
        .from('org_membership')
        .select('*, organisation(*)')
        .eq('person_id', person.person_id)
        .eq('is_active', true)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

      setCtx({
        person,
        membership,
        org: membership.organisation,
        isOwner:      membership.role === 'owner',
        isDispatcher: ['owner', 'dispatcher'].includes(membership.role),
        isTechnician: membership.role === 'technician',
        isAccounts:   membership.role === 'accounts',
        loading: false,
      })
    }
    load()
  }, [])

  if (!ctx) return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>
  return <OrgContext.Provider value={ctx}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used inside OrgProvider')
  return ctx
}
```

---

## Step 6: (org) layout — `src/app/(org)/layout.tsx`

Server component. Auth check, then wraps children in OrgProvider.

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgProvider } from '@/hooks/use-org'
import { Sidebar } from '@/components/layout/sidebar'

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <OrgProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </OrgProvider>
  )
}
```

---

## Step 7: Sidebar — `src/components/layout/sidebar.tsx`

Desktop sidebar, hidden on mobile. Nav items:

```typescript
const NAV = [
  { href: '/dispatch',    label: 'Dispatch',    icon: LayoutGrid },
  { href: '/tickets',     label: 'Tickets',     icon: AlertCircle },
  { href: '/jobs',        label: 'Jobs',        icon: Wrench },
  { href: '/equipment',   label: 'Equipment',   icon: Package },
  { href: '/contracts',   label: 'Contracts',   icon: FileText },
  { href: '/renewals',    label: 'Renewals',    icon: RefreshCw },
  { href: '/technicians', label: 'Technicians', icon: Users },
  { href: '/parts',       label: 'Parts',       icon: Box },
  { href: '/dashboard',   label: 'Dashboard',   icon: BarChart2 },
  { href: '/settings',    label: 'Settings',    icon: Settings },
]
```

Role guard: hide `/dispatch`, `/technicians` from `accounts` role. Show only own jobs for `technician` role (redirect to `/tech` instead of `/dispatch`).

### Mobile bottom nav — `src/components/layout/mobile-nav.tsx`

Visible only on mobile (md:hidden). Show: Dispatch, Tickets, Jobs, More.

---

## Step 8: (tech) layout — `src/app/(tech)/layout.tsx`

Mobile-first layout for technicians. Same auth guard but different shell: no sidebar, full-width, large touch targets. Role check: if `membership.role !== 'technician'` redirect to `/dispatch`.

---

## Step 9: Settings page — `src/app/(org)/settings/page.tsx`

Basic org settings. Allow owner to:
- Edit org name, working hours
- Invite new member by email and role
- Manage holidays (add/delete)

Invite flow: call `supabase.auth.admin.inviteUserByEmail` (use service role key in an API route, not client-side).

### `src/app/api/invite/route.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, orgId, role, fullName } = await req.json()

  // Only an owner of this org may invite. Without this check anyone could POST here.
  const session = createSessionClient()
  const { data: myRole } = await session.rpc('fn_my_role', { p_org_id: orgId })
  if (myRole !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: invited, error } = await supabase.auth.admin.inviteUserByEmail(email)
  if (error || !invited.user) {
    return NextResponse.json({ error: error?.message ?? 'Invite failed' }, { status: 400 })
  }

  // Service role bypasses RLS: create the person and membership now so the invitee skips /onboard
  const { data: person } = await supabase
    .from('person')
    .upsert({ auth_user_id: invited.user.id, full_name: fullName ?? email, email },
            { onConflict: 'auth_user_id' })
    .select('person_id')
    .single()
  await supabase.from('org_membership')
    .insert({ person_id: person!.person_id, org_id: orgId, role })

  return NextResponse.json({ ok: true })
}
```

Invited users already have a person row and a membership by the time they click the link, so they skip `/onboard`.

---

## Step 10: Vercel deployment

1. Push to GitHub.
2. Connect repo to Vercel.
3. Add all env vars from `.env.local` to Vercel project settings.
4. Ensure `SUPABASE_SERVICE_ROLE_KEY` is in Vercel env but NOT prefixed `NEXT_PUBLIC_`.
5. Set Supabase URL to the production project URL.

---

## What you expose to other tracks

- `useOrg()` hook with `org`, `person`, `membership`, role booleans
- `createClient()` from `@/lib/supabase/client` and `@/lib/supabase/server`
- `(org)/layout.tsx` with OrgProvider wrapping all org pages
- `(tech)/layout.tsx` for technician pages
- Sidebar and mobile nav with all nav items present (even if the pages are stubs)
- Vercel URL (share this with the team as soon as it deploys)

---

## What you do NOT build

- Ticket form (Track C)
- Dispatch board (Track C)
- Equipment pages (Track B)
- Contract pages (Track B)
- Technician job view (Track D)
- WhatsApp integration (Track E)
- Dashboard (Track E)

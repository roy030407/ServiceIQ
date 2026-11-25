# ServiceIQ — Track E: Integrations and Dashboard
# You own: WhatsApp notifications, owner dashboard, Edge Functions, customer portal.
# Read master_context.md first.

---

## Your deliverables

1. WhatsApp webhook receiver and message sender
2. Outbound notifications for: ticket raised, technician assigned, job closed
3. Inbound WhatsApp ticket creation
4. Owner dashboard with KPIs
5. SLA breach check Edge Function (scheduled daily)
6. PM visit breach check Edge Function (scheduled daily)
7. Renewal reminder Edge Function (scheduled weekly)
8. Materialized view refresh Edge Function (scheduled nightly)
9. Customer portal (`/portal/[ticketNo]`)

---

## WhatsApp setup

You already have Meta Business / WhatsApp Business API access. You need:
- A verified WhatsApp Business number
- A permanent access token
- A webhook verify token (any random string, store in env as `WHATSAPP_VERIFY_TOKEN`)

In the Meta developer console, set the webhook URL to:
`https://your-vercel-url.vercel.app/api/whatsapp/webhook`

Subscribe to: `messages`

---

## WhatsApp helper — `src/lib/whatsapp.ts`

```typescript
const BASE = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`
const HEADERS = {
  'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
  'Content-Type': 'application/json',
}

export async function sendText(to: string, text: string) {
  // Normalise Indian numbers: add 91 prefix if missing
  const phone = to.replace(/\D/g, '').replace(/^0/, '91').replace(/^(?!91)/, '91')
  await fetch(BASE, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text }
    })
  })
}

export async function sendTemplate(to: string, template: string, components: any[]) {
  const phone = to.replace(/\D/g, '').replace(/^0/, '91').replace(/^(?!91)/, '91')
  await fetch(BASE, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: { name: template, language: { code: 'en' }, components }
    })
  })
}
```

---

## WhatsApp webhook — `src/app/api/whatsapp/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendText } from '@/lib/whatsapp'

// GET: Meta verification handshake
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// POST: Incoming messages
export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role needed for insert without RLS
  )

  try {
    const entry    = body.entry?.[0]
    const change   = entry?.changes?.[0]?.value
    const message  = change?.messages?.[0]
    if (!message || message.type !== 'text') return NextResponse.json({ ok: true })

    const from = message.from // the sender's WhatsApp number
    const text = message.text.body.trim()

    // Look up the party by phone number
    const { data: party } = await supabase
      .from('party')
      .select('party_id, org_id, name')
      .ilike('phone', `%${from.slice(-10)}%`) // match last 10 digits
      .single()

    if (!party) {
      await sendText(from, "Hello! We don't have your number registered. Please contact us directly.")
      return NextResponse.json({ ok: true })
    }

    // Get first site for this party
    const { data: site } = await supabase
      .from('site')
      .select('site_id')
      .eq('party_id', party.party_id)
      .limit(1)
      .single()

    // Create a ticket from the WhatsApp message
    const { data: ticket } = await supabase
      .from('ticket')
      .insert({
        org_id: party.org_id,
        site_id: site?.site_id,
        source: 'whatsapp',
        fault_description: text,
        priority: 'P2',
      })
      .select()
      .single()

    await sendText(from,
      `Hi ${party.name}! Your complaint has been registered as *${ticket.ticket_no}*. ` +
      `We will assign a technician shortly. ` +
      `Track your ticket at: https://serviceiq.vercel.app/portal/${ticket.public_token}`
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return NextResponse.json({ ok: true }) // always 200 to Meta
  }
}
```

---

## Outbound notification triggers

These are called from other tracks at key events. Add them to `src/lib/whatsapp.ts`:

```typescript
export async function notifyTicketRaised(customerPhone: string, ticketNo: string) {
  await sendText(customerPhone,
    `Your service request *${ticketNo}* has been raised. We will contact you shortly.`
  )
}

export async function notifyTechnicianAssigned(
  customerPhone: string, ticketNo: string, techName: string, scheduledTime: string
) {
  await sendText(customerPhone,
    `Update on *${ticketNo}*: ${techName} has been assigned and will arrive at ${scheduledTime}.`
  )
}

export async function notifyJobClosed(customerPhone: string, ticketNo: string, jobNo: string, publicToken: string) {
  await sendText(customerPhone,
    `Your service job *${jobNo}* (ticket ${ticketNo}) has been completed. ` +
    `Please rate your experience: https://serviceiq.vercel.app/portal/${publicToken}`
  )
}
```

**Where other tracks call these:**

Track C calls `notifyTicketRaised` at the end of `POST /api/jobs` (after ticket + job created).

Track C calls `notifyTechnicianAssigned` at the end of `POST /api/jobs/[id]/assign`.

Track D calls `notifyJobClosed` at the end of the job close flow.

Each call is non-blocking: wrap in `void sendText(...)` or a background `fetch`.

---

## Edge Functions

Create these in `supabase/functions/`. Each is a Deno TypeScript file.

### Daily checks (no Edge Function needed)

Marking breached jobs, breached PM visits (honouring `grace_days`), expiring contracts and refreshing the materialised views are all one SQL function, `fn_daily_checks()`, already in `schema.sql`. Enable the `pg_cron` extension under Database > Extensions, then run once in the SQL editor:

```sql
SELECT cron.schedule('serviceiq-daily', '30 17 * * *', 'SELECT fn_daily_checks()');  -- 23:00 IST
```

Test it any time with `SELECT fn_daily_checks();`. The weekly-renewals function below still needs a scheduler: use Vercel Cron or pg_cron with pg_net.

### `supabase/functions/weekly-renewals/index.ts`

Runs every Monday morning. Sends WhatsApp reminders for contracts expiring in 30 days.

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function sendText(to: string, text: string) {
  await fetch(`https://graph.facebook.com/v18.0/${Deno.env.get('WHATSAPP_PHONE_ID')}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('WHATSAPP_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
  })
}

Deno.serve(async () => {
  const { data: renewals } = await supabase
    .from('mv_renewal_pipeline')
    .select('*')
    .lte('days_until_expiry', 30)
    .gte('days_until_expiry', 0)

  for (const r of renewals ?? []) {
    if (r.customer_phone) {
      await sendText(r.customer_phone,
        `Reminder: Your AMC contract *${r.contract_no}* expires on ${r.valid_to}. ` +
        `Please contact us to renew.`
      )
    }
  }

  return new Response(`sent ${renewals?.length} renewal reminders`, { status: 200 })
})
```

---

## Owner dashboard — `/dashboard`

Show these KPIs at the top (fetch server-side):

```typescript
// All in one pass, parallel
const [tickets, jobs, pmVisits, renewals] = await Promise.all([
  supabase.from('ticket').select('status', { count: 'exact', head: false }).eq('org_id', orgId),
  supabase.from('job').select('breached, current_state_id, workflow_state(is_terminal)', { count: 'exact' }).eq('org_id', orgId),
  supabase.from('pm_visit').select('status', { count: 'exact' }).eq('status', 'pending').lt('due_date', thirtyDaysFromNow),
  supabase.from('v_renewal_pipeline').select('annual_value').eq('org_id', orgId).lte('days_until_expiry', 30),
])
```

KPI cards:
- Open tickets
- Jobs in progress
- SLA breaches today
- PM visits due this month
- Revenue at risk (sum of `annual_value` for renewals expiring in 30 days)
- Average technician rating (from `v_technician_performance`)

Below KPIs, two tables:

**Recent SLA breaches**: jobs where `breached = true`, ordered by `resolution_due` desc, limit 10.

**PM visits overdue**: `pm_visit` where `status = 'pending'` and `due_date < today`, limit 10.

---

## Customer portal — `/portal/[token]/page.tsx`

Public page, no auth required. Customer receives this link via WhatsApp.

```typescript
// Public page. Use the SERVICE ROLE client server-side here (the anon key cannot read tickets under RLS),
// look up by public_token only (never the guessable ticket_no), and select only the fields below.
const { data: ticket } = await supabase
  .from('ticket')
  .select(`
    ticket_no, status, reported_at, fault_description, priority,
    job(
      job_no,
      workflow_state(label),
      job_assignment(person(full_name))
    )
  `)
  .eq('public_token', params.token)
  .single()
```

Show:
- Ticket status (large, prominent)
- Job timeline: each `job_status_event` as a vertical stepper
- Assigned technician name (if assigned)
- Star rating input (1-5) if job is closed and no rating yet

Rating submit:
```typescript
// Use service role key in an API route so the customer can write without login
// POST /api/portal/rate  (body: { token, rating, feedback }). Resolve the job from the ticket's public_token
// on the server; never trust a raw job_id sent by the browser.
await supabase.from('job').update({ customer_rating: rating, customer_feedback: feedback }).eq('job_id', jobId)
```

No customer login. No customer data shown except their own ticket.

---

## Technicians page — `/technicians`

Dispatcher view of all technicians in the org.

```typescript
const { data: members } = await supabase
  .from('org_membership')
  .select(`
    membership_id, role, emp_code, is_active,
    person(
      person_id, full_name, phone, base_city,
      person_skill(level, certified_until, skill(name))
    )
  `)
  .eq('org_id', org.org_id)
  .eq('role', 'technician')
  .eq('is_active', true)
```

Join with `v_technician_performance` by `person_id` to show stats per row.

Table: Name, Phone, Skills (badges), Avg Rating, Jobs Completed, SLA Breaches, Availability toggle.

---

## Parts page — `/parts`

Simple CRUD for the org's part catalog.

```typescript
supabase.from('part').select('*').eq('org_id', org.org_id).order('name')
```

Table: Part No, Name, UOM, Sell Price. Add / Edit / Delete actions.

This page is built here because parts are used by Track D's job close flow and need to be set up before any job can be closed.

---

## What you expose to other tracks

- `sendText`, `notifyTicketRaised`, `notifyTechnicianAssigned`, `notifyJobClosed` from `@/lib/whatsapp`
- `/portal/[public_token]` URL pattern (other tracks link to it)
- Parts page at `/parts` (Track D depends on parts being in the database)

---

## What you do NOT build

- Ticket creation (Track C)
- Job assignment (Track C)
- Technician field close (Track D)
- Equipment and contract pages (Track B)

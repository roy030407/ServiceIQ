import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { JobDetailClient } from './job-detail-client'
import { OfflineBanner } from '@/components/tech/offline-banner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TechJobDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('job')
    .select(`
      job_id, org_id, job_no, unit_id, technician_notes, scheduled_start, breached,
      current_state_id,
      workflow_state(state_id, code, label, allowed_next, is_terminal),
      ticket(ticket_id, ticket_no, priority, fault_description,
        site(name, address, contact_name, contact_phone,
          party(name))),
      equipment_unit(unit_id, serial_no, warranty_end,
        site(name, address, contact_name, contact_phone,
          party(name)),
        product_model(name, brand_name))
    `)
    .eq('job_id', params.id)
    .single()

  if (!job) notFound()

  const resolvedUnitId = job.unit_id ?? (job.equipment_unit as any)?.unit_id ?? null

  let serviceHistory: Array<{
    ticket_no: string
    reported_at: string
    fault_description: string | null
    status: string
  }> = []

  if (resolvedUnitId) {
    const { data: history } = await supabase
      .from('ticket')
      .select('ticket_no, reported_at, fault_description, status')
      .eq('unit_id', resolvedUnitId)
      .order('reported_at', { ascending: false })
      .limit(5)

    serviceHistory = history ?? []
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <OfflineBanner />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link
          href="/tech"
          aria-label="Back to My Jobs"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 active:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-mono text-lg font-bold text-slate-900">{job.job_no}</h1>
          <p className="text-xs text-slate-500">
            {(job.workflow_state as any)?.label ?? 'Active Job'}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4">
        <JobDetailClient job={job as any} serviceHistory={serviceHistory} />
      </main>
    </div>
  )
}
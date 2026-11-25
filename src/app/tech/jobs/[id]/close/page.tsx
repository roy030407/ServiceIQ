import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CloseJobWizard } from './close-job-wizard'
import { OfflineBanner } from '@/components/tech/offline-banner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CloseJobPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: person } = await supabase
    .from('person')
    .select('person_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!person) redirect('/onboard')

  const { data: job } = await supabase
    .from('job')
    .select(`
      job_id, org_id, job_no, unit_id, pm_visit_id, checklist_answers, signature_url,
      job_type(job_type_id, name, checklist_schema, requires_signature, requires_parts)
    `)
    .eq('job_id', params.id)
    .single()

  if (!job) notFound()

  const { data: parts } = await supabase
    .from('part')
    .select('part_id, part_no, name, uom, sell_price')
    .eq('org_id', job.org_id)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <OfflineBanner />

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link
          href={`/tech/jobs/${job.job_id}`}
          aria-label="Back to Job"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Close {job.job_no}</h1>
          <p className="text-xs text-slate-500">
            {(job.job_type as any)?.name ?? 'Service Job'}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4">
        <CloseJobWizard
          job={job as any}
          personId={person.person_id}
          availableParts={parts ?? []}
        />
      </main>
    </div>
  )
}

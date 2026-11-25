import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isToday, isAfter, startOfDay } from 'date-fns'
import { JobsBoardClient } from './jobs-board-client'
import { OfflineBanner } from '@/components/tech/offline-banner'
import type { TechAssignmentItem } from '@/components/tech/job-list-item'
import Link from 'next/link'
import { UserCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TechJobsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: person } = await supabase
    .from('person')
    .select('person_id, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!person) redirect('/onboard')

  const { data: rawAssignments } = await supabase
    .from('job_assignment')
    .select(`
      assignment_id, status, slot_start, slot_end, is_lead,
      job!inner(
        job_id, job_no, scheduled_start, response_due, resolution_due, breached,
        current_state_id,
        workflow_state(code, label, is_terminal),
        ticket(priority, fault_description,
          site(name, address, contact_phone,
            party(name))),
        equipment_unit(serial_no, warranty_end,
          site(name, address, party(name)),
          product_model(name, brand_name))
      )
    `)
    .eq('person_id', person.person_id)
    .in('status', ['offered', 'accepted'])
    .order('slot_start', { ascending: true })

  const activeAssignments = ((rawAssignments as unknown as TechAssignmentItem[]) ?? []).filter(
    (a) => a.job && !a.job.workflow_state?.is_terminal
  )

  const todayStart = startOfDay(new Date())
  const today: TechAssignmentItem[] = []
  const upcoming: TechAssignmentItem[] = []
  const unscheduled: TechAssignmentItem[] = []

  for (const item of activeAssignments) {
    if (!item.slot_start && item.status === 'offered') {
      unscheduled.push(item)
      continue
    }
    const targetDate = item.slot_start
      ? new Date(item.slot_start)
      : item.job.scheduled_start
        ? new Date(item.job.scheduled_start)
        : null

    if (!targetDate) {
      unscheduled.push(item)
    } else if (isToday(targetDate) || targetDate < todayStart) {
      today.push(item)
    } else if (isAfter(targetDate, todayStart)) {
      upcoming.push(item)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <OfflineBanner />

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-xs text-slate-500">{person.full_name}</p>
        </div>
        <Link
          href="/tech/profile"
          aria-label="Technician Profile"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 active:bg-slate-100"
        >
          <UserCircle className="h-6 w-6" />
        </Link>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4">
        <JobsBoardClient
          initialToday={today}
          initialUpcoming={upcoming}
          initialUnscheduled={unscheduled}
        />
      </main>
    </div>
  )
}

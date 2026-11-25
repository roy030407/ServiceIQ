'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JobListItem, type TechAssignmentItem } from '@/components/tech/job-list-item'
import { toast } from 'sonner'

interface JobsBoardClientProps {
  initialToday: TechAssignmentItem[]
  initialUpcoming: TechAssignmentItem[]
  initialUnscheduled: TechAssignmentItem[]
}

export function JobsBoardClient({
  initialToday,
  initialUpcoming,
  initialUnscheduled,
}: JobsBoardClientProps) {
  const router = useRouter()
  const [today, setToday] = useState(initialToday)
  const [upcoming, setUpcoming] = useState(initialUpcoming)
  const [unscheduled, setUnscheduled] = useState(initialUnscheduled)
  const [respondingId, setRespondingId] = useState<string | null>(null)

  async function handleRespond(assignmentId: string, action: 'accepted' | 'declined') {
    setRespondingId(assignmentId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('job_assignment')
        .update({
          status: action,
          responded_at: new Date().toISOString(),
        })
        .eq('assignment_id', assignmentId)

      if (error) {
        if (error.code === '23P01') {
          toast.error('Schedule conflict: you already have an accepted job in this time slot.')
          return
        }
        throw error
      }

      if (action === 'declined') {
        setToday((prev) => prev.filter((a) => a.assignment_id !== assignmentId))
        setUpcoming((prev) => prev.filter((a) => a.assignment_id !== assignmentId))
        setUnscheduled((prev) => prev.filter((a) => a.assignment_id !== assignmentId))
        toast.info('Assignment declined. Dispatcher notified.')
      } else {
        const updateList = (list: TechAssignmentItem[]) =>
          list.map((a) => (a.assignment_id === assignmentId ? { ...a, status: 'accepted' as const } : a))
        setToday(updateList)
        setUpcoming(updateList)
        setUnscheduled(updateList)
        toast.success('Job accepted!')
      }

      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Unable to update assignment. Check your connection.')
    } finally {
      setRespondingId(null)
    }
  }

  const totalCount = today.length + upcoming.length + unscheduled.length

  if (totalCount === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-base font-semibold text-slate-900">No active jobs assigned</p>
        <p className="mt-1 text-sm text-slate-500">
          New assignments from dispatch will appear here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {unscheduled.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Unscheduled / Offered ({unscheduled.length})
          </h2>
          {unscheduled.map((item) => (
            <JobListItem
              key={item.assignment_id}
              assignment={item}
              onRespond={handleRespond}
              responding={respondingId === item.assignment_id}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Today ({today.length})
        </h2>
        {today.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
            No jobs scheduled for today.
          </p>
        ) : (
          today.map((item) => (
            <JobListItem
              key={item.assignment_id}
              assignment={item}
              onRespond={handleRespond}
              responding={respondingId === item.assignment_id}
            />
          ))
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Upcoming ({upcoming.length})
          </h2>
          {upcoming.map((item) => (
            <JobListItem
              key={item.assignment_id}
              assignment={item}
              onRespond={handleRespond}
              responding={respondingId === item.assignment_id}
            />
          ))}
        </section>
      )}
    </div>
  )
}
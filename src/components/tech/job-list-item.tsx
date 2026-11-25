'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Wrench, Clock, AlertTriangle, Check, X } from 'lucide-react'

export interface TechAssignmentItem {
  assignment_id: string
  status: 'offered' | 'accepted' | 'declined' | 'completed'
  slot_start: string | null
  slot_end: string | null
  is_lead: boolean
  job: {
    job_id: string
    job_no: string
    scheduled_start: string | null
    response_due: string | null
    resolution_due: string | null
    breached: boolean
    current_state_id: string | null
    workflow_state: {
      code: string
      label: string
      is_terminal: boolean
    } | null
    ticket: {
      priority: 'P1' | 'P2' | 'P3'
      fault_description: string | null
      site: {
        name: string
        address: string | null
        contact_phone: string | null
        party: { name: string } | null
      } | null
    } | null
    equipment_unit: {
      serial_no: string | null
      warranty_end: string | null
      site?: {
        name: string
        address: string | null
        party: { name: string } | null
      } | null
      product_model: {
        name: string
        brand_name: string | null
      } | null
    } | null
  }
}

interface JobListItemProps {
  assignment: TechAssignmentItem
  onRespond?: (assignmentId: string, action: 'accepted' | 'declined') => Promise<void>
  responding?: boolean
}

const PRIORITY_STYLES: Record<string, string> = {
  P1: 'bg-red-100 text-red-800 border-red-200',
  P2: 'bg-amber-100 text-amber-800 border-amber-200',
  P3: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function JobListItem({ assignment, onRespond, responding }: JobListItemProps) {
  const { job } = assignment
  const site = job.ticket?.site ?? job.equipment_unit?.site
  const customerName = site?.party?.name ?? 'Customer'
  const priority = job.ticket?.priority ?? 'P3'
  const modelName = job.equipment_unit?.product_model
    ? `${job.equipment_unit.product_model.brand_name ?? ''} ${job.equipment_unit.product_model.name}`.trim()
    : 'Equipment'

  const timeDisplay = assignment.slot_start
    ? format(new Date(assignment.slot_start), 'EEE, d MMM • h:mm a')
    : job.scheduled_start
      ? format(new Date(job.scheduled_start), 'EEE, d MMM • h:mm a')
      : 'Unscheduled'

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link href={`/tech/jobs/${job.job_id}`} className="block p-4 active:bg-slate-50">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900">
              {job.job_no}
            </span>
            <Badge variant="outline" className={`text-xs font-semibold ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.P3}`}>
              {priority}
            </Badge>
            {job.breached && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                SLA
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            {job.workflow_state?.label ?? 'Open'}
          </Badge>
        </div>

        <h3 className="text-base font-semibold text-slate-900">{customerName}</h3>

        <div className="mt-2 space-y-1.5 text-sm text-slate-600">
          {site?.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span className="line-clamp-2">{site.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{modelName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{timeDisplay}</span>
          </div>
        </div>
      </Link>

      {assignment.status === 'offered' && onRespond && (
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 p-3">
          <Button
            type="button"
            variant="outline"
            disabled={responding}
            onClick={() => onRespond(assignment.assignment_id, 'declined')}
            className="min-h-[48px] border-red-200 text-base font-semibold text-red-700 hover:bg-red-50"
          >
            <X className="mr-1.5 h-5 w-5" />
            Decline
          </Button>
          <Button
            type="button"
            disabled={responding}
            onClick={() => onRespond(assignment.assignment_id, 'accepted')}
            className="min-h-[48px] bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
          >
            <Check className="mr-1.5 h-5 w-5" />
            Accept
          </Button>
        </div>
      )}
    </div>
  )
}
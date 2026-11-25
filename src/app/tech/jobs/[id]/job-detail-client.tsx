'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { enqueue } from '@/lib/offline-queue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  MapPin,
  Wrench,
  History,
  Navigation,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

const BUTTON_LABELS: Record<string, string> = {
  en_route: 'I am on my way',
  on_site: 'I have arrived',
  awaiting_parts: 'Waiting for parts',
  closed: 'Close job',
}

interface JobDetailClientProps {
  job: {
    job_id: string
    job_no: string
    technician_notes: string | null
    workflow_state: {
      state_id: string
      code: string
      label: string
      allowed_next: string[]
      is_terminal: boolean
    } | null
    ticket: {
      priority: string
      fault_description: string | null
      site: {
        name: string
        address: string | null
        contact_name: string | null
        contact_phone: string | null
        party: { name: string } | null
      } | null
    } | null
    equipment_unit: {
      serial_no: string | null
      warranty_end: string | null
      site: {
        name: string
        address: string | null
        contact_name: string | null
        contact_phone: string | null
        party: { name: string } | null
      } | null
      product_model: {
        name: string
        brand_name: string | null
      } | null
    } | null
  }
  serviceHistory: Array<{
    ticket_no: string
    reported_at: string
    fault_description: string | null
    status: string
  }>
}

export function JobDetailClient({ job, serviceHistory }: JobDetailClientProps) {
  const router = useRouter()
  const [currentState, setCurrentState] = useState(job.workflow_state)
  const [transitioning, setTransitioning] = useState<string | null>(null)
  const [notes, setNotes] = useState(job.technician_notes ?? '')
  const [savingNotes, setSavingNotes] = useState<'idle' | 'saving' | 'saved'>('idle')
  const isFirstRender = useRef(true)

  const site = job.ticket?.site ?? job.equipment_unit?.site
  const customerName = site?.party?.name ?? 'Customer'
  const unit = job.equipment_unit
  const warrantyActive =
    unit?.warranty_end && new Date(unit.warranty_end) >= new Date()

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setSavingNotes('saving')
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('job')
          .update({ technician_notes: notes })
          .eq('job_id', job.job_id)

        if (error) throw error
        setSavingNotes('saved')
      } catch {
        setSavingNotes('idle')
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [notes, job.job_id])

  function getPosition(): Promise<{ lat?: number; lng?: number }> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve({})
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 30000 }
      )
    })
  }

  async function handleStatusAction(toStateCode: string) {
    if (toStateCode === 'closed') {
      router.push(`/tech/jobs/${job.job_id}/close`)
      return
    }

    setTransitioning(toStateCode)
    const { lat, lng } = await getPosition()

    try {
      if (!navigator.onLine) {
        throw new Error('Offline')
      }

      const res = await fetch(`/api/jobs/${job.job_id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStateCode,
          geoLat: lat,
          geoLng: lng,
          geo_lat: lat,
          geo_lng: lng,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Transition failed')
      }

      toast.success(`Status updated to ${BUTTON_LABELS[toStateCode] || toStateCode}`)
      router.refresh()
    } catch {
      enqueue({
        type: 'transition',
        payload: {
          jobId: job.job_id,
          toStateCode,
          geoLat: lat,
          geoLng: lng,
        },
      })

      const optimisticNextMap: Record<string, string[]> = {
        en_route: ['on_site'],
        on_site: ['awaiting_parts', 'closed'],
        awaiting_parts: ['on_site'],
      }

      setCurrentState((prev) =>
        prev
          ? {
              ...prev,
              code: toStateCode,
              label:
                toStateCode === 'en_route'
                  ? 'En Route'
                  : toStateCode === 'on_site'
                    ? 'On Site'
                    : toStateCode === 'awaiting_parts'
                      ? 'Awaiting Parts'
                      : prev.label,
              allowed_next: optimisticNextMap[toStateCode] ?? [],
            }
          : prev
      )
      toast.warning('Saved offline — will sync automatically when signal returns.')
    } finally {
      setTransitioning(null)
    }
  }

  const allowedActions = (currentState?.allowed_next ?? []).filter(
    (code) => code !== 'cancelled' && code !== 'skipped'
  )

  return (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className="grid h-12 w-full grid-cols-3 rounded-xl bg-slate-200/80 p-1">
        <TabsTrigger value="status" className="min-h-[40px] rounded-lg text-sm font-semibold">
          Status
        </TabsTrigger>
        <TabsTrigger value="details" className="min-h-[40px] rounded-lg text-sm font-semibold">
          Details
        </TabsTrigger>
        <TabsTrigger value="notes" className="min-h-[40px] rounded-lg text-sm font-semibold">
          Notes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="mt-4 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Current Status
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {currentState?.label ?? 'Open'}
          </p>
          {site && (
            <p className="mt-2 text-sm text-slate-600">
              {customerName} — {site.name}
            </p>
          )}
        </div>

        {currentState?.is_terminal ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">This job is completed.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {allowedActions.map((code) => {
              const isClose = code === 'closed'
              return (
                <Button
                  key={code}
                  type="button"
                  disabled={transitioning !== null}
                  onClick={() => handleStatusAction(code)}
                  variant={code === 'awaiting_parts' ? 'outline' : 'default'}
                  className={`min-h-[56px] w-full rounded-xl text-base font-bold shadow-sm ${
                    isClose ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''
                  }`}
                >
                  {transitioning === code ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      {!isClose && <Navigation className="mr-2 h-5 w-5" />}
                      {BUTTON_LABELS[code] ?? code}
                    </>
                  )}
                </Button>
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="details" className="mt-4 space-y-4">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer & Site
              </p>
              <h2 className="mt-0.5 text-base font-bold text-slate-900">
                {customerName}
              </h2>
              <p className="text-sm font-medium text-slate-700">{site?.name}</p>
            </div>
            {job.ticket?.priority && (
              <Badge variant="outline" className="font-semibold">
                {job.ticket.priority}
              </Badge>
            )}
          </div>

          {site?.address && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>{site.address}</span>
            </div>
          )}

          {site?.contact_phone && (
            <a
              href={`tel:${site.contact_phone}`}
              className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white active:bg-blue-700"
            >
              <Phone className="h-5 w-5" />
              Call Site Contact
              {site.contact_name ? ` (${site.contact_name})` : ''}
            </a>
          )}
        </div>

        {job.ticket?.fault_description && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Reported Fault
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
              {job.ticket.fault_description}
            </p>
          </div>
        )}

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Wrench className="h-4 w-4" />
            <span>Equipment</span>
          </div>
          <p className="text-base font-bold text-slate-900">
            {unit?.product_model
              ? `${unit.product_model.brand_name ?? ''} ${unit.product_model.name}`.trim()
              : 'Unassigned Unit'}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-sm">
            <div>
              <span className="text-slate-400">Serial No:</span>
              <p className="font-mono font-medium text-slate-800">
                {unit?.serial_no || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Warranty End:</span>
              <p className="flex items-center gap-1 font-medium text-slate-800">
                {unit?.warranty_end
                  ? format(new Date(unit.warranty_end), 'dd MMM yyyy')
                  : 'N/A'}
                {warrantyActive && (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <History className="h-4 w-4" />
            <span>Equipment Service History (Last 5)</span>
          </div>

          {serviceHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No prior service tickets recorded.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {serviceHistory.map((item) => (
                <div key={item.ticket_no} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-900">
                      {item.ticket_no}
                    </span>
                    <span className="text-slate-400">
                      {format(new Date(item.reported_at), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                    {item.fault_description || 'No description'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="notes" className="mt-4">
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <label htmlFor="tech-notes" className="text-sm font-semibold text-slate-900">
              Technician Field Notes
            </label>
            <span className="text-xs text-slate-400">
              {savingNotes === 'saving'
                ? 'Saving...'
                : savingNotes === 'saved'
                  ? 'Saved'
                  : 'Auto-saves'}
            </span>
          </div>
          <textarea
            id="tech-notes"
            rows={7}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record diagnostics, observations, or follow-up recommendations..."
            className="w-full rounded-xl border border-slate-300 p-3 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}

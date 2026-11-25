'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { enqueue } from '@/lib/offline-queue'
import { ChecklistForm, type ChecklistSchemaItem } from '@/components/tech/checklist-form'
import { PhotoUpload } from '@/components/tech/photo-upload'
import { SignaturePad } from '@/components/tech/signature-pad'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Star,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

interface PartCatalogItem {
  part_id: string
  part_no: string | null
  name: string
  uom: string
  sell_price: number | null
}

interface UsedPartEntry {
  localId: string
  partId: string
  partName: string
  quantity: number
  unitPrice: number
  isChargeable: boolean
  entitlementChecked: boolean
  checkingEntitlement: boolean
  coverageSource: 'amc' | 'warranty' | 'none'
  coverageExplanation: string
  contractId?: string | null
  ruleId?: string | null
}

interface CloseJobWizardProps {
  job: {
    job_id: string
    org_id: string
    job_no: string
    unit_id: string | null
    pm_visit_id: string | null
    checklist_answers: Record<string, any> | null
    signature_url: string | null
    job_type: {
      checklist_schema: ChecklistSchemaItem[]
      requires_signature: boolean
      requires_parts: boolean
    } | null
  }
  personId: string
  availableParts: PartCatalogItem[]
}

const STEPS = ['Checklist', 'Photos', 'Parts', 'Signature'] as const

export function CloseJobWizard({
  job,
  personId,
  availableParts,
}: CloseJobWizardProps) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [isRatingStep, setIsRatingStep] = useState(false)

  const schema = job.job_type?.checklist_schema ?? []
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, any>>(
    job.checklist_answers ?? {}
  )

  const requiresSignature = job.job_type?.requires_signature ?? true
  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string | null>(null)
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string | null>(null)

  const [partsUsed, setPartsUsed] = useState<UsedPartEntry[]>([])
  const [partSearch, setPartSearch] = useState('')
  const [selectedCatalogId, setSelectedCatalogId] = useState('')

  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(
    job.signature_url
  )
  const [submitting, setSubmitting] = useState(false)

  const [rating, setRating] = useState<number>(5)
  const [feedback, setFeedback] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  const filteredCatalog = availableParts.filter((p) =>
    `${p.name} ${p.part_no ?? ''}`.toLowerCase().includes(partSearch.toLowerCase())
  )

  function handleAddPart() {
    const part = availableParts.find((p) => p.part_id === selectedCatalogId)
    if (!part) return

    setPartsUsed((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        partId: part.part_id,
        partName: part.name,
        quantity: 1,
        unitPrice: Number(part.sell_price ?? 0),
        isChargeable: true,
        entitlementChecked: false,
        checkingEntitlement: false,
        coverageSource: 'none',
        coverageExplanation: 'Not checked yet',
      },
    ])
    setSelectedCatalogId('')
    setPartSearch('')
  }

  async function checkPartEntitlement(localId: string, partName: string) {
    if (!job.unit_id) {
      setPartsUsed((prev) =>
        prev.map((p) =>
          p.localId === localId
            ? {
                ...p,
                entitlementChecked: true,
                coverageSource: 'none',
                coverageExplanation: 'No unit linked to job',
                isChargeable: true,
              }
            : p
        )
      )
      return
    }

    setPartsUsed((prev) =>
      prev.map((p) => (p.localId === localId ? { ...p, checkingEntitlement: true } : p))
    )

    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('fn_check_entitlement', {
        p_unit_id: job.unit_id,
        p_part_category: partName,
        p_scope: 'part_category',
      })

      if (error) throw error

      const covered = Boolean(data?.covered)
      setPartsUsed((prev) =>
        prev.map((p) =>
          p.localId === localId
            ? {
                ...p,
                checkingEntitlement: false,
                entitlementChecked: true,
                isChargeable: !covered,
                coverageSource: data?.source ?? 'none',
                coverageExplanation: data?.explanation ?? '',
                contractId: data?.contract_id ?? null,
                ruleId: data?.rule_id ?? null,
              }
            : p
        )
      )
    } catch {
      setPartsUsed((prev) =>
        prev.map((p) =>
          p.localId === localId
            ? {
                ...p,
                checkingEntitlement: false,
                coverageExplanation: 'Offline — defaulted to chargeable',
              }
            : p
        )
      )
      toast.error('Could not check entitlement (offline)')
    }
  }

  function validateStep(step: number): boolean {
    if (step === 0) {
      for (const item of schema) {
        if (item.type !== 'bool') {
          const val = checklistAnswers[item.key]
          if (val === undefined || val === null || val === '') {
            toast.error(`Please fill out: ${item.label}`)
            return false
          }
        }
      }
      return true
    }
    if (step === 1 && requiresSignature) {
      if (!beforePhotoUrl || !afterPhotoUrl) {
        toast.error('Both Before and After photos are required before continuing.')
        return false
      }
    }
    return true
  }

  function handleNext() {
    if (!validateStep(stepIndex)) return
    setStepIndex((s) => Math.min(STEPS.length - 1, s + 1))
  }

  async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl)
    return res.blob()
  }

  async function handleCloseJob() {
    if (requiresSignature && !signatureDataUrl && !uploadedSignatureUrl) {
      toast.error('Please capture customer signature and tap Done.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    try {
      let finalSigUrl = uploadedSignatureUrl
      if (signatureDataUrl && navigator.onLine) {
        const blob = await dataUrlToBlob(signatureDataUrl)
        const sigPath = `${job.org_id}/${job.job_id}/signature-${Date.now()}.png`
        const { error: sigErr } = await supabase.storage
          .from('job-attachments')
          .upload(sigPath, blob, { contentType: 'image/png', upsert: true })

        if (!sigErr) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('job-attachments').getPublicUrl(sigPath)
          finalSigUrl = publicUrl
          setUploadedSignatureUrl(publicUrl)
        }
      }

      if (!navigator.onLine) {
        throw new Error('Offline')
      }

      const { error: jobUpdateErr } = await supabase
        .from('job')
        .update({
          checklist_answers: checklistAnswers,
          ...(finalSigUrl ? { signature_url: finalSigUrl } : {}),
        })
        .eq('job_id', job.job_id)

      if (jobUpdateErr) throw jobUpdateErr

      for (const part of partsUsed) {
        let covered = !part.isChargeable
        let source = part.coverageSource
        let explanation = part.coverageExplanation
        let contractId = part.contractId ?? null
        let ruleId = part.ruleId ?? null

        if (!part.entitlementChecked && job.unit_id) {
          const { data: ent } = await supabase.rpc('fn_check_entitlement', {
            p_unit_id: job.unit_id,
            p_part_category: part.partName,
            p_scope: 'part_category',
          })
          if (ent) {
            covered = Boolean(ent.covered)
            source = ent.source ?? 'none'
            explanation = ent.explanation ?? ''
            contractId = ent.contract_id ?? null
            ruleId = ent.rule_id ?? null
          }
        }

        const { error: partErr } = await supabase.from('job_part').insert({
          job_id: job.job_id,
          part_id: part.partId,
          contract_id: contractId,
          rule_id: ruleId,
          quantity: part.quantity,
          unit_price: part.unitPrice,
          is_chargeable: part.entitlementChecked ? part.isChargeable : !covered,
          coverage_source: source,
          coverage_explanation: explanation,
        })
        if (partErr) throw partErr
      }

      const transitionRes = await fetch(`/api/jobs/${job.job_id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStateCode: 'closed' }),
      })
      if (!transitionRes.ok) throw new Error('Failed to close job state')

      await supabase
        .from('job_assignment')
        .update({ status: 'completed' })
        .eq('job_id', job.job_id)
        .eq('person_id', personId)
        .eq('status', 'accepted')

      if (job.pm_visit_id) {
        await supabase
          .from('pm_visit')
          .update({ status: 'done' })
          .eq('pm_visit_id', job.pm_visit_id)
      }

      toast.success('Job closed successfully!')
      setIsRatingStep(true)
    } catch {
      enqueue({
        type: 'checklist',
        payload: { jobId: job.job_id, checklistAnswers },
      })

      for (const part of partsUsed) {
        enqueue({
          type: 'part',
          payload: {
            job_id: job.job_id,
            part_id: part.partId,
            quantity: part.quantity,
            unit_price: part.unitPrice,
            is_chargeable: part.isChargeable,
            coverage_source: part.coverageSource,
            coverage_explanation: part.coverageExplanation,
          },
        })
      }

      enqueue({
        type: 'transition',
        payload: { jobId: job.job_id, toStateCode: 'closed' },
      })

      toast.warning('Offline: Job closure queued and will sync automatically when back online.')
      setIsRatingStep(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitRating(skip = false) {
    if (skip) {
      router.push('/tech')
      router.refresh()
      return
    }

    setSubmittingRating(true)
    try {
      if (!navigator.onLine) throw new Error('Offline')
      const supabase = createClient()
      const { error } = await supabase
        .from('job')
        .update({
          customer_rating: rating,
          customer_feedback: feedback || null,
        })
        .eq('job_id', job.job_id)

      if (error) throw error
      toast.success('Thank you for your feedback!')
    } catch {
      enqueue({
        type: 'rating',
        payload: { jobId: job.job_id, rating, feedback: feedback || null },
      })
      toast.info('Rating saved offline.')
    } finally {
      setSubmittingRating(false)
      router.push('/tech')
      router.refresh()
    }
  }

  if (isRatingStep) {
    return (
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Job Closed</h2>
          <p className="mt-1 text-sm text-slate-500">
            Please ask the customer to rate today&apos;s service
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="flex h-12 w-12 items-center justify-center rounded-xl active:scale-95"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={`h-9 w-9 ${
                  star <= rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional customer comments..."
          className="w-full rounded-xl border border-slate-300 p-3 text-base"
        />

        <div className="space-y-2.5">
          <Button
            type="button"
            disabled={submittingRating}
            onClick={() => handleSubmitRating(false)}
            className="min-h-[52px] w-full text-base font-bold"
          >
            {submittingRating ? 'Submitting...' : 'Submit Rating & Finish'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleSubmitRating(true)}
            className="min-h-[44px] w-full text-sm text-slate-500"
          >
            Skip rating
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]}
          </span>
          <span>{Math.round(((stepIndex + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => idx < stepIndex && setStepIndex(idx)}
              className={`h-2.5 rounded-full transition-colors ${
                idx <= stepIndex ? 'bg-slate-900' : 'bg-slate-200'
              }`}
              aria-label={`Go to ${label}`}
            />
          ))}
        </div>
      </div>

      {stepIndex === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">1. Service Checklist</h2>
          <ChecklistForm
            schema={schema}
            answers={checklistAnswers}
            onChange={setChecklistAnswers}
          />
        </div>
      )}

      {stepIndex === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">2. Before & After Photos</h2>
            <p className="text-sm text-slate-500">
              {requiresSignature
                ? 'Both photos are required to close this job.'
                : 'Capture photos of the work performed.'}
            </p>
          </div>
          <PhotoUpload
            orgId={job.org_id}
            jobId={job.job_id}
            kind="before_photo"
            label="Before Photo"
            required={requiresSignature}
            uploadedUrl={beforePhotoUrl}
            onUploaded={setBeforePhotoUrl}
          />
          <PhotoUpload
            orgId={job.org_id}
            jobId={job.job_id}
            kind="after_photo"
            label="After Photo"
            required={requiresSignature}
            uploadedUrl={afterPhotoUrl}
            onUploaded={setAfterPhotoUrl}
          />
        </div>
      )}

      {stepIndex === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">3. Parts Consumed</h2>
            <p className="text-sm text-slate-500">
              Add spare parts used and verify AMC/Warranty coverage.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <Input
              type="search"
              placeholder="Search part name or code..."
              value={partSearch}
              onChange={(e) => setPartSearch(e.target.value)}
              className="min-h-[48px] text-base"
            />
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base"
            >
              <option value="">Select a part ({filteredCatalog.length})...</option>
              {filteredCatalog.map((part) => (
                <option key={part.part_id} value={part.part_id}>
                  {part.name} {part.part_no ? `(${part.part_no})` : ''} — ₹
                  {part.sell_price ?? 0}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={!selectedCatalogId}
              onClick={handleAddPart}
              className="min-h-[48px] w-full text-base font-semibold"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Part
            </Button>
          </div>

          {partsUsed.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
              No parts added. Tap Next if no spare parts were used.
            </p>
          ) : (
            <div className="space-y-3">
              {partsUsed.map((part) => (
                <div
                  key={part.localId}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{part.partName}</p>
                      <p className="text-xs text-slate-500">
                        Unit Price: ₹{part.unitPrice}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPartsUsed((prev) =>
                          prev.filter((p) => p.localId !== part.localId)
                        )
                      }
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                      aria-label="Remove part"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min={1}
                        step="1"
                        value={part.quantity}
                        onChange={(e) =>
                          setPartsUsed((prev) =>
                            prev.map((p) =>
                              p.localId === part.localId
                                ? { ...p, quantity: Math.max(1, Number(e.target.value)) }
                                : p
                            )
                          )
                        }
                        className="mt-1 min-h-[44px] text-base"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={part.checkingEntitlement}
                        onClick={() =>
                          checkPartEntitlement(part.localId, part.partName)
                        }
                        className="min-h-[44px] text-sm font-semibold"
                      >
                        {part.checkingEntitlement
                          ? 'Checking...'
                          : 'Check Entitlement'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-xs">
                      {part.entitlementChecked && !part.isChargeable ? (
                        <>
                          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="font-medium text-emerald-800">
                            {part.coverageExplanation}
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                          <span className="text-slate-700">
                            {part.coverageExplanation}
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPartsUsed((prev) =>
                          prev.map((p) =>
                            p.localId === part.localId
                              ? { ...p, isChargeable: !p.isChargeable }
                              : p
                          )
                        )
                      }
                      className="min-h-[36px]"
                    >
                      <Badge
                        variant={part.isChargeable ? 'destructive' : 'default'}
                        className="cursor-pointer px-3 py-1 text-xs"
                      >
                        {part.isChargeable ? 'Chargeable (Tap to override)' : 'Covered (Free)'}
                      </Badge>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {stepIndex === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">4. Customer Signature</h2>
            <p className="text-sm text-slate-500">
              Hand your phone to the customer to sign off on the work.
            </p>
          </div>
          <SignaturePad
            existingUrl={uploadedSignatureUrl}
            onCapture={(dataUrl) => {
              setSignatureDataUrl(dataUrl)
              toast.success('Signature captured')
            }}
          />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white p-4">
        <div className="mx-auto flex max-w-lg gap-3">
          {stepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setStepIndex((s) => s - 1)}
              className="min-h-[52px] flex-1 text-base font-semibold"
            >
              Back
            </Button>
          )}

          {stepIndex < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="min-h-[52px] flex-1 text-base font-bold"
            >
              Next: {STEPS[stepIndex + 1]}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={submitting}
              onClick={handleCloseJob}
              className="min-h-[52px] flex-1 bg-emerald-600 text-base font-bold text-white hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Closing Job...
                </>
              ) : (
                'Complete & Close Job'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
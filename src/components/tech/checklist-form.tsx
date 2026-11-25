'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'

export interface ChecklistSchemaItem {
  key: string
  label: string
  type: 'bool' | 'number' | 'text'
}

interface ChecklistFormProps {
  schema: ChecklistSchemaItem[]
  answers: Record<string, any>
  onChange: (updated: Record<string, any>) => void
}

export function ChecklistForm({ schema, answers, onChange }: ChecklistFormProps) {
  if (!schema || schema.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No checklist items configured for this job type. You can proceed to the next step.
      </div>
    )
  }

  const updateField = (key: string, value: any) => {
    onChange({ ...answers, [key]: value })
  }

  return (
    <div className="space-y-4">
      {schema.map((item) => {
        const val = answers[item.key]

        if (item.type === 'bool') {
          const checked = Boolean(val)
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => updateField(item.key, !checked)}
              className={`flex min-h-[56px] w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                checked
                  ? 'border-emerald-600 bg-emerald-50/70'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <span className="pr-3 text-base font-medium text-slate-900">
                {item.label}
              </span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                  checked
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {checked && <Check className="h-4 w-4 stroke-[3]" />}
              </span>
            </button>
          )
        }

        return (
          <div
            key={item.key}
            className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
          >
            <Label htmlFor={item.key} className="text-base font-medium text-slate-900">
              {item.label}
            </Label>
            <Input
              id={item.key}
              type={item.type}
              inputMode={item.type === 'number' ? 'decimal' : 'text'}
              value={val ?? ''}
              onChange={(e) =>
                updateField(
                  item.key,
                  item.type === 'number'
                    ? e.target.value === ''
                      ? ''
                      : Number(e.target.value)
                    : e.target.value
                )
              }
              placeholder={item.type === 'number' ? '0.0' : 'Enter details...'}
              className="min-h-[48px] text-base"
            />
          </div>
        )
      })}
    </div>
  )
}

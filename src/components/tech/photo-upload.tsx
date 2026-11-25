'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PhotoUploadProps {
  orgId: string
  jobId: string
  kind: 'before_photo' | 'after_photo'
  label: string
  required?: boolean
  uploadedUrl?: string | null
  onUploaded: (publicUrl: string) => void
}

export function PhotoUpload({
  orgId,
  jobId,
  kind,
  label,
  required = false,
  uploadedUrl,
  onUploaded,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(uploadedUrl ?? null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${orgId}/${jobId}/${kind}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('job-attachments')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('job-attachments').getPublicUrl(path)

      const { error: rpcError } = await supabase.rpc('fn_append_attachment', {
        p_job_id: jobId,
        p_url: publicUrl,
      })

      if (rpcError) throw rpcError

      setPreviewUrl(publicUrl)
      onUploaded(publicUrl)
      toast.success(`${label} uploaded`)
    } catch (err: any) {
      toast.error(err?.message || `Failed to upload ${label.toLowerCase()}`)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-base font-semibold text-slate-900">
          {label} {required && <span className="text-red-600">*</span>}
        </span>
        {previewUrl && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Attached
          </span>
        )}
      </div>

      {previewUrl && (
        <div className="mb-3 overflow-hidden rounded-lg border border-slate-200">
          <img
            src={previewUrl}
            alt={label}
            className="h-44 w-full object-cover"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-base font-medium text-slate-700 active:bg-slate-100 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading photo...
          </>
        ) : (
          <>
            <Camera className="h-5 w-5" />
            {previewUrl ? `Retake ${label}` : `Capture ${label}`}
          </>
        )}
      </button>
    </div>
  )
}
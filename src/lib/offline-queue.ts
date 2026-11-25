'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type OfflineActionType = 'transition' | 'notes' | 'close_job' | 'checklist' | 'part' | 'rating'

export interface QueuedAction {
  id: string
  type: OfflineActionType
  payload: Record<string, any>
  createdAt: number
}

const QUEUE_KEY = 'serviceiq_offline_queue'
const QUEUE_EVENT = 'serviceiq_queue_updated'

export function getQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function enqueue(action: Omit<QueuedAction, 'id' | 'createdAt'>): QueuedAction {
  const queue = getQueue()
  const item: QueuedAction = {
    ...action,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  }
  queue.push(item)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  window.dispatchEvent(new Event(QUEUE_EVENT))
  return item
}

export function dequeue(id: string) {
  const queue = getQueue().filter((a) => a.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  window.dispatchEvent(new Event(QUEUE_EVENT))
}

export async function flushOfflineQueue(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0
  const queue = getQueue()
  if (queue.length === 0) return 0

  const supabase = createClient()
  let syncedCount = 0

  for (const action of queue) {
    try {
      if (action.type === 'transition') {
        const res = await fetch(`/api/jobs/${action.payload.jobId}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toStateCode: action.payload.toStateCode,
            geoLat: action.payload.geoLat,
            geoLng: action.payload.geoLng,
            geo_lat: action.payload.geoLat,
            geo_lng: action.payload.geoLng,
            syncedOffline: true,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        dequeue(action.id)
        syncedCount++
      } else if (action.type === 'notes') {
        const { error } = await supabase
          .from('job')
          .update({ technician_notes: action.payload.technicianNotes })
          .eq('job_id', action.payload.jobId)
        if (error) throw error
        dequeue(action.id)
        syncedCount++
      } else if (action.type === 'checklist') {
        const { error } = await supabase
          .from('job')
          .update({ checklist_answers: action.payload.checklistAnswers })
          .eq('job_id', action.payload.jobId)
        if (error) throw error
        dequeue(action.id)
        syncedCount++
      } else if (action.type === 'part') {
        const { error } = await supabase.from('job_part').insert(action.payload)
        if (error) throw error
        dequeue(action.id)
        syncedCount++
      } else if (action.type === 'rating') {
        const { error } = await supabase
          .from('job')
          .update({
            customer_rating: action.payload.rating,
            customer_feedback: action.payload.feedback,
          })
          .eq('job_id', action.payload.jobId)
        if (error) throw error
        dequeue(action.id)
        syncedCount++
      }
    } catch {
      break
    }
  }

  return syncedCount
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)

  const refreshCount = useCallback(() => {
    setPendingCount(getQueue().length)
  }, [])

  const syncNow = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    setIsSyncing(true)
    try {
      await flushOfflineQueue()
      refreshCount()
    } finally {
      setIsSyncing(false)
    }
  }, [refreshCount])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    refreshCount()

    const handleOnline = () => {
      setIsOnline(true)
      syncNow()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener(QUEUE_EVENT, refreshCount)

    if (navigator.onLine) {
      syncNow()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(QUEUE_EVENT, refreshCount)
    }
  }, [refreshCount, syncNow])

  return { isOnline, pendingCount, isSyncing, syncNow }
}

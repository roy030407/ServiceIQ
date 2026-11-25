'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { useOfflineQueue } from '@/lib/offline-queue'

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineQueue()

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 text-sm font-medium ${
        !isOnline ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>
              You are offline. Actions will sync when connected
              {pendingCount > 0 ? ` (${pendingCount} queued)` : ''}.
            </span>
          </>
        ) : (
          <>
            <RefreshCw className={`h-4 w-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? `Syncing ${pendingCount} offline action(s)...`
                : `${pendingCount} offline action(s) pending sync`}
            </span>
          </>
        )}
      </div>
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          type="button"
          onClick={syncNow}
          className="ml-3 min-h-[36px] rounded bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
        >
          Sync now
        </button>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_META, type OrderStatus } from '@/types'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  orderId: string
  currentStatus: OrderStatus
}

export default function AdminStatusPanel({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<OrderStatus>(currentStatus)
  const [loading, setLoading]   = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [error,   setError]     = useState<string | null>(null)

  async function applyStatus(newStatus: OrderStatus) {
    if (newStatus === selected) return
    setSelected(newStatus)
    setSaved(false)
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Update failed')
      }
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSelected(currentStatus) // revert optimistic
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Order Status</h2>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />}
        {saved && !loading && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Click to change status. Client gets an SMS notification automatically.
      </p>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2">
        {(Object.entries(STATUS_META) as [OrderStatus, { label: string; className: string }][]).map(
          ([key, meta]) => {
            const isActive = selected === key
            return (
              <button
                key={key}
                type="button"
                disabled={loading}
                onClick={() => applyStatus(key)}
                className={`
                  rounded-xl border-2 px-4 py-3 text-sm font-semibold text-left
                  flex items-center justify-between transition-all
                  disabled:opacity-60 disabled:cursor-not-allowed
                  ${isActive
                    ? `${meta.className} border-teal-400 shadow-sm`
                    : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'}
                `}
              >
                <span>{meta.label}</span>
                {isActive && (
                  <span className="flex items-center gap-1 text-xs font-bold opacity-80">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Current
                  </span>
                )}
              </button>
            )
          }
        )}
      </div>
    </div>
  )
}

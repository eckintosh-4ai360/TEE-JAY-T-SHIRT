'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_META, type OrderStatus } from '@/types'
import { Loader2 } from 'lucide-react'

interface Props {
  orderId: string
  currentStatus: OrderStatus
}

export default function OrderStatusSelect({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const meta = STATUS_META[currentStatus]

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className={`appearance-none rounded-full px-3 py-1 pr-8 text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 ${meta?.className || 'bg-slate-100 text-slate-700'}`}
      >
        {(Object.entries(STATUS_META) as [OrderStatus, { label: string }][]).map(([key, m]) => (
          <option key={key} value={key}>
            {m.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-70">
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </div>
  )
}

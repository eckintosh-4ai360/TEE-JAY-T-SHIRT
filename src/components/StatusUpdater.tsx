'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_META, type OrderStatus } from '@/types'

interface StatusUpdaterProps {
  orderId: string
  current: string
}

export default function StatusUpdater({ orderId, current }: StatusUpdaterProps) {
  const [value, setValue] = useState<OrderStatus>(current as OrderStatus)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleChange = async (next: OrderStatus) => {
    setValue(next)
    startTransition(async () => {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      {isPending && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      )}
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <option key={key} value={key}>{meta.label}</option>
        ))}
      </select>
    </div>
  )
}

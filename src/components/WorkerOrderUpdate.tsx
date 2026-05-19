'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_META, type OrderStatus, type SerializedOrder } from '@/types'
import { fmtDate, getServiceLabel, getStatusLabel } from '@/lib/utils'
import { Loader2, ChevronLeft, Printer, Camera } from 'lucide-react'
import Link from 'next/link'

interface Props { order: SerializedOrder }

export default function WorkerOrderUpdate({ order }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(order.status as OrderStatus)
  const [notes,  setNotes]  = useState(order.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const isPrinting = order.serviceCategory === 'PRINTING'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true); setSaved(false)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Error') }
      setSaved(true)
      router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/worker" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 mb-3">
          <ChevronLeft className="h-4 w-4" /> My orders
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isPrinting ? 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'}`}>
            {isPrinting ? <Printer className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">{order.clientName}</h1>
        </div>
        <p className="text-sm text-slate-500">{getServiceLabel(order)} · <span className="font-mono">{order.receiptNumber}</span></p>
      </div>

      {/* Order info — NO pricing shown to worker */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 space-y-3 text-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Order Details</h2>
        {[
          { label: 'Client',      value: order.clientName  },
          { label: 'Phone',       value: order.clientPhone },
          { label: 'Service',     value: getServiceLabel(order) },
          { label: 'Description', value: order.description },
          { label: 'Due Date',    value: fmtDate(order.dueDate) },
        ].map(({ label, value }) => value ? (
          <div key={label} className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2.5 last:border-0 last:pb-0">
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[200px]">{value}</span>
          </div>
        ) : null)}

        {isPrinting && order.colors.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Colour Breakdown</p>
            <div className="space-y-1">
              {order.colors.map(c => (
                <div key={c.id} className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{c.name}</span>
                  <span className="font-semibold tabular-nums">{c.qty} pcs</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100 dark:border-white/5">
                <span>Total pieces</span>
                <span>{order.totalQty}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status update form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Update Status</h2>
        {error   && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {saved   && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">✓ Saved successfully</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.entries(STATUS_META) as [OrderStatus, { label: string; className: string }][]).map(([key, meta]) => (
            <button key={key} type="button" onClick={() => setStatus(key)}
              className={`rounded-xl border-2 py-3 px-3 text-sm font-semibold transition-all ${status === key ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500' : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'}`}>
              {meta.label}
            </button>
          ))}
        </div>

        <div>
          <label className="label" htmlFor="wNotes">Notes / Progress Update</label>
          <textarea id="wNotes" className="input resize-none" rows={3} value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="Add progress notes or any updates…" />
        </div>

        <button type="submit" disabled={loading}
          className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-50 transition-colors flex items-center gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Update'}
        </button>
      </form>
    </div>
  )
}

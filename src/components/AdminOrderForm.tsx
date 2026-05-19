'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { computeTotals, fmtCurrency } from '@/lib/utils'
import {
  STATUS_META, PRINTING_TYPES, PHOTOGRAPHY_TYPES,
  type OrderStatus, type ServiceCategory, type PrintingType, type PhotographyType,
  type SerializedOrder, type ColorEntry
} from '@/types'
import { Plus, X } from 'lucide-react'

interface Props { order?: SerializedOrder; workers?: { id: string; name: string }[] }
interface FormColor extends ColorEntry { _key: number }
let _keyCounter = 200
const mkColor = (): FormColor => ({ _key: _keyCounter++, name: '', qty: 0 })

function initColors(order?: SerializedOrder): FormColor[] {
  if (order?.colors.length) return order.colors.map(c => ({ ...c, _key: _keyCounter++ }))
  return [{ name: 'Black', qty: 0, _key: _keyCounter++ }]
}

export default function AdminOrderForm({ order, workers = [] }: Props) {
  const router = useRouter()
  const isEdit = Boolean(order)

  const [service,    setService]    = useState<ServiceCategory>((order?.serviceCategory as ServiceCategory) ?? 'PRINTING')
  const [printType,  setPrintType]  = useState<PrintingType | ''>((order?.printingType as PrintingType) ?? '')
  const [printOther, setPrintOther] = useState(order?.printingTypeOther ?? '')
  const [photoType,  setPhotoType]  = useState<PhotographyType | ''>((order?.photographyType as PhotographyType) ?? '')
  const [photoOther, setPhotoOther] = useState(order?.photographyTypeOther ?? '')

  const [clientName,  setClientName]  = useState(order?.clientName  ?? '')
  const [clientPhone, setClientPhone] = useState(order?.clientPhone ?? '')
  const [clientEmail, setClientEmail] = useState(order?.clientEmail ?? '')
  const [assignedTo,  setAssignedTo]  = useState(order?.assignedToId ?? '')
  const [description, setDescription] = useState(order?.description ?? '')
  const [dueDate,     setDueDate]     = useState(order?.dueDate ? order.dueDate.slice(0, 10) : '')
  const [status,      setStatus]      = useState<OrderStatus>((order?.status as OrderStatus) ?? 'PENDING')
  const [notes,       setNotes]       = useState(order?.notes ?? '')
  const [unitPrice,   setUnitPrice]   = useState(order?.unitPrice   ?? 0)
  const [amountPaid,  setAmountPaid]  = useState(order?.amountPaid  ?? 0)
  const [colors,      setColors]      = useState<FormColor[]>(() => initColors(order))
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const isPrinting = service === 'PRINTING'
  const { totalQty, totalAmount, balance } = computeTotals(
    isPrinting ? colors : [{ name: 's', qty: 1 }], unitPrice, amountPaid
  )

  const updateColor = useCallback((key: number, field: 'name' | 'qty', val: string | number) =>
    setColors(p => p.map(c => c._key === key ? { ...c, [field]: val } : c)), [])
  const removeColor = useCallback((key: number) =>
    setColors(p => p.filter(c => c._key !== key)), [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const body: Record<string, unknown> = {
        serviceCategory: service,
        printingType: printType || undefined,
        printingTypeOther: printType === 'OTHER' ? printOther : undefined,
        photographyType: photoType || undefined,
        photographyTypeOther: photoType === 'OTHER' ? photoOther : undefined,
        clientName, clientPhone, clientEmail,
        assignedToId: assignedTo || undefined,
        description, dueDate, status, notes, unitPrice, amountPaid,
        colors: isPrinting ? colors.map(({ name, qty }) => ({ name, qty: Number(qty) })) : [],
      }
      const url    = isEdit ? `/api/orders/${order!.id}` : '/api/orders'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? `HTTP ${res.status}`) }
      const saved = await res.json()
      router.push(`/admin/orders/${saved.id}`)
      router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{error}</div>}

      {/* Service type */}
      <section className="space-y-4">
        <h2 className="label-section">Service Type</h2>
        <div className="grid grid-cols-2 gap-4">
          {(['PRINTING', 'PHOTOGRAPHY'] as ServiceCategory[]).map(s => (
            <button key={s} type="button" onClick={() => setService(s)}
              className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${service === s ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'}`}>
              {s === 'PRINTING' ? '🖨 Printing' : '📷 Photography'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(isPrinting ? PRINTING_TYPES : PHOTOGRAPHY_TYPES).map(({ value, label }) => {
            const active = isPrinting ? printType === value : photoType === value
            return (
              <button key={value} type="button"
                onClick={() => isPrinting ? setPrintType(value as PrintingType) : setPhotoType(value as PhotographyType)}
                className={`rounded-xl border-2 py-2.5 px-3 text-sm font-semibold transition-all ${active ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'}`}>
                {label}
              </button>
            )
          })}
        </div>
        {isPrinting && printType === 'OTHER' && (
          <input className="input" placeholder="Specify printing type" value={printOther} onChange={e => setPrintOther(e.target.value)} />
        )}
        {!isPrinting && photoType === 'OTHER' && (
          <input className="input" placeholder="Specify photography type" value={photoOther} onChange={e => setPhotoOther(e.target.value)} />
        )}
      </section>

      {/* Client */}
      <section className="space-y-4">
        <h2 className="label-section">Client Information</h2>
        <div>
          <label className="label" htmlFor="cn">Client Name *</label>
          <input id="cn" className="input" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label" htmlFor="cp">Phone</label><input id="cp" className="input" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+233 XX XXX XXXX" /></div>
          <div><label className="label" htmlFor="ce">Email</label><input id="ce" type="email" className="input" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" /></div>
        </div>
      </section>

      {/* Order details */}
      <section className="space-y-4">
        <h2 className="label-section">Order Detail</h2>
        <div>
          <label className="label" htmlFor="desc">{isPrinting ? 'Design Description' : 'Photography Brief'}</label>
          <textarea id="desc" className="input resize-none" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder={isPrinting ? 'Design details, colours, placement…' : 'Event details, venue, expected count…'} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label" htmlFor="dd">Due Date</label><input id="dd" type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          <div>
            <label className="label" htmlFor="stat">Status</label>
            <select id="stat" className="input" value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        {workers.length > 0 && (
          <div>
            <label className="label" htmlFor="worker">Assign to Worker</label>
            <select id="worker" className="input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">— Unassigned —</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        <div><label className="label" htmlFor="notes">Notes</label><textarea id="notes" className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions…" /></div>
      </section>

      {/* Colours — printing only */}
      {isPrinting && (
        <section className="space-y-4">
          <h2 className="label-section">Colours & Quantities</h2>
          <div className="space-y-2">
            {colors.map(c => (
              <div key={c._key} className="grid grid-cols-[1fr_100px_32px] items-center gap-3">
                <input className="input" value={c.name} onChange={e => updateColor(c._key, 'name', e.target.value)} placeholder="e.g. Black" />
                <input type="number" min={0} className="input text-right tabular-nums" value={c.qty || ''} onChange={e => updateColor(c._key, 'qty', Number(e.target.value))} placeholder="0" />
                <button type="button" onClick={() => removeColor(c._key)} disabled={colors.length === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 disabled:opacity-30 transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setColors(p => [...p, mkColor()])}
            className="flex items-center gap-2 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            <Plus className="h-4 w-4" /> Add colour
          </button>
          <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-4 py-3 flex justify-between text-sm">
            <span className="text-slate-500">Total pieces</span>
            <span className="font-bold tabular-nums dark:text-white">{totalQty.toLocaleString()}</span>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="space-y-4">
        <h2 className="label-section">Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="up">{isPrinting ? 'Unit Price (GHS) *' : 'Package Price (GHS) *'}</label>
            <input id="up" type="number" min={0} step={0.01} className="input tabular-nums" required value={unitPrice || ''} onChange={e => setUnitPrice(Number(e.target.value))} placeholder="0.00" />
          </div>
          <div>
            <label className="label" htmlFor="ap">Amount Paid (GHS)</label>
            <input id="ap" type="number" min={0} step={0.01} className="input tabular-nums" value={amountPaid || ''} onChange={e => setAmountPaid(Number(e.target.value))} placeholder="0.00" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 divide-y divide-slate-100 dark:divide-white/5 text-sm overflow-hidden">
          {isPrinting && <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Total ({totalQty} × {fmtCurrency(unitPrice)})</span><span className="font-medium tabular-nums">{fmtCurrency(totalAmount)}</span></div>}
          {!isPrinting && <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Package price</span><span className="font-medium tabular-nums">{fmtCurrency(unitPrice)}</span></div>}
          <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Paid</span><span className="font-medium tabular-nums text-emerald-600">{fmtCurrency(amountPaid)}</span></div>
          <div className="flex justify-between px-4 py-3 font-semibold"><span>Balance due</span><span className={`tabular-nums ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmtCurrency(balance)}</span></div>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading || !clientName.trim() || !unitPrice}
          className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-50 transition-colors">
          {loading ? 'Saving…' : isEdit ? 'Update Order' : 'Create Order'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors dark:border-white/10 dark:text-slate-300">
          Cancel
        </button>
      </div>
    </form>
  )
}

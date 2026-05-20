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
interface OrderItem {
  _key: number
  color: string
  size: string
  qty: number
}
let _keyCounter = 200

function initItems(order?: SerializedOrder): OrderItem[] {
  if (!order) {
    return [{ _key: _keyCounter++, color: 'Black', size: 'M', qty: 0 }]
  }

  // Case 1: Apparel with detailed _items
  if (order.sizes && typeof order.sizes === 'object') {
    const rawItems = (order.sizes as any)._items
    if (Array.isArray(rawItems)) {
      return rawItems.map((it: any) => ({
        _key: _keyCounter++,
        color: it.color || 'Solid',
        size: it.size || 'M',
        qty: Number(it.qty || 0)
      }))
    }

    // Case 2: Apparel legacy with flat sizes
    const sizeKeys = Object.keys(order.sizes).filter(k => k !== '_items')
    if (sizeKeys.length > 0) {
      const legacyColors = order.colors && order.colors.length > 0 ? order.colors.map(c => c.name) : ['Solid']
      const firstColor = legacyColors[0] || 'Solid'
      const items: OrderItem[] = []
      sizeKeys.forEach(sz => {
        const qty = Number((order.sizes as any)[sz] || 0)
        if (qty > 0) {
          items.push({
            _key: _keyCounter++,
            color: firstColor,
            size: sz,
            qty
          })
        }
      })
      if (items.length > 0) return items
    }
  }

  // Case 3: Standard printing order with colors
  if (order.colors && order.colors.length > 0) {
    return order.colors.map(c => ({
      _key: _keyCounter++,
      color: c.name || 'Solid',
      size: 'M',
      qty: Number(c.qty || 0)
    }))
  }

  // Fallback
  return [{ _key: _keyCounter++, color: 'Black', size: 'M', qty: 0 }]
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
  const [items,       setItems]       = useState<OrderItem[]>(() => initItems(order))
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const isPrinting = service === 'PRINTING'
  const isApparel  = isPrinting && (printType === 'TSHIRT' || printType === 'LACOSTE')
  
  const totalSizeQty = isPrinting
    ? items.reduce((sum, it) => sum + Number(it.qty || 0), 0)
    : 0

  const { totalQty, totalAmount, balance } = computeTotals(
    isPrinting
      ? items.map(it => ({ name: it.color, qty: it.qty }))
      : [{ name: 'service', qty: 1 }],
    unitPrice, amountPaid
  )

  const updateItem = useCallback((key: number, field: keyof OrderItem, val: any) => {
    setItems(p => p.map(it => it._key === key ? { ...it, [field]: val } : it))
  }, [])

  const removeItem = useCallback((key: number) => {
    setItems(p => p.filter(it => it._key !== key))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const aggregatedColors = isPrinting
        ? items.reduce((acc, item) => {
            const name = item.color.trim() || 'Solid'
            const existing = acc.find(c => c.name.toLowerCase() === name.toLowerCase())
            if (existing) {
              existing.qty += item.qty
            } else {
              acc.push({ name, qty: item.qty })
            }
            return acc
          }, [] as { name: string; qty: number }[])
        : []

      const body: Record<string, unknown> = {
        serviceCategory: service,
        clientName, clientPhone, clientEmail,
        assignedToId: assignedTo || undefined,
        description, dueDate, status, notes, unitPrice, amountPaid,
        colors: aggregatedColors,
      }

      if (service === 'PRINTING') {
        body.printingType = printType || undefined
        if (printType === 'OTHER') body.printingTypeOther = printOther
        if (isApparel) {
          const aggregatedSizes: Record<string, any> = {}
          items.forEach(item => {
            if (item.qty > 0 && item.size) {
              aggregatedSizes[item.size] = (aggregatedSizes[item.size] || 0) + item.qty
            }
          })
          aggregatedSizes._items = items
            .filter(item => item.qty > 0)
            .map(item => ({ color: item.color.trim() || 'Solid', size: item.size, qty: item.qty }))
          body.sizes = aggregatedSizes
        } else {
          body.sizes = null
        }
      } else {
        body.colors = []
        body.sizes = null
        body.printingType = undefined
        body.printingTypeOther = undefined
        body.photographyType = photoType || undefined
        if (photoType === 'OTHER') body.photographyTypeOther = photoOther
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
              className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${service === s ? 'border-brand-500 bg-brand-50/10 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'}`}>
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
                className={`rounded-xl border-2 py-2.5 px-3 text-sm font-semibold transition-all ${active ? 'border-brand-500 bg-brand-50/10 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'}`}>
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
        <h2 className="label-section">Order Details</h2>
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

      {/* Apparel Sizes section */}
      {isApparel && (
        <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-5">
          <div>
            <h2 className="label-section flex items-center justify-between">
              <span>Garment Breakdown ({printType === 'TSHIRT' ? 'T-Shirt' : 'Lacoste'})</span>
              <span className="text-xs font-semibold text-brand-600 dark:text-yellow-400 font-mono">Total: {totalSizeQty} pcs</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Specify the color, select the size, and enter the quantity for each item.</p>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._key} className="grid grid-cols-[1fr_120px_100px_36px] items-center gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Colour</label>
                  <input
                    type="text"
                    className="input py-1 px-3"
                    value={item.color}
                    onChange={(e) => updateItem(item._key, 'color', e.target.value)}
                    placeholder="e.g. Black"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Size</label>
                  <select
                    className="input py-1 px-3 text-sm font-bold"
                    value={item.size}
                    onChange={(e) => updateItem(item._key, 'size', e.target.value)}
                  >
                    {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="input py-1 px-3 text-right tabular-nums font-semibold"
                    value={item.qty || ''}
                    onChange={(e) => updateItem(item._key, 'qty', Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={() => removeItem(item._key)}
                    disabled={items.length === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 disabled:opacity-30 transition bg-white dark:bg-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setItems(p => [...p, { _key: Date.now() + Math.random(), color: '', size: 'M', qty: 0 }])}
              className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <Plus className="h-4 w-4" /> Add Row
            </button>
          </div>
        </section>
      )}

      {/* Colours — printing only */}
      {isPrinting && !isApparel && printType && (
        <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-5">
          <div>
            <h2 className="label-section flex items-center justify-between">
              <span>Colours & Quantities Breakdown</span>
              <span className="text-xs font-semibold text-brand-600 dark:text-yellow-400 font-mono">Total: {totalSizeQty} pcs</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Specify the color/style and quantity for each item.</p>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._key} className="grid grid-cols-[1fr_120px_36px] items-center gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Colour / Style</label>
                  <input
                    type="text"
                    className="input py-1 px-3"
                    value={item.color}
                    onChange={(e) => updateItem(item._key, 'color', e.target.value)}
                    placeholder="e.g. Black"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="input py-1 px-3 text-right tabular-nums font-semibold"
                    value={item.qty || ''}
                    onChange={(e) => updateItem(item._key, 'qty', Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={() => removeItem(item._key)}
                    disabled={items.length === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 disabled:opacity-30 transition bg-white dark:bg-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setItems(p => [...p, { _key: Date.now() + Math.random(), color: '', size: 'M', qty: 0 }])}
              className="flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <Plus className="h-4 w-4" /> Add Row
            </button>
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
          <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Paid</span><span className="font-bold tabular-nums text-yellow-600 dark:text-yellow-500">{fmtCurrency(amountPaid)}</span></div>
          <div className="flex justify-between px-4 py-3 font-semibold font-mono"><span>Balance due</span><span className={`tabular-nums ${balance > 0 ? 'text-red-600' : 'text-yellow-600 dark:text-yellow-500'}`}>{fmtCurrency(balance)}</span></div>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading || !clientName.trim() || !unitPrice || (isApparel && totalSizeQty <= 0)}
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition-all shadow-md shadow-brand-500/15">
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

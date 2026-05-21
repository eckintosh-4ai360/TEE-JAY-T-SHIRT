'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fmtCurrency, getOrderItems } from '@/lib/utils'
import {
  STATUS_META, PRINTING_TYPES, PHOTOGRAPHY_TYPES, DESIGN_TYPES,
  type OrderStatus, type ServiceCategory, type PrintingType, type PhotographyType, type DesignType,
  type SerializedOrder
} from '@/types'
import { Plus, X, Trash2 } from 'lucide-react'

interface Props {
  order?: SerializedOrder
  workers?: { id: string; name: string }[]
}

interface FormItem {
  id: string
  category: ServiceCategory
  type: string
  typeOther: string
  description: string
  unitPrice: number
  qty: number
  breakdown: {
    id: string
    color: string
    size: string
    qty: number
  }[]
}

function initFormItems(order?: SerializedOrder): FormItem[] {
  if (!order) {
    return [
      {
        id: '1',
        category: 'PRINTING',
        type: 'TSHIRT',
        typeOther: '',
        description: '',
        unitPrice: 0,
        qty: 0,
        breakdown: [{ id: '1-1', color: 'Black', size: 'M', qty: 0 }]
      }
    ]
  }

  const items = getOrderItems(order)
  return items.map((it, idx) => {
    const isPrinting = it.category === 'PRINTING'
    const isApparel  = isPrinting && (it.type === 'TSHIRT' || it.type === 'LACOSTE')
    
    let breakdown: FormItem['breakdown'] = []
    
    if (isApparel && it.sizes && typeof it.sizes === 'object') {
      const rawItems = it.sizes._items
      if (Array.isArray(rawItems)) {
        breakdown = rawItems.map((r: any, rIdx: number) => ({
          id: `${idx}-${rIdx}`,
          color: r.color || 'Solid',
          size: r.size || 'M',
          qty: Number(r.qty || 0)
        }))
      } else {
        // Flat sizes fallback
        const sizeKeys = Object.keys(it.sizes).filter(k => k !== '_items')
        const firstColor = it.colors?.[0]?.name || 'Solid'
        sizeKeys.forEach((sz, rIdx) => {
          const qty = Number(it.sizes[sz] || 0)
          if (qty > 0) {
            breakdown.push({
              id: `${idx}-${rIdx}`,
              color: firstColor,
              size: sz,
              qty
            })
          }
        })
      }
    } else if (isPrinting) {
      if (it.colors && it.colors.length > 0) {
        breakdown = it.colors.map((c, rIdx) => ({
          id: `${idx}-${rIdx}`,
          color: c.name || 'Solid',
          size: 'M',
          qty: Number(c.qty || 0)
        }))
      }
    }

    if (breakdown.length === 0) {
      breakdown = [{ id: `${idx}-0`, color: 'Black', size: 'M', qty: 0 }]
    }

    return {
      id: String(idx + 1),
      category: it.category as ServiceCategory,
      type: it.type || '',
      typeOther: it.typeOther || '',
      description: it.description || '',
      unitPrice: it.unitPrice,
      qty: it.qty,
      breakdown
    }
  })
}

export default function AdminOrderForm({ order, workers = [] }: Props) {
  const router = useRouter()
  const isEdit = Boolean(order)

  // Global order details
  const [clientName,  setClientName]  = useState(order?.clientName  ?? '')
  const [clientPhone, setClientPhone] = useState(order?.clientPhone ?? '')
  const [clientEmail, setClientEmail] = useState(order?.clientEmail ?? '')
  const [assignedTo,  setAssignedTo]  = useState(order?.assignedToId ?? '')
  const [dueDate,     setDueDate]     = useState(order?.dueDate ? order.dueDate.slice(0, 10) : '')
  const [status,      setStatus]      = useState<OrderStatus>((order?.status as OrderStatus) ?? 'PENDING')
  const [notes,       setNotes]       = useState(order?.notes ?? '')
  const [amountPaid,  setAmountPaid]  = useState(order?.amountPaid  ?? 0)

  // Multi-item state
  const [formItems,   setFormItems]   = useState<FormItem[]>(() => initFormItems(order))
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Computed totals
  const totalQty = formItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)
  const totalAmount = parseFloat(formItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0).toFixed(2))
  const balance = parseFloat((totalAmount - Number(amountPaid)).toFixed(2))

  // Handlers for form items
  const addItem = () => {
    setFormItems(prev => [
      ...prev,
      {
        id: String(Date.now()),
        category: 'PRINTING',
        type: 'TSHIRT',
        typeOther: '',
        description: '',
        unitPrice: 0,
        qty: 0,
        breakdown: [{ id: String(Date.now() + 1), color: 'Black', size: 'M', qty: 0 }]
      }
    ])
  }

  const removeItem = (itemId: string) => {
    if (formItems.length <= 1) return
    setFormItems(prev => prev.filter(item => item.id !== itemId))
  }

  const updateItemField = useCallback((itemId: string, field: keyof FormItem, val: any) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      
      const updated = { ...item, [field]: val }
      const isPrinting = updated.category === 'PRINTING'
      
      if (isPrinting) {
        updated.qty = updated.breakdown.reduce((sum, b) => sum + b.qty, 0)
      } else {
        if (field === 'category') {
          updated.qty = 1
        }
      }
      return updated
    }))
  }, [])

  const updateBreakdownRow = useCallback((itemId: string, rowId: string, field: keyof FormItem['breakdown'][0], val: any) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      
      const newBreakdown = item.breakdown.map(b => b.id === rowId ? { ...b, [field]: val } : b)
      const qty = newBreakdown.reduce((sum, b) => sum + b.qty, 0)
      return { ...item, breakdown: newBreakdown, qty }
    }))
  }, [])

  const addBreakdownRow = useCallback((itemId: string) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      const newRow = { id: String(Date.now() + Math.random()), color: '', size: 'M', qty: 0 }
      return { ...item, breakdown: [...item.breakdown, newRow] }
    }))
  }, [])

  const removeBreakdownRow = useCallback((itemId: string, rowId: string) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== itemId) return item
      if (item.breakdown.length <= 1) return item
      const newBreakdown = item.breakdown.filter(b => b.id !== rowId)
      const qty = newBreakdown.reduce((sum, b) => sum + b.qty, 0)
      return { ...item, breakdown: newBreakdown, qty }
    }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (formItems.some(item => !item.unitPrice || Number(item.unitPrice) < 0)) {
        throw new Error('All items must have a valid unit price')
      }
      if (formItems.some(item => item.qty <= 0)) {
        throw new Error('All items must have a quantity greater than zero')
      }

      // Construct sizes v2 object
      const payloadSizes = {
        _version: 'v2',
        items: formItems.map(item => {
          const isPrinting = item.category === 'PRINTING'
          const isApparel  = isPrinting && (item.type === 'TSHIRT' || item.type === 'LACOSTE')
          
          let sizesObject: any = null
          if (isApparel) {
            sizesObject = {}
            item.breakdown.forEach(b => {
              if (b.qty > 0 && b.size) {
                sizesObject[b.size] = (sizesObject[b.size] || 0) + b.qty
              }
            })
            sizesObject._items = item.breakdown
              .filter(b => b.qty > 0)
              .map(b => ({ color: b.color.trim() || 'Solid', size: b.size, qty: b.qty }))
          }

          let colorsArray: any[] = []
          if (isPrinting) {
            colorsArray = item.breakdown
              .filter(b => b.qty > 0)
              .map(b => ({ name: b.color.trim() || 'Solid', qty: b.qty }))
          }

          return {
            category: item.category,
            type: item.type || null,
            typeOther: item.typeOther || null,
            description: item.description || null,
            unitPrice: Number(item.unitPrice),
            qty: Number(item.qty),
            sizes: sizesObject,
            colors: colorsArray
          }
        })
      }

      // Root details fallback for backwards compatibility on query/filters
      const body: Record<string, unknown> = {
        clientName: clientName.trim(),
        clientPhone: clientPhone?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        assignedToId: assignedTo || undefined,
        dueDate: dueDate || null,
        status,
        notes: notes?.trim() || null,
        amountPaid,
        sizes: payloadSizes,
        
        serviceCategory: formItems[0]?.category || 'PRINTING',
        unitPrice: Number(formItems[0]?.unitPrice || 0),
        printingType: formItems[0]?.category === 'PRINTING' ? (formItems[0]?.type || null) : null,
        printingTypeOther: formItems[0]?.category === 'PRINTING' ? (formItems[0]?.typeOther || null) : null,
        photographyType: formItems[0]?.category === 'PHOTOGRAPHY' ? (formItems[0]?.type || null) : null,
        photographyTypeOther: formItems[0]?.category === 'PHOTOGRAPHY' ? (formItems[0]?.typeOther || null) : null,
        designType: formItems[0]?.category === 'DESIGN' ? (formItems[0]?.type || null) : null,
        designTypeOther: formItems[0]?.category === 'DESIGN' ? (formItems[0]?.typeOther || null) : null,
        description: formItems[0]?.description || null,
      }

      const url    = isEdit ? `/api/orders/${order!.id}` : '/api/orders'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? `HTTP ${res.status}`)
      }
      const saved = await res.json()
      router.push(`/admin/orders/${saved.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Client */}
      <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-5">
        <h2 className="label-section">Client Information</h2>
        <div>
          <label className="label" htmlFor="cn">Client Name *</label>
          <input id="cn" className="input" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="cp">Phone</label>
            <input id="cp" className="input" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
          </div>
          <div>
            <label className="label" htmlFor="ce">Email</label>
            <input id="ce" type="email" className="input" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" />
          </div>
        </div>
      </section>

      {/* Global Order Settings */}
      <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-5">
        <h2 className="label-section">Order Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="dd">Due Date</label>
            <input id="dd" type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="stat">Status</label>
            <select id="stat" className="input animate-fade-in" value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        {workers.length > 0 && (
          <div>
            <label className="label" htmlFor="worker">Assign to Worker</label>
            <select id="worker" className="input animate-fade-in" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">— Unassigned —</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea id="notes" className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions…" />
        </div>
      </section>

      {/* Items Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="label-section text-lg font-bold text-slate-800 dark:text-slate-200">Order Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add Item
          </button>
        </div>

        <div className="space-y-6">
          {formItems.map((item, index) => {
            const isPrinting = item.category === 'PRINTING'
            const isDesign = item.category === 'DESIGN'
            const isPhotography = item.category === 'PHOTOGRAPHY'
            const isApparel = isPrinting && (item.type === 'TSHIRT' || item.type === 'LACOSTE')

            return (
              <div
                key={item.id}
                className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-5 shadow-sm space-y-4"
              >
                {formItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition"
                    title="Remove Item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold font-mono">
                    {index + 1}
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Item Details</h3>
                </div>

                {/* Service Category Buttons */}
                <div className="space-y-3">
                  <label className="label">Service Category</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['PRINTING', 'PHOTOGRAPHY', 'DESIGN'] as ServiceCategory[]).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateItemField(item.id, 'category', s)}
                        className={`rounded-xl border-2 py-2 text-xs font-bold transition-all ${
                          item.category === s
                            ? 'border-brand-500 bg-brand-50/10 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                            : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'
                        }`}
                      >
                        {s === 'PRINTING' ? '🖨 Printing' : s === 'PHOTOGRAPHY' ? '📷 Photography' : '🎨 Design'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Types */}
                <div className="space-y-3">
                  <label className="label">Service Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(isPrinting ? PRINTING_TYPES : isDesign ? DESIGN_TYPES : PHOTOGRAPHY_TYPES).map(({ value, label }) => {
                      const active = item.type === value
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateItemField(item.id, 'type', value)}
                          className={`rounded-xl border-2 py-2 px-2.5 text-xs font-semibold transition-all ${
                            active
                              ? 'border-brand-500 bg-brand-50/10 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                              : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  {item.type === 'OTHER' && (
                    <input
                      className="input mt-2"
                      placeholder={`Specify other ${item.category.toLowerCase()} type`}
                      value={item.typeOther}
                      onChange={e => updateItemField(item.id, 'typeOther', e.target.value)}
                      required
                    />
                  )}
                </div>

                {/* Unit Price and Quantity / Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Unit Price (GHS) *</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="input tabular-nums"
                      value={item.unitPrice || ''}
                      onChange={e => updateItemField(item.id, 'unitPrice', Number(e.target.value))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      className="input tabular-nums bg-slate-100/50 dark:bg-white/5"
                      value={item.qty || ''}
                      onChange={e => {
                        if (!isPrinting) {
                          updateItemField(item.id, 'qty', Math.max(1, parseInt(e.target.value) || 0))
                        }
                      }}
                      disabled={isPrinting}
                      placeholder={isPrinting ? 'Calculated' : '1'}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="label">Description / Brief</label>
                  <textarea
                    className="input resize-none"
                    rows={2}
                    value={item.description}
                    onChange={e => updateItemField(item.id, 'description', e.target.value)}
                    placeholder={
                      isPrinting
                        ? 'Design/printing specs, color placements…'
                        : isDesign
                        ? 'Style instructions, visual brief…'
                        : 'Venue, package specs, shoot details…'
                    }
                  />
                </div>

                {/* Apparel breakdown (Sizes & Colors) */}
                {isApparel && (
                  <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Garment breakdown ({item.type === 'TSHIRT' ? 'T-Shirt' : 'Lacoste'})
                      </h4>
                      <span className="text-xs font-bold text-brand-600 dark:text-yellow-400 font-mono">
                        Item Qty: {item.qty} pcs
                      </span>
                    </div>

                    <div className="space-y-2">
                      {item.breakdown.map((row) => (
                        <div key={row.id} className="grid grid-cols-[1fr_90px_80px_36px] items-center gap-2">
                          <input
                            type="text"
                            className="input py-1 px-2.5 text-xs"
                            value={row.color}
                            onChange={(e) => updateBreakdownRow(item.id, row.id, 'color', e.target.value)}
                            placeholder="e.g. Black"
                            required
                          />
                          <select
                            className="input py-1 px-2.5 text-xs font-bold"
                            value={row.size}
                            onChange={(e) => updateBreakdownRow(item.id, row.id, 'size', e.target.value)}
                          >
                            {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(sz => (
                              <option key={sz} value={sz}>{sz}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={0}
                            className="input py-1 px-2.5 text-right text-xs tabular-nums"
                            value={row.qty || ''}
                            onChange={(e) => updateBreakdownRow(item.id, row.id, 'qty', Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeBreakdownRow(item.id, row.id)}
                            disabled={item.breakdown.length === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 disabled:opacity-30 transition bg-white dark:bg-slate-900"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addBreakdownRow(item.id)}
                      className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Row
                    </button>
                  </div>
                )}

                {/* Non-Apparel Printing breakdown (Colors & Qty) */}
                {isPrinting && !isApparel && item.type && (
                  <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Colors breakdown
                      </h4>
                      <span className="text-xs font-bold text-brand-600 dark:text-yellow-400 font-mono">
                        Item Qty: {item.qty} pcs
                      </span>
                    </div>

                    <div className="space-y-2">
                      {item.breakdown.map((row) => (
                        <div key={row.id} className="grid grid-cols-[1fr_80px_36px] items-center gap-2">
                          <input
                            type="text"
                            className="input py-1 px-2.5 text-xs"
                            value={row.color}
                            onChange={(e) => updateBreakdownRow(item.id, row.id, 'color', e.target.value)}
                            placeholder="e.g. Full Color"
                            required
                          />
                          <input
                            type="number"
                            min={0}
                            className="input py-1 px-2.5 text-right text-xs tabular-nums"
                            value={row.qty || ''}
                            onChange={(e) => updateBreakdownRow(item.id, row.id, 'qty', Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeBreakdownRow(item.id, row.id)}
                            disabled={item.breakdown.length === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 disabled:opacity-30 transition bg-white dark:bg-slate-900"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addBreakdownRow(item.id)}
                      className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Row
                    </button>
                  </div>
                )}

                {/* Subtotal Display */}
                <div className="flex justify-end text-xs font-bold text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-2 font-mono">
                  Subtotal: {item.qty} × {fmtCurrency(item.unitPrice)} = {fmtCurrency(item.qty * item.unitPrice)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pricing Summary */}
      <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-5">
        <h2 className="label-section">Order Financial Summary</h2>
        <div>
          <label className="label" htmlFor="ap">Amount Paid (GHS)</label>
          <input
            id="ap"
            type="number"
            min={0}
            step={0.01}
            className="input tabular-nums"
            value={amountPaid || ''}
            onChange={e => setAmountPaid(Number(e.target.value))}
            placeholder="0.00"
          />
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 divide-y divide-slate-100 dark:divide-white/5 text-sm overflow-hidden">
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-slate-500">Total Quantity</span>
            <span className="font-semibold tabular-nums">{totalQty} pcs</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-slate-500">Gross Total</span>
            <span className="font-semibold tabular-nums">{fmtCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-slate-500">Paid</span>
            <span className="font-bold tabular-nums text-yellow-600 dark:text-yellow-500">{fmtCurrency(amountPaid)}</span>
          </div>
          <div className="flex justify-between px-4 py-3 font-semibold font-mono">
            <span>Balance due</span>
            <span className={`tabular-nums ${balance > 0 ? 'text-red-600' : 'text-yellow-600 dark:text-yellow-500'}`}>
              {fmtCurrency(balance)}
            </span>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !clientName.trim() || formItems.some(item => item.qty <= 0)}
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition-all shadow-md shadow-brand-500/15"
        >
          {loading ? 'Saving…' : isEdit ? 'Update Order' : 'Create Order'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:border-slate-300 transition-colors dark:border-white/10 dark:text-slate-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

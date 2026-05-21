'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Printer, Camera, Palette, Plus, X, Loader2, CheckCircle, ChevronRight } from 'lucide-react'
import { PRINTING_TYPES, PHOTOGRAPHY_TYPES, DESIGN_TYPES, type ServiceCategory, type PrintingType, type PhotographyType, type DesignType } from '@/types'
import { fmtCurrency } from '@/lib/utils'

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

export default function BookingForm() {
  const router = useRouter()
  const params = useSearchParams()

  // Global fields
  const [clientName,  setClientName]  = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [dueDate,     setDueDate]     = useState('')
  const [notes,       setNotes]       = useState('')
  const [amountPaid,  setAmountPaid]  = useState(0)

  // Initialize from search query if any
  const queryCategory = params.get('service')?.toUpperCase() as ServiceCategory | null
  const initialCategory = queryCategory && ['PRINTING', 'PHOTOGRAPHY', 'DESIGN'].includes(queryCategory)
    ? queryCategory
    : 'PRINTING'

  const [formItems, setFormItems] = useState<FormItem[]>([
    {
      id: '1',
      category: initialCategory,
      type: initialCategory === 'PRINTING' ? 'TSHIRT' : 'OTHER',
      typeOther: '',
      description: '',
      unitPrice: 0,
      qty: 0,
      breakdown: [{ id: '1-1', color: 'Black', size: 'M', qty: 0 }]
    }
  ])

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<{ receiptNumber: string; id: string } | null>(null)

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

      // Root details fallback for database
      const body: Record<string, unknown> = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail?.trim() || null,
        dueDate: dueDate || null,
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

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? `HTTP ${res.status}`)
      }
      const saved = await res.json()
      setSuccess({ receiptNumber: saved.receiptNumber, id: saved.id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    const hasPhotography = formItems.some(it => it.category === 'PHOTOGRAPHY')

    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 mx-auto dark:bg-yellow-500/20 dark:text-yellow-400">
          <CheckCircle className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Booking Confirmed!</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Your multi-service order has been placed successfully.</p>
        </div>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50/50 p-6 dark:border-yellow-500/30 dark:bg-yellow-500/10">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Your Receipt Number</p>
          <p className="text-3xl font-black text-brand-600 dark:text-yellow-400 font-mono tracking-wider">{success.receiptNumber}</p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Save this number to track your order status</p>
        </div>

        {hasPhotography && (
          <div className="rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50/50 to-pink-50/30 p-6 dark:border-purple-500/20 dark:from-purple-950/20 dark:to-pink-950/10 text-left space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-purple-950 dark:text-purple-300 uppercase tracking-widest flex items-center gap-2">
                <Camera className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Photography Guides & Info
              </h3>
              <p className="text-xs text-purple-700/80 dark:text-purple-400/80 mt-1">Please review our packages and essential guidelines for your photography session.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a 
                href="/REVISED TJM BRIDAL PACKAGES.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-red-800 to-yellow-700 px-4 py-3 text-xs font-black text-white hover:from-purple-700 hover:to-pink-700 shadow-md shadow-purple-500/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 text-center"
              >
                <span>View Bridal Packages</span>
              </a>
              <a 
                href="/THINGS TO FACTOR WHEN YOU BOOK US - TEE-JAY MULTIMEDIA.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 rounded-xl border border-purple-200 bg-white px-4 py-3 text-xs font-black text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-sm hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 dark:border-purple-500/30 dark:bg-purple-950/20 dark:text-purple-300 dark:hover:bg-purple-950/40 text-center"
              >
                <span>View Necessities Guide</span>
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.push(`/receipt/${success.receiptNumber}`)}
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/15 transition-all">
            View Receipt
          </button>
          <button onClick={() => router.push('/track')}
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors dark:border-white/10 dark:text-slate-300">
            Track Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Book a Service</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Fill in your details and items below. We support multiple bookings in a single order!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Client Info */}
        <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">1. Your Information</h2>
          <div>
            <label className="label" htmlFor="bName">Full Name *</label>
            <input id="bName" className="input animate-fade-in" required value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="bPhone">Phone *</label>
              <input id="bPhone" className="input animate-fade-in" required value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
            </div>
            <div>
              <label className="label" htmlFor="bEmail">Email</label>
              <input id="bEmail" className="input animate-fade-in" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="you@email.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="bDue">Required Date</label>
              <input id="bDue" type="date" className="input animate-fade-in" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="bNotes">Additional Notes</label>
              <input id="bNotes" className="input animate-fade-in" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requests?" />
            </div>
          </div>
        </section>

        {/* Items Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">2. Customize Booking Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Add Another Item
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
                  className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6 shadow-sm space-y-4 animate-fade-in"
                >
                  {formItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition"
                      title="Remove Item"
                    >
                      <Trash2Fallback />
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold font-mono">
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Item Configuration</h3>
                  </div>

                  {/* Service Category Buttons */}
                  <div className="space-y-2">
                    <label className="label">Service Category</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['PRINTING', 'PHOTOGRAPHY', 'DESIGN'] as ServiceCategory[]).map(s => {
                        const Icon = s === 'PRINTING' ? Printer : s === 'PHOTOGRAPHY' ? Camera : Palette
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateItemField(item.id, 'category', s)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-xs font-bold transition-all ${
                              item.category === s
                                ? 'border-brand-500 bg-brand-50/10 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                                : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            {s === 'PRINTING' ? 'Printing' : s === 'PHOTOGRAPHY' ? 'Photography' : 'Design'}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Service Types */}
                  <div className="space-y-2">
                    <label className="label">Select Type *</label>
                    <select
                      className="input text-sm font-semibold"
                      value={item.type || ''}
                      onChange={e => updateItemField(item.id, 'type', e.target.value)}
                    >
                      <option value="">-- Choose {item.category === 'PRINTING' ? 'Printing' : item.category === 'PHOTOGRAPHY' ? 'Photography' : 'Design'} Type --</option>
                      {(item.category === 'PRINTING' ? PRINTING_TYPES : item.category === 'PHOTOGRAPHY' ? PHOTOGRAPHY_TYPES : DESIGN_TYPES).map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {item.type === 'OTHER' && (
                      <input
                        className="input mt-2 animate-fade-in"
                        placeholder={`Specify other ${item.category.toLowerCase()} type`}
                        value={item.typeOther}
                        onChange={e => updateItemField(item.id, 'typeOther', e.target.value)}
                        required
                      />
                    )}
                  </div>

                  {/* Unit Price and Qty */}
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
                    <label className="label">Details / Requirements</label>
                    <textarea
                      className="input resize-none"
                      rows={2}
                      value={item.description}
                      onChange={e => updateItemField(item.id, 'description', e.target.value)}
                      placeholder={
                        isPrinting
                          ? 'Design specs, colors, locations…'
                          : isDesign
                          ? 'Design brief, look and feel…'
                          : 'Photoshoot duration, locations, specific shots…'
                      }
                    />
                  </div>

                  {/* Apparel Size Grid */}
                  {isApparel && (
                    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Garment breakdown ({item.type === 'TSHIRT' ? 'T-Shirt' : 'Lacoste'})
                        </h4>
                        <span className="text-xs font-bold text-brand-600 dark:text-yellow-400 font-mono">
                          {item.qty} pcs
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
                              placeholder="Color"
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

                  {/* Colors Breakdown */}
                  {isPrinting && !isApparel && item.type && (
                    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Colors breakdown
                        </h4>
                        <span className="text-xs font-bold text-brand-600 dark:text-yellow-400 font-mono">
                          {item.qty} pcs
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
                              placeholder="Color/Style"
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

                  {/* Item Subtotal Display */}
                  <div className="flex justify-end text-xs font-bold text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-2 font-mono">
                    Subtotal: {item.qty} × {fmtCurrency(item.unitPrice)} = {fmtCurrency(item.qty * item.unitPrice)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Submit Details & Deposit */}
        <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">3. Pricing Summary & Deposit</h2>
          <div>
            <label className="label" htmlFor="bPaid">Deposit / Amount to Pay Now (GHS)</label>
            <input
              id="bPaid"
              type="number"
              min={0}
              step={0.01}
              className="input tabular-nums animate-fade-in"
              value={amountPaid || ''}
              onChange={e => setAmountPaid(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 divide-y divide-slate-100 dark:divide-white/5 text-sm overflow-hidden font-sans">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-slate-500">Total Items Quantity</span>
              <span className="font-semibold tabular-nums dark:text-white">{totalQty} pcs</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-slate-500">Gross Total</span>
              <span className="font-semibold tabular-nums dark:text-white">{fmtCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-slate-500">Deposit Paid</span>
              <span className="font-bold tabular-nums text-yellow-600 dark:text-yellow-500">{fmtCurrency(amountPaid)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 font-semibold font-mono">
              <span>Balance Due</span>
              <span className={`tabular-nums ${balance > 0 ? 'text-red-600' : 'text-yellow-600 dark:text-yellow-500'}`}>
                {fmtCurrency(balance)}
              </span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading || !clientName.trim() || !clientPhone.trim() || formItems.some(item => item.qty <= 0)}
          className="w-full rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-yellow-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              Submit Booking <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

function Trash2Fallback() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 bg-white dark:bg-slate-900 transition">
      <X className="h-4 w-4" />
    </span>
  )
}

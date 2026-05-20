'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Printer, Camera, ChevronRight, Plus, X, Loader2, CheckCircle } from 'lucide-react'
import { PRINTING_TYPES, PHOTOGRAPHY_TYPES, type ServiceCategory, type PrintingType, type PhotographyType } from '@/types'
import { computeTotals, fmtCurrency } from '@/lib/utils'

interface OrderItem {
  _key: number
  color: string
  size: string
  qty: number
}
let _keyCounter = 1

export default function BookingForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [step, setStep] = useState<'service' | 'type' | 'details'>('service')
  const [service, setService] = useState<ServiceCategory | null>(
    params.get('service') === 'photography' ? 'PHOTOGRAPHY' : params.get('service') === 'printing' ? 'PRINTING' : null
  )
  const [printType,   setPrintType]   = useState<PrintingType | null>(null)
  const [printOther,  setPrintOther]  = useState('')
  const [photoType,   setPhotoType]   = useState<PhotographyType | null>(null)
  const [photoOther,  setPhotoOther]  = useState('')

  // Client fields
  const [name,  setName]  = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [desc,  setDesc]  = useState('')
  const [due,   setDue]   = useState('')
  const [notes, setNotes] = useState('')

  // Pricing
  const [unitPrice,  setUnitPrice]  = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [items, setItems] = useState<OrderItem[]>([
    { _key: _keyCounter++, color: 'Black', size: 'M', qty: 0 }
  ])

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<{ receiptNumber: string; id: string } | null>(null)

  useEffect(() => { if (service) setStep('type') }, [service])

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
    setError(null)
    setLoading(true)
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
        clientName: name, clientPhone: phone, clientEmail: email,
        description: desc, dueDate: due, notes, unitPrice, amountPaid,
        colors: aggregatedColors,
      }
      if (service === 'PRINTING') { 
        body.printingType = printType; 
        if (printType === 'OTHER') body.printingTypeOther = printOther;
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
        }
      }
      if (service === 'PHOTOGRAPHY') { body.photographyType = photoType; if (photoType === 'OTHER') body.photographyTypeOther = photoOther }

      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? `HTTP ${res.status}`) }
      const saved = await res.json()
      setSuccess({ receiptNumber: saved.receiptNumber, id: saved.id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 mx-auto dark:bg-yellow-500/20 dark:text-yellow-400">
        <CheckCircle className="h-10 w-10" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Booking Confirmed!</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Your order has been placed successfully.</p>
      </div>
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50/50 p-6 dark:border-yellow-500/30 dark:bg-yellow-500/10">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Your Receipt Number</p>
        <p className="text-3xl font-black text-brand-600 dark:text-yellow-400 font-mono tracking-wider">{success.receiptNumber}</p>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Save this number to track your order status</p>
      </div>
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Book a Service</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Fill in your details and we'll get back to you</p>
      </div>

      {/* Step 1 — Service */}
      <section className="space-y-4">
        <h2 className="label-section">1. Choose Service</h2>
        <div className="grid grid-cols-2 gap-4">
          {([
            { val: 'PRINTING' as ServiceCategory, label: 'Printing', icon: Printer, color: 'teal' },
            { val: 'PHOTOGRAPHY' as ServiceCategory, label: 'Photography', icon: Camera, color: 'purple' },
          ]).map(({ val, label, icon: Icon, color }) => (
            <button key={val} type="button" onClick={() => { setService(val); setStep('type') }}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-sm font-bold transition-all ${
                service === val
                  ? color === 'teal' ? 'border-brand-500 bg-brand-50/10 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500'
                                     : 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-white/10 dark:text-slate-400 dark:hover:border-white/20'
              }`}>
              <Icon className="h-8 w-8" /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 — Sub-type & Configuration */}
      {service && step === 'type' && (
        <section className="space-y-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">2. Configure Order</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose your service type and customize details.</p>
          </div>
          <div>
            <label className="label" htmlFor="sType">Select Type *</label>
            <select
              id="sType"
              className="input text-base font-semibold"
              value={service === 'PRINTING' ? (printType || '') : (photoType || '')}
              onChange={(e) => {
                const val = e.target.value
                if (service === 'PRINTING') {
                  setPrintType(val as PrintingType)
                } else {
                  setPhotoType(val as PhotographyType)
                }
              }}
            >
              <option value="">-- Choose {service === 'PRINTING' ? 'Printing' : 'Photography'} Type --</option>
              {(service === 'PRINTING' ? PRINTING_TYPES : PHOTOGRAPHY_TYPES).map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {((service === 'PRINTING' && printType === 'OTHER') || (service === 'PHOTOGRAPHY' && photoType === 'OTHER')) && (
            <div>
              <label className="label" htmlFor="sOther">Specify Type *</label>
              <input
                id="sOther"
                className="input"
                placeholder="Please specify your service type"
                value={service === 'PRINTING' ? printOther : photoOther}
                onChange={e => service === 'PRINTING' ? setPrintOther(e.target.value) : setPhotoOther(e.target.value)}
              />
            </div>
          )}

          {/* Colours, Sizes & Quantities for Apparel */}
          {isApparel && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Garment Breakdown ({printType === 'TSHIRT' ? 'T-Shirt' : 'Lacoste'})</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Specify the color, select the size, and enter the quantity for each item.</p>
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
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  Total pieces: <span className="text-slate-900 dark:text-white font-mono text-base">{totalSizeQty}</span> pcs
                </div>
              </div>
            </div>
          )}

          {/* Colours & Quantities for Standard Printing */}
          {isPrinting && !isApparel && printType && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Colours & Quantities Breakdown</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Specify the color/style and quantity for each item.</p>
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
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  Total pieces: <span className="text-slate-900 dark:text-white font-mono text-base">{totalSizeQty}</span> pcs
                </div>
              </div>
            </div>
          )}

          {/* Next Button */}
          {((service === 'PRINTING' && printType) || (service === 'PHOTOGRAPHY' && photoType)) && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={isPrinting && totalSizeQty <= 0}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-1 shadow-md shadow-brand-500/15"
              >
                Next: Client Details <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Step 3 — Details */}
      {step === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{error}</div>}

          {(() => {
            let stepIdx = 3
            const infoNum = stepIdx++
            const pricingNum = stepIdx++

            return (
              <>
                <section className="space-y-4">
                  <h2 className="label-section">{infoNum}. Your Information</h2>
                  <div>
                    <label className="label" htmlFor="bName">Full Name *</label>
                    <input id="bName" className="input" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="bPhone">Phone *</label>
                      <input id="bPhone" className="input" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
                    </div>
                    <div>
                      <label className="label" htmlFor="bEmail">Email</label>
                      <input id="bEmail" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="bDesc">{service === 'PHOTOGRAPHY' ? 'Event Details / Brief' : 'Design Description'}</label>
                    <textarea id="bDesc" className="input resize-none" rows={3} value={desc} onChange={e => setDesc(e.target.value)}
                      placeholder={service === 'PHOTOGRAPHY' ? 'Tell us about your event, venue, expected guests…' : 'Describe your design, colours, placement…'} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="bDue">Required Date</label>
                      <input id="bDue" type="date" className="input" value={due} onChange={e => setDue(e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor="bNotes">Additional Notes</label>
                      <input id="bNotes" className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requests?" />
                    </div>
                  </div>
                </section>

                {/* Pricing */}
                <section className="space-y-4">
                  <h2 className="label-section">{pricingNum}. Pricing</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="bUnit">{isPrinting ? 'Unit Price (GHS) *' : 'Package Price (GHS) *'}</label>
                      <input id="bUnit" type="number" min={0} step={0.01} className="input tabular-nums" required value={unitPrice || ''} onChange={e => setUnitPrice(Number(e.target.value))} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="label" htmlFor="bPaid">Deposit / Amount Paid (GHS)</label>
                      <input id="bPaid" type="number" min={0} step={0.01} className="input tabular-nums" value={amountPaid || ''} onChange={e => setAmountPaid(Number(e.target.value))} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 divide-y divide-slate-100 dark:divide-white/5 text-sm overflow-hidden">
                    {isPrinting && <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Total pieces</span><span className="font-bold tabular-nums dark:text-white">{totalQty}</span></div>}
                    <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Subtotal</span><span className="font-medium tabular-nums">{fmtCurrency(totalAmount)}</span></div>
                    <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Paid</span><span className="font-bold tabular-nums text-yellow-600 dark:text-yellow-500">{fmtCurrency(amountPaid)}</span></div>
                    <div className="flex justify-between px-4 py-3 font-semibold font-mono"><span>Balance</span><span className={`tabular-nums ${balance > 0 ? 'text-red-600' : 'text-yellow-600 dark:text-yellow-500'}`}>{fmtCurrency(balance)}</span></div>
                  </div>
                </section>
              </>
            )
          })()}

          <button type="submit" disabled={loading || !name.trim() || !phone.trim() || !unitPrice || (isPrinting && totalSizeQty <= 0)}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-yellow-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</> : <>Submit Booking <ChevronRight className="h-5 w-5" /></>}
          </button>
        </form>
      )}
    </div>
  )
}

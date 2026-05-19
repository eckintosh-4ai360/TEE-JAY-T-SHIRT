'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Printer, Camera, ChevronRight, Plus, X, Loader2, CheckCircle } from 'lucide-react'
import { PRINTING_TYPES, PHOTOGRAPHY_TYPES, type ServiceCategory, type PrintingType, type PhotographyType } from '@/types'
import { computeTotals, fmtCurrency } from '@/lib/utils'

interface ColorRow { _key: number; name: string; qty: number }
let _key = 1
const mk = (): ColorRow => ({ _key: _key++, name: '', qty: 0 })

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
  const [colors, setColors] = useState<ColorRow[]>([{ _key: _key++, name: 'Black', qty: 0 }])

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<{ receiptNumber: string; id: string } | null>(null)

  useEffect(() => { if (service) setStep('type') }, [service])

  const isPrinting = service === 'PRINTING'
  const { totalQty, totalAmount, balance } = computeTotals(
    isPrinting ? colors : [{ name: 'service', qty: 1 }],
    unitPrice, amountPaid
  )

  const updateColor = useCallback((key: number, field: 'name' | 'qty', val: string | number) =>
    setColors(p => p.map(c => c._key === key ? { ...c, [field]: val } : c)), [])
  const removeColor = useCallback((key: number) =>
    setColors(p => p.filter(c => c._key !== key)), [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        serviceCategory: service,
        clientName: name, clientPhone: phone, clientEmail: email,
        description: desc, dueDate: due, notes, unitPrice, amountPaid,
        colors: isPrinting ? colors.map(({ name, qty }) => ({ name, qty: Number(qty) })) : [],
      }
      if (service === 'PRINTING')    { body.printingType = printType;    if (printType  === 'OTHER') body.printingTypeOther    = printOther  }
      if (service === 'PHOTOGRAPHY') { body.photographyType = photoType; if (photoType === 'OTHER') body.photographyTypeOther = photoOther  }

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
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto dark:bg-emerald-500/20 dark:text-emerald-400">
        <CheckCircle className="h-10 w-10" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Booking Confirmed!</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Your order has been placed successfully.</p>
      </div>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Your Receipt Number</p>
        <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-wider">{success.receiptNumber}</p>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Save this number to track your order status</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => router.push(`/receipt/${success.receiptNumber}`)}
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition-colors">
          View Receipt
        </button>
        <button onClick={() => router.push('/track')}
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:border-teal-400 transition-colors dark:border-white/10 dark:text-slate-300">
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
                  ? color === 'teal' ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500'
                                     : 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-white/10 dark:text-slate-400 dark:hover:border-white/20'
              }`}>
              <Icon className="h-8 w-8" /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 — Sub-type */}
      {service && (
        <section className="space-y-4">
          <h2 className="label-section">2. Select Type</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(service === 'PRINTING' ? PRINTING_TYPES : PHOTOGRAPHY_TYPES).map(({ value, label }) => {
              const active = service === 'PRINTING' ? printType === value : photoType === value
              return (
                <button key={value} type="button"
                  onClick={() => { service === 'PRINTING' ? setPrintType(value as PrintingType) : setPhotoType(value as PhotographyType); setStep('details') }}
                  className={`rounded-xl border-2 py-3 px-4 text-sm font-semibold transition-all ${
                    active ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300'
                           : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20'
                  }`}>
                  {label}
                </button>
              )
            })}
          </div>
          {((service === 'PRINTING' && printType === 'OTHER') || (service === 'PHOTOGRAPHY' && photoType === 'OTHER')) && (
            <input className="input" placeholder="Please specify your service type"
              value={service === 'PRINTING' ? printOther : photoOther}
              onChange={e => service === 'PRINTING' ? setPrintOther(e.target.value) : setPhotoOther(e.target.value)} />
          )}
        </section>
      )}

      {/* Step 3 — Details */}
      {step === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{error}</div>}

          <section className="space-y-4">
            <h2 className="label-section">3. Your Information</h2>
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

          {/* Colours section — printing only */}
          {isPrinting && (
            <section className="space-y-4">
              <h2 className="label-section">4. Colours & Quantities</h2>
              <div className="space-y-2">
                {colors.map(c => (
                  <div key={c._key} className="grid grid-cols-[1fr_100px_32px] items-center gap-3">
                    <input className="input" value={c.name} onChange={e => updateColor(c._key, 'name', e.target.value)} placeholder="e.g. Black" />
                    <input type="number" min={0} className="input text-right tabular-nums" value={c.qty || ''} onChange={e => updateColor(c._key, 'qty', Number(e.target.value))} placeholder="0" />
                    <button type="button" onClick={() => removeColor(c._key)} disabled={colors.length === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 disabled:opacity-30 transition">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setColors(p => [...p, mk()])}
                className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400">
                <Plus className="h-4 w-4" /> Add colour
              </button>
            </section>
          )}

          {/* Pricing */}
          <section className="space-y-4">
            <h2 className="label-section">{isPrinting ? '5.' : '4.'} Pricing</h2>
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
              <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Paid</span><span className="font-medium tabular-nums text-emerald-600">{fmtCurrency(amountPaid)}</span></div>
              <div className="flex justify-between px-4 py-3 font-semibold"><span>Balance</span><span className={`tabular-nums ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmtCurrency(balance)}</span></div>
            </div>
          </section>

          <button type="submit" disabled={loading || !name.trim() || !phone.trim() || !unitPrice}
            className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 py-4 text-base font-bold text-white shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</> : <>Submit Booking <ChevronRight className="h-5 w-5" /></>}
          </button>
        </form>
      )}
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { computeTotals, fmtCurrency } from '@/lib/utils'
import { STATUS_META, type OrderStatus, type SerializedOrder, type ColorEntry, type OrderPayload } from '@/types'

interface OrderFormProps {
  /** Pass existing order when editing; omit for new order */
  order?: SerializedOrder
}

interface FormColor extends ColorEntry {
  _key: number // stable React key
}

const DEFAULT_COLOR: Omit<FormColor, '_key'> = { name: '', qty: 0 }

let colorKeyCounter = 100

function makeColor(): FormColor {
  return { ...DEFAULT_COLOR, _key: colorKeyCounter++ }
}

function initColors(order?: SerializedOrder): FormColor[] {
  if (order?.colors.length) {
    return order.colors.map((c) => ({ ...c, _key: colorKeyCounter++ }))
  }
  return [{ name: 'Black', qty: 0, _key: colorKeyCounter++ }]
}

export default function OrderForm({ order }: OrderFormProps) {
  const router = useRouter()
  const isEdit = Boolean(order)

  // ── Field state ──────────────────────────────────────────────────────────
  const [clientName,  setClientName]  = useState(order?.clientName  ?? '')
  const [clientPhone, setClientPhone] = useState(order?.clientPhone ?? '')
  const [clientEmail, setClientEmail] = useState(order?.clientEmail ?? '')
  const [design,      setDesign]      = useState(order?.design      ?? '')
  const [dueDate,     setDueDate]     = useState(
    order?.dueDate ? order.dueDate.slice(0, 10) : ''
  )
  const [status,      setStatus]      = useState<OrderStatus>(
    (order?.status as OrderStatus) ?? 'PENDING'
  )
  const [notes,       setNotes]       = useState(order?.notes ?? '')
  const [unitPrice,   setUnitPrice]   = useState(order?.unitPrice   ?? 0)
  const [amountPaid,  setAmountPaid]  = useState(order?.amountPaid  ?? 0)
  const [colors,      setColors]      = useState<FormColor[]>(() => initColors(order))

  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // ── Derived totals ────────────────────────────────────────────────────────
  const { totalQty, totalAmount, balance } = computeTotals(colors, unitPrice, amountPaid)

  // ── Colour helpers ────────────────────────────────────────────────────────
  const addColor = useCallback(() => setColors((prev) => [...prev, makeColor()]), [])

  const updateColor = useCallback((key: number, field: 'name' | 'qty', value: string | number) => {
    setColors((prev) =>
      prev.map((c) => (c._key === key ? { ...c, [field]: value } : c))
    )
  }, [])

  const removeColor = useCallback((key: number) => {
    setColors((prev) => prev.filter((c) => c._key !== key))
  }, [])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload: OrderPayload = {
      clientName,
      clientPhone,
      clientEmail,
      design,
      dueDate,
      status,
      notes,
      unitPrice,
      amountPaid,
      colors: colors.map(({ name, qty }) => ({ name, qty: Number(qty) })),
    }

    try {
      const url    = isEdit ? `/api/orders/${order!.id}` : '/api/orders'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      const saved = await res.json()
      router.push(`/orders/${saved.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ── Left column ──────────────────────────────────────────────── */}
        <section className="space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Client information
          </h2>

          <div>
            <label className="label" htmlFor="clientName">Client name *</label>
            <input
              id="clientName"
              className="input"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="clientPhone">Phone</label>
              <input
                id="clientPhone"
                className="input"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX"
              />
            </div>
            <div>
              <label className="label" htmlFor="clientEmail">Email</label>
              <input
                id="clientEmail"
                type="email"
                className="input"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@email.com"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="design">Design / description</label>
            <input
              id="design"
              className="input"
              value={design}
              onChange={(e) => setDesign(e.target.value)}
              placeholder="e.g. Front-only logo, double-sided event tee"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="dueDate">Due date</label>
              <input
                id="dueDate"
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select
                id="status"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className="input resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions, delivery info, etc."
            />
          </div>
        </section>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <section className="space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Colours &amp; quantities
          </h2>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_100px_32px] gap-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            <span>Colour</span>
            <span className="text-right">Qty</span>
            <span />
          </div>

          {/* Colour rows */}
          <div className="space-y-2">
            {colors.map((c) => (
              <div key={c._key} className="grid grid-cols-[1fr_100px_32px] items-center gap-3">
                <input
                  className="input"
                  value={c.name}
                  onChange={(e) => updateColor(c._key, 'name', e.target.value)}
                  placeholder="e.g. Black"
                />
                <input
                  type="number"
                  min={0}
                  className="input text-right tabular-nums"
                  value={c.qty || ''}
                  onChange={(e) => updateColor(c._key, 'qty', Number(e.target.value))}
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => removeColor(c._key)}
                  disabled={colors.length === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500 disabled:opacity-30 transition"
                  aria-label="Remove colour"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addColor}
            className="btn-secondary btn-sm"
          >
            + Add colour
          </button>

          {/* Total pieces summary */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total pieces</span>
              <span className="font-semibold tabular-nums">{totalQty.toLocaleString()}</span>
            </div>
          </div>

          {/* Pricing section */}
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 pt-2">
            Pricing
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="unitPrice">Unit price (GHS) *</label>
              <input
                id="unitPrice"
                type="number"
                min={0}
                step={0.01}
                className="input tabular-nums"
                value={unitPrice || ''}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="amountPaid">Amount paid (GHS)</label>
              <input
                id="amountPaid"
                type="number"
                min={0}
                step={0.01}
                className="input tabular-nums"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Invoice summary */}
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 text-sm overflow-hidden">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-gray-500">
                Subtotal ({totalQty.toLocaleString()} × {fmtCurrency(unitPrice)})
              </span>
              <span className="font-medium tabular-nums">{fmtCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-gray-500">Amount paid</span>
              <span className="font-medium tabular-nums text-green-700">{fmtCurrency(amountPaid)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 font-semibold">
              <span>Balance due</span>
              <span className={`tabular-nums ${balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                {fmtCurrency(balance)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
        <button
          type="submit"
          disabled={loading || !clientName.trim() || totalQty === 0}
          className="btn-primary"
        >
          {loading ? 'Saving…' : isEdit ? 'Update order' : 'Create order'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

import type { Order, OrderColor } from '@prisma/client'

// ── Serialization ─────────────────────────────────────────────────────────────
// Prisma returns Decimal and Date objects which are not JSON-serialisable.
// Call this before sending any Order from an API Route to the client.

export type SerializedColor = {
  id: string
  name: string
  qty: number
  orderId: string
}

export type SerializedOrder = {
  id: string
  createdAt: string
  updatedAt: string
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
  design: string | null
  dueDate: string | null
  status: string
  notes: string | null
  unitPrice: number
  totalQty: number
  totalAmount: number
  amountPaid: number
  balance: number
  colors: SerializedColor[]
}

export function serializeOrder(
  order: Order & { colors: OrderColor[] }
): SerializedOrder {
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    clientName: order.clientName,
    clientPhone: order.clientPhone,
    clientEmail: order.clientEmail,
    design: order.design,
    dueDate: order.dueDate?.toISOString() ?? null,
    status: order.status,
    notes: order.notes,
    unitPrice: Number(order.unitPrice),
    totalQty: order.totalQty,
    totalAmount: Number(order.totalAmount),
    amountPaid: Number(order.amountPaid),
    balance: Number(order.balance),
    colors: order.colors.map((c) => ({
      id: c.id,
      name: c.name,
      qty: c.qty,
      orderId: c.orderId,
    })),
  }
}

// ── Derived values ────────────────────────────────────────────────────────────
export interface ColorEntry {
  id?: string
  name: string
  qty: number
}

export function computeTotals(
  colors: ColorEntry[],
  unitPrice: number,
  amountPaid: number
) {
  const totalQty = colors.reduce((sum, c) => sum + Number(c.qty || 0), 0)
  const totalAmount = parseFloat((totalQty * Number(unitPrice || 0)).toFixed(2))
  const balance = parseFloat((totalAmount - Number(amountPaid || 0)).toFixed(2))
  return { totalQty, totalAmount, balance }
}

// ── Formatting ────────────────────────────────────────────────────────────────
export function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

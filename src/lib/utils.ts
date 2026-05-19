import type { Order, OrderColor } from '@prisma/client'

// ── Serialization ─────────────────────────────────────────────────────────────

export type SerializedColor = {
  id: string
  name: string
  qty: number
  orderId: string
}

export type SerializedOrder = {
  id: string
  receiptNumber: string
  createdAt: string
  updatedAt: string
  serviceCategory: string
  printingType: string | null
  printingTypeOther: string | null
  photographyType: string | null
  photographyTypeOther: string | null
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
  assignedToId: string | null
  assignedToName: string | null
  description: string | null
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
  order: Order & { colors: OrderColor[]; assignedTo?: { name: string } | null }
): SerializedOrder {
  return {
    id: order.id,
    receiptNumber: order.receiptNumber,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    serviceCategory: order.serviceCategory,
    printingType: order.printingType ?? null,
    printingTypeOther: order.printingTypeOther ?? null,
    photographyType: order.photographyType ?? null,
    photographyTypeOther: order.photographyTypeOther ?? null,
    clientName: order.clientName,
    clientPhone: order.clientPhone ?? null,
    clientEmail: order.clientEmail ?? null,
    assignedToId: order.assignedToId ?? null,
    assignedToName: order.assignedTo?.name ?? null,
    description: order.description ?? null,
    dueDate: order.dueDate?.toISOString() ?? null,
    status: order.status,
    notes: order.notes ?? null,
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

// ── Receipt number generator ───────────────────────────────────────────────────
export function generateReceiptNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `TJ-${datePart}-${rand}`
}

// ── Service label helpers ──────────────────────────────────────────────────────
export function getServiceLabel(order: SerializedOrder): string {
  if (order.serviceCategory === 'PHOTOGRAPHY') {
    if (!order.photographyType) return 'Photography'
    if (order.photographyType === 'OTHER') return order.photographyTypeOther ?? 'Photography'
    const labels: Record<string, string> = {
      WEDDING: 'Wedding Photography',
      BIRTHDAY: 'Birthday Photography',
      GRADUATION: 'Graduation Photography',
    }
    return labels[order.photographyType] ?? 'Photography'
  }
  // PRINTING
  if (!order.printingType) return 'Printing'
  if (order.printingType === 'OTHER') return order.printingTypeOther ?? 'Printing'
  const labels: Record<string, string> = {
    TSHIRT: 'T-Shirt Printing',
    LOGO: 'Logo Printing',
    POSTER: 'Poster Printing',
    FLYER: 'Flyer Printing',
  }
  return labels[order.printingType] ?? 'Printing'
}

export function getStatusLabel(order: SerializedOrder): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PRINTING: order.serviceCategory === 'PHOTOGRAPHY' ? 'In Progress' : 'Printing',
    COMPLETED: 'Completed',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }
  return labels[order.status] ?? order.status
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

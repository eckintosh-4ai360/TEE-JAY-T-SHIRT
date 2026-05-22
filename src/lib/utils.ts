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
  designType: string | null
  designTypeOther: string | null
  clientName: string
  clientPhone: string | null
  clientEmail: string | null
  assignedToId: string | null
  assignedToName: string | null
  createdById: string | null
  createdByName: string | null
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
  sizes: any | null
}

export function serializeOrder(
  order: Order & {
    colors: OrderColor[]
    assignedTo?: { name: string } | null
    createdBy?: { name: string } | null
  }
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
    designType: (order as any).designType ?? null,
    designTypeOther: (order as any).designTypeOther ?? null,
    clientName: order.clientName,
    clientPhone: order.clientPhone ?? null,
    clientEmail: order.clientEmail ?? null,
    assignedToId: order.assignedToId ?? null,
    assignedToName: order.assignedTo?.name ?? null,
    createdById: order.createdById ?? null,
    createdByName: order.createdBy?.name ?? null,
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
    sizes: order.sizes ?? null,
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

export function sumSizeQuantities(
  sizes: Record<string, unknown> | null | undefined
): number {
  if (!sizes || typeof sizes !== 'object') return 0

  return Object.entries(sizes).reduce((sum, [key, value]) => {
    if (key === '_items') return sum

    const qty = typeof value === 'number' ? value : Number(value ?? 0)
    return Number.isFinite(qty) ? sum + qty : sum
  }, 0)
}

// ── Receipt number generator ───────────────────────────────────────────────────
export function generateReceiptNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `TJ-${datePart}-${rand}`
}

// ── Service label helpers ──────────────────────────────────────────────────────
export interface OrderColorItem {
  name: string
  qty: number
}

export interface UnifiedOrderItem {
  category: string
  type: string | null
  typeOther: string | null
  description: string | null
  unitPrice: number
  qty: number
  sizes: any | null
  colors: OrderColorItem[]
}

export function getOrderItems(order: SerializedOrder): UnifiedOrderItem[] {
  if (order.sizes && typeof order.sizes === 'object' && (order.sizes as any)._version === 'v2') {
    const rawItems = (order.sizes as any).items
    if (Array.isArray(rawItems)) {
      return rawItems.map((it: any) => ({
        category: it.category,
        type: it.type || null,
        typeOther: it.typeOther || null,
        description: it.description || null,
        unitPrice: Number(it.unitPrice || 0),
        qty: Number(it.qty || 0),
        sizes: it.sizes || null,
        colors: Array.isArray(it.colors) ? it.colors.map((c: any) => ({ name: c.name, qty: Number(c.qty || 0) })) : []
      }))
    }
  }

  // Fallback: parse single-item order
  const isPrinting = order.serviceCategory === 'PRINTING'
  
  let itemColors: OrderColorItem[] = []
  if (isPrinting) {
    if (order.colors && order.colors.length > 0) {
      itemColors = order.colors.map(c => ({ name: c.name, qty: c.qty }))
    }
  }

  return [
    {
      category: order.serviceCategory,
      type: order.printingType || order.photographyType || order.designType || null,
      typeOther: order.printingTypeOther || order.photographyTypeOther || order.designTypeOther || null,
      description: order.description,
      unitPrice: order.unitPrice,
      qty: order.totalQty,
      sizes: order.sizes,
      colors: itemColors
    }
  ]
}

export function getSingleServiceLabel(category: string, type: string | null, typeOther: string | null): string {
  if (category === 'PHOTOGRAPHY') {
    if (!type) return 'Photography'
    if (type === 'OTHER') return typeOther ?? 'Photography'
    const labels: Record<string, string> = {
      WEDDING: 'Wedding Photography',
      BIRTHDAY: 'Birthday Photography',
      GRADUATION: 'Graduation Photography',
    }
    return labels[type] ?? 'Photography'
  }
  if (category === 'DESIGN') {
    if (!type) return 'Design'
    if (type === 'OTHER') return typeOther ?? 'Design'
    const labels: Record<string, string> = {
      FLYER: 'Flyer Design',
      LOGO:  'Logo Design',
    }
    return labels[type] ?? 'Design'
  }
  // PRINTING
  if (!type) return 'Printing'
  if (type === 'OTHER') return typeOther ?? 'Printing'
  const labels: Record<string, string> = {
    TSHIRT:  'T-Shirt Printing',
    LACOSTE: 'Lacoste Printing',
    POSTER:  'Poster Printing',
  }
  return labels[type] ?? 'Printing'
}

export function getServiceLabel(order: SerializedOrder): string {
  const items = getOrderItems(order)
  if (items.length === 0) return 'No service'
  if (items.length === 1) {
    const item = items[0]
    return getSingleServiceLabel(item.category, item.type, item.typeOther)
  }

  // Multiple items
  const categories = Array.from(new Set(items.map(it => it.category)))
  if (categories.length > 1) {
    return categories.map(c => c.charAt(0) + c.slice(1).toLowerCase()).join(' & ')
  }

  // Same category, list types
  const types = items.map(it => {
    if (it.category === 'PRINTING') {
      const labels: Record<string, string> = { TSHIRT: 'T-Shirt', LACOSTE: 'Lacoste', POSTER: 'Poster' }
      return it.type === 'OTHER' ? (it.typeOther || 'Printing') : (labels[it.type || ''] || 'Printing')
    }
    if (it.category === 'PHOTOGRAPHY') {
      const labels: Record<string, string> = { WEDDING: 'Wedding', BIRTHDAY: 'Birthday', GRADUATION: 'Graduation' }
      return it.type === 'OTHER' ? (it.typeOther || 'Photography') : (labels[it.type || ''] || 'Photography')
    }
    if (it.category === 'DESIGN') {
      const labels: Record<string, string> = { FLYER: 'Flyer', LOGO: 'Logo' }
      return it.type === 'OTHER' ? (it.typeOther || 'Design') : (labels[it.type || ''] || 'Design')
    }
    return 'Service'
  })

  const uniqueTypes = Array.from(new Set(types))
  const catLabel = categories[0].charAt(0) + categories[0].slice(1).toLowerCase()
  return uniqueTypes.join(' & ') + ` (${catLabel})`
}

export function getStatusLabel(order: SerializedOrder): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    PRINTING: (order.serviceCategory === 'PHOTOGRAPHY' || order.serviceCategory === 'DESIGN') ? 'In Progress' : 'Printing',
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

import type { SerializedOrder, SerializedColor, ColorEntry } from '@/lib/utils'

export type { SerializedOrder, SerializedColor, ColorEntry }

export type OrderStatus = 'PENDING' | 'PRINTING' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED'

export interface StatusMeta {
  label: string
  className: string // Tailwind classes for badge
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING:   { label: 'Pending',   className: 'bg-amber-100 text-amber-800'   },
  PRINTING:  { label: 'Printing',  className: 'bg-blue-100 text-blue-800'     },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800'   },
  DELIVERED: { label: 'Delivered', className: 'bg-gray-100 text-gray-600'     },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700'       },
}

// Payload sent from OrderForm to API
export interface OrderPayload {
  clientName: string
  clientPhone: string
  clientEmail: string
  design: string
  dueDate: string
  status: OrderStatus
  notes: string
  unitPrice: number
  amountPaid: number
  colors: ColorEntry[]
}

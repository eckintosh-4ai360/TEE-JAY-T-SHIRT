import type { SerializedOrder, SerializedColor, ColorEntry } from '@/lib/utils'

export type { SerializedOrder, SerializedColor, ColorEntry }

export type OrderStatus = 'PENDING' | 'PRINTING' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED'
export type ServiceCategory = 'PRINTING' | 'PHOTOGRAPHY'
export type PrintingType = 'TSHIRT' | 'LOGO' | 'POSTER' | 'FLYER' | 'OTHER'
export type PhotographyType = 'WEDDING' | 'BIRTHDAY' | 'GRADUATION' | 'OTHER'
export type UserRole = 'ADMIN' | 'WORKER'

export interface StatusMeta {
  label: string
  className: string
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING:   { label: 'Pending',    className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'  },
  PRINTING:  { label: 'In Progress',className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'     },
  COMPLETED: { label: 'Completed',  className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
  DELIVERED: { label: 'Delivered',  className: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300' },
  CANCELLED: { label: 'Cancelled',  className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'         },
}

export const PRINTING_TYPES: { value: PrintingType; label: string }[] = [
  { value: 'TSHIRT', label: 'T-Shirt' },
  { value: 'LOGO',   label: 'Logo' },
  { value: 'POSTER', label: 'Poster' },
  { value: 'FLYER',  label: 'Flyer' },
  { value: 'OTHER',  label: 'Other (specify)' },
]

export const PHOTOGRAPHY_TYPES: { value: PhotographyType; label: string }[] = [
  { value: 'WEDDING',    label: 'Wedding' },
  { value: 'BIRTHDAY',   label: 'Birthday' },
  { value: 'GRADUATION', label: 'Graduation' },
  { value: 'OTHER',      label: 'Other (specify)' },
]

// Payload sent from form to API
export interface OrderPayload {
  serviceCategory: ServiceCategory
  printingType?: PrintingType
  printingTypeOther?: string
  photographyType?: PhotographyType
  photographyTypeOther?: string
  clientName: string
  clientPhone: string
  clientEmail: string
  assignedToId?: string
  description: string
  dueDate: string
  status?: OrderStatus
  notes: string
  unitPrice: number
  amountPaid: number
  colors: ColorEntry[]
}

export interface WorkerUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
  _count: { assignedOrders: number }
}

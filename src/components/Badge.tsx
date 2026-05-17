import { STATUS_META, type OrderStatus } from '@/types'

interface BadgeProps {
  status: string
  className?: string
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const meta = STATUS_META[status as OrderStatus]
  if (!meta) return null
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className} ${className}`}
    >
      {meta.label}
    </span>
  )
}

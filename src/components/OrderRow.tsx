import Link from 'next/link'
import Badge from './Badge'
import { fmtCurrency, fmtDate } from '@/lib/utils'
import type { SerializedOrder } from '@/types'

interface OrderRowProps {
  order: SerializedOrder
}

export default function OrderRow({ order }: OrderRowProps) {
  return (
    <tr className="group border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
      <td className="py-3 pl-6 pr-4">
        <p className="font-medium text-gray-900">{order.clientName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{order.id}</p>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {order.design || <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600 text-right tabular-nums">
        {order.totalQty.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-sm text-right tabular-nums font-medium text-gray-900">
        {fmtCurrency(order.totalAmount)}
      </td>
      <td className={`py-3 px-4 text-sm text-right tabular-nums font-medium ${order.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
        {fmtCurrency(order.balance)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {fmtDate(order.dueDate)}
      </td>
      <td className="py-3 px-4">
        <Badge status={order.status} />
      </td>
      <td className="py-3 pl-4 pr-6 text-right">
        <Link
          href={`/orders/${order.id}`}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition"
        >
          View →
        </Link>
      </td>
    </tr>
  )
}

import Link from 'next/link'
import Badge from './Badge'
import { fmtCurrency, fmtDate } from '@/lib/utils'
import type { SerializedOrder } from '@/types'

interface OrderRowProps {
  order: SerializedOrder
}

export default function OrderRow({ order }: OrderRowProps) {
  return (
    <tr className="group hover:bg-slate-50/50 transition-colors duration-200 dark:hover:bg-white/[0.02]">
      <td className="py-3 pl-6 pr-4">
        <p className="font-semibold text-slate-900 dark:text-white">{order.clientName}</p>
        <p className="text-xs text-slate-400 mt-0.5 dark:text-slate-500 font-mono tracking-tight">{order.id.slice(-6)}</p>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
        {order.design || <span className="text-slate-300 dark:text-slate-600">—</span>}
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 text-right tabular-nums">
        {order.totalQty.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-sm text-right tabular-nums font-semibold text-slate-900 dark:text-white">
        {fmtCurrency(order.totalAmount)}
      </td>
      <td className={`py-3 px-4 text-sm text-right tabular-nums font-semibold ${order.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {fmtCurrency(order.balance)}
      </td>
      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
        {fmtDate(order.dueDate)}
      </td>
      <td className="py-3 px-4">
        <Badge status={order.status} />
      </td>
      <td className="py-3 pl-4 pr-6 text-right">
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 group-hover:opacity-100 opacity-0 sm:opacity-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          View &rarr;
        </Link>
      </td>
    </tr>
  )
}

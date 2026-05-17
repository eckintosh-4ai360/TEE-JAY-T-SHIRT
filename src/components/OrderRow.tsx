import Link from 'next/link'
import Badge from './Badge'
import { fmtCurrency, fmtDate } from '@/lib/utils'
import type { SerializedOrder } from '@/lib/utils'

interface OrderRowProps {
  order: SerializedOrder
}

export default function OrderRow({ order }: OrderRowProps) {
  return (
    <>
      {/* ── Desktop row (hidden on mobile) ──────────────────────────── */}
      <tr className="group hidden sm:table-row hover:bg-slate-50/50 transition-colors duration-200 dark:hover:bg-white/[0.02]">
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
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            View &rarr;
          </Link>
        </td>
      </tr>

      {/* ── Mobile card (visible on mobile only) ────────────────────── */}
      <tr className="sm:hidden">
        <td colSpan={8} className="px-0 py-0">
          <Link href={`/orders/${order.id}`} className="block">
            <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4 dark:border-white/5 active:bg-slate-50 dark:active:bg-white/5 transition-colors">
              {/* Left: client + design */}
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">{order.clientName}</p>
                  <Badge status={order.status} />
                </div>
                {order.design && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">{order.design}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{order.totalQty.toLocaleString()} pcs</span>
                  {order.dueDate && <span>Due {fmtDate(order.dueDate)}</span>}
                  <span className="font-mono text-[10px] text-slate-400">#{order.id.slice(-6)}</span>
                </div>
              </div>
              {/* Right: amounts */}
              <div className="text-right shrink-0">
                <p className="font-bold text-slate-900 dark:text-white tabular-nums">{fmtCurrency(order.totalAmount)}</p>
                <p className={`mt-1 text-xs font-semibold tabular-nums ${order.balance > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {order.balance > 0 ? `Bal: ${fmtCurrency(order.balance)}` : '✓ Paid'}
                </p>
              </div>
            </div>
          </Link>
        </td>
      </tr>
    </>
  )
}

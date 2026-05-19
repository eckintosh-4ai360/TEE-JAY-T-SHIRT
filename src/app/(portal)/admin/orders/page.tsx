import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtCurrency, fmtDate, getServiceLabel, getStatusLabel } from '@/lib/utils'
import { STATUS_META } from '@/types'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'All Orders — Tee-Jay Multimedia' }

export default async function AdminOrdersPage() {
  const raw = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { colors: true, assignedTo: true },
  })
  const orders = raw.map(serializeOrder)

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">All Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{orders.length} total orders</p>
        </div>
        <Link href="/admin/orders/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-600 transition-colors">
          <Plus className="h-4 w-4" /> New Order
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0a0a0a] overflow-hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Search className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-semibold text-slate-500">No orders yet</p>
            <Link href="/admin/orders/new" className="mt-4 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white">Create first order</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="py-3 pl-5 pr-3 text-left">Client</th>
                  <th className="py-3 px-3 text-left">Service</th>
                  <th className="py-3 px-3 text-left hidden sm:table-cell">Receipt #</th>
                  <th className="py-3 px-3 text-left">Status</th>
                  <th className="py-3 px-3 text-left hidden md:table-cell">Assigned</th>
                  <th className="py-3 px-3 text-right hidden md:table-cell">Total</th>
                  <th className="py-3 px-3 text-right hidden lg:table-cell">Paid</th>
                  <th className="py-3 px-3 text-right hidden lg:table-cell">Balance</th>
                  <th className="py-3 px-3 text-left hidden sm:table-cell">Due</th>
                  <th className="py-3 pl-3 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {orders.map(o => {
                  const meta = STATUS_META[o.status as keyof typeof STATUS_META]
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-5 pr-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{o.clientName}</div>
                        {o.clientPhone && <div className="text-xs text-slate-400">{o.clientPhone}</div>}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate">{getServiceLabel(o)}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-400 hidden sm:table-cell">{o.receiptNumber}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meta?.className}`}>{getStatusLabel(o)}</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 hidden md:table-cell">{o.assignedToName ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                      <td className="py-3 px-3 text-right tabular-nums font-medium text-slate-700 dark:text-slate-300 hidden md:table-cell">{fmtCurrency(o.totalAmount)}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-emerald-600 font-medium hidden lg:table-cell">{fmtCurrency(o.amountPaid)}</td>
                      <td className="py-3 px-3 text-right tabular-nums hidden lg:table-cell">
                        <span className={o.balance > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>{fmtCurrency(o.balance)}</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400 hidden sm:table-cell">{fmtDate(o.dueDate)}</td>
                      <td className="py-3 pl-3 pr-5">
                        <Link href={`/admin/orders/${o.id}`} className="rounded-lg bg-slate-100 dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-500/20 dark:hover:text-teal-300 transition-colors whitespace-nowrap">
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtCurrency } from '@/lib/utils'
import OrderRow from '@/components/OrderRow'
import { STATUS_META } from '@/types'
import type { OrderStatus } from '@/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const { search = '', status = '' } = await searchParams

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(search
        ? {
            OR: [
              { clientName: { contains: search, mode: 'insensitive' } },
              { id:         { contains: search, mode: 'insensitive' } },
              { design:     { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { colors: true },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = orders.map(serializeOrder)

  const totalAmount  = serialized.reduce((s, o) => s + o.totalAmount, 0)
  const totalBalance = serialized.reduce((s, o) => s + o.balance, 0)
  const totalPieces  = serialized.reduce((s, o) => s + o.totalQty, 0)

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Orders</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {serialized.length} order{serialized.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/orders/new" className="btn-primary btn-sm">
          + New order
        </Link>
      </div>

      {/* Search & filter */}
      <form method="GET" className="flex flex-col gap-3 sm:flex-row">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name, ID, or design…"
          className="input flex-1"
        />
        <select name="status" defaultValue={status} className="input sm:w-44">
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="btn-secondary flex-1 sm:flex-none">Search</button>
          {(search || status) && (
            <Link href="/orders" className="btn-secondary flex-1 sm:flex-none text-center">Clear</Link>
          )}
        </div>
      </form>

      {/* Aggregate bar */}
      {serialized.length > 0 && (
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/60 px-4 py-3 text-sm shadow-sm border border-slate-100 dark:border-white/5 dark:bg-white/[0.03] sm:flex sm:gap-6 sm:rounded-xl">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">Pieces</p>
            <p className="font-bold text-slate-900 dark:text-white tabular-nums">{totalPieces.toLocaleString()}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">Revenue</p>
            <p className="font-bold text-slate-900 dark:text-white tabular-nums">{fmtCurrency(totalAmount)}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">Outstanding</p>
            <p className={`font-bold tabular-nums ${totalBalance > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmtCurrency(totalBalance)}</p>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-sm overflow-hidden dark:border-white/10 dark:bg-[#0a0a0a]/70">
        {serialized.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-slate-600 dark:text-slate-300 font-semibold">No orders found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              {search || status ? 'Try adjusting your search filters.' : 'Create your first order to get started.'}
            </p>
            {!search && !status && (
              <Link href="/orders/new" className="btn-primary mt-4">
                + New order
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* Table headers: hidden on mobile (OrderRow renders cards) */}
              <thead className="hidden sm:table-header-group">
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-slate-400">
                  <th className="py-3 pl-6 pr-4">Client</th>
                  <th className="py-3 px-4">Design</th>
                  <th className="py-3 px-4 text-right">Pieces</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Due date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 pl-4 pr-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {serialized.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

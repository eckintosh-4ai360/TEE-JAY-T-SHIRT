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
      ...(status ? { status: status as any } : {}),
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

  // Totals for filtered set
  const totalAmount  = serialized.reduce((s, o) => s + o.totalAmount, 0)
  const totalBalance = serialized.reduce((s, o) => s + o.balance, 0)
  const totalPieces  = serialized.reduce((s, o) => s + o.totalQty, 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {serialized.length} order{serialized.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/orders/new" className="btn-primary">
          + New order
        </Link>
      </div>

      {/* Filters — form submission drives URL params; no JS needed */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name, ID, or design…"
          className="input flex-1 min-w-48"
        />
        <select name="status" defaultValue={status} className="input w-44">
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Search</button>
        {(search || status) && (
          <Link href="/orders" className="btn-secondary">Clear</Link>
        )}
      </form>

      {/* Aggregate bar */}
      {serialized.length > 0 && (
        <div className="flex flex-wrap gap-6 rounded-xl bg-gray-100 px-5 py-3 text-sm">
          <span className="text-gray-500">
            Pieces: <span className="font-semibold text-gray-900">{totalPieces.toLocaleString()}</span>
          </span>
          <span className="text-gray-500">
            Revenue: <span className="font-semibold text-gray-900">{fmtCurrency(totalAmount)}</span>
          </span>
          <span className="text-gray-500">
            Outstanding: <span className={`font-semibold ${totalBalance > 0 ? 'text-red-600' : 'text-green-700'}`}>{fmtCurrency(totalBalance)}</span>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {serialized.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || status ? 'Try adjusting your search filters.' : 'Create your first order to get started.'}
            </p>
            {!search && !status && (
              <Link href="/orders/new" className="btn-primary mt-4">
                + New order
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2.5 pl-6 pr-4 text-left font-medium">Client</th>
                <th className="py-2.5 px-4 text-left font-medium">Design</th>
                <th className="py-2.5 px-4 text-right font-medium">Pieces</th>
                <th className="py-2.5 px-4 text-right font-medium">Total</th>
                <th className="py-2.5 px-4 text-right font-medium">Balance</th>
                <th className="py-2.5 px-4 text-left font-medium">Due date</th>
                <th className="py-2.5 px-4 text-left font-medium">Status</th>
                <th className="py-2.5 pl-4 pr-6" />
              </tr>
            </thead>
            <tbody>
              {serialized.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

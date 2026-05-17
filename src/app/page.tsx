import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/StatCard'
import OrderRow from '@/components/OrderRow'
import { serializeOrder, fmtCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic' // always fetch fresh data

async function getStats() {
  const [orders, agg] = await Promise.all([
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { colors: true },
    }),
    prisma.order.aggregate({
      _count: { id: true },
      _sum:   { totalAmount: true, amountPaid: true, balance: true, totalQty: true },
    }),
  ])

  const byStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
  })

  const statusMap = Object.fromEntries(
    byStatus.map((r) => [r.status, r._count.id])
  )

  return {
    orders: orders.map(serializeOrder),
    total:        agg._count.id           ?? 0,
    totalRevenue: Number(agg._sum.totalAmount ?? 0),
    totalPaid:    Number(agg._sum.amountPaid  ?? 0),
    totalBalance: Number(agg._sum.balance     ?? 0),
    totalPieces:  agg._sum.totalQty           ?? 0,
    pending:   statusMap['PENDING']   ?? 0,
    printing:  statusMap['PRINTING']  ?? 0,
    completed: statusMap['COMPLETED'] ?? 0,
    delivered: statusMap['DELIVERED'] ?? 0,
    cancelled: statusMap['CANCELLED'] ?? 0,
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  const statusCards = [
    { label: 'Pending',   count: stats.pending,   status: 'PENDING',   color: 'bg-amber-50 border-amber-200 text-amber-700'  },
    { label: 'Printing',  count: stats.printing,  status: 'PRINTING',  color: 'bg-blue-50 border-blue-200 text-blue-700'    },
    { label: 'Completed', count: stats.completed, status: 'COMPLETED', color: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'Delivered', count: stats.delivered, status: 'DELIVERED', color: 'bg-gray-50 border-gray-200 text-gray-600'   },
  ]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Overview of your printing business</p>
        </div>
        <Link href="/orders/new" className="btn-primary">
          + New order
        </Link>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total orders"
          value={stats.total}
          sub={`${stats.totalPieces.toLocaleString()} pieces printed`}
        />
        <StatCard
          label="Total revenue"
          value={fmtCurrency(stats.totalRevenue)}
          sub={`Collected: ${fmtCurrency(stats.totalPaid)}`}
          accent="orange"
        />
        <StatCard
          label="Outstanding balance"
          value={fmtCurrency(stats.totalBalance)}
          sub="Across all clients"
          accent={stats.totalBalance > 0 ? 'red' : 'green'}
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          sub={`${stats.completed} completed, ${stats.cancelled} cancelled`}
          accent="blue"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statusCards.map(({ label, count, status, color }) => (
          <Link
            key={status}
            href={`/orders?status=${status}`}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition hover:shadow-sm ${color}`}
          >
            <span className="block text-2xl font-bold">{count}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent orders</h2>
          <Link href="/orders" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        </div>

        <div className="card overflow-hidden">
          {stats.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-4xl mb-3">🖨️</p>
              <p className="text-gray-500 text-sm">No orders yet.</p>
              <Link href="/orders/new" className="btn-primary mt-4 btn-sm">
                Create your first order
              </Link>
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
                  <th className="py-2.5 px-4 text-left font-medium">Due</th>
                  <th className="py-2.5 px-4 text-left font-medium">Status</th>
                  <th className="py-2.5 pl-4 pr-6" />
                </tr>
              </thead>
              <tbody>
                {stats.orders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

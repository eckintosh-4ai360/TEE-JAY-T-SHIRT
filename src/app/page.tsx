import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/StatCard'
import OrderRow from '@/components/OrderRow'
import { serializeOrder, fmtCurrency } from '@/lib/utils'
import { Shirt, Zap, CheckCircle2, Truck, CreditCard, AlertCircle, Box } from 'lucide-react'
import ReportExporter from '@/components/ReportExporter'

export const dynamic = 'force-dynamic'

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Overview of your printing business</p>
        </div>
        <Link href="/orders/new" className="btn-primary btn-sm hidden sm:inline-flex">
          + New order
        </Link>
      </div>

      {/* KPI stat cards — 2 cols on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Orders"
          value={stats.total}
          sub="Across all clients"
          badge="ALL TIME"
          accent="cyan"
          icon={<Box className="h-5 w-5" />}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          sub="Awaiting action"
          badge="ACTION"
          accent="purple"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Printing"
          value={stats.printing}
          sub="In progress"
          badge="LIVE"
          accent="green"
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          sub="Ready for delivery"
          badge="DONE"
          accent="orange"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          sub="Successfully done"
          badge="ALL TIME"
          accent="magenta"
          icon={<Truck className="h-5 w-5" />}
        />
        <StatCard
          label="Revenue"
          value={fmtCurrency(stats.totalRevenue)}
          sub={`Paid: ${fmtCurrency(stats.totalPaid)}`}
          badge="ALL TIME"
          accent="cyan"
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* Mobile: FAB-style new order button */}
      <Link
        href="/orders/new"
        className="sm:hidden flex items-center justify-center gap-2 w-full btn-primary py-4 text-base rounded-2xl"
      >
        + Create new order
      </Link>

      {/* Report export panel */}
      <ReportExporter />

      {/* Recent orders */}
      <section className="rounded-[1.5rem] bg-white/70 p-4 sm:p-6 shadow-sm border border-white/50 backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0a]/70">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 shrink-0">
              <Shirt className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">Recent Orders</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">Latest t-shirt printing jobs</p>
            </div>
          </div>
          <Link href="/orders" className="flex items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 shrink-0">
            All <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white/50 dark:border-white/5 dark:bg-white/5">
          {stats.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 mb-4">
                <Box className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No orders found.</p>
              <Link href="/orders/new" className="btn-primary mt-4 btn-sm rounded-lg">
                Create your first order
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="hidden sm:table-header-group">
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-white/5 dark:bg-white/5 dark:text-slate-400">
                    <th className="py-3 pl-6 pr-4">Client</th>
                    <th className="py-3 px-4">Design</th>
                    <th className="py-3 px-4 text-right">Pieces</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 pl-4 pr-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {stats.orders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/StatCard'
import OrderRow from '@/components/OrderRow'
import { serializeOrder, fmtCurrency } from '@/lib/utils'
import { Shirt, Zap, Rocket, Clock, Users, GitCommit, CheckCircle2, Truck, CreditCard, AlertCircle, Box } from 'lucide-react'
import ReportExporter from '@/components/ReportExporter'

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

      {/* KPI stat cards (6-card layout matching the design) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Orders"
          value={stats.total}
          sub="Across all clients"
          badge="ALL TIME"
          accent="cyan"
          icon={<Box className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Orders"
          value={stats.pending}
          sub="Awaiting action"
          badge="ACTION"
          accent="purple"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Printing"
          value={stats.printing}
          sub="In progress now"
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
          sub="Successfully completed"
          badge="ALL TIME"
          accent="magenta"
          icon={<Truck className="h-5 w-5" />}
        />
        <StatCard
          label="Total Revenue"
          value={fmtCurrency(stats.totalRevenue)}
          sub={`Paid: ${fmtCurrency(stats.totalPaid)}`}
          badge="ALL TIME"
          accent="cyan"
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* Report export panel */}
      <ReportExporter />

      {/* Recent orders */}
      <section className="mt-8 rounded-[1.5rem] bg-white/70 p-6 shadow-sm border border-white/50 backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0a]/70">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
              <Shirt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Latest t-shirt printing jobs</p>
            </div>
          </div>
          <Link href="/orders" className="flex items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300">
            View all <span aria-hidden="true">&rarr;</span>
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
                <thead>
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

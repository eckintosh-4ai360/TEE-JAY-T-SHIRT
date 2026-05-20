import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtCurrency, fmtDate, getServiceLabel } from '@/lib/utils'
import { STATUS_META } from '@/types'
import StatCard from '@/components/StatCard'
import Link from 'next/link'
import {
  Box, AlertCircle, Zap, CheckCircle2, Truck,
  CreditCard, Camera, Printer, Plus, ArrowRight, Users
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin Dashboard — Tee-Jay Multimedia' }

async function getStats() {
  const [orders, agg, byStatus, byCategory, workers] = await Promise.all([
    prisma.order.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { colors: true, assignedTo: true } }),
    prisma.order.aggregate({ _count: { id: true }, _sum: { totalAmount: true, amountPaid: true, balance: true } }),
    prisma.order.groupBy({ by: ['status'],          _count: { id: true } }),
    prisma.order.groupBy({ by: ['serviceCategory'], _count: { id: true } }),
    prisma.user.count({ where: { isActive: true } }),
  ])
  const sm = Object.fromEntries(byStatus.map(r => [r.status, r._count.id]))
  const cm = Object.fromEntries(byCategory.map(r => [r.serviceCategory, r._count.id]))
  return {
    orders: orders.map(serializeOrder),
    total:        agg._count.id ?? 0,
    totalRevenue: Number(agg._sum.totalAmount ?? 0),
    totalPaid:    Number(agg._sum.amountPaid  ?? 0),
    totalBalance: Number(agg._sum.balance     ?? 0),
    pending:   sm['PENDING']   ?? 0,
    printing:  sm['PRINTING']  ?? 0,
    completed: sm['COMPLETED'] ?? 0,
    delivered: sm['DELIVERED'] ?? 0,
    cancelled: sm['CANCELLED'] ?? 0,
    printingOrders:  cm['PRINTING']     ?? 0,
    photoOrders:     cm['PHOTOGRAPHY']  ?? 0,
    activeWorkers: workers,
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') redirect('/worker')

  const s = await getStats()

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Full overview of Tee-Jay Multimedia operations</p>
        </div>
        <Link href="/admin/orders/new" className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2 text-sm font-bold text-white dark:text-black hover:from-red-500 hover:to-yellow-400 transition-colors shadow-sm shadow-red-600/25">
          <Plus className="h-4 w-4" /> New Order
        </Link>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Revenue"   value={fmtCurrency(s.totalRevenue)} sub="All time"          badge="ALL TIME"  accent="cyan"    icon={<CreditCard className="h-5 w-5" />} />
        <StatCard label="Amount Paid"     value={fmtCurrency(s.totalPaid)}    sub="Collected"         badge="COLLECTED" accent="green"   icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Balance Owed"    value={fmtCurrency(s.totalBalance)} sub="Outstanding"       badge="OWED"      accent="orange"  icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard label="Active Workers"  value={s.activeWorkers}             sub="On the team"       badge="STAFF"     accent="purple"  icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Order status + service split */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Orders" value={s.total}     sub="All services"    badge="ALL" accent="cyan"    icon={<Box className="h-5 w-5" />} />
        <StatCard label="Pending"      value={s.pending}   sub="Awaiting action" badge="NEW" accent="purple"  icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard label="In Progress"  value={s.printing}  sub="Being processed" badge="LIVE" accent="blue"  icon={<Zap className="h-5 w-5" />} />
        <StatCard label="Completed"    value={s.completed} sub="Ready"           badge="DONE" accent="green" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Printing Jobs" value={s.printingOrders} sub="Print orders" badge="PRINT" accent="orange" icon={<Printer className="h-5 w-5" />} />
        <StatCard label="Photo Jobs"   value={s.photoOrders} sub="Photo sessions" badge="PHOTO" accent="magenta" icon={<Camera className="h-5 w-5" />} />
      </div>

      {/* Mobile FAB */}
      <Link href="/admin/orders/new"
        className="sm:hidden flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-red-600 to-yellow-500 py-4 text-base font-bold text-white dark:text-black shadow-lg shadow-red-600/25 hover:from-red-500 hover:to-yellow-400 transition-all">
        <Plus className="h-5 w-5" /> Create New Order
      </Link>

      {/* Recent orders */}
      <section className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0a0a0a] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="font-bold text-slate-900 dark:text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-red-600 dark:text-yellow-500 hover:gap-2 transition-all">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {s.orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Box className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No orders yet</p>
            <Link href="/admin/orders/new" className="mt-4 rounded-xl bg-gradient-to-r from-red-600 to-yellow-500 px-5 py-2.5 text-sm font-bold text-white dark:text-black hover:from-red-500 hover:to-yellow-400 transition-colors shadow-sm shadow-red-600/25">Create first order</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 pl-5 pr-3 text-left">Client</th>
                  <th className="py-3 px-3 text-left">Service</th>
                  <th className="py-3 px-3 text-left hidden sm:table-cell">Receipt</th>
                  <th className="py-3 px-3 text-left">Status</th>
                  <th className="py-3 px-3 text-right hidden md:table-cell">Total</th>
                  <th className="py-3 px-3 text-right hidden md:table-cell">Balance</th>
                  <th className="py-3 pl-3 pr-5 text-left hidden sm:table-cell">Due</th>
                  <th className="py-3 pl-3 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {s.orders.map(o => {
                  const meta = STATUS_META[o.status as keyof typeof STATUS_META]
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-5 pr-3 font-semibold text-slate-900 dark:text-white">{o.clientName}</td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-xs">{getServiceLabel(o)}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-400 hidden sm:table-cell">{o.receiptNumber}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meta?.className}`}>{meta?.label}</span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-medium text-slate-700 dark:text-slate-300 hidden md:table-cell">{fmtCurrency(o.totalAmount)}</td>
                      <td className="py-3 px-3 text-right tabular-nums hidden md:table-cell">
                        <span className={o.balance > 0 ? 'text-red-600 font-semibold' : 'text-yellow-600 dark:text-yellow-500'}>{fmtCurrency(o.balance)}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs hidden sm:table-cell">{fmtDate(o.dueDate)}</td>
                      <td className="py-3 pl-3 pr-5">
                        <Link href={`/admin/orders/${o.id}`} className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-yellow-500 dark:hover:text-yellow-400">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

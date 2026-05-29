import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtDate, getServiceLabel, getOrderDescriptionSummary } from '@/lib/utils'
import Link from 'next/link'
import { Box, Clock, CheckCircle2, Zap } from 'lucide-react'
import OrderStatusSelect from '@/components/OrderStatusSelect'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Worker Dashboard — Tee-Jay' }

export default async function WorkerDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = session.user?.id as string

  const [allAssigned, byStatus] = await Promise.all([
    prisma.order.findMany({
      where: { assignedToId: userId },
      orderBy: { updatedAt: 'desc' },
      include: { colors: true, assignedTo: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { assignedToId: userId },
      _count: { id: true },
    }),
  ])

  const orders = allAssigned.map(serializeOrder)
  const sm = Object.fromEntries(byStatus.map(r => [r.status, r._count.id]))

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          Welcome, {session.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Your assigned orders</p>
      </div>

      {/* Status summary — NO financial data */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Assigned', value: orders.length,       icon: Box,         color: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
          { label: 'Pending',        value: sm['PENDING']  ?? 0, icon: Clock,       color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' },
          { label: 'In Progress',    value: sm['PRINTING'] ?? 0, icon: Zap,         color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
          { label: 'Completed',      value: sm['COMPLETED']?? 0, icon: CheckCircle2,color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orders table — NO financial columns */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="font-bold text-slate-900 dark:text-white">My Orders</h2>
        </div>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Box className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-semibold text-slate-500">No orders assigned yet</p>
            <p className="text-sm text-slate-400 mt-1">Orders assigned to you will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="py-3 pl-5 pr-3 text-left">Client</th>
                  <th className="py-3 px-3 text-left">Service</th>
                  <th className="py-3 px-3 text-left hidden sm:table-cell">Description</th>
                  <th className="py-3 px-3 text-left">Status</th>
                  <th className="py-3 px-3 text-left hidden sm:table-cell">Due</th>
                  <th className="py-3 pl-3 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {orders.map(o => {
                  const description = getOrderDescriptionSummary(o)
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-5 pr-3 font-semibold text-slate-900 dark:text-white">{o.clientName}</td>
                      <td className="py-3 px-3 text-xs text-slate-500">{getServiceLabel(o)}</td>
                      <td className="py-3 px-3 text-slate-500 text-xs hidden sm:table-cell max-w-[160px] truncate">{description ?? '—'}</td>
                      <td className="py-3 px-3">
                        <OrderStatusSelect orderId={o.id} currentStatus={o.status as any} />
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400 hidden sm:table-cell">{fmtDate(o.dueDate)}</td>
                      <td className="py-3 pl-3 pr-5">
                        <Link href={`/worker/orders/${o.id}`}
                          className="rounded-lg bg-slate-100 dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors">
                          Update →
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

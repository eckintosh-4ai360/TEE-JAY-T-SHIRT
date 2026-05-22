import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtDate, getServiceLabel } from '@/lib/utils'
import Link from 'next/link'
import { Box, ListOrdered } from 'lucide-react'
import OrderStatusSelect from '@/components/OrderStatusSelect'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Orders — Tee-Jay' }

export default async function WorkerOrdersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const userId = session.user?.id as string

  const allAssigned = await prisma.order.findMany({
    where: { assignedToId: userId },
    orderBy: { updatedAt: 'desc' },
    include: { colors: true, assignedTo: true },
  })

  const orders = allAssigned.map(serializeOrder)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          My Orders
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">All orders assigned to you</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-slate-400" />
          <h2 className="font-bold text-slate-900 dark:text-white">Assigned List</h2>
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
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-5 pr-3 font-semibold text-slate-900 dark:text-white">{o.clientName}</td>
                      <td className="py-3 px-3 text-xs text-slate-500">{getServiceLabel(o)}</td>
                      <td className="py-3 px-3 text-slate-500 text-xs hidden sm:table-cell max-w-[160px] truncate">{o.description ?? '—'}</td>
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

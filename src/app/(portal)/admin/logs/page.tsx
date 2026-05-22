import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { fmtDateTime } from '@/lib/utils'
import { History } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Activity Logs — Tee-Jay Multimedia' }

export default async function AdminLogsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') redirect('/worker')

  const logs = await prisma.orderLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, role: true } },
      order: { select: { receiptNumber: true, clientName: true } },
    },
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          Activity Logs
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Canonical logs of all order modifications and progress updates
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            <h2 className="font-bold text-slate-900 dark:text-white">All Activities</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{logs.length} events logged</span>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <History className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-semibold text-slate-500">No activity logged yet</p>
            <p className="text-sm text-slate-400 mt-1">Actions on orders will be recorded here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="py-3 pl-5 pr-3 text-left">Timestamp</th>
                  <th className="py-3 px-3 text-left">Receipt &amp; Client</th>
                  <th className="py-3 px-3 text-left">User</th>
                  <th className="py-3 px-3 text-left">Action</th>
                  <th className="py-3 pl-3 pr-5 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {logs.map((log) => {
                  let actionBadge = 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300';
                  if (log.action === 'CREATE') {
                    actionBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
                  } else if (log.action === 'UPDATE') {
                    actionBadge = 'bg-blue-50 text-blue-700 border border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
                  } else if (log.action === 'UPDATE_PROGRESS') {
                    actionBadge = 'bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-5 pr-3 text-xs text-slate-400 tabular-nums">
                        {fmtDateTime(log.createdAt.toISOString())}
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-900 dark:text-white font-semibold">
                          {log.order.clientName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {log.order.receiptNumber}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {log.user ? (
                          <div>
                            <span className="text-slate-700 dark:text-slate-300">{log.user.name}</span>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-widest">{log.user.role.toLowerCase()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">System / Client</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${actionBadge}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-5 text-xs text-slate-600 dark:text-slate-300 max-w-[280px] break-words">
                        {log.details}
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

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtCurrency, fmtDate, fmtDateTime, initials } from '@/lib/utils'
import Badge from '@/components/Badge'
import StatusUpdater from '@/components/StatusUpdater'
import DeleteButton from '@/components/DeleteButton'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id }, select: { clientName: true } })
  return { title: order ? `${order.clientName} — Press Manager` : 'Order not found' }
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const raw = await prisma.order.findUnique({
    where: { id },
    include: { colors: true },
  })
  if (!raw) notFound()

  const order = serializeOrder(raw)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-200 shrink-0">Dashboard</Link>
        <span>/</span>
        <Link href="/orders" className="hover:text-slate-600 dark:hover:text-slate-200 shrink-0">Orders</Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300 font-mono text-xs shrink-0">#{order.id.slice(-6)}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-base font-bold text-brand-700 dark:bg-brand-600/20 dark:text-brand-400">
            {initials(order.clientName)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl truncate">{order.clientName}</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Created {fmtDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        {/* Action buttons — wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusUpdater orderId={order.id} current={order.status} />
          <Link href={`/orders/${order.id}/edit`} className="btn-secondary btn-sm">
            Edit
          </Link>
          <DeleteButton orderId={order.id} />
        </div>
      </div>

      {/* Payment summary — shown first on mobile for quick reference */}
      <section className="card overflow-hidden lg:hidden">
        <div className="border-b border-slate-100 dark:border-white/5 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Payment summary</h2>
          <Badge status={order.status} />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
          <div className="flex justify-between px-5 py-3">
            <span className="text-slate-500 dark:text-slate-400">Unit price</span>
            <span className="tabular-nums font-medium dark:text-slate-200">{fmtCurrency(order.unitPrice)}</span>
          </div>
          <div className="flex justify-between px-5 py-3">
            <span className="text-slate-500 dark:text-slate-400">Subtotal ({order.totalQty} pcs)</span>
            <span className="tabular-nums font-medium dark:text-slate-200">{fmtCurrency(order.totalAmount)}</span>
          </div>
          <div className="flex justify-between px-5 py-3">
            <span className="text-slate-500 dark:text-slate-400">Amount paid</span>
            <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{fmtCurrency(order.amountPaid)}</span>
          </div>
          <div className="flex justify-between px-5 py-3.5 font-bold">
            <span className="text-slate-900 dark:text-white">Balance due</span>
            <span className={`tabular-nums ${order.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {fmtCurrency(order.balance)}
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* ── Main content ─────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          {/* Colour breakdown */}
          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 dark:border-white/5 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Colour breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2.5 pl-5 pr-4 text-left font-medium">Colour</th>
                    <th className="py-2.5 px-4 text-right font-medium">Qty</th>
                    <th className="py-2.5 pl-4 pr-5 text-right font-medium">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.colors.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                      <td className="py-3 pl-5 pr-4 text-slate-800 dark:text-slate-200 font-medium">{c.name || '—'}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600 dark:text-slate-400">
                        {c.qty.toLocaleString()}
                      </td>
                      <td className="py-3 pl-4 pr-5 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {fmtCurrency(c.qty * order.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 font-bold">
                    <td className="py-3 pl-5 pr-4 text-slate-800 dark:text-slate-200">Total</td>
                    <td className="py-3 px-4 text-right tabular-nums dark:text-slate-200">{order.totalQty.toLocaleString()}</td>
                    <td className="py-3 pl-4 pr-5 text-right tabular-nums dark:text-slate-200">{fmtCurrency(order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="card px-5 py-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Client info */}
          <section className="card px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Client</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500">Name</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200">{order.clientName}</dd>
              </div>
              {order.clientPhone && (
                <div>
                  <dt className="text-xs text-slate-400 dark:text-slate-500">Phone</dt>
                  <dd className="text-slate-700 dark:text-slate-300">
                    <a href={`tel:${order.clientPhone}`} className="hover:text-brand-600 dark:hover:text-brand-400">{order.clientPhone}</a>
                  </dd>
                </div>
              )}
              {order.clientEmail && (
                <div>
                  <dt className="text-xs text-slate-400 dark:text-slate-500">Email</dt>
                  <dd className="text-slate-700 dark:text-slate-300 break-all">
                    <a href={`mailto:${order.clientEmail}`} className="hover:text-brand-600 dark:hover:text-brand-400">{order.clientEmail}</a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Order meta */}
          <section className="card px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Order details</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500">Design</dt>
                <dd className="text-slate-700 dark:text-slate-300">{order.design || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500">Due date</dt>
                <dd className="text-slate-700 dark:text-slate-300">{fmtDate(order.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 dark:text-slate-500">Status</dt>
                <dd className="mt-1"><Badge status={order.status} /></dd>
              </div>
            </dl>
          </section>

          {/* Payment summary — desktop sidebar only */}
          <section className="card overflow-hidden hidden lg:block">
            <div className="border-b border-slate-100 dark:border-white/5 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Payment</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
              <div className="flex justify-between px-5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Unit price</span>
                <span className="tabular-nums font-medium dark:text-slate-200">{fmtCurrency(order.unitPrice)}</span>
              </div>
              <div className="flex justify-between px-5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                <span className="tabular-nums font-medium dark:text-slate-200">{fmtCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between px-5 py-2.5">
                <span className="text-slate-500 dark:text-slate-400">Amount paid</span>
                <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{fmtCurrency(order.amountPaid)}</span>
              </div>
              <div className="flex justify-between px-5 py-3 font-bold">
                <span className="dark:text-white">Balance due</span>
                <span className={`tabular-nums ${order.balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {fmtCurrency(order.balance)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

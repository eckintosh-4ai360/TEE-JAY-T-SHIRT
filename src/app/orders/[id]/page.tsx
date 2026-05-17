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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">Dashboard</Link>
        <span>/</span>
        <Link href="/orders" className="hover:text-gray-600">Orders</Link>
        <span>/</span>
        <span className="text-gray-700 font-mono text-xs">{order.id}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-base font-bold text-brand-700">
            {initials(order.clientName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.clientName}</h1>
            <p className="text-sm text-gray-400">
              Created {fmtDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusUpdater orderId={order.id} current={order.status} />
          <Link href={`/orders/${order.id}/edit`} className="btn-secondary btn-sm">
            Edit order
          </Link>
          <DeleteButton orderId={order.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main content ────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Colour breakdown table */}
          <section className="card overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Colour breakdown</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pl-5 pr-4 text-left font-medium">Colour</th>
                  <th className="py-2 px-4 text-right font-medium">Qty</th>
                  <th className="py-2 pl-4 pr-5 text-right font-medium">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.colors.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 pl-5 pr-4 text-gray-800">{c.name || '—'}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-gray-600">
                      {c.qty.toLocaleString()}
                    </td>
                    <td className="py-2.5 pl-4 pr-5 text-right tabular-nums text-gray-800">
                      {fmtCurrency(c.qty * order.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                  <td className="py-2.5 pl-5 pr-4 text-gray-700">Total</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{order.totalQty.toLocaleString()}</td>
                  <td className="py-2.5 pl-4 pr-5 text-right tabular-nums">{fmtCurrency(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="card px-5 py-4">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Notes</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Client info */}
          <section className="card px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Client</h2>
            <dl className="text-sm space-y-1.5">
              <div>
                <dt className="text-xs text-gray-400">Name</dt>
                <dd className="font-medium text-gray-800">{order.clientName}</dd>
              </div>
              {order.clientPhone && (
                <div>
                  <dt className="text-xs text-gray-400">Phone</dt>
                  <dd className="text-gray-700">{order.clientPhone}</dd>
                </div>
              )}
              {order.clientEmail && (
                <div>
                  <dt className="text-xs text-gray-400">Email</dt>
                  <dd className="text-gray-700 break-all">{order.clientEmail}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Order meta */}
          <section className="card px-5 py-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Order details</h2>
            <dl className="text-sm space-y-1.5">
              <div>
                <dt className="text-xs text-gray-400">Design</dt>
                <dd className="text-gray-700">{order.design || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Due date</dt>
                <dd className="text-gray-700">{fmtDate(order.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Status</dt>
                <dd className="mt-0.5"><Badge status={order.status} /></dd>
              </div>
            </dl>
          </section>

          {/* Payment summary */}
          <section className="card overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Payment</h2>
            </div>
            <div className="divide-y divide-gray-100 text-sm">
              <div className="flex justify-between px-5 py-2.5">
                <span className="text-gray-500">Unit price</span>
                <span className="tabular-nums font-medium">{fmtCurrency(order.unitPrice)}</span>
              </div>
              <div className="flex justify-between px-5 py-2.5">
                <span className="text-gray-500">Subtotal</span>
                <span className="tabular-nums font-medium">{fmtCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between px-5 py-2.5">
                <span className="text-gray-500">Amount paid</span>
                <span className="tabular-nums font-medium text-green-700">{fmtCurrency(order.amountPaid)}</span>
              </div>
              <div className="flex justify-between px-5 py-3 font-semibold">
                <span>Balance due</span>
                <span className={`tabular-nums ${order.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
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

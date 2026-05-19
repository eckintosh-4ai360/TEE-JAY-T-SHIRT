import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtCurrency, fmtDate, getServiceLabel, getStatusLabel } from '@/lib/utils'
import { STATUS_META } from '@/types'
import { CheckCircle, Clock, Printer, Camera } from 'lucide-react'
import Link from 'next/link'
import PrintButton from '@/components/PrintButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  return { title: `Receipt ${ref} — Tee-Jay Multimedia` }
}

export default async function ReceiptPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  const raw = await prisma.order.findUnique({
    where: { receiptNumber: ref.toUpperCase() },
    include: { colors: true, assignedTo: true },
  })
  if (!raw) notFound()

  const order = serializeOrder(raw)
  const meta  = STATUS_META[order.status as keyof typeof STATUS_META]
  const isPrinting = order.serviceCategory === 'PRINTING'
  const serviceLabel = getServiceLabel(order)
  const statusLabel  = getStatusLabel(order)

  function fmtM(n: number) { return '₵' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 sm:p-8 flex justify-between items-start text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isPrinting ? <Printer className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              <span className="text-sm font-bold opacity-90">TEE-JAY MULTIMEDIA</span>
            </div>
            <p className="text-xs opacity-75">Printing & Photography Services</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold opacity-75 uppercase tracking-widest">Receipt</p>
            <p className="text-lg font-black font-mono">{order.receiptNumber}</p>
            <p className="text-xs opacity-75">{fmtDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Order Status</p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta?.className}`}>
                {order.status === 'COMPLETED' || order.status === 'DELIVERED'
                  ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {statusLabel}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Service</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{serviceLabel}</p>
            </div>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-2">Bill To</p>
              <p className="font-bold text-slate-900 dark:text-white">{order.clientName}</p>
              {order.clientPhone && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.clientPhone}</p>}
              {order.clientEmail && <p className="text-sm text-slate-500 dark:text-slate-400">{order.clientEmail}</p>}
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-2">Order Details</p>
              {order.description && <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{order.description}</p>}
              {order.dueDate && <p className="text-sm text-slate-500 dark:text-slate-400">Due: {fmtDate(order.dueDate)}</p>}
            </div>
          </div>

          {/* Colour table (printing) */}
          {isPrinting && order.colors.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Breakdown</p>
              <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-teal-500 text-white">
                    <tr>
                      <th className="py-2.5 pl-4 pr-3 text-left font-semibold text-xs">Colour</th>
                      <th className="py-2.5 px-3 text-right font-semibold text-xs">Qty</th>
                      <th className="py-2.5 px-3 text-right font-semibold text-xs">Unit</th>
                      <th className="py-2.5 pl-3 pr-4 text-right font-semibold text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {order.colors.map(c => (
                      <tr key={c.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-transparent dark:even:bg-white/5">
                        <td className="py-2.5 pl-4 pr-3 text-slate-700 dark:text-slate-300">{c.name}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{c.qty}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">{fmtM(order.unitPrice)}</td>
                        <td className="py-2.5 pl-3 pr-4 text-right tabular-nums font-medium text-slate-700 dark:text-slate-300">{fmtM(c.qty * order.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment summary */}
          <div className="flex justify-end">
            <div className="w-56 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/10 text-sm">
              <div className="flex justify-between px-4 py-2.5 bg-white dark:bg-transparent">
                <span className="text-slate-500">Subtotal</span>
                <span className="tabular-nums font-medium">{fmtM(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 bg-white dark:bg-transparent">
                <span className="text-slate-500">Paid</span>
                <span className="tabular-nums font-medium text-emerald-600">{fmtM(order.amountPaid)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-slate-50 dark:bg-white/5 font-bold">
                <span>Balance</span>
                <span className={`tabular-nums ${order.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmtM(order.balance)}</span>
              </div>
            </div>
          </div>

          {/* Thank you */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-500/10 dark:to-cyan-500/10 border border-teal-100 dark:border-teal-500/20 p-5 text-center">
            <p className="font-bold text-teal-700 dark:text-teal-300">Thank you for choosing Tee-Jay Multimedia!</p>
            <p className="font-medium italic text-teal-700 dark:text-teal-300">We serve you at ease</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep this receipt number for your records: <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{order.receiptNumber}</span></p>
          </div>

          <div className="flex gap-3 pt-2 print:hidden">
            <PrintButton />
            <Link href="/track" className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-center text-slate-600 hover:border-teal-400 transition-colors dark:border-white/10 dark:text-slate-300">
              Track Another
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

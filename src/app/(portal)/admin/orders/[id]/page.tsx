import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtCurrency, fmtDate, getServiceLabel } from '@/lib/utils'
import Link from 'next/link'
import AdminReceiptButton from '@/components/AdminReceiptButton'
import AdminStatusPanel from '@/components/AdminStatusPanel'
import { ChevronLeft, Edit, Printer, Camera } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const o = await prisma.order.findUnique({ where: { id } })
  return { title: o ? `Order – ${o.clientName} — Tee-Jay Multimedia` : 'Order not found' }
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = await prisma.order.findUnique({
    where: { id },
    include: { colors: true, assignedTo: { select: { name: true, email: true } } },
  })
  if (!raw) notFound()

  const o    = serializeOrder(raw)
  const isPrinting = o.serviceCategory === 'PRINTING'
  const isApparel = isPrinting && (o.printingType === 'TSHIRT' || o.printingType === 'LACOSTE')

  function R({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0 text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-900 dark:text-white text-right">{value ?? '—'}</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 mb-3">
          <ChevronLeft className="h-4 w-4" /> Back to orders
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isPrinting ? 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'}`}>
                {isPrinting ? <Printer className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{o.clientName}</h1>
            </div>
            <p className="text-sm text-slate-500">{getServiceLabel(o)} · <span className="font-mono">{o.receiptNumber}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <AdminReceiptButton order={o} />
            <Link href={`/admin/orders/${o.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-red-400 hover:text-red-600 dark:hover:border-yellow-400 dark:hover:text-yellow-400 transition-colors">
              <Edit className="h-4 w-4" /> Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Client Information</h2>
            <R label="Name"  value={o.clientName} />
            <R label="Phone" value={o.clientPhone} />
            <R label="Email" value={o.clientEmail} />
          </div>

          {/* Order */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Order Details</h2>
            <R label="Service"   value={getServiceLabel(o)} />
            <R label="Description" value={o.description} />
            <R label="Due Date" value={fmtDate(o.dueDate)} />
            <R label="Placed on" value={fmtDate(o.createdAt)} />
            <R label="Assigned to" value={o.assignedToName} />
            {o.notes && <R label="Notes" value={o.notes} />}
          </div>

          {/* Apparel Size / Itemized Breakdown */}
          {isApparel && o.sizes && typeof o.sizes === 'object' && (
            (() => {
              const items = (o.sizes as any)._items
              if (Array.isArray(items) && items.length > 0) {
                return (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Apparel Breakdown</h2>
                      <span className="text-xs font-semibold text-red-600 dark:text-yellow-500 font-mono">Total: {o.totalQty} pcs</span>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-900 dark:bg-zinc-950 text-white text-xs">
                        <tr>
                          <th className="py-2.5 pl-5 pr-3 text-left">Colour</th>
                          <th className="py-2.5 px-3 text-center">Size</th>
                          <th className="py-2.5 px-3 text-right">Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 pl-3 pr-5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {items.map((it: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2.5 pl-5 pr-3 font-semibold text-slate-700 dark:text-slate-300">{it.color || 'Solid'}</td>
                            <td className="py-2.5 px-3 text-center"><span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-slate-400">{it.size}</span></td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-medium">{it.qty}</td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">{fmtCurrency(o.unitPrice)}</td>
                            <td className="py-2.5 pl-3 pr-5 text-right tabular-nums font-bold text-red-600 dark:text-yellow-500">{fmtCurrency(Number(it.qty || 0) * o.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-white/5 font-bold text-sm">
                        <tr>
                          <td className="py-3 pl-5 pr-3" colSpan={2}>Total</td>
                          <td className="py-3 px-3 text-right tabular-nums text-red-600 dark:text-yellow-500">{o.totalQty}</td>
                          <td />
                          <td className="py-3 pl-3 pr-5 text-right tabular-nums text-red-600 dark:text-yellow-500">{fmtCurrency(o.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )
              }

              // Fallback to legacy flat layout
              const sizeKeys = Object.keys(o.sizes).filter(k => k !== '_items')
              if (sizeKeys.length > 0) {
                return (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Apparel Size Breakdown</h2>
                    </div>
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {sizeKeys.map((size) => {
                        const qty = Number((o.sizes as any)[size] || 0)
                        return (
                          <div key={size} className="rounded-xl border border-slate-100 dark:border-white/5 p-4 bg-slate-50/50 dark:bg-white/5 text-center">
                            <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{size}</span>
                            <span className="block text-xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{qty}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{fmtCurrency(o.unitPrice)} ea</span>
                            <span className="block text-xs font-semibold text-red-600 dark:text-yellow-500 mt-2">{fmtCurrency(qty * o.unitPrice)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }
              return null
            })()
          )}

          {/* Colours */}
          {isPrinting && o.colors.length > 0 && (
            isApparel ? (
              // Only display selected colors summary card if we don't have the new itemized breakdown
              (!((o.sizes as any)?._items && Array.isArray((o.sizes as any)?._items)) && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Selected Colours</h2>
                  <div className="flex flex-wrap gap-2">
                    {o.colors.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Colour Breakdown</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 dark:bg-zinc-950 text-white text-xs">
                    <tr>
                      <th className="py-2.5 pl-5 pr-3 text-left">Colour</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit</th>
                      <th className="py-2.5 pl-3 pr-5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {o.colors.map(c => (
                      <tr key={c.id}>
                        <td className="py-2.5 pl-5 pr-3 text-slate-700 dark:text-slate-300">{c.name}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums">{c.qty}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-400">{fmtCurrency(o.unitPrice)}</td>
                        <td className="py-2.5 pl-3 pr-5 text-right tabular-nums font-medium">{fmtCurrency(c.qty * o.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-white/5 font-bold text-sm">
                    <tr>
                      <td className="py-3 pl-5 pr-3">Total</td>
                      <td className="py-3 px-3 text-right tabular-nums">{o.totalQty}</td>
                      <td />
                      <td className="py-3 pl-3 pr-5 text-right tabular-nums">{fmtCurrency(o.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          )}
        </div>

        {/* Right — financials */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Payment Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold tabular-nums">{fmtCurrency(o.totalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-semibold tabular-nums text-yellow-600 dark:text-yellow-500">{fmtCurrency(o.amountPaid)}</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                <span className="font-bold">Balance Due</span>
                <span className={`font-black tabular-nums text-base ${o.balance > 0 ? 'text-red-600' : 'text-yellow-600 dark:text-yellow-500'}`}>{fmtCurrency(o.balance)}</span>
              </div>
            </div>
            {o.balance <= 0 && (
              <div className="rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 p-3 text-center">
                <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">✓ Fully Paid</p>
              </div>
            )}
          </div>

          {/* Status update card */}
          <AdminStatusPanel orderId={o.id} currentStatus={o.status as any} />

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Receipt</h2>
            <p className="font-mono text-lg font-black text-red-600 dark:text-yellow-500 mb-2">{o.receiptNumber}</p>
            <Link href={`/receipt/${o.receiptNumber}`} target="_blank"
              className="block text-center rounded-xl border border-red-300 dark:border-yellow-500/40 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-yellow-500 dark:hover:bg-yellow-500/10 transition-colors">
              View Client Receipt ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

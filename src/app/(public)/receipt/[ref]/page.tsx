import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtCurrency, fmtDate, getServiceLabel, getStatusLabel } from '@/lib/utils'
import { STATUS_META } from '@/types'
import { CheckCircle, Clock, Printer, Camera, Palette } from 'lucide-react'
import Link from 'next/link'
import PrintButton from '@/components/PrintButton'
import PageBackground from '@/components/PageBackground'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  return { title: `Receipt ${ref} — Tee-Jay Multimedia` }
}

export default async function ReceiptPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  const raw = await prisma.order.findUnique({
    where: { receiptNumber: ref.toUpperCase() },
    include: { colors: true, assignedTo: true, createdBy: true },
  })
  if (!raw) notFound()

  const order = serializeOrder(raw)
  const meta  = STATUS_META[order.status as keyof typeof STATUS_META]
  const isPrinting = order.serviceCategory === 'PRINTING'
  const isDesign   = order.serviceCategory === 'DESIGN'
  const serviceLabel = getServiceLabel(order)
  const statusLabel  = getStatusLabel(order)
  const isApparel = isPrinting && (order.printingType === 'TSHIRT' || order.printingType === 'LACOSTE')

  function fmtM(n: number) { return '₵' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }

  return (
    <>
      <div className="print:hidden">
        <PageBackground />
      </div>

      <div data-receipt-print className="relative overflow-hidden bg-white px-4 py-8 dark:bg-zinc-950/40 sm:px-6">
        {/* Background Ambient Glows */}
        {/* <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-red-600/10 blur-[100px] dark:bg-red-600/25" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-yellow-500/10 blur-[100px] dark:bg-yellow-500/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-black/[0.02] blur-[80px] dark:bg-white/[0.02]" />
        </div> */}

        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          {/* Header */}
          <div className="receipt-page-card overflow-hidden rounded-3xl border border-slate-200 shadow-lg dark:border-white/10">
            <div className="receipt-gradient-header flex flex-col gap-4 bg-gradient-to-r from-brand-600 via-brand-700 to-yellow-500 p-6 text-white sm:flex-row sm:items-start sm:justify-between sm:p-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                  {isPrinting ? <Printer className="h-5 w-5" /> : isDesign ? <Palette className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                  <span className="text-sm font-black tracking-wider">TEE-JAY MULTIMEDIA</span>
                </div>
                <p className="text-[10px] uppercase tracking-widest opacity-80">Printing & Photography Services</p>
                <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-white/90">
                  <p>Contact: 024 836 5559 / 053 968 360 / 025 790 3397</p>
                  <p>Locate us: Central Region - Mumford</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold opacity-75 uppercase tracking-widest">Receipt</p>
                <p className="text-lg font-black font-mono">{order.receiptNumber}</p>
                <p className="text-xs opacity-75">{fmtDate(order.createdAt)}</p>
              </div>
            </div>

            <div className="receipt-paper bg-white p-6 space-y-6 dark:bg-slate-900 sm:p-8">
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
                <div className="receipt-panel rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">Bill To</p>
                  <p className="font-bold text-slate-900 dark:text-white">{order.clientName}</p>
                  {order.clientPhone && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{order.clientPhone}</p>}
                  {order.clientEmail && <p className="text-sm text-slate-500 dark:text-slate-400">{order.clientEmail}</p>}
                </div>
                <div className="receipt-panel rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">Order Details</p>
                  {order.description && <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{order.description}</p>}
                  {order.dueDate && <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Due: {fmtDate(order.dueDate)}</p>}
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ordered By: <span className="font-semibold">{order.createdByName || 'Online Booking'}</span>
                  </p>
                </div>
              </div>

              {/* Apparel Size / Itemized Breakdown */}
              {isApparel && order.sizes && typeof order.sizes === 'object' && (
                (() => {
                  const items = (order.sizes as any)._items
                  if (Array.isArray(items) && items.length > 0) {
                    return (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Apparel Breakdown</p>
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                          <table className="receipt-table w-full text-sm">
                            <thead className="bg-zinc-900 text-xs text-white dark:bg-zinc-950">
                              <tr>
                                <th className="py-2.5 pl-4 pr-3 text-left">Colour</th>
                                <th className="py-2.5 px-3 text-center">Size</th>
                                <th className="py-2.5 px-3 text-right">Qty</th>
                                <th className="py-2.5 px-3 text-right">Unit Price</th>
                                <th className="py-2.5 pl-3 pr-4 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                              {items.map((it: any, idx: number) => (
                                <tr key={idx} className="odd:bg-white even:bg-slate-50 dark:odd:bg-transparent dark:even:bg-white/5">
                                  <td className="py-2.5 pl-4 pr-3 font-semibold text-slate-700 dark:text-slate-300">{it.color || 'Solid'}</td>
                                  <td className="py-2.5 px-3 text-center"><span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-600 dark:text-slate-400">{it.size}</span></td>
                                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{it.qty}</td>
                                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">{fmtM(order.unitPrice)}</td>
                                  <td className="py-2.5 pl-3 pr-4 text-right tabular-nums font-bold text-slate-900 dark:text-white">{fmtM(Number(it.qty || 0) * order.unitPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  }

                  // Fallback to legacy flat layout
                  const sizeKeys = Object.keys(order.sizes).filter(k => k !== '_items' && k !== '_version' && k !== 'items' && k !== 'ITEMS');
                  if (sizeKeys.length > 0) {
                    return (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Apparel Size Breakdown</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {sizeKeys.map((size) => {
                            const qty = Number(((order.sizes as any)[size]?.qty ?? (order.sizes as any)[size])) || 0;
                            return (
                              <div key={size} className="receipt-panel rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-white/10 dark:bg-white/5">
                                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{size}</span>
                                <span className="block text-lg font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">{qty}</span>
                                <span className="block text-[10px] text-slate-400">{fmtM(order.unitPrice)} ea</span>
                                <span className="block text-xs font-bold text-slate-900 dark:text-white mt-1.5">{fmtM(qty * order.unitPrice)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  }
                  return null
                })()
              )}

              {/* Colour table (printing) */}
              {isPrinting && order.colors.length > 0 && (
                isApparel ? (
                  // Only display selected colors summary card if we don't have the new itemized breakdown
                  (!((order.sizes as any)?._items && Array.isArray((order.sizes as any)?._items)) && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Selected Colours</p>
                      <div className="flex flex-wrap gap-2">
                        {order.colors.map(c => (
                          <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-brand-500" />
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Breakdown</p>
                    <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-white/10">
                      <table className="receipt-table w-full text-sm">
                        <thead className="bg-zinc-900 text-white dark:bg-zinc-950">
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
                )
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
                    <span className="tabular-nums font-bold text-yellow-600 dark:text-yellow-500">{fmtM(order.amountPaid)}</span>
                  </div>
                  <div className="receipt-summary-accent flex justify-between bg-slate-50 px-4 py-3 font-mono font-bold dark:bg-white/5">
                    <span>Balance</span>
                    <span className={`tabular-nums ${order.balance > 0 ? 'text-red-600' : 'text-yellow-600 dark:text-yellow-500'}`}>{fmtM(order.balance)}</span>
                  </div>
                </div>
              </div>


              {/* Photography Guides */}
              {order.serviceCategory === 'PHOTOGRAPHY' && (
                <div className="receipt-photography space-y-4 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 dark:border-purple-500/20 dark:from-purple-950/20 dark:to-pink-950/10">
                  <div>
                    <h3 className="text-sm font-black text-purple-900 dark:text-purple-300 uppercase tracking-widest flex items-center gap-2">
                      <Camera className="h-4 w-4 text-purple-500 shrink-0" />
                      Photography Guides & Documents
                    </h3>
                    <p className="text-xs text-purple-700 dark:text-purple-400/80 mt-1">Please download or view our curated packages and preparation guides for your photography session.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <a 
                      href="/REVISED TJM BRIDAL PACKAGES.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-red-800 to-yellow-700 px-4 py-3 text-xs font-black text-white hover:from-purple-700 hover:to-pink-700 shadow-md shadow-purple-500/20 hover:shadow-purple-500/35 hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 text-center"
                    >
                      <span>View Bridal Packages</span>
                    </a>
                    <a 
                      href="/THINGS TO FACTOR WHEN YOU BOOK US - TEE-JAY MULTIMEDIA.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 rounded-xl border border-purple-200 bg-white px-4 py-3 text-xs font-black text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-sm hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 dark:border-purple-500/30 dark:bg-purple-950/20 dark:text-purple-300 dark:hover:bg-purple-950/40 text-center"
                    >
                      <span>View Necessities Guide</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Thank you */}
              <div className="receipt-thanks rounded-2xl border border-brand-500/10 bg-gradient-to-br from-brand-50/5 to-yellow-50/5 p-5 text-center dark:border-brand-500/20 dark:from-brand-500/5 dark:to-yellow-500/5">
                <p className="font-extrabold text-brand-600 dark:text-yellow-400">Thank you for choosing Tee-Jay Multimedia!</p>
                <p className="font-bold italic text-slate-700 dark:text-slate-300">We serve you at ease</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep this receipt number for your records: <span className="font-mono font-black text-brand-600 dark:text-yellow-400">{order.receiptNumber}</span></p>
              </div>

              <div className="flex gap-3 pt-2 print:hidden">
                <PrintButton />
                <Link href="/track" className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-center text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors dark:border-white/10 dark:text-slate-300">
                  Track Another
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

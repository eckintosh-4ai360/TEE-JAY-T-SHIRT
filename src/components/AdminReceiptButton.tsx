'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import type { SerializedOrder } from '@/lib/utils'
import { getServiceLabel, getStatusLabel } from '@/lib/utils'

function fmtM(n: number) { return '₵' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
function fmtD(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function AdminReceiptButton({ order }: { order: SerializedOrder }) {
  const [loading, setLoading] = useState(false)

  function generate() {
    setLoading(true)
    try {
      const isPrinting = order.serviceCategory === 'PRINTING'
      const isApparel = isPrinting && (order.printingType === 'TSHIRT' || order.printingType === 'LACOSTE')
      
      const rawItems = (order.sizes as any)?._items
      const hasDetailedItems = isApparel && Array.isArray(rawItems) && rawItems.length > 0

      const apparelBreakdownHtml = hasDetailedItems
        ? `
        <div class="sec-title">Apparel Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Colour</th>
              <th style="text-align:center">Size</th>
              <th class="num">Qty</th>
              <th class="num">Unit Price</th>
              <th class="num">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${rawItems.map((it: any) => `
              <tr>
                <td style="font-weight:500">${it.color || 'Solid'}</td>
                <td style="text-align:center"><span style="display:inline-block;padding:2px 6px;background:#f1f5f9;border-radius:4px;font-size:11px;font-weight:700;color:#475569">${it.size}</span></td>
                <td class="num">${Number(it.qty).toLocaleString()}</td>
                <td class="num">${fmtM(order.unitPrice)}</td>
                <td class="num">${fmtM(Number(it.qty) * order.unitPrice)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>Total</strong></td>
              <td class="num">${order.totalQty.toLocaleString()}</td>
              <td></td>
              <td class="num">${fmtM(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
        `
        : isApparel && order.sizes && Object.keys(order.sizes).length > 0
          ? `
          <div class="sec-title">Apparel Size Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Size</th>
                <th class="num">Qty</th>
                <th class="num">Unit Price</th>
                <th class="num">Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(order.sizes).filter(([k]) => k !== '_items').map(([size, qty]) => `
                <tr>
                  <td style="font-weight:600;text-transform:uppercase">${size}</td>
                  <td class="num">${Number(qty).toLocaleString()}</td>
                  <td class="num">${fmtM(order.unitPrice)}</td>
                  <td class="num">${fmtM(Number(qty) * order.unitPrice)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Total</strong></td>
                <td class="num">${order.totalQty.toLocaleString()}</td>
                <td></td>
                <td class="num">${fmtM(order.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
          ${order.colors.length > 0 ? `
            <div style="margin-bottom:24px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:12px;color:#475569">
              <strong>Selected Colours:</strong> ${order.colors.map(c => c.name).join(', ')}
            </div>
          ` : ''}
          `
          : ''

      const colorRows = isPrinting && !isApparel && order.colors.length > 0
        ? order.colors.map(c => `
          <tr>
            <td>${c.name || '—'}</td>
            <td class="num">${c.qty.toLocaleString()}</td>
            <td class="num">${fmtM(order.unitPrice)}</td>
            <td class="num">${fmtM(c.qty * order.unitPrice)}</td>
          </tr>`).join('')
        : `<tr><td colspan="4" style="text-align:center;color:#94a3b8">N/A</td></tr>`

      const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<title>Receipt – ${order.clientName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',Arial,sans-serif;font-size:13px;color:#0f172a;background:#fff}
.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff}
.header{background:linear-gradient(135deg,#14b8a6 0%,#0891b2 100%);color:#fff;padding:28px 32px 24px;display:flex;justify-content:space-between;align-items:flex-start}
.brand-name{font-size:26px;font-weight:800;letter-spacing:-0.5px}
.brand-tag{font-size:11px;opacity:.85;margin-top:4px}
.rec-label{text-align:right}
.rec-word{font-size:20px;font-weight:800;letter-spacing:2px}
.rec-ref{font-size:11px;opacity:.85;margin-top:4px}
.body{padding:28px 32px}
.info-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px}
.info-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#14b8a6;margin-bottom:10px}
.info-r{display:flex;justify-content:space-between;margin-top:5px}
.info-k{color:#64748b;font-size:12px}.info-v{font-weight:600;font-size:12px;color:#0f172a}
.cli-name{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px}
.cli-sub{font-size:12px;color:#64748b;margin-top:3px}
.sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#475569;margin-bottom:10px}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
thead tr{background:#14b8a6;color:#fff}
thead th{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase}
thead th.num{text-align:right}
tbody tr:nth-child(even){background:#f8fafc}
tbody td{padding:9px 12px;font-size:12.5px;border-bottom:1px solid #e2e8f0}
tfoot tr{background:#f1f5f9;font-weight:700}
tfoot td{padding:10px 12px;font-size:13px;border-top:2px solid #cbd5e1}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.pay-wrap{display:flex;justify-content:flex-end;margin-bottom:28px}
.pay-box{width:220px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.pay-row{display:flex;justify-content:space-between;padding:9px 14px;font-size:12.5px;border-bottom:1px solid #e2e8f0}
.pay-row:last-child{border-bottom:none}
.pay-row.total{font-weight:700;font-size:14px;background:#f8fafc}
.pay-k{color:#64748b}.pay-v{font-variant-numeric:tabular-nums}
.paid{color:#10b981}.owed{color:#ef4444}.settled{color:#10b981}
.ty{background:linear-gradient(135deg,#f0fdfa 0%,#ecfeff 100%);border:1px solid #99f6e4;border-radius:10px;text-align:center;padding:18px;margin-bottom:20px}
.ty-main{font-size:15px;font-weight:700;color:#0f766e}
.ty-sub{font-size:11.5px;color:#64748b;margin-top:4px}
.footer{text-align:center;color:#94a3b8;font-size:10px;padding-top:16px;border-top:1px solid #e2e8f0}
@media print{@page{size:A4;margin:0}body{padding:0}.page{width:210mm;min-height:297mm}.no-print{display:none!important}}
</style></head><body>
<div class="page">
<div class="header">
  <div><div class="brand-name">TEE-JAY MULTIMEDIA</div><div class="brand-tag">PRINTING &amp; PHOTOGRAPHY SERVICES</div></div>
  <div class="rec-label"><div class="rec-word">RECEIPT</div><div class="rec-ref">#${order.receiptNumber}</div><div class="rec-ref">Date: ${fmtD(order.createdAt)}</div></div>
</div>
<div class="body">
  <div class="info-row">
    <div class="info-box">
      <div class="info-lbl">Bill To</div>
      <div class="cli-name">${order.clientName}</div>
      ${order.clientPhone ? `<div class="cli-sub">📞 ${order.clientPhone}</div>` : ''}
      ${order.clientEmail ? `<div class="cli-sub">✉ ${order.clientEmail}</div>` : ''}
    </div>
    <div class="info-box">
      <div class="info-lbl">Order Details</div>
      <div class="info-r"><span class="info-k">Service</span><span class="info-v">${getServiceLabel(order)}</span></div>
      <div class="info-r"><span class="info-k">Status</span><span class="info-v">${getStatusLabel(order)}</span></div>
      <div class="info-r"><span class="info-k">Due date</span><span class="info-v">${fmtD(order.dueDate)}</span></div>
      <div class="info-r"><span class="info-k">Ordered By</span><span class="info-v">${order.createdByName || 'Online Booking'}</span></div>
      ${isPrinting ? `<div class="info-r"><span class="info-k">Unit price</span><span class="info-v">${fmtM(order.unitPrice)}</span></div>` : `<div class="info-r"><span class="info-k">Package price</span><span class="info-v">${fmtM(order.unitPrice)}</span></div>`}
    </div>
  </div>
  ${isApparel ? apparelBreakdownHtml : isPrinting ? `
  <div class="sec-title">Colour Breakdown</div>
  <table>
    <thead><tr><th>Colour / Style</th><th class="num">Qty</th><th class="num">Unit Price</th><th class="num">Line Total</th></tr></thead>
    <tbody>${colorRows}</tbody>
    <tfoot><tr><td><strong>Total</strong></td><td class="num">${order.totalQty.toLocaleString()}</td><td></td><td class="num">${fmtM(order.totalAmount)}</td></tr></tfoot>
  </table>` : `<div class="sec-title">Service Details</div>${order.description ? `<p style="margin-bottom:24px;color:#475569;font-size:13px">${order.description}</p>` : ''}`}
  <div class="pay-wrap"><div class="pay-box">
    <div class="pay-row"><span class="pay-k">Subtotal</span><span class="pay-v">${fmtM(order.totalAmount)}</span></div>
    <div class="pay-row"><span class="pay-k">Amount Paid</span><span class="pay-v paid">${fmtM(order.amountPaid)}</span></div>
    <div class="pay-row total"><span class="pay-k">Balance Due</span><span class="pay-v ${order.balance > 0 ? 'owed' : 'settled'}">${fmtM(order.balance)}</span></div>
  </div></div>
  <div class="ty"><div class="ty-main">Thank you for choosing Tee-Jay Multimedia!</div><div class="ty-sub">Please keep this receipt for your records.</div></div>
  <div class="footer">Generated ${new Date().toLocaleString('en-GH')} &nbsp;|&nbsp; Receipt: ${order.receiptNumber} &nbsp;|&nbsp; Ref: ${order.id.slice(-8).toUpperCase()}</div>
</div></div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`

      const win = window.open('', '_blank', 'width=794,height=1123')
      if (!win) { alert('Allow pop-ups to generate receipts.'); return }
      win.document.write(html)
      win.document.close()
    } catch (err) {
      console.error(err)
      alert('Could not generate receipt.')
    } finally { setLoading(false) }
  }

  return (
    <button onClick={generate} disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600 dark:hover:border-teal-500/40 dark:hover:text-teal-400 transition-colors"
      id="admin-receipt-btn" title="Generate & print receipt">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-teal-500" />}
      {loading ? 'Generating…' : 'Print Receipt'}
    </button>
  )
}

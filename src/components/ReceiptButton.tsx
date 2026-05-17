'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import type { SerializedOrder } from '@/lib/utils'

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtMoney(n: number) {
  return '₵' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

interface Props { order: SerializedOrder }

export default function ReceiptButton({ order }: Props) {
  const [loading, setLoading] = useState(false)

  function generate() {
    setLoading(true)
    try {
      const colorRows = order.colors.map((c) => `
        <tr>
          <td>${c.name || '—'}</td>
          <td class="num">${c.qty.toLocaleString()}</td>
          <td class="num">${fmtMoney(order.unitPrice)}</td>
          <td class="num">${fmtMoney(c.qty * order.unitPrice)}</td>
        </tr>`).join('')

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt – ${order.clientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 13px;
      color: #0f172a;
      background: #fff;
      padding: 0;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
    }
    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%);
      color: #fff;
      padding: 28px 32px 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-name  { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-tagline { font-size: 11px; opacity: 0.85; margin-top: 4px; }
    .receipt-label { text-align: right; }
    .receipt-word  { font-size: 20px; font-weight: 800; letter-spacing: 2px; }
    .receipt-ref   { font-size: 11px; opacity: 0.85; margin-top: 4px; }
    /* ── Body ── */
    .body { padding: 28px 32px; }
    /* ── Info row ── */
    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 18px;
    }
    .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase;
                  letter-spacing: 1px; color: #14b8a6; margin-bottom: 10px; }
    .info-row-item { display: flex; justify-content: space-between; margin-top: 5px; }
    .info-key   { color: #64748b; font-size: 12px; }
    .info-val   { font-weight: 600; font-size: 12px; color: #0f172a; }
    .client-name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    .client-sub  { font-size: 12px; color: #64748b; margin-top: 3px; }
    /* ── Section title ── */
    .section-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; color: #475569; margin-bottom: 10px;
    }
    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #14b8a6; color: #fff; }
    thead th {
      padding: 10px 12px; text-align: left; font-size: 11px;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    }
    thead th.num { text-align: right; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 9px 12px; font-size: 12.5px; border-bottom: 1px solid #e2e8f0; }
    tfoot tr { background: #f1f5f9; font-weight: 700; }
    tfoot td { padding: 10px 12px; font-size: 13px; border-top: 2px solid #cbd5e1; }
    td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
    /* ── Payment summary ── */
    .payment-wrap { display: flex; justify-content: flex-end; margin-bottom: 28px; }
    .payment-box {
      width: 220px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .pay-row {
      display: flex; justify-content: space-between;
      padding: 9px 14px; font-size: 12.5px;
      border-bottom: 1px solid #e2e8f0;
    }
    .pay-row:last-child { border-bottom: none; }
    .pay-row.total { font-weight: 700; font-size: 14px; background: #f8fafc; }
    .pay-key { color: #64748b; }
    .pay-val { font-variant-numeric: tabular-nums; }
    .paid    { color: #10b981; }
    .owed    { color: #ef4444; }
    .settled { color: #10b981; }
    /* ── Thank you ── */
    .thankyou {
      background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
      border: 1px solid #99f6e4;
      border-radius: 10px;
      text-align: center;
      padding: 18px;
      margin-bottom: 20px;
    }
    .thankyou-main { font-size: 15px; font-weight: 700; color: #0f766e; }
    .thankyou-sub  { font-size: 11.5px; color: #64748b; margin-top: 4px; }
    /* ── Footer ── */
    .footer {
      text-align: center; color: #94a3b8; font-size: 10px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    /* ── Print ── */
    @media print {
      @page { size: A4; margin: 0; }
      body { padding: 0; }
      .page { width: 210mm; min-height: 297mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-name">TEE-JAY</div>
      <div class="brand-tagline">T-SHIRT PRINTING &amp; PROFESSIONAL GARMENT SERVICES</div>
    </div>
    <div class="receipt-label">
      <div class="receipt-word">RECEIPT</div>
      <div class="receipt-ref">#${order.id.slice(-8).toUpperCase()}</div>
      <div class="receipt-ref">Date: ${fmtDate(order.createdAt)}</div>
    </div>
  </div>

  <div class="body">
    <!-- Info row -->
    <div class="info-row">
      <div class="info-box">
        <div class="info-label">Bill To</div>
        <div class="client-name">${order.clientName}</div>
        ${order.clientPhone ? `<div class="client-sub">📞 ${order.clientPhone}</div>` : ''}
        ${order.clientEmail ? `<div class="client-sub">✉ ${order.clientEmail}</div>` : ''}
      </div>
      <div class="info-box">
        <div class="info-label">Order Details</div>
        <div class="info-row-item"><span class="info-key">Design</span><span class="info-val">${order.design || '—'}</span></div>
        <div class="info-row-item"><span class="info-key">Status</span><span class="info-val">${order.status}</span></div>
        <div class="info-row-item"><span class="info-key">Due date</span><span class="info-val">${fmtDate(order.dueDate)}</span></div>
        <div class="info-row-item"><span class="info-key">Unit price</span><span class="info-val">${fmtMoney(order.unitPrice)}</span></div>
      </div>
    </div>

    <!-- Colour breakdown -->
    <div class="section-title">Colour Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Colour / Style</th>
          <th class="num">Qty</th>
          <th class="num">Unit Price</th>
          <th class="num">Line Total</th>
        </tr>
      </thead>
      <tbody>${colorRows}</tbody>
      <tfoot>
        <tr>
          <td><strong>Total</strong></td>
          <td class="num">${order.totalQty.toLocaleString()}</td>
          <td></td>
          <td class="num">${fmtMoney(order.totalAmount)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Payment summary -->
    <div class="payment-wrap">
      <div class="payment-box">
        <div class="pay-row">
          <span class="pay-key">Subtotal</span>
          <span class="pay-val">${fmtMoney(order.totalAmount)}</span>
        </div>
        <div class="pay-row">
          <span class="pay-key">Amount Paid</span>
          <span class="pay-val paid">${fmtMoney(order.amountPaid)}</span>
        </div>
        <div class="pay-row total">
          <span class="pay-key">Balance Due</span>
          <span class="pay-val ${order.balance > 0 ? 'owed' : 'settled'}">${fmtMoney(order.balance)}</span>
        </div>
      </div>
    </div>

    <!-- Thank you -->
    <div class="thankyou">
      <div class="thankyou-main">Thank you for choosing Tee-Jay!</div>
      <div class="thankyou-sub">Please keep this receipt for your records.</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Generated ${new Date().toLocaleString('en-GH')} &nbsp;|&nbsp; Ref: ${order.id}
    </div>
  </div>
</div>
<script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`

      const win = window.open('', '_blank', 'width=794,height=1123')
      if (!win) {
        alert('Please allow pop-ups for this site to generate receipts.')
        return
      }
      win.document.write(html)
      win.document.close()
    } catch (err) {
      console.error('Receipt error:', err)
      alert('Could not generate receipt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="btn-secondary btn-sm flex items-center gap-2"
      id="print-receipt-btn"
      title="Print / Save PDF receipt"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <FileText className="h-3.5 w-3.5 text-teal-500" />}
      {loading ? 'Generating…' : 'Receipt'}
    </button>
  )
}

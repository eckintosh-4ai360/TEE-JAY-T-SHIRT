'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import type { SerializedOrder } from '@/lib/utils'

// ── helpers (can't import server utils in client component) ───────────────────
function fmtGHS(n: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency', currency: 'GHS', minimumFractionDigits: 2,
  }).format(n)
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

  async function generate() {
    setLoading(true)
    try {
      const jsPDF    = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      // ── Document setup ──────────────────────────────────────────────────────
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const PW  = 210  // A4 width mm
      const PH  = 297  // A4 height mm
      const ML  = 18   // margin left
      const MR  = PW - ML // margin right

      // ── Brand colour palette ────────────────────────────────────────────────
      const TEAL  : [number,number,number] = [20,  184, 166]   // brand teal
      const DARK  : [number,number,number] = [15,  23,  42 ]   // slate-900
      const MID   : [number,number,number] = [71,  85,  105]   // slate-600
      const LIGHT : [number,number,number] = [241, 245, 249]   // slate-100
      const WHITE : [number,number,number] = [255, 255, 255]
      const RED   : [number,number,number] = [239, 68,  68 ]
      const GREEN : [number,number,number] = [16,  185, 129]

      // ── Header banner ───────────────────────────────────────────────────────
      doc.setFillColor(...TEAL)
      doc.rect(0, 0, PW, 38, 'F')

      // Company name
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(...WHITE)
      doc.text('TEE-JAY', ML, 17)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(200, 250, 250)
      doc.text('T-SHIRT PRINTING', ML, 23)
      doc.text('Professional Garment Printing Services', ML, 29)

      // "RECEIPT" badge top-right
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(...WHITE)
      doc.text('RECEIPT', MR, 17, { align: 'right' })
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(200, 250, 250)
      doc.text(`#${order.id.slice(-8).toUpperCase()}`, MR, 24, { align: 'right' })
      doc.text(`Date: ${fmtDate(order.createdAt)}`, MR, 30, { align: 'right' })

      // ── Two-column info row ─────────────────────────────────────────────────
      let y = 50

      // Client box
      doc.setFillColor(...LIGHT)
      doc.roundedRect(ML, y, 82, 36, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...TEAL)
      doc.text('BILL TO', ML + 5, y + 7)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...DARK)
      doc.text(order.clientName, ML + 5, y + 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...MID)
      if (order.clientPhone) doc.text(`📞  ${order.clientPhone}`, ML + 5, y + 21)
      if (order.clientEmail) doc.text(`✉  ${order.clientEmail}`, ML + 5, y + 27, { maxWidth: 72 })

      // Order info box
      const OX = ML + 88
      doc.setFillColor(...LIGHT)
      doc.roundedRect(OX, y, 82, 36, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...TEAL)
      doc.text('ORDER DETAILS', OX + 5, y + 7)

      const infoRows = [
        ['Design',   order.design || '—'],
        ['Status',   order.status],
        ['Due date', fmtDate(order.dueDate)],
        ['Unit price', fmtGHS(order.unitPrice)],
      ]
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...MID)
      infoRows.forEach(([k, v], i) => {
        doc.setTextColor(...MID)
        doc.text(k, OX + 5, y + 14 + i * 6)
        doc.setTextColor(...DARK)
        doc.setFont('helvetica', 'bold')
        doc.text(v, OX + 77, y + 14 + i * 6, { align: 'right' })
        doc.setFont('helvetica', 'normal')
      })

      // ── Colour breakdown table ──────────────────────────────────────────────
      y += 44

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...DARK)
      doc.text('Colour Breakdown', ML, y)
      y += 4

      autoTable(doc, {
        startY: y,
        head: [['Colour / Style', 'Qty', 'Unit Price', 'Line Total']],
        body: order.colors.map((c) => [
          c.name || '—',
          c.qty.toLocaleString(),
          fmtGHS(order.unitPrice),
          fmtGHS(c.qty * order.unitPrice),
        ]),
        foot: [['', order.totalQty.toLocaleString(), '', fmtGHS(order.totalAmount)]],
        styles:         { fontSize: 9, cellPadding: 3.5, textColor: DARK },
        headStyles:     { fillColor: TEAL, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
        footStyles:     { fillColor: LIGHT, textColor: DARK, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] as [number,number,number] },
        columnStyles:   { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin:         { left: ML, right: ML },
        tableLineColor: [226, 232, 240] as [number,number,number],
        tableLineWidth: 0.2,
      })

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

      // ── Payment summary box ─────────────────────────────────────────────────
      const bw = 90
      const bx = MR - bw

      const payRows = [
        { label: 'Subtotal',     value: fmtGHS(order.totalAmount), bold: false },
        { label: 'Amount Paid',  value: fmtGHS(order.amountPaid),  bold: false, color: GREEN },
        { label: 'Balance Due',  value: fmtGHS(order.balance),     bold: true,  color: order.balance > 0 ? RED : GREEN },
      ]

      let py = y
      payRows.forEach(({ label, value, bold, color }) => {
        doc.setFontSize(9)
        doc.setTextColor(...MID)
        doc.setFont('helvetica', 'normal')
        doc.text(label, bx, py)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(...(color ?? DARK as [number,number,number]))
        doc.text(value, MR, py, { align: 'right' })
        // Divider
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.2)
        doc.line(bx, py + 2, MR, py + 2)
        py += 9
      })

      // Highlight balance row
      if (order.balance > 0) {
        doc.setFillColor(254, 242, 242)
        doc.roundedRect(bx - 3, py - 9 - 7, bw + 3, 10, 2, 2, 'F')
      } else {
        doc.setFillColor(236, 253, 245)
        doc.roundedRect(bx - 3, py - 9 - 7, bw + 3, 10, 2, 2, 'F')
      }

      // ── Thank you note ──────────────────────────────────────────────────────
      y = Math.max(py + 8, y + 50)

      doc.setFillColor(...LIGHT)
      doc.roundedRect(ML, y, PW - ML * 2, 18, 3, 3, 'F')
      doc.setFont('helvetica', 'bolditalic')
      doc.setFontSize(9.5)
      doc.setTextColor(...TEAL)
      doc.text('Thank you for choosing Tee-Jay!', PW / 2, y + 7, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...MID)
      doc.text('Please keep this receipt for your records.', PW / 2, y + 13, { align: 'center' })

      // ── Footer ──────────────────────────────────────────────────────────────
      doc.setFontSize(7.5)
      doc.setTextColor(...MID)
      doc.text(`Generated ${new Date().toLocaleString('en-GH')}  |  Ref: ${order.id}`, PW / 2, PH - 10, { align: 'center' })

      // ── Save ────────────────────────────────────────────────────────────────
      const filename = `receipt-${order.clientName.replace(/\s+/g, '-')}-${order.id.slice(-6)}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('Receipt generation failed:', err)
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
      title="Download PDF receipt"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <FileText className="h-3.5 w-3.5 text-teal-500" />}
      {loading ? 'Generating…' : 'Receipt'}
    </button>
  )
}

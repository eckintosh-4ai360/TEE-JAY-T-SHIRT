'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Loader2, ChevronDown } from 'lucide-react'
import type { SerializedOrder } from '@/types'
import { getServiceLabel, getStatusLabel, fmtCurrency } from '@/lib/utils'

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_OPTIONS = ['ALL', 'PENDING', 'PRINTING', 'COMPLETED', 'DELIVERED', 'CANCELLED']

// ── Table columns used for both exports ──────────────────────────────────────
function buildRows(orders: SerializedOrder[]) {
  return orders.map((o) => [
    o.clientName,
    o.clientPhone ?? '—',
    getServiceLabel(o),
    o.totalQty,
    fmtCurrency(o.unitPrice),
    fmtCurrency(o.totalAmount),
    fmtCurrency(o.amountPaid),
    fmtCurrency(o.balance),
    getStatusLabel(o),
    fmtDate(o.dueDate),
    fmtDate(o.createdAt),
  ])
}

const HEADERS = [
  'Client', 'Phone', 'Design', 'Qty', 'Unit Price',
  'Total', 'Paid', 'Balance', 'Status', 'Due Date', 'Created At',
]

// ── Main Component ────────────────────────────────────────────────────────────
export default function ReportExporter() {
  const [from,     setFrom]     = useState('')
  const [to,       setTo]       = useState('')
  const [status,   setStatus]   = useState('ALL')
  const [loading,  setLoading]  = useState<'pdf' | 'excel' | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function fetchOrders(): Promise<SerializedOrder[]> {
    const params = new URLSearchParams()
    if (from)           params.set('from', from)
    if (to)             params.set('to',   to)
    if (status !== 'ALL') params.set('status', status)
    const res = await fetch(`/api/orders?${params}`)
    if (!res.ok) throw new Error('Failed to fetch orders')
    return res.json()
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  async function exportPDF() {
    setLoading('pdf')
    try {
      const orders = await fetchOrders()
      // Dynamic imports — only runs in browser, avoids SSR issues
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // Header bar
      doc.setFillColor(20, 184, 166)       // teal-500
      doc.rect(0, 0, 297, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Press Manager — Orders Report', 14, 12)

      // Sub-header
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const range = (from && to)
        ? `Period: ${fmtDate(from)} – ${fmtDate(to)}`
        : from ? `From: ${fmtDate(from)}`
        : to   ? `Up to: ${fmtDate(to)}`
        : 'All time'
      doc.text(`${range}   |   Status: ${status}   |   Generated: ${new Date().toLocaleString()}`, 14, 17)

      autoTable(doc, {
        head: [HEADERS],
        body: buildRows(orders),
        startY: 22,
        styles: { fontSize: 7.5, cellPadding: 2.5 },
        headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 249, 250] },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
        },
      })

      // Footer
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Page ${i} of ${pageCount}`, 283, 205, { align: 'right' })
      }

      const filename = `orders-report-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
    } catch (e) {
      console.error(e)
      alert('PDF export failed. Check the console for details.')
    } finally {
      setLoading(null)
    }
  }

  // ── Excel ──────────────────────────────────────────────────────────────────
  async function exportExcel() {
    setLoading('excel')
    try {
      const orders = await fetchOrders()
      const XLSX = await import('xlsx')

      // Summary sheet data
      const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0)
      const totalPaid    = orders.reduce((s, o) => s + o.amountPaid,  0)
      const totalBalance = orders.reduce((s, o) => s + o.balance,     0)
      const totalQty     = orders.reduce((s, o) => s + o.totalQty,    0)

      const summaryData = [
        ['PRESS MANAGER — ORDERS REPORT'],
        ['Generated', new Date().toLocaleString()],
        ['Period', (from && to) ? `${from} to ${to}` : from ? `From ${from}` : to ? `Up to ${to}` : 'All time'],
        ['Status filter', status],
        [],
        ['SUMMARY'],
        ['Total Orders', orders.length],
        ['Total Pieces', totalQty],
        ['Total Revenue', fmtCurrency(totalRevenue)],
        ['Total Paid',    fmtCurrency(totalPaid)],
        ['Outstanding',   fmtCurrency(totalBalance)],
      ]

      // Orders sheet
      const ordersData = [HEADERS, ...buildRows(orders)]

      const wb = XLSX.utils.book_new()

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWs['!cols'] = [{ wch: 20 }, { wch: 30 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      const ordersWs = XLSX.utils.aoa_to_sheet(ordersData)
      ordersWs['!cols'] = HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 14) }))
      XLSX.utils.book_append_sheet(wb, ordersWs, 'Orders')

      const filename = `orders-report-${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (e) {
      console.error(e)
      alert('Excel export failed. Check the console for details.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-white/50 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0a]/70">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
        id="report-exporter-toggle"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
            <Download className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Export Reports</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Download orders as PDF or Excel</p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Collapsible body */}
      {expanded && (
        <div className="mt-6 border-t border-slate-100 pt-6 dark:border-white/5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Date From */}
            <div>
              <label className="label" htmlFor="report-from">From date</label>
              <input
                id="report-from"
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="label" htmlFor="report-to">To date</label>
              <input
                id="report-to"
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className="label" htmlFor="report-status">Status</label>
              <select
                id="report-status"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              id="export-pdf-btn"
              onClick={exportPDF}
              disabled={loading !== null}
              className="btn-primary flex items-center gap-2"
            >
              {loading === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Export PDF
            </button>

            <button
              id="export-excel-btn"
              onClick={exportExcel}
              disabled={loading !== null}
              className="btn-secondary flex items-center gap-2 dark:text-slate-200"
            >
              {loading === 'excel' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              )}
              Export Excel
            </button>

            {(from || to || status !== 'ALL') && (
              <button
                onClick={() => { setFrom(''); setTo(''); setStatus('ALL') }}
                className="text-xs font-medium text-slate-400 underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear filters
              </button>
            )}
          </div>

          <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
            Leave dates empty to export all-time data. The PDF includes a styled table with alternating rows. The Excel file includes a Summary sheet.
          </p>
        </div>
      )}
    </div>
  )
}

'use client'

export default function PrintButton() {
  return (
    <button onClick={() => window.print()}
      className="flex-1 rounded-xl bg-teal-500 py-3 text-sm font-bold text-white hover:bg-teal-600 transition-colors">
      Print Receipt
    </button>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import PageBackground from '@/components/PageBackground'

export default function TrackPage() {
  const router = useRouter()
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = ref.trim().toUpperCase()
    if (!trimmed) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(trimmed)}`)
      if (res.status === 404) { setError('No order found with that receipt number. Please double-check and try again.'); return }
      if (!res.ok) throw new Error('Server error')
      router.push(`/receipt/${trimmed}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (

      

    <div className="max-w-lg mx-auto py-16 space-y-8">
       <PageBackground />
      <div className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 mx-auto mb-4 dark:bg-brand-500/20 dark:text-brand-400">
          <Search className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Track Your Order</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Enter your receipt number to check your order status</p>
      </div>

      <form onSubmit={handleTrack} className="space-y-4">
        <div>
          <label className="label" htmlFor="ref">Receipt Number</label>
          <input id="ref" className="input text-lg font-mono tracking-wider uppercase" value={ref}
            onChange={e => setRef(e.target.value)} placeholder="TJ-20260519-XXXXX"
            autoComplete="off" autoFocus />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={loading || !ref.trim()}
          className="w-full rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-yellow-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Searching…</> : <><Search className="h-5 w-5" /> Track Order</>}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5 text-sm text-slate-500 dark:text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Where is my receipt number?</p>
        <p>Your receipt number (e.g. <span className="font-mono font-black text-brand-600 dark:text-yellow-400">TJ-20260519-AB3XY</span>) was provided when you placed your booking. Check your email or any printed receipt from us.</p>
      </div>
    </div>
  )
}

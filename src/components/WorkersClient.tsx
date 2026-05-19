'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, X } from 'lucide-react'

interface Worker {
  id: string; name: string; email: string; phone: string | null
  isActive: boolean; role: string; createdAt: string
  _count: { assignedOrders: number }
}
interface Props { workers: Worker[] }

export default function WorkersClient({ workers: initial }: Props) {
  const router = useRouter()
  const [workers, setWorkers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function createWorker(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role: 'WORKER' }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Failed') }
      setName(''); setEmail(''); setPhone(''); setPassword(''); setShowForm(false)
      router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Error')
    } finally { setLoading(false) }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">Workers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{workers.length} team member{workers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-600 transition-colors">
          <UserPlus className="h-4 w-4" /> Add Worker
        </button>
      </div>

      {/* Add worker form */}
      {showForm && (
        <div className="rounded-2xl border border-teal-200 dark:border-teal-500/30 bg-teal-50/50 dark:bg-teal-500/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">New Worker Account</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={createWorker} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {error && <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
            <div><label className="label">Full Name *</label><input className="input" required value={name} onChange={e => setName(e.target.value)} placeholder="Worker Name" /></div>
            <div><label className="label">Email *</label><input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="worker@teejay.com" /></div>
            <div><label className="label">Phone</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 XX XXX XXXX" /></div>
            <div><label className="label">Password *</label><input className="input" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" /></div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={loading}
                className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-50 flex items-center gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create Worker'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workers list */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden">
        {workers.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <UserPlus className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-semibold text-slate-500">No workers yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first team member above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="py-3 pl-5 pr-3 text-left">Name</th>
                <th className="py-3 px-3 text-left hidden sm:table-cell">Email</th>
                <th className="py-3 px-3 text-left hidden md:table-cell">Phone</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 pl-3 pr-5 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {workers.map(w => (
                <tr key={w.id} className={`transition-colors ${!w.isActive ? 'opacity-50' : 'hover:bg-slate-50/50 dark:hover:bg-white/5'}`}>
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs font-bold shrink-0">
                        {w.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{w.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{w.role.toLowerCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{w.email}</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">{w.phone ?? '—'}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300">{w._count.assignedOrders}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${w.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 pl-3 pr-5">
                    <button onClick={() => toggleActive(w.id, w.isActive)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${w.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                      {w.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

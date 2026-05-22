'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, X, Pencil, Trash2, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react'

interface Worker {
  id: string; name: string; email: string; phone: string | null
  isActive: boolean; role: string; createdAt: string
  _count: { assignedOrders: number }
}
interface Props { workers: Worker[] }

export default function WorkersClient({ workers: initial }: Props) {
  const router = useRouter()
  const [workers, setWorkers] = useState(initial)

  // ── Create form ──────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // ── Edit modal ───────────────────────────────────────────────────────────
  const [editTarget,  setEditTarget]  = useState<Worker | null>(null)
  const [editName,    setEditName]    = useState('')
  const [editPhone,   setEditPhone]   = useState('')
  const [editRole,    setEditRole]    = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError,   setEditError]   = useState<string | null>(null)

  // ── Delete modal ─────────────────────────────────────────────────────────
  const [deleteTarget,  setDeleteTarget]  = useState<Worker | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError,   setDeleteError]   = useState<string | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────
  function openEdit(w: Worker) {
    setEditTarget(w)
    setEditName(w.name)
    setEditPhone(w.phone ?? '')
    setEditRole(w.role)
    setEditError(null)
  }
  function closeEdit() { setEditTarget(null); setEditError(null) }

  function openDelete(w: Worker) { setDeleteTarget(w); setDeleteError(null) }
  function closeDelete() { setDeleteTarget(null); setDeleteError(null) }

  // ── API actions ──────────────────────────────────────────────────────────
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
      const created = await res.json()
      setWorkers(prev => [{ ...created, _count: { assignedOrders: 0 } }, ...prev])
      setName(''); setEmail(''); setPhone(''); setPassword(''); setShowForm(false)
      router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Error')
    } finally { setLoading(false) }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditError(null); setEditLoading(true)
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() || null, role: editRole }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Failed') }
      setWorkers(prev => prev.map(w =>
        w.id === editTarget.id ? { ...w, name: editName.trim(), phone: editPhone.trim() || null, role: editRole } : w
      ))
      closeEdit()
      router.refresh()
    } catch (err) { setEditError(err instanceof Error ? err.message : 'Error')
    } finally { setEditLoading(false) }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, isActive: !isActive } : w))
    router.refresh()
  }

  async function deleteWorker() {
    if (!deleteTarget) return
    setDeleteError(null); setDeleteLoading(true)
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Failed') }
      setWorkers(prev => prev.filter(w => w.id !== deleteTarget.id))
      closeDelete()
      router.refresh()
    } catch (err) { setDeleteError(err instanceof Error ? err.message : 'Error')
    } finally { setDeleteLoading(false) }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">Workers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{workers.length} team member{workers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all active:scale-95 shrink-0">
          <UserPlus className="h-4 w-4" /> Add Worker
        </button>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <div className="rounded-2xl border border-brand-200 dark:border-brand-500/30 bg-brand-50/10 dark:bg-brand-500/5 p-6">
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
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : 'Create Worker'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Workers table ── */}
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
                <th className="py-3 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {workers.map(w => (
                <tr key={w.id} className={`transition-colors ${!w.isActive ? 'opacity-50' : 'hover:bg-slate-50/50 dark:hover:bg-white/5'}`}>
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-yellow-500 text-white text-xs font-bold shrink-0 shadow-sm shadow-brand-500/10">
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
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${w.isActive ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="py-3 pl-3 pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Toggle active */}
                      <button
                        onClick={() => toggleActive(w.id, w.isActive)}
                        title={w.isActive ? 'Deactivate' : 'Reactivate'}
                        className={`rounded-lg p-1.5 transition-colors ${w.isActive
                          ? 'text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                          : 'text-slate-400 hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-500/10 dark:hover:text-yellow-400'}`}>
                        {w.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(w)}
                        title="Edit worker"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => openDelete(w)}
                        title="Delete worker"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEdit} />
          {/* Panel */}
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-2xl shadow-black/40 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Worker</h2>
              <button onClick={closeEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {editError}
              </div>
            )}

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" required value={editName} onChange={e => setEditName(e.target.value)} placeholder="Worker Name" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input bg-slate-50 dark:bg-white/5 cursor-not-allowed" disabled value={editTarget.email} />
                <p className="mt-1 text-xs text-slate-400">Email cannot be changed</p>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="WORKER">Worker</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editLoading}
                  className="flex-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all">
                  {editLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}
                </button>
                <button type="button" onClick={closeEdit}
                  className="rounded-xl border border-slate-200 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDelete} />
          {/* Panel */}
          <div className="relative w-full max-w-sm rounded-2xl border border-red-200 dark:border-red-500/30 bg-white dark:bg-[#111] shadow-2xl shadow-black/40 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
              <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Delete Worker?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              You are about to permanently delete
            </p>
            <p className="font-semibold text-slate-900 dark:text-white mb-1">{deleteTarget.name}</p>
            <p className="text-xs text-slate-400 mb-5">{deleteTarget.email}</p>

            {deleteTarget._count.assignedOrders > 0 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 text-left">
                ⚠️ This worker has <strong>{deleteTarget._count.assignedOrders}</strong> assigned order{deleteTarget._count.assignedOrders !== 1 ? 's' : ''}. Those orders will become unassigned.
              </div>
            )}

            {deleteError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={closeDelete}
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={deleteWorker} disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all">
                {deleteLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting…</> : <><Trash2 className="h-4 w-4" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

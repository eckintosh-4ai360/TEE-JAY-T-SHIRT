'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserPlus, Trash2, Loader2, Shield, UserCheck, Users } from 'lucide-react'

interface User {
  id:        string
  name:      string
  email:     string
  role:      'ADMIN' | 'WORKER'
  createdAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users,    setUsers]    = useState<User[]>([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Add user form state
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [role,      setRole]      = useState<'WORKER' | 'ADMIN'>('WORKER')
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formOk,    setFormOk]    = useState(false)

  // Redirect non-admins
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.replace('/')
    }
  }, [session, status, router])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFormOk(false)
    setSaving(true)

    const res = await fetch('/api/users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, role }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setFormError(data.error ?? 'Failed to create user.')
    } else {
      setFormOk(true)
      setName(''); setEmail(''); setPassword(''); setRole('WORKER')
      fetchUsers()
    }
  }

  async function handleDelete(id: string, userName: string) {
    if (!confirm(`Remove ${userName}? They will no longer be able to log in.`)) return
    setDeleting(id)
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    setDeleting(null)
    fetchUsers()
  }

  if (status === 'loading') {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
  }

  if (session?.user.role !== 'ADMIN') return null

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Add and manage staff access</p>
        </div>
      </div>

      {/* Add user form */}
      <section className="rounded-[1.5rem] border border-white/50 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0a]/70">
        <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <UserPlus className="h-4 w-4 text-brand-500" />
          Add new user
        </h2>

        <form onSubmit={handleAdd} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {formError}
            </div>
          )}
          {formOk && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              ✓ User created successfully.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="new-name">Full name *</label>
              <input id="new-name" className="input" required value={name}
                onChange={(e) => setName(e.target.value)} placeholder="e.g. Kofi Mensah" />
            </div>
            <div>
              <label className="label" htmlFor="new-email">Email address *</label>
              <input id="new-email" type="email" className="input" required value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="worker@teejay.com" />
            </div>
            <div>
              <label className="label" htmlFor="new-password">Password *</label>
              <input id="new-password" type="password" className="input" required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} />
            </div>
            <div>
              <label className="label" htmlFor="new-role">Role</label>
              <select id="new-role" className="input" value={role}
                onChange={(e) => setRole(e.target.value as 'WORKER' | 'ADMIN')}>
                <option value="WORKER">Worker</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><UserPlus className="h-4 w-4" /> Add user</>}
          </button>
        </form>
      </section>

      {/* Users list */}
      <section className="rounded-[1.5rem] border border-white/50 bg-white/70 shadow-sm backdrop-blur-xl overflow-hidden dark:border-white/10 dark:bg-[#0a0a0a]/70">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Staff ({users.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    u.role === 'ADMIN' ? 'bg-brand-500' : 'bg-slate-400 dark:bg-slate-600'
                  }`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Role badge */}
                  <span className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold sm:flex ${
                    u.role === 'ADMIN'
                      ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'
                  }`}>
                    {u.role === 'ADMIN' ? <Shield className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                    {u.role}
                  </span>

                  {/* Delete (can't delete self) */}
                  {u.id !== session?.user.id && (
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={deleting === u.id}
                      className="btn-danger btn-sm"
                      aria-label={`Remove ${u.name}`}
                    >
                      {deleting === u.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Trash2 className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

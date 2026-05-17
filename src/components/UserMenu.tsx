'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { LogOut, Users, ChevronDown, Shield, UserCheck } from 'lucide-react'
import Link from 'next/link'

export default function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref  = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!session?.user) return null

  const { name, email, role } = session.user
  const isAdmin = role === 'ADMIN'

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/50 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
        aria-label="User menu"
      >
        {/* Avatar */}
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${isAdmin ? 'bg-brand-500' : 'bg-slate-400 dark:bg-slate-600'}`}>
          {name?.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:block max-w-[120px] truncate">{name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200/60 bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0f0f0f]/95 z-50 overflow-hidden">
          {/* User info */}
          <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
            <div className="flex items-center gap-2 mb-1">
              {isAdmin
                ? <Shield className="h-3 w-3 text-brand-500" />
                : <UserCheck className="h-3 w-3 text-slate-400" />}
              <span className={`text-xs font-bold uppercase tracking-wider ${isAdmin ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {role}
              </span>
            </div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{email}</p>
          </div>

          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5 transition-colors"
            >
              <Users className="h-4 w-4 text-slate-400" />
              Manage users
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors border-t border-slate-100 dark:border-white/5"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

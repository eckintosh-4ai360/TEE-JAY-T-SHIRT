'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, ListOrdered, Users, BarChart3,
  Printer, Camera, LogOut, ChevronRight, Menu, X
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useState } from 'react'
import { initials } from '@/lib/utils'

const adminLinks = [
  { href: '/admin',          label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/admin/orders',   label: 'All Orders', icon: ListOrdered                  },
  { href: '/admin/workers',  label: 'Workers',    icon: Users                        },
  { href: '/admin/reports',  label: 'Reports',    icon: BarChart3                    },
]

const workerLinks = [
  { href: '/worker',         label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/worker/orders',  label: 'My Orders',  icon: ListOrdered                  },
]

export default function PortalSidebar() {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const role      = session?.user?.role ?? 'WORKER'
  const links     = role === 'ADMIN' ? adminLinks : workerLinks
  const [open, setOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 px-3">
      {links.map(({ href, label, icon: Icon, exact }) => (
        <Link key={href} href={href} onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
            isActive(href, exact)
              ? 'bg-teal-500/10 text-teal-600 dark:bg-red-500/10 dark:text-red-400'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100'
          }`}>
          <Icon className="h-4 w-4 shrink-0" /> {label}
          {isActive(href, exact) && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-50" />}
        </Link>
      ))}
    </nav>
  )

  const UserBlock = () => (
    <div className="border-t border-slate-200 dark:border-zinc-800 p-3 space-y-2">
      <div className="flex items-center gap-3 rounded-xl px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white dark:from-red-600 dark:to-yellow-500 dark:text-black text-xs font-bold shrink-0">
          {initials(session?.user?.name ?? 'U')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{session?.user?.name}</p>
          <p className="text-xs text-slate-400 capitalize">{role.toLowerCase()}</p>
        </div>
        <ThemeToggle />
      </div>
      <button onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:backdrop-blur-xl">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-zinc-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg dark:from-red-600 dark:to-yellow-500 dark:text-black dark:shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <Printer className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white">TEE-JAY MULTIMEDIA</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><Printer className="h-2.5 w-2.5" /> Printing · <Camera className="h-2.5 w-2.5" /> Photography</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 flex flex-col">
          <NavLinks />
        </div>
        <UserBlock />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4 py-3 dark:border-zinc-800 dark:bg-black/60 dark:backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white dark:from-red-600 dark:to-yellow-500 dark:text-black">
            <Printer className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white">TEE-JAY MULTIMEDIA</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-zinc-950 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-zinc-800">
              <span className="font-black text-slate-900 dark:text-white">TEE-JAY MULTIMEDIA</span>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 flex flex-col">
              <NavLinks />
            </div>
            <UserBlock />
          </aside>
        </div>
      )}
    </>
  )
}

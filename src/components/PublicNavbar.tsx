'use client'
import Image from 'next/image'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Camera, Printer, BookOpen, Search, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function PublicNavbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/book',  label: 'Book a Service', icon: BookOpen },
    { href: '/track', label: 'Track Order',     icon: Search   },
  ]

  const dashHref = session?.user?.role === 'ADMIN' ? '/admin' : session?.user?.role === 'WORKER' ? '/worker' : '/login'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-black/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">


        <Link href="/" className="relative flex items-center gap-3 group" onClick={() => setOpen(false)}>

            <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-xl object-cover" priority />
          
          <div className="z-10">
            <p className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-white">TEE-JAY MULTIMEDIA</p>
            <p className="text-[10px] font-medium leading-none text-red-600 dark:text-yellow-500 mt-1 hidden sm:block">Printing & Photography</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  active ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                         : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100'
                }`}>
                {label}
              </Link>
            )
          })}
          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-2" />
          <ThemeToggle />
          {session ? (
            <Link href={dashHref} className="ml-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2 text-sm font-semibold text-white dark:text-black hover:from-red-500 hover:to-yellow-400 transition-colors shadow-sm shadow-red-600/25">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          ) : (
            <Link href="/login" className="ml-2 rounded-lg bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2 text-sm font-semibold text-white dark:text-black hover:from-red-500 hover:to-yellow-400 transition-colors shadow-sm shadow-red-600/25">
              Staff Login
            </Link>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-slate-300">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-slate-100 dark:border-zinc-800/50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-zinc-900/50">
              <Icon className="h-4 w-4 text-red-600 dark:text-red-400" /> {label}
            </Link>
          ))}
          <Link href={session ? dashHref : '/login'} onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 dark:text-yellow-500">
            <LayoutDashboard className="h-4 w-4" />
            {session ? 'Dashboard' : 'Staff Login'}
          </Link>
        </div>
      )}
    </header>
  )
}

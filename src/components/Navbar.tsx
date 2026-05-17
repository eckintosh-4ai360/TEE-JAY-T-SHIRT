'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

const links = [
  { href: '/',        label: 'Dashboard' },
  { href: '/orders',  label: 'Orders'    },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#0a0a0a]/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-brand-500/40">
            {/* shirt icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight leading-none text-slate-900 dark:text-white">Press Manager</p>
            <p className="text-[11px] font-medium leading-none text-slate-500 dark:text-slate-400 mt-1">T-shirt printing orders</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </Link>
            )
          })}
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>
          <ThemeToggle />
          <Link href="/orders/new" className="btn-primary btn-sm ml-3 hidden sm:inline-flex">
            + New order
          </Link>
        </nav>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',        label: 'Dashboard' },
  { href: '/orders',  label: 'Orders'    },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
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
            <p className="text-sm font-semibold leading-none text-gray-900">Press Manager</p>
            <p className="text-[10px] leading-none text-gray-400 mt-0.5">T-shirt printing orders</p>
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
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                {label}
              </Link>
            )
          })}
          <Link href="/orders/new" className="btn-primary btn-sm ml-3">
            + New order
          </Link>
        </nav>
      </div>
    </header>
  )
}

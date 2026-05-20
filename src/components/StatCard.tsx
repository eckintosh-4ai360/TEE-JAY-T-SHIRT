import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'cyan' | 'purple' | 'green' | 'orange' | 'magenta' | 'red' | 'blue' | 'yellow'
  icon?: React.ReactNode
  badge?: string
}

const accentMap = {
  cyan:    { bg: 'bg-red-50 dark:bg-red-500/10',         iconBg: 'bg-red-600 text-white',   text: 'text-red-600 dark:text-red-400' },
  purple:  { bg: 'bg-[#eeedfc] dark:bg-purple-500/20',   iconBg: 'bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400' },
  green:   { bg: 'bg-yellow-50 dark:bg-yellow-500/10',   iconBg: 'bg-yellow-500 text-black', text: 'text-yellow-600 dark:text-yellow-400' },
  yellow:  { bg: 'bg-yellow-50 dark:bg-yellow-500/10',   iconBg: 'bg-yellow-500 text-black', text: 'text-yellow-600 dark:text-yellow-400' },
  orange:  { bg: 'bg-[#fcf1e3] dark:bg-orange-500/20',   iconBg: 'bg-orange-400',  text: 'text-orange-600 dark:text-orange-400' },
  magenta: { bg: 'bg-[#fbe8f6] dark:bg-fuchsia-500/20',  iconBg: 'bg-fuchsia-400', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
  red:     { bg: 'bg-red-50 dark:bg-red-500/10',         iconBg: 'bg-red-600 text-white',   text: 'text-red-600 dark:text-red-400' },
  blue:    { bg: 'bg-[#e8f1fc] dark:bg-blue-500/20',     iconBg: 'bg-blue-400',    text: 'text-blue-600 dark:text-blue-400' },
}

export default function StatCard({ label, value, sub, accent = 'cyan', icon, badge }: StatCardProps) {
  const styles = accentMap[accent]

  return (
    <div className={`relative flex min-w-0 flex-col justify-between overflow-hidden rounded-[1.5rem] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${styles.bg} border border-white/50 dark:border-white/5`}>
      {/* Top row: Icon & Badge */}
      <div className="flex min-w-0 items-start justify-between gap-2">
        {icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${styles.iconBg}`}>
            {icon}
          </div>
        ) : (
          <div className="h-10 w-10 shrink-0" />
        )}
        {badge && (
          <span className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-500 opacity-60 mix-blend-multiply dark:text-slate-400 dark:mix-blend-normal">
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mt-5 min-w-0">
        {/* Fluid font: large for short numbers, smaller for long strings */}
        <p className="min-w-0 break-words font-bold leading-none text-slate-900 dark:text-white"
           style={{ fontSize: 'clamp(1.1rem, 3.5cqi, 2rem)' }}>
          {value}
        </p>
        <p className="mt-2 truncate text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">
          {label}
        </p>
        {sub && (
          <p className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

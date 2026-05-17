interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: 'default' | 'green' | 'red' | 'blue' | 'orange'
}

const accentMap = {
  default: 'text-gray-900',
  green:   'text-green-700',
  red:     'text-red-600',
  blue:    'text-blue-700',
  orange:  'text-brand-600',
}

export default function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  return (
    <div className="stat-card">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${accentMap[accent]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

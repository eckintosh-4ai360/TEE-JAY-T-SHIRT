import ReportExporter from '@/components/ReportExporter'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reports — Tee-Jay Admin' }

export default function AdminReportsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Generate and export financial and order reports</p>
      </div>
      
      <ReportExporter />
    </div>
  )
}

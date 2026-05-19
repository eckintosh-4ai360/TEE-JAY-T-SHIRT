import { prisma } from '@/lib/prisma'
import AdminOrderForm from '@/components/AdminOrderForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = { title: 'New Order — Tee-Jay Admin' }

export default async function NewOrderPage() {
  const workers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-3">
          <ChevronLeft className="h-4 w-4" /> Back to orders
        </Link>
        <h1 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">New Order</h1>
        <p className="mt-0.5 text-sm text-slate-500">Create a printing or photography order</p>
      </div>
      <AdminOrderForm workers={workers} />
    </div>
  )
}

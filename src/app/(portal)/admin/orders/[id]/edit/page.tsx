import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { serializeOrder } from '@/lib/utils'
import AdminOrderForm from '@/components/AdminOrderForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [raw, workers] = await Promise.all([
    prisma.order.findUnique({ where: { id }, include: { colors: true, assignedTo: true } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])
  if (!raw) notFound()
  const order = serializeOrder(raw)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/admin/orders/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 mb-3">
          <ChevronLeft className="h-4 w-4" /> Back to order
        </Link>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">Edit Order</h1>
        <p className="text-sm text-slate-500 mt-0.5">{order.clientName} · {order.receiptNumber}</p>
      </div>
      <AdminOrderForm order={order} workers={workers} />
    </div>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { serializeOrder } from '@/lib/utils'
import OrderForm from '@/components/OrderForm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id }, select: { clientName: true } })
  return { title: order ? `Edit ${order.clientName} — Press Manager` : 'Order not found' }
}

export default async function EditOrderPage({ params }: PageProps) {
  const { id } = await params
  const raw = await prisma.order.findUnique({
    where: { id },
    include: { colors: true },
  })
  if (!raw) notFound()

  const order = serializeOrder(raw)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">Dashboard</Link>
        <span>/</span>
        <Link href="/orders" className="hover:text-gray-600">Orders</Link>
        <span>/</span>
        <Link href={`/orders/${id}`} className="hover:text-gray-600 font-mono text-xs">{id}</Link>
        <span>/</span>
        <span className="text-gray-700">Edit</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">
        Edit order — {order.clientName}
      </h1>

      <div className="card p-6 lg:p-8">
        <OrderForm order={order} />
      </div>
    </div>
  )
}

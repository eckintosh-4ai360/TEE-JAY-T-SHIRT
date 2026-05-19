import { prisma } from '@/lib/prisma'
import WorkersClient from '@/components/WorkersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Workers — Tee-Jay Admin' }

export default async function WorkersPage() {
  const workers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, isActive: true, createdAt: true,
      _count: { select: { assignedOrders: true } },
    },
  })
  const serialized = workers.map(w => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
    _count: w._count,
  }))
  return <WorkersClient workers={serialized} />
}

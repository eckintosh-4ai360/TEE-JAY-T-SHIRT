import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { serializeOrder } from '@/lib/utils'
import WorkerOrderUpdate from '@/components/WorkerOrderUpdate'

export const dynamic = 'force-dynamic'

export default async function WorkerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId  = session?.user?.id as string

  const raw = await prisma.order.findFirst({
    where: { id, assignedToId: userId },
    include: { colors: true, assignedTo: true },
  })
  if (!raw) notFound()

  return <WorkerOrderUpdate order={serializeOrder(raw)} />
}

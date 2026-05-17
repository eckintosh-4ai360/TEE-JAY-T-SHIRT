import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeOrder } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from  = searchParams.get('from')
  const to    = searchParams.get('to')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) } : {}),
    }
  }

  if (status && status !== 'ALL') {
    where.status = status
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { colors: true },
  })

  return NextResponse.json(orders.map(serializeOrder))
}

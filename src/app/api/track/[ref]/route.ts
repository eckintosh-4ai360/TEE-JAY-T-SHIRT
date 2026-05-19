import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  const order = await prisma.order.findUnique({
    where: { receiptNumber: ref.toUpperCase() },
    select: { id: true, receiptNumber: true, status: true, clientName: true, serviceCategory: true },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

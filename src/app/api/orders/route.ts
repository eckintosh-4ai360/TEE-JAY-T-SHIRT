import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeOrder, computeTotals } from '@/lib/utils'
import type { OrderPayload } from '@/types'

// ── POST /api/orders ── create a new order ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: OrderPayload = await req.json()

    if (!body.clientName?.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    }

    const colors = (body.colors ?? []).map((c) => ({
      name: c.name ?? '',
      qty:  Number(c.qty ?? 0),
    }))

    const { totalQty, totalAmount, balance } = computeTotals(
      colors,
      body.unitPrice,
      body.amountPaid
    )

    const order = await prisma.order.create({
      data: {
        clientName:  body.clientName.trim(),
        clientPhone: body.clientPhone  || null,
        clientEmail: body.clientEmail  || null,
        design:      body.design       || null,
        dueDate:     body.dueDate ? new Date(body.dueDate) : null,
        status:      body.status  ?? 'PENDING',
        notes:       body.notes        || null,
        unitPrice:   Number(body.unitPrice  ?? 0),
        amountPaid:  Number(body.amountPaid ?? 0),
        totalQty,
        totalAmount,
        balance,
        colors: { create: colors },
      },
      include: { colors: true },
    })

    return NextResponse.json(serializeOrder(order), { status: 201 })
  } catch (err) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// ── GET /api/orders ── list / filter for report exports ───────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')
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

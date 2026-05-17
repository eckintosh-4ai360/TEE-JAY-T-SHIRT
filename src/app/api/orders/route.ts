import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeOrder, computeTotals } from '@/lib/utils'
import type { OrderPayload } from '@/types'

// ── GET /api/orders ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? ''

    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(search
          ? {
              OR: [
                { clientName: { contains: search, mode: 'insensitive' } },
                { id:         { contains: search, mode: 'insensitive' } },
                { design:     { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { colors: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders.map(serializeOrder))
  } catch (err) {
    console.error('[GET /api/orders]', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// ── POST /api/orders ──────────────────────────────────────────────────────────
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
        colors: {
          create: colors,
        },
      },
      include: { colors: true },
    })

    return NextResponse.json(serializeOrder(order), { status: 201 })
  } catch (err) {
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

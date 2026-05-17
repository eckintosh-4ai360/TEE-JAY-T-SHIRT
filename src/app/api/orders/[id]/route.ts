import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeOrder, computeTotals } from '@/lib/utils'
import type { OrderPayload } from '@/types'

type Params = { params: Promise<{ id: string }> }

// ── GET /api/orders/[id] ──────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: { colors: true },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(serializeOrder(order))
  } catch (err) {
    console.error('[GET /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// ── PUT /api/orders/[id] ── full update ───────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
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

    // Delete existing colours and recreate — simplest strategy for a list update
    await prisma.orderColor.deleteMany({ where: { orderId: id } })

    const order = await prisma.order.update({
      where: { id },
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

    return NextResponse.json(serializeOrder(order))
  } catch (err) {
    console.error('[PUT /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// ── PATCH /api/orders/[id] ── partial update (status) ────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()

    const order = await prisma.order.update({
      where: { id },
      data: { status: body.status },
      include: { colors: true },
    })

    return NextResponse.json(serializeOrder(order))
  } catch (err) {
    console.error('[PATCH /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}

// ── DELETE /api/orders/[id] ───────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    // OrderColor rows are cascade-deleted via Prisma schema onDelete: Cascade
    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/orders/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}

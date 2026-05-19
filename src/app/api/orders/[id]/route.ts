import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { serializeOrder } from '@/lib/utils'

// ── GET /api/orders/[id] ──────────────────────────────────────────────────────
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findUnique({
    where: { id },
    include: { colors: true, assignedTo: true },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.user?.role === 'WORKER' && order.assignedToId !== session.user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(serializeOrder(order))
}

// ── PUT /api/orders/[id] (full update — admin) ────────────────────────────────
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const {
      serviceCategory, printingType, printingTypeOther,
      photographyType, photographyTypeOther,
      clientName, clientPhone, clientEmail,
      assignedToId, description, dueDate, status, notes,
      unitPrice, amountPaid = 0, colors = [],
    } = body

    const isPrinting = serviceCategory === 'PRINTING'
    const totalQty    = isPrinting ? colors.reduce((s: number, c: { qty: number }) => s + Number(c.qty || 0), 0) : 1
    const totalAmount = parseFloat((totalQty * Number(unitPrice)).toFixed(2))
    const balance     = parseFloat((totalAmount - Number(amountPaid)).toFixed(2))

    // Replace colors
    await prisma.orderColor.deleteMany({ where: { orderId: id } })

    const order = await prisma.order.update({
      where: { id },
      data: {
        serviceCategory, printingType: printingType ?? null,
        printingTypeOther: printingTypeOther ?? null,
        photographyType: photographyType ?? null,
        photographyTypeOther: photographyTypeOther ?? null,
        clientName: clientName?.trim(), clientPhone: clientPhone?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        assignedToId: assignedToId || null,
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status, notes: notes?.trim() || null,
        unitPrice: Number(unitPrice), totalQty, totalAmount,
        amountPaid: Number(amountPaid), balance,
        colors: isPrinting && colors.length > 0 ? {
          create: colors
            .filter((c: { name: string; qty: number }) => c.name?.trim())
            .map((c: { name: string; qty: number }) => ({ name: c.name.trim(), qty: Number(c.qty) })),
        } : undefined,
      },
      include: { colors: true, assignedTo: true },
    })
    return NextResponse.json(serializeOrder(order))
  } catch (err) {
    console.error('PUT /api/orders/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PATCH /api/orders/[id] (partial — worker can update status/notes only) ────
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Workers can only update status + notes on their assigned orders
  if (session.user?.role === 'WORKER') {
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order || order.assignedToId !== session.user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const updated = await prisma.order.update({
      where: { id },
      data: { status: body.status, notes: body.notes },
      include: { colors: true, assignedTo: true },
    })
    return NextResponse.json(serializeOrder(updated))
  }

  // Admin can patch anything
  const updated = await prisma.order.update({
    where: { id },
    data: body,
    include: { colors: true, assignedTo: true },
  })
  return NextResponse.json(serializeOrder(updated))
}

// ── DELETE /api/orders/[id] ───────────────────────────────────────────────────
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.order.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

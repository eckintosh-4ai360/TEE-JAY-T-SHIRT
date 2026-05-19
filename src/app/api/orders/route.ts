import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { serializeOrder, generateReceiptNumber } from '@/lib/utils'
import type { Prisma } from '@prisma/client'

// ── GET /api/orders ────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status   = searchParams.get('status')

  const where: Prisma.OrderWhereInput = {}
  if (category) where.serviceCategory = category as 'PRINTING' | 'PHOTOGRAPHY'
  if (status)   where.status = status as Prisma.EnumOrderStatusFilter
  if (session.user?.role === 'WORKER') where.assignedToId = session.user.id

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { colors: true, assignedTo: true },
  })
  return NextResponse.json(orders.map(serializeOrder))
}

// ── POST /api/orders ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      serviceCategory = 'PRINTING',
      printingType, printingTypeOther,
      photographyType, photographyTypeOther,
      clientName, clientPhone, clientEmail,
      assignedToId,
      description, dueDate, status = 'PENDING', notes,
      unitPrice, amountPaid = 0,
      colors = [],
    } = body

    if (!clientName?.trim()) return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    if (!unitPrice || Number(unitPrice) <= 0) return NextResponse.json({ error: 'Unit price is required' }, { status: 400 })

    const isPrinting = serviceCategory === 'PRINTING'
    const totalQty    = isPrinting ? colors.reduce((s: number, c: { qty: number }) => s + Number(c.qty || 0), 0) : 1
    const totalAmount = parseFloat((totalQty * Number(unitPrice)).toFixed(2))
    const balance     = parseFloat((totalAmount - Number(amountPaid)).toFixed(2))

    const order = await prisma.order.create({
      data: {
        receiptNumber: generateReceiptNumber(),
        serviceCategory,
        printingType:         printingType    ?? null,
        printingTypeOther:    printingTypeOther   ?? null,
        photographyType:      photographyType ?? null,
        photographyTypeOther: photographyTypeOther ?? null,
        clientName: clientName.trim(),
        clientPhone: clientPhone?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        assignedToId: assignedToId || null,
        description: description?.trim() || null,
        dueDate:    dueDate ? new Date(dueDate) : null,
        status,
        notes: notes?.trim() || null,
        unitPrice:   Number(unitPrice),
        totalQty,
        totalAmount,
        amountPaid:  Number(amountPaid),
        balance,
        colors: isPrinting && colors.length > 0 ? {
          create: colors
            .filter((c: { name: string; qty: number }) => c.name?.trim())
            .map((c: { name: string; qty: number }) => ({ name: c.name.trim(), qty: Number(c.qty) })),
        } : undefined,
      },
      include: { colors: true, assignedTo: true },
    })
    return NextResponse.json(serializeOrder(order), { status: 201 })
  } catch (err) {
    console.error('POST /api/orders', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

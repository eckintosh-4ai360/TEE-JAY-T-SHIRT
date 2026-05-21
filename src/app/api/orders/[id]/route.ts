import { after, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { serializeOrder, fmtCurrency, fmtDate, getServiceLabel, sumSizeQuantities } from '@/lib/utils'
import { sendSMS, buildStatusUpdateSMS } from '@/lib/sms'
import { STATUS_META, type OrderStatus } from '@/types'

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
      designType, designTypeOther,
      clientName, clientPhone, clientEmail,
      assignedToId, description, dueDate, status, notes,
      unitPrice, amountPaid = 0, colors = [], sizes = null,
    } = body

    const isV2 = sizes && typeof sizes === 'object' && (sizes as any)._version === 'v2' && Array.isArray((sizes as any).items)

    let totalQty = 0
    let totalAmount = 0
    let calculatedUnitPrice = Number(unitPrice || 0)

    if (isV2) {
      const items = (sizes as any).items
      totalQty = items.reduce((sum: number, it: any) => sum + Number(it.qty || 0), 0)
      totalAmount = items.reduce((sum: number, it: any) => sum + (Number(it.qty || 0) * Number(it.unitPrice || 0)), 0)
      if (items.length > 0) {
        calculatedUnitPrice = Number(items[0].unitPrice || 0)
      }
    } else {
      const isPrinting = serviceCategory === 'PRINTING'
      const isApparel  = isPrinting && (printingType === 'TSHIRT' || printingType === 'LACOSTE')
      totalQty   = isApparel
        ? sumSizeQuantities(sizes)
        : (isPrinting ? colors.reduce((s: number, c: { qty: number }) => s + Number(c.qty || 0), 0) : 1)
      totalAmount = parseFloat((totalQty * calculatedUnitPrice).toFixed(2))
    }

    const balance     = parseFloat((totalAmount - Number(amountPaid)).toFixed(2))

    // Replace colors
    await prisma.orderColor.deleteMany({ where: { orderId: id } })

    let dbColors: { name: string; qty: number }[] = []
    if (isV2) {
      const items = (sizes as any).items
      const colorMap = new Map<string, number>()
      for (const item of items) {
        if (Array.isArray(item.colors)) {
          for (const c of item.colors) {
            const name = c.name?.trim()
            if (name) {
              const qty = Number(c.qty || 0)
              const key = name.toLowerCase()
              colorMap.set(key, (colorMap.get(key) || 0) + qty)
            }
          }
        }
      }
      for (const [key, qty] of colorMap.entries()) {
        let originalName = key
        for (const item of items) {
          if (Array.isArray(item.colors)) {
            const found = item.colors.find((c: any) => c.name?.trim().toLowerCase() === key)
            if (found) {
              originalName = found.name.trim()
              break
            }
          }
        }
        dbColors.push({ name: originalName, qty })
      }
    } else {
      if (serviceCategory === 'PRINTING' && colors && colors.length > 0) {
        dbColors = colors
          .filter((c: { name: string; qty: number }) => c.name?.trim())
          .map((c: { name: string; qty: number }) => ({ name: c.name.trim(), qty: Number(c.qty) }))
      }
    }

    const firstItem = isV2 ? (sizes as any).items[0] : null
    const finalServiceCategory = isV2 ? (firstItem?.category || serviceCategory) : serviceCategory
    const finalPrintingType = isV2 ? (firstItem?.category === 'PRINTING' ? firstItem?.type : null) : printingType
    const finalPrintingTypeOther = isV2 ? (firstItem?.category === 'PRINTING' ? firstItem?.typeOther : null) : printingTypeOther
    const finalPhotographyType = isV2 ? (firstItem?.category === 'PHOTOGRAPHY' ? firstItem?.type : null) : photographyType
    const finalPhotographyTypeOther = isV2 ? (firstItem?.category === 'PHOTOGRAPHY' ? firstItem?.typeOther : null) : photographyTypeOther
    const finalDesignType = isV2 ? (firstItem?.category === 'DESIGN' ? firstItem?.type : null) : designType
    const finalDesignTypeOther = isV2 ? (firstItem?.category === 'DESIGN' ? firstItem?.typeOther : null) : designTypeOther

    const order = await prisma.order.update({
      where: { id },
      data: {
        serviceCategory:      finalServiceCategory,
        printingType:         finalPrintingType ?? null,
        printingTypeOther:    finalPrintingTypeOther ?? null,
        photographyType:      finalPhotographyType ?? null,
        photographyTypeOther: finalPhotographyTypeOther ?? null,
        designType:           finalDesignType ?? null,
        designTypeOther:      finalDesignTypeOther ?? null,
        clientName: clientName?.trim(),
        clientPhone: clientPhone?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        assignedToId: assignedToId || null,
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        notes: notes?.trim() || null,
        unitPrice: calculatedUnitPrice,
        totalQty,
        totalAmount,
        amountPaid: Number(amountPaid),
        balance,
        sizes: isV2 ? sizes : (serviceCategory === 'PRINTING' && (printingType === 'TSHIRT' || printingType === 'LACOSTE') ? (sizes || {}) : null),
        colors: dbColors.length > 0 ? {
          create: dbColors,
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
    const serialized = serializeOrder(updated)
    // ── Notify client via SMS on status change ────────────────────────────
    if (updated.clientPhone && body.status && body.status !== order.status) {
      const statusLabel = STATUS_META[body.status as OrderStatus]?.label ?? body.status
      const msg = buildStatusUpdateSMS({
        clientName:    serialized.clientName,
        receiptNumber: serialized.receiptNumber,
        serviceLabel:  getServiceLabel(serialized),
        totalAmount:   fmtCurrency(serialized.totalAmount),
        amountPaid:    fmtCurrency(serialized.amountPaid),
        balance:       fmtCurrency(serialized.balance),
        dueDate:       serialized.dueDate ? fmtDate(serialized.dueDate) : 'TBD',
        status:        statusLabel,
      })
      after(async () => {
        const result = await sendSMS([updated.clientPhone!], msg)
        if (!result.ok) {
          console.error('[SMS] Worker status update SMS failed', {
            orderId: updated.id,
            receiptNumber: updated.receiptNumber,
            clientPhone: updated.clientPhone,
            error: result.error,
            raw: result.raw,
          })
        }
      })
    }
    return NextResponse.json(serialized)
  }

  // Admin can patch anything
  const prevOrder = await prisma.order.findUnique({ where: { id } })
  const updated = await prisma.order.update({
    where: { id },
    data: body,
    include: { colors: true, assignedTo: true },
  })
  const serialized = serializeOrder(updated)
  // ── Notify client via SMS on status change (admin path) ───────────────
  if (updated.clientPhone && body.status && body.status !== prevOrder?.status) {
    const statusLabel = STATUS_META[body.status as OrderStatus]?.label ?? body.status
    const msg = buildStatusUpdateSMS({
      clientName:    serialized.clientName,
      receiptNumber: serialized.receiptNumber,
      serviceLabel:  getServiceLabel(serialized),
      totalAmount:   fmtCurrency(serialized.totalAmount),
      amountPaid:    fmtCurrency(serialized.amountPaid),
      balance:       fmtCurrency(serialized.balance),
      dueDate:       serialized.dueDate ? fmtDate(serialized.dueDate) : 'TBD',
      status:        statusLabel,
    })
    after(async () => {
      const result = await sendSMS([updated.clientPhone!], msg)
      if (!result.ok) {
        console.error('[SMS] Admin status update SMS failed', {
          orderId: updated.id,
          receiptNumber: updated.receiptNumber,
          clientPhone: updated.clientPhone,
          error: result.error,
          raw: result.raw,
        })
      }
    })
  }
  return NextResponse.json(serialized)
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

import { after, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { serializeOrder, generateReceiptNumber, fmtCurrency, fmtDate, getServiceLabel, sumSizeQuantities } from '@/lib/utils'
import { sendSMS, buildOrderConfirmationSMS, buildWorkerAssignmentSMS, resolveAppBaseUrl } from '@/lib/sms'
import type { Prisma } from '@prisma/client'

// ── GET /api/orders ────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status   = searchParams.get('status')

  const where: Prisma.OrderWhereInput = {}
  if (category) where.serviceCategory = category as 'PRINTING' | 'PHOTOGRAPHY' | 'DESIGN'
  if (status)   where.status = status as Prisma.EnumOrderStatusFilter
  if (session.user?.role === 'WORKER') where.assignedToId = session.user.id

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { colors: true, assignedTo: true, createdBy: true },
  })
  return NextResponse.json(orders.map(serializeOrder))
}

// ── POST /api/orders ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const appBaseUrl = resolveAppBaseUrl(req)
    const {
      serviceCategory = 'PRINTING',
      printingType, printingTypeOther,
      photographyType, photographyTypeOther,
      designType, designTypeOther,
      clientName, clientPhone, clientEmail,
      assignedToId,
      description, dueDate, status = 'PENDING', notes,
      unitPrice, amountPaid = 0,
      colors = [],
      sizes = null,
    } = body

    if (!clientName?.trim()) return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    
    const isV2 = sizes && typeof sizes === 'object' && (sizes as any)._version === 'v2' && Array.isArray((sizes as any).items)
    if (!isV2 && (!unitPrice || Number(unitPrice) <= 0)) {
      return NextResponse.json({ error: 'Unit price is required' }, { status: 400 })
    }

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
      totalQty    = isApparel
        ? sumSizeQuantities(sizes)
        : (isPrinting ? colors.reduce((s: number, c: { qty: number }) => s + Number(c.qty || 0), 0) : 1)
      totalAmount = parseFloat((totalQty * calculatedUnitPrice).toFixed(2))
    }

    const balance = parseFloat((totalAmount - Number(amountPaid)).toFixed(2))

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

    const finalCreatedById = session?.user?.id || null
    const finalAssignedToId = (session?.user?.role === 'ADMIN' ? assignedToId : null) || null

    const order = await prisma.order.create({
      data: {
        receiptNumber: generateReceiptNumber(),
        serviceCategory:      finalServiceCategory,
        printingType:         finalPrintingType ?? null,
        printingTypeOther:    finalPrintingTypeOther ?? null,
        photographyType:      finalPhotographyType ?? null,
        photographyTypeOther: finalPhotographyTypeOther ?? null,
        designType:           finalDesignType ?? null,
        designTypeOther:      finalDesignTypeOther ?? null,
        clientName: clientName.trim(),
        clientPhone: clientPhone?.trim() || null,
        clientEmail: clientEmail?.trim() || null,
        assignedToId: finalAssignedToId,
        createdById: finalCreatedById,
        description: description?.trim() || null,
        dueDate:    dueDate ? new Date(dueDate) : null,
        status,
        notes: notes?.trim() || null,
        unitPrice:   calculatedUnitPrice,
        totalQty,
        totalAmount,
        amountPaid:  Number(amountPaid),
        balance,
        sizes: isV2 ? sizes : (serviceCategory === 'PRINTING' && (printingType === 'TSHIRT' || printingType === 'LACOSTE') ? (sizes || {}) : null),
        colors: dbColors.length > 0 ? {
          create: dbColors,
        } : undefined,
      },
      include: { colors: true, assignedTo: true, createdBy: true },
    })

    // Create Activity Log
    await prisma.orderLog.create({
      data: {
        orderId: order.id,
        userId: finalCreatedById,
        action: 'CREATE',
        details: session?.user
          ? `Order created by ${session.user.name} (${session.user.role})`
          : 'Order created via Online Booking',
      },
    })

    const serialized = serializeOrder(order)

    // ── Fire-and-forget SMS confirmation to client ──────────────────────────
    if (order.clientPhone) {
      const msg = buildOrderConfirmationSMS({
        clientName:    serialized.clientName,
        receiptNumber: serialized.receiptNumber,
        serviceLabel:  getServiceLabel(serialized),
        totalAmount:   fmtCurrency(serialized.totalAmount),
        amountPaid:    fmtCurrency(serialized.amountPaid),
        balance:       fmtCurrency(serialized.balance),
        dueDate:       serialized.dueDate ? fmtDate(serialized.dueDate) : 'TBD',
        appBaseUrl,
      })
      after(async () => {
        const result = await sendSMS([order.clientPhone!], msg)
        if (!result.ok) {
          console.error('[SMS] Order confirmation SMS failed', {
            orderId: order.id,
            receiptNumber: order.receiptNumber,
            clientPhone: order.clientPhone,
            error: result.error,
            raw: result.raw,
          })
        }
      })
    }

    // ── Fire-and-forget SMS assignment to worker ────────────────────────────
    if (order.assignedTo?.phone) {
      const workerMsg = buildWorkerAssignmentSMS({
        workerName:    order.assignedTo.name ?? 'Worker',
        clientName:    serialized.clientName,
        receiptNumber: serialized.receiptNumber,
        serviceLabel:  getServiceLabel(serialized),
        dueDate:       serialized.dueDate ? fmtDate(serialized.dueDate) : 'TBD',
        description:   order.description ?? undefined,
        appBaseUrl,
      })
      after(async () => {
        const result = await sendSMS([order.assignedTo!.phone!], workerMsg)
        if (!result.ok) {
          console.error('[SMS] Worker assignment SMS failed (POST)', {
            orderId: order.id,
            workerPhone: order.assignedTo?.phone,
            error: result.error,
          })
        }
      })
    }

    return NextResponse.json(serialized, { status: 201 })
  } catch (err) {
    console.error('POST /api/orders', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { assignedOrders: true } } },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { name, email, phone, password, role = 'WORKER' } = await req.json()
    if (!name?.trim() || !email?.trim() || !password)
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), phone: phone?.trim() || null, passwordHash, role, isActive: true },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error('POST /api/users', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

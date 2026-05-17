import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Seeding admin user…')

  const email = 'admin@teejay.com'
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    console.log('Admin user already exists — skipping.')
    return
  }

  const passwordHash = await bcrypt.hash('adminpassword', 12)

  const admin = await prisma.user.create({
    data: {
      name:  'Admin',
      email,
      passwordHash,
      role:  'ADMIN',
    },
  })

  console.log(`✓ Admin created: ${admin.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

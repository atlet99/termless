import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '@termless/auth'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL ?? 'admin@example.com'
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD

  if (!adminPassword) {
    console.warn('INITIAL_ADMIN_PASSWORD not set, skipping seed')
    return
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existing) {
    console.log('Admin user already exists, skipping seed')
    return
  }

  const passwordHash = await hashPassword(adminPassword)

  await prisma.user.create({
    data: {
      email: adminEmail,
      displayName: 'Administrator',
      passwordHash,
      role: Role.ADMIN,
    },
  })

  console.log(`Seeded admin user: ${adminEmail}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient, Role } from '@prisma/client'

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

  await prisma.user.create({
    data: {
      email: adminEmail,
      displayName: 'Administrator',
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

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing database connection...')
    const users = await prisma.user.findMany()
    console.log(`Found ${users.length} users:`)
    users.forEach(u => console.log(`- ${u.email}`))
    
    console.log('\nTesting login for admin@test.com...')
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    })
    
    if (admin) {
      console.log('✅ Admin user found:', admin.email)
      console.log('Password hash exists:', admin.password ? 'Yes' : 'No')
      
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: admin.id, status: 'ACCEPTED' }
      })
      console.log('Organization membership:', membership ? 'Found' : 'Not found')
    } else {
      console.log('❌ Admin user NOT found')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()

import { prisma } from './lib/prisma.js'
import bcrypt from 'bcryptjs';

async function main() {
  const user = await prisma.user.create({
    data: {
      username: 'Alice',          
      password: await bcrypt.hash('password', 10),  
      documents: {
        create: {
          name: 'Root Folder',
          type: 'FOLDER',       
          size: 1024,         
          mimeType: 'text/plain', 
        },
      },
    },
    include: {
      documents: true,          
    },
  })

  console.log('Created user:', user)

  const allUsers = await prisma.user.findMany({
    include: {
      documents: true,
      sharedFolders: true, 
    },
  })

  console.log('All users:', JSON.stringify(allUsers, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

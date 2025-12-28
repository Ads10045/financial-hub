import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    const usersFilePath = path.join(process.cwd(), 'src', 'data', 'users.json')
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'))

    console.log('Seeding users...')

    for (const user of usersData) {
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
        })

        if (!existingUser) {
            // Only valid dates
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null

            await prisma.user.create({
                data: {
                    id: user.id,
                    password: user.password,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    status: user.status,
                    lastLogin: lastLogin,
                }
            })
            console.log(`Created user: ${user.firstName} ${user.lastName}`)
        } else {
            console.log(`User already exists: ${user.email}`)
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

const xs: Prisma.QNodeCreateInput[] = [
  {
    name: { create: { val: "A" } },
    size: { create: { val: 2 } },
  },
  {
    name: { create: { val: "B" } },
    size: { create: { val: 2 } },
  },
  {
    name: { create: { val: "C" } },
    size: { create: { val: 2 } },
  },
]

async function main() {
  console.log(`Start seeding ...`)
  for (const x of xs) {
    const n = await prisma.qNode.create({ data: x })
    console.log(`Created node with id: ${n.id}`)
  }
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

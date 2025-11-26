import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Badem2005acd@db.lvciqbweooripjmltxwh.supabase.co:5432/postgres'
    }
  }
});

const adminId = '7574c020-a576-43d5-8215-d222ac5c79b4';

const admin = await prisma.admin.findUnique({
  where: { id: adminId },
  include: { branches: true }
});

console.log('Admin:', JSON.stringify(admin, null, 2));

await prisma.$disconnect();

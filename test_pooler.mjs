// Test different pooler formats
const formats = [
  {
    name: "Format 1: postgres.PROJECT_REF (nokta ile)",
    url: "postgresql://postgres.lvciqbweooripjmltxwh:Badem2005acd@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  },
  {
    name: "Format 2: Direct postgres",  
    url: "postgresql://postgres:Badem2005acd@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  }
];

for (const format of formats) {
  console.log(`\n🔍 Testing: ${format.name}`);
  console.log(`URL: ${format.url}\n`);
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url: format.url } }
    });
    
    const result = await prisma.$queryRaw`SELECT current_database(), current_user;`;
    console.log(`✅ SUCCESS:`, result);
    await prisma.$disconnect();
  } catch (error) {
    console.log(`❌ FAILED:`, error.message);
  }
}

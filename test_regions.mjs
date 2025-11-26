const regions = [
  "aws-0-ap-southeast-1.pooler.supabase.com", // Singapore
  "aws-1-ap-southeast-2.pooler.supabase.com"  // Sydney (Vercel log'larda bu vardı)
];

for (const region of regions) {
  console.log(`\n🌏 Testing region: ${region}`);
  const url = `postgresql://postgres.lvciqbweooripjmltxwh:Badem2005acd@${region}:6543/postgres?pgbouncer=true&connect_timeout=5`;
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: { db: { url } }
    });
    
    const result = await prisma.$queryRaw`SELECT 1 as test;`;
    console.log(`✅ SUCCESS on ${region}:`, result);
    await prisma.$disconnect();
    break; // İlk çalışan region'u kullan
  } catch (error) {
    console.log(`❌ FAILED on ${region}:`, error.message.split('\n')[0]);
  }
}

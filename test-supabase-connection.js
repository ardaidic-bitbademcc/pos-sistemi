// Test Supabase bağlantısı
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔌 Supabase bağlantısı test ediliyor...\n');
    
    // Database bağlantısını test et
    await prisma.$connect();
    console.log('✅ Supabase bağlantısı başarılı!\n');
    
    // Mevcut tabloları listele
    console.log('📋 Mevcut tablolar kontrol ediliyor...\n');
    
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    console.log(`✅ Toplam ${tables.length} tablo bulundu:\n`);
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}`);
    });
    
    console.log('\n---\n');
    
    // Örnek tablo kontrolü
    const adminCount = await prisma.admin.count().catch(() => null);
    const branchCount = await prisma.branch.count().catch(() => null);
    const employeeCount = await prisma.employee.count().catch(() => null);
    
    console.log('📊 Tablo kayıt sayıları:');
    if (adminCount !== null) console.log(`   Admin: ${adminCount}`);
    if (branchCount !== null) console.log(`   Branch: ${branchCount}`);
    if (employeeCount !== null) console.log(`   Employee: ${employeeCount}`);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('\n🔍 Detaylı hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

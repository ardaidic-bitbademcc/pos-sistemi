import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlıyor...\n');

  try {
    // 1. Admins
    console.log('📋 Admins yükleniyor...');
    const adminsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/admins.json'), 'utf-8')
    );
    
    for (const admin of adminsData) {
      await prisma.admin.upsert({
        where: { id: admin.id },
        update: admin,
        create: admin,
      });
    }
    console.log(`✅ ${adminsData.length} admin eklendi\n`);

    // 2. Branches
    console.log('📋 Branches yükleniyor...');
    const branchesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/branches.json'), 'utf-8')
    );
    
    for (const branch of branchesData) {
      await prisma.branch.upsert({
        where: { id: branch.id },
        update: branch,
        create: branch,
      });
    }
    console.log(`✅ ${branchesData.length} şube eklendi\n`);

    // 3. Employees
    console.log('📋 Employees yükleniyor...');
    const employeesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/employees.json'), 'utf-8')
    );
    
    for (const employee of employeesData) {
      await prisma.employee.upsert({
        where: { id: employee.id },
        update: employee,
        create: employee,
      });
    }
    console.log(`✅ ${employeesData.length} personel eklendi\n`);

    console.log('🎉 Seed işlemi başarıyla tamamlandı!');
  } catch (error) {
    console.error('❌ Seed işlemi sırasında hata:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

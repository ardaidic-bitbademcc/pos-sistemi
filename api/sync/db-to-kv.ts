import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: 'adminId required' });
    }

    // Fetch all data from database for this admin
    const [branches, categories, products, employees, sales] = await Promise.all([
      prisma.branch.findMany({ where: { adminId } }),
      prisma.category.findMany({ where: { adminId } }),
      prisma.product.findMany({ where: { adminId } }),
      prisma.employee.findMany({ where: { adminId } }),
      prisma.sale.findMany({ 
        where: { adminId },
        include: { items: true },
      }),
    ]);

    // Sync to KV storage
    const kvWrites = [];

    if (branches.length > 0) {
      kvWrites.push(
        fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/kv/${adminId}_branches`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: branches.map(b => ({
            id: b.id,
            name: b.name,
            code: b.code,
            address: b.address,
            phone: b.phone,
            isActive: b.isActive,
            adminId: b.adminId,
          })) }),
        })
      );
    }

    if (categories.length > 0) {
      kvWrites.push(
        fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/kv/${adminId}_categories`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: categories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            showInPOS: c.showInPOS,
            sortOrder: c.sortOrder,
            adminId: c.adminId,
            branchId: c.branchId,
          })) }),
        })
      );
    }

    if (products.length > 0) {
      kvWrites.push(
        fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/kv/${adminId}_products`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: products.map(p => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            categoryId: p.categoryId,
            price: p.basePrice,
            basePrice: p.basePrice,
            cost: p.costPrice,
            costPrice: p.costPrice,
            stock: p.stock,
            unit: p.unit,
            taxRate: p.taxRate,
            isActive: p.isActive,
            minStock: p.minStockLevel,
            minStockLevel: p.minStockLevel,
            adminId: p.adminId,
            branchId: p.branchId,
          })) }),
        })
      );
    }

    if (employees.length > 0) {
      kvWrites.push(
        fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/kv/${adminId}_employees`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: employees.map(e => ({
            id: e.id,
            fullName: e.fullName,
            email: e.email,
            phone: e.phone,
            role: e.role,
            branchId: e.branchId,
            isActive: e.isActive,
            hourlyRate: e.hourlyRate,
            salary: e.hourlyRate,
            employeePin: e.employeePin,
            qrCode: e.qrCode,
            adminId: e.adminId,
          })) }),
        })
      );
    }

    await Promise.all(kvWrites);

    return res.status(200).json({
      success: true,
      synced: {
        branches: branches.length,
        categories: categories.length,
        products: products.length,
        employees: employees.length,
        sales: sales.length,
      },
    });
  } catch (error) {
    console.error('DB to KV sync error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

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
    const { adminId, items } = req.body;

    if (!adminId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'adminId and items array required' });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: 0,
    };

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.id || !item.name) {
          console.warn('Skipping product - missing required fields:', item);
          results.errors++;
          continue;
        }

        // If categoryId is missing or invalid, try to find or create a default category
        let categoryId = item.categoryId;
        if (!categoryId) {
          // Try to find "Genel" category for this admin
          const defaultCategory = await prisma.category.findFirst({
            where: {
              adminId: adminId,
              name: 'Genel',
            },
          });

          if (defaultCategory) {
            categoryId = defaultCategory.id;
          } else {
            // Create default category
            const newCategory = await prisma.category.create({
              data: {
                name: 'Genel',
                description: 'Genel ürünler',
                adminId: adminId,
                branchId: item.branchId || '',
                showInPOS: true,
                sortOrder: 0,
              },
            });
            categoryId = newCategory.id;
          }
        }

        // Check if product exists
        const existing = await prisma.product.findUnique({
          where: { id: item.id },
        });

        if (existing) {
          // Update existing product
          await prisma.product.update({
            where: { id: item.id },
            data: {
              sku: item.sku || item.id,
              name: item.name,
              category: item.category || 'Genel',
              basePrice: item.price || item.basePrice || 0,
              costPrice: item.cost || item.costPrice || 0,
              stock: item.stock || 0,
              unit: item.unit || 'adet',
              taxRate: item.taxRate || 20,
              isActive: item.isActive !== false,
              categoryId: categoryId,
              minStockLevel: item.minStock || item.minStockLevel || 0,
            },
          });
          results.updated++;
        } else {
          // Create new product
          await prisma.product.create({
            data: {
              id: item.id,
              sku: item.sku || item.id,
              name: item.name,
              category: item.category || 'Genel',
              basePrice: item.price || item.basePrice || 0,
              costPrice: item.cost || item.costPrice || 0,
              stock: item.stock || 0,
              unit: item.unit || 'adet',
              taxRate: item.taxRate || 20,
              isActive: item.isActive !== false,
              adminId: adminId,
              branchId: item.branchId,
              categoryId: categoryId,
              minStockLevel: item.minStock || item.minStockLevel || 0,
            },
          });
          results.created++;
        }
      } catch (itemError) {
        console.error('Product sync error for item:', item.id, itemError);
        console.error('Item data:', JSON.stringify(item, null, 2));
        results.errors++;
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Products sync API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

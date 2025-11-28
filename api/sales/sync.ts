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
      skipped: 0,
      errors: 0,
    };

    for (const item of items) {
      try {
        // Check if sale exists
        const existing = await prisma.sale.findUnique({
          where: { id: item.id },
        });

        if (existing) {
          // Skip already synced sales
          results.skipped++;
          continue;
        }

        // Create new sale with items
        await prisma.sale.create({
          data: {
            id: item.id,
            saleNumber: item.saleNumber,
            totalAmount: item.totalAmount,
            taxAmount: item.taxAmount,
            paymentMethod: item.paymentMethod || 'cash',
            cashAmount: item.cashAmount || 0,
            cardAmount: item.cardAmount || 0,
            customerId: item.customerId || item.customerAccountId,
            customerName: item.customerName,
            adminId: adminId,
            branchId: item.branchId,
            createdAt: item.saleDate ? new Date(item.saleDate) : new Date(),
            items: {
              create: (item.items || []).map((saleItem: any) => ({
                id: saleItem.id,
                menuItemId: saleItem.productId,
                name: saleItem.productName || saleItem.name,
                quantity: saleItem.quantity,
                price: saleItem.unitPrice || saleItem.price,
                total: saleItem.totalPrice || saleItem.total,
                taxRate: saleItem.taxRate,
                taxAmount: saleItem.taxAmount,
                options: saleItem.options ? JSON.stringify(saleItem.options) : null,
              })),
            },
          },
        });
        results.created++;
      } catch (itemError) {
        console.error('Sale sync error for item:', item.id, itemError);
        results.errors++;
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Sales sync API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

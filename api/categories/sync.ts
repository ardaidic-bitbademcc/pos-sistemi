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
        // Check if category exists
        const existing = await prisma.category.findUnique({
          where: { id: item.id },
        });

        if (existing) {
          // Update existing category
          await prisma.category.update({
            where: { id: item.id },
            data: {
              name: item.name,
              description: item.description,
              showInPOS: item.showInPOS !== false,
              sortOrder: item.sortOrder || 0,
            },
          });
          results.updated++;
        } else {
          // Create new category
          await prisma.category.create({
            data: {
              id: item.id,
              name: item.name,
              description: item.description,
              showInPOS: item.showInPOS !== false,
              sortOrder: item.sortOrder || 0,
              adminId: adminId,
              branchId: item.branchId,
            },
          });
          results.created++;
        }
      } catch (itemError) {
        console.error('Category sync error for item:', item.id, itemError);
        results.errors++;
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Categories sync API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

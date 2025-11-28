import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { adminId, branchId } = req.query;
        
        const where: any = {};
        if (adminId) where.adminId = adminId as string;
        if (branchId) where.branchId = branchId as string;

        const sales = await prisma.sale.findMany({
          where,
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json(sales);
      }

      case 'POST': {
        const { items, ...saleData } = req.body;
        
        const sale = await prisma.sale.create({
          data: {
            ...saleData,
            items: {
              create: items,
            },
          },
          include: {
            items: true,
          },
        });

        return res.status(201).json(sale);
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sales API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

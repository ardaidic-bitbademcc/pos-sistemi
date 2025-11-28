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

        const products = await prisma.product.findMany({
          where,
          orderBy: { name: 'asc' },
        });

        return res.status(200).json(products);
      }

      case 'POST': {
        const product = await prisma.product.create({
          data: req.body,
        });

        return res.status(201).json(product);
      }

      case 'PUT': {
        const { id, ...data } = req.body;
        
        const product = await prisma.product.update({
          where: { id },
          data,
        });

        return res.status(200).json(product);
      }

      case 'DELETE': {
        const { id } = req.query;
        
        await prisma.product.delete({
          where: { id: id as string },
        });

        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

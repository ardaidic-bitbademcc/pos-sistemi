import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

// Singleton Prisma client for KV endpoint
const globalForPrisma = global as unknown as { kvPrisma: PrismaClient };
const prisma = globalForPrisma.kvPrisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : []
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.kvPrisma = prisma;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key } = req.query;

  console.log('[KV API] Request:', req.method, key);
  console.log('[KV API] DATABASE_URL exists:', !!process.env.DATABASE_URL);

  if (typeof key !== 'string') {
    return res.status(400).json({ error: 'Invalid key' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get value from database
      console.log('[KV API] Fetching key:', key);
      const record = await prisma.kvStorage.findUnique({
        where: { key },
      });

      console.log('[KV API] Record found:', !!record);

      if (!record) {
        return res.status(404).json({ error: 'Key not found' });
      }

      return res.status(200).json({ value: record.value });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      // Set value in database
      const { value } = req.body;

      const record = await prisma.kvStorage.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

      return res.status(200).json({ success: true, value: record.value });
    }

    if (req.method === 'DELETE') {
      // Delete value from database
      await prisma.kvStorage.delete({
        where: { key },
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[KV API] Error:', error);
    console.error('[KV API] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

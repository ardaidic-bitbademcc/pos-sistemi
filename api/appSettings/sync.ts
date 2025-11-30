import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminId, items } = req.body;

    if (!adminId || !items) {
      return res.status(400).json({ error: 'adminId and items object required' });
    }

    console.log(`[SYNC] Syncing appSettings for admin:`, adminId);

    try {
      // AppSettings is stored as JSONB in the database
      // Check if exists
      const existing = await prisma.appSettings.findUnique({
        where: { adminId: adminId },
      });

      const settingsData = {
        adminId: adminId,
        settings: items, // Store entire settings object as JSONB
        updatedAt: new Date(),
      };

      if (existing) {
        await prisma.appSettings.update({
          where: { adminId: adminId },
          data: settingsData,
        });
        console.log('[SYNC] AppSettings updated for admin:', adminId);
      } else {
        await prisma.appSettings.create({
          data: {
            ...settingsData,
            createdAt: new Date(),
          },
        });
        console.log('[SYNC] AppSettings created for admin:', adminId);
      }

      return res.status(200).json({
        success: true,
        updated: existing ? 1 : 0,
        created: existing ? 0 : 1,
        errors: 0,
      });
    } catch (error) {
      console.error('[SYNC] Error syncing appSettings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (error) {
    console.error('[SYNC] AppSettings sync failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

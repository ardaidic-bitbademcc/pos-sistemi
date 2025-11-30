import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminId, items } = req.body;

    if (!adminId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'adminId and items array required' });
    }

    console.log(`[SYNC] Syncing ${items.length} table sections for admin:`, adminId);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.id || !item.name) {
          console.warn('[SYNC] Skipping table section - missing required fields:', item);
          errors++;
          continue;
        }

        // Check if exists
        const existing = await prisma.tableSection.findUnique({
          where: { id: item.id },
        });

        const sectionData = {
          name: item.name,
          branchId: item.branchId || 'branch-1',
          adminId: adminId,
          description: item.description || null,
          color: item.color || '#4F46E5',
          isActive: item.isActive !== undefined ? item.isActive : true,
          sortOrder: item.sortOrder || 0,
          updatedAt: new Date(),
        };

        if (existing) {
          await prisma.tableSection.update({
            where: { id: item.id },
            data: sectionData,
          });
          updated++;
        } else {
          await prisma.tableSection.create({
            data: {
              id: item.id,
              ...sectionData,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            },
          });
          created++;
        }
      } catch (error) {
        console.error('[SYNC] Error syncing table section:', item.id, error);
        errors++;
      }
    }

    console.log(`[SYNC] Table sections sync complete - created: ${created}, updated: ${updated}, errors: ${errors}`);

    return res.status(200).json({
      success: true,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error('[SYNC] Table sections sync failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

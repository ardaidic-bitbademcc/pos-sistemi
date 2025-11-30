import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminId, items } = req.body;

    if (!adminId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'adminId and items array required' });
    }

    console.log(`[SYNC] Syncing ${items.length} menu items for admin:`, adminId);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.id || !item.name || !item.categoryId) {
          console.warn('[SYNC] Skipping menu item - missing required fields:', item);
          errors++;
          continue;
        }

        // Check if exists
        const existing = await prisma.menuItem.findUnique({
          where: { id: item.id },
        });

        const menuItemData = {
          name: item.name,
          description: item.description || null,
          categoryId: item.categoryId,
          basePrice: item.basePrice || 0,
          taxRate: item.taxRate || 18, // Default KDV %18
          isActive: item.isAvailable !== undefined ? item.isAvailable : true,
          imageUrl: item.image || item.imageUrl || null,
          updatedAt: new Date(),
        };

        if (existing) {
          await prisma.menuItem.update({
            where: { id: item.id },
            data: menuItemData,
          });
          updated++;
        } else {
          await prisma.menuItem.create({
            data: {
              id: item.id,
              branchId: item.branchId || 'branch-1',
              adminId: adminId,
              ...menuItemData,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            },
          });
          created++;
        }
      } catch (error) {
        console.error('[SYNC] Error syncing menu item:', item.id, error);
        errors++;
      }
    }

    console.log(`[SYNC] Menu items sync complete - created: ${created}, updated: ${updated}, errors: ${errors}`);

    return res.status(200).json({
      success: true,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error('[SYNC] Menu items sync failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

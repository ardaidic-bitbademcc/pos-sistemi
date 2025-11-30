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

    console.log(`[SYNC] Syncing ${items.length} menu items for admin:`, adminId);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.id || !item.name) {
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
          branchId: item.branchId || 'branch-1',
          adminId: adminId,
          categoryId: item.categoryId || null,
          categoryName: item.categoryName || null,
          basePrice: item.basePrice || 0,
          currentPrice: item.currentPrice || item.basePrice || 0,
          description: item.description || null,
          image: item.image || null,
          isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
          preparationTime: item.preparationTime || null,
          calories: item.calories || null,
          allergens: item.allergens || null,
          isVegetarian: item.isVegetarian || false,
          isVegan: item.isVegan || false,
          isGlutenFree: item.isGlutenFree || false,
          spicyLevel: item.spicyLevel || null,
          stockTracking: item.stockTracking || false,
          currentStock: item.currentStock || null,
          lowStockThreshold: item.lowStockThreshold || null,
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

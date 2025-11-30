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

    console.log(`[SYNC] Syncing ${items.length} tables for admin:`, adminId);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.id || !item.tableNumber) {
          console.warn('[SYNC] Skipping table - missing required fields:', item);
          errors++;
          continue;
        }

        // Check if exists
        const existing = await prisma.table.findUnique({
          where: { id: item.id },
        });

        const tableData = {
          tableNumber: item.tableNumber,
          branchId: item.branchId || 'branch-1',
          adminId: adminId,
          capacity: item.capacity || 4,
          status: item.status || 'available',
          currentSaleId: item.currentSaleId || null,
          currentOrderId: item.currentOrderId || null,
          guestCount: item.guestCount || null,
          sectionId: item.sectionId || null,
          section: item.section || null,
          waiterName: item.waiterName || null,
          isActive: item.isActive !== undefined ? item.isActive : true,
          sortOrder: item.sortOrder || 0,
          positionX: item.positionX || null,
          positionY: item.positionY || null,
          width: item.width || null,
          height: item.height || null,
          shape: item.shape || null,
          rotation: item.rotation || null,
          updatedAt: new Date(),
        };

        if (existing) {
          await prisma.table.update({
            where: { id: item.id },
            data: tableData,
          });
          updated++;
        } else {
          await prisma.table.create({
            data: {
              id: item.id,
              ...tableData,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            },
          });
          created++;
        }
      } catch (error) {
        console.error('[SYNC] Error syncing table:', item.id, error);
        errors++;
      }
    }

    console.log(`[SYNC] Tables sync complete - created: ${created}, updated: ${updated}, errors: ${errors}`);

    return res.status(200).json({
      success: true,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error('[SYNC] Tables sync failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

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

    console.log(`[SYNC] Syncing cashRegister for admin:`, adminId);

    try {
      // CashRegister is a single object for each branch
      const cashRegisterData = {
        id: items.id,
        branchId: items.branchId || 'branch-1',
        adminId: adminId,
        date: items.date || new Date().toISOString().split('T')[0],
        openingBalance: items.openingBalance || 0,
        currentBalance: items.currentBalance || 0,
        totalCashSales: items.totalCashSales || 0,
        totalCardSales: items.totalCardSales || 0,
        totalMobileSales: items.totalMobileSales || 0,
        totalTransferSales: items.totalTransferSales || 0,
        totalMultinetSales: items.totalMultinetSales || 0,
        totalSales: items.totalSales || 0,
        isOpen: items.isOpen || false,
        openedBy: items.openedBy || null,
        openedAt: items.openedAt ? new Date(items.openedAt) : null,
        closedBy: items.closedBy || null,
        closedAt: items.closedAt ? new Date(items.closedAt) : null,
        lastUpdated: new Date(),
      };

      // Check if exists
      const existing = await prisma.cashRegister.findUnique({
        where: { id: items.id },
      });

      if (existing) {
        await prisma.cashRegister.update({
          where: { id: items.id },
          data: cashRegisterData,
        });
        console.log('[SYNC] CashRegister updated:', items.id);
      } else {
        await prisma.cashRegister.create({
          data: {
            ...cashRegisterData,
            createdAt: items.createdAt ? new Date(items.createdAt) : new Date(),
          },
        });
        console.log('[SYNC] CashRegister created:', items.id);
      }

      return res.status(200).json({
        success: true,
        updated: existing ? 1 : 0,
        created: existing ? 0 : 1,
        errors: 0,
      });
    } catch (error) {
      console.error('[SYNC] Error syncing cashRegister:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (error) {
    console.error('[SYNC] CashRegister sync failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

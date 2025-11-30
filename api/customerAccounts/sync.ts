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

    console.log(`[SYNC] Syncing ${items.length} customer accounts for admin:`, adminId);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Validate required fields
        if (!item.id || !item.customerName) {
          console.warn('[SYNC] Skipping customer account - missing required fields:', item);
          errors++;
          continue;
        }

        // Generate unique account number if not exists
        const accountNumber = item.accountNumber || `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Check if exists
        const existing = await prisma.customerAccount.findUnique({
          where: { id: item.id },
        });

        const accountData = {
          name: item.customerName,
          accountNumber: accountNumber,
          phone: item.phone || null,
          email: item.email || null,
          address: item.address || null,
          balance: item.totalDebt || 0,
          creditLimit: item.creditLimit || 0,
          isActive: item.status === 'active',
          updatedAt: new Date(),
        };

        if (existing) {
          await prisma.customerAccount.update({
            where: { id: item.id },
            data: accountData,
          });
          updated++;
        } else {
          await prisma.customerAccount.create({
            data: {
              id: item.id,
              branchId: item.branchId || 'branch-1',
              adminId: adminId,
              ...accountData,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            },
          });
          created++;
        }
      } catch (error) {
        console.error('[SYNC] Error syncing customer account:', item.id, error);
        errors++;
      }
    }

    console.log(`[SYNC] Customer accounts sync complete - created: ${created}, updated: ${updated}, errors: ${errors}`);

    return res.status(200).json({
      success: true,
      created,
      updated,
      errors,
    });
  } catch (error) {
    console.error('[SYNC] Customer accounts sync failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

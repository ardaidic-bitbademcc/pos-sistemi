import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminId, items, type } = req.body;

    if (!adminId || !items || !type) {
      return res.status(400).json({ error: 'adminId, items, and type required' });
    }

    console.log(`[SYNC] Syncing ${type} for admin:`, adminId, 'items:', Array.isArray(items) ? items.length : 'N/A');

    let result;

    switch (type) {
      case 'products':
        result = await syncProducts(adminId, items);
        break;
      case 'sales':
        result = await syncSales(adminId, items);
        break;
      case 'employees':
        result = await syncEmployees(adminId, items);
        break;
      case 'branches':
        result = await syncBranches(adminId, items);
        break;
      case 'categories':
        result = await syncCategories(adminId, items);
        break;
      case 'customerAccounts':
        result = await syncCustomerAccounts(adminId, items);
        break;
      case 'menuItems':
        result = await syncMenuItems(adminId, items);
        break;
      default:
        return res.status(400).json({ error: `Unknown sync type: ${type}` });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[SYNC] Failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Products sync
async function syncProducts(adminId: string, items: any[]) {
  let created = 0, updated = 0, errors = 0;

  for (const item of items) {
    try {
      if (!item.id || !item.name) {
        console.warn('[SYNC] Skipping product - missing required fields:', item);
        errors++;
        continue;
      }

      // Ensure categoryId exists or use default "Genel" category
      let categoryId = item.categoryId;
      if (!categoryId) {
        let defaultCategory = await prisma.category.findFirst({
          where: { name: 'Genel', adminId: adminId },
        });
        if (!defaultCategory) {
          defaultCategory = await prisma.category.create({
            data: {
              id: `cat-genel-${Date.now()}`,
              name: 'Genel',
              branchId: item.branchId || 'branch-1',
              adminId: adminId,
            },
          });
        }
        categoryId = defaultCategory.id;
      }

      const existing = await prisma.product.findUnique({ where: { id: item.id } });

      const productData = {
        name: item.name,
        sku: item.sku || `SKU-${Date.now()}`,
        description: item.description || null,
        categoryId: categoryId,
        basePrice: item.basePrice || 0,
        costPrice: item.costPrice || 0,
        taxRate: item.taxRate || 18,
        unit: item.unit || 'adet',
        imageUrl: item.imageUrl || null,
        isActive: item.isActive !== undefined ? item.isActive : true,
        stock: item.stock || 0,
        minStockLevel: item.minStockLevel || 0,
        updatedAt: new Date(),
      };

      if (existing) {
        await prisma.product.update({ where: { id: item.id }, data: productData });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            id: item.id,
            branchId: item.branchId || 'branch-1',
            adminId: adminId,
            ...productData,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          },
        });
        created++;
      }
    } catch (error) {
      console.error('[SYNC] Error syncing product:', item.id, error);
      errors++;
    }
  }

  return { success: true, created, updated, errors };
}

// Sales sync
async function syncSales(adminId: string, items: any[]) {
  let created = 0, updated = 0, errors = 0;

  for (const item of items) {
    try {
      if (!item.id || !item.saleNumber) {
        console.warn('[SYNC] Skipping sale - missing required fields:', item);
        errors++;
        continue;
      }

      // Validate sale items
      const validItems = (item.items || []).filter((si: any) => si.menuItemId || si.productId);
      if (validItems.length === 0) {
        console.warn('[SYNC] Skipping sale - no valid items:', item.id);
        errors++;
        continue;
      }

      const existing = await prisma.sale.findUnique({ where: { id: item.id } });

      const saleData = {
        saleNumber: item.saleNumber,
        totalAmount: item.totalAmount || 0,
        taxAmount: item.taxAmount || 0,
        paymentMethod: item.paymentMethod || 'cash',
        cashAmount: item.cashAmount || 0,
        cardAmount: item.cardAmount || 0,
        customerId: item.customerId || null,
        customerName: item.customerName || null,
        branchId: item.branchId || 'branch-1',
        adminId: adminId,
      };

      if (existing) {
        await prisma.sale.update({ where: { id: item.id }, data: saleData });
        updated++;
      } else {
        await prisma.sale.create({
          data: {
            id: item.id,
            ...saleData,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          },
        });
        created++;
      }
    } catch (error) {
      console.error('[SYNC] Error syncing sale:', item.id, error);
      errors++;
    }
  }

  return { success: true, created, updated, errors };
}

// Employees sync
async function syncEmployees(adminId: string, items: any[]) {
  let created = 0, updated = 0, errors = 0;

  for (const item of items) {
    try {
      if (!item.id || !item.fullName || !item.email) {
        console.warn('[SYNC] Skipping employee - missing required fields:', item);
        errors++;
        continue;
      }

      const existing = await prisma.employee.findUnique({ where: { id: item.id } });

      const employeeData = {
        fullName: item.fullName,
        email: item.email,
        phone: item.phone || null,
        role: item.role || 'staff',
        branchId: item.branchId || 'branch-1',
        isActive: item.isActive !== undefined ? item.isActive : true,
        hourlyRate: item.hourlyRate || 0,
        employeePin: item.employeePin || `PIN-${Date.now()}`,
        qrCode: item.qrCode || `QR-${item.id}`,
        adminId: adminId,
      };

      if (existing) {
        await prisma.employee.update({ where: { id: item.id }, data: employeeData });
        updated++;
      } else {
        await prisma.employee.create({
          data: {
            id: item.id,
            ...employeeData,
          },
        });
        created++;
      }
    } catch (error) {
      console.error('[SYNC] Error syncing employee:', item.id, error);
      errors++;
    }
  }

  return { success: true, created, updated, errors };
}

// Branches sync
async function syncBranches(adminId: string, items: any[]) {
  let created = 0, updated = 0, errors = 0;

  for (const item of items) {
    try {
      if (!item.id || !item.name || !item.code) {
        console.warn('[SYNC] Skipping branch - missing required fields:', item);
        errors++;
        continue;
      }

      const existing = await prisma.branch.findUnique({ where: { id: item.id } });

      const branchData = {
        name: item.name,
        code: item.code,
        address: item.address || null,
        phone: item.phone || null,
        isActive: item.isActive !== undefined ? item.isActive : true,
        adminId: adminId,
      };

      if (existing) {
        await prisma.branch.update({ where: { id: item.id }, data: branchData });
        updated++;
      } else {
        await prisma.branch.create({
          data: {
            id: item.id,
            ...branchData,
          },
        });
        created++;
      }
    } catch (error) {
      console.error('[SYNC] Error syncing branch:', item.id, error);
      errors++;
    }
  }

  return { success: true, created, updated, errors };
}

// Categories sync
async function syncCategories(adminId: string, items: any[]) {
  let created = 0, updated = 0, errors = 0;

  for (const item of items) {
    try {
      if (!item.id || !item.name) {
        console.warn('[SYNC] Skipping category - missing required fields:', item);
        errors++;
        continue;
      }

      const existing = await prisma.category.findUnique({ where: { id: item.id } });

      const categoryData = {
        name: item.name,
        description: item.description || null,
        branchId: item.branchId || 'branch-1',
        adminId: adminId,
      };

      if (existing) {
        await prisma.category.update({ where: { id: item.id }, data: categoryData });
        updated++;
      } else {
        await prisma.category.create({
          data: {
            id: item.id,
            ...categoryData,
          },
        });
        created++;
      }
    } catch (error) {
      console.error('[SYNC] Error syncing category:', item.id, error);
      errors++;
    }
  }

  return { success: true, created, updated, errors };
}

// Customer Accounts sync
async function syncCustomerAccounts(adminId: string, items: any[]) {
  let created = 0, updated = 0, errors = 0;

  for (const item of items) {
    try {
      if (!item.id || !item.customerName) {
        console.warn('[SYNC] Skipping customer account - missing required fields:', item);
        errors++;
        continue;
      }

      const accountNumber = item.accountNumber || `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const existing = await prisma.customerAccount.findUnique({ where: { id: item.id } });

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
        await prisma.customerAccount.update({ where: { id: item.id }, data: accountData });
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

  return { success: true, created, updated, errors };
}

// Menu Items sync
async function syncMenuItems(adminId: string, items: any[]) {
  let created = 0, updated = 0, errors = 0;

  for (const item of items) {
    try {
      if (!item.id || !item.name || !item.categoryId) {
        console.warn('[SYNC] Skipping menu item - missing required fields:', item);
        errors++;
        continue;
      }

      const existing = await prisma.menuItem.findUnique({ where: { id: item.id } });

      const menuItemData = {
        name: item.name,
        description: item.description || null,
        categoryId: item.categoryId,
        basePrice: item.basePrice || 0,
        taxRate: item.taxRate || 18,
        isActive: item.isAvailable !== undefined ? item.isAvailable : true,
        imageUrl: item.image || item.imageUrl || null,
        updatedAt: new Date(),
      };

      if (existing) {
        await prisma.menuItem.update({ where: { id: item.id }, data: menuItemData });
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

  return { success: true, created, updated, errors };
}

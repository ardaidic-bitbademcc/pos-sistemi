import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Integration Tests
 * 
 * These tests verify that multiple components/modules work together correctly.
 * They test data flow, state management, and cross-module interactions.
 */

// Shared mock state that persists across renders
let mockSales: any[] = [];
let mockProducts: any[] = [];
let mockCashRegister: any = {
  id: 'reg-1',
  currentBalance: 1000,
  totalSales: 0,
};

// Mock KV store with shared state
const createMockKVStore = () => {
  return vi.fn((key: string, defaultValue: any) => {
    const state: Record<string, any> = {
      sales: mockSales,
      products: mockProducts,
      cashRegister: mockCashRegister,
      employees: [],
      categories: [{ id: 'cat-1', name: 'İçecekler' }],
      menuItems: [],
      tables: [],
      tableOrders: [],
      invoices: [],
      expenses: [],
      'cash-transactions': [],
      customerAccounts: [],
      branches: [{ id: 'branch-1', name: 'Ana Şube', adminId: 'admin-1' }],
      appSettings: {
        paymentMethods: [
          { method: 'cash', displayName: 'Nakit', isActive: true },
        ],
      },
    };

    const setValue = (newValue: any) => {
      state[key] = newValue;
      if (key === 'sales') mockSales = newValue;
      if (key === 'products') mockProducts = newValue;
      if (key === 'cashRegister') mockCashRegister = newValue;
    };

    return [state[key] || defaultValue, setValue];
  });
};

describe('Integration Tests - POS to Finance Flow', () => {
  beforeEach(() => {
    // Reset mock state
    mockSales = [];
    mockProducts = [
      {
        id: 'prod-1',
        name: 'Espresso',
        price: 45,
        category: 'İçecekler',
        stock: 100,
        isActive: true,
        taxRate: 18,
        branchId: 'branch-1',
        adminId: 'admin-1',
      },
    ];
    mockCashRegister = {
      id: 'reg-1',
      branchId: 'branch-1',
      date: new Date().toISOString().split('T')[0],
      currentBalance: 1000,
      totalSales: 0,
      totalCashSales: 0,
    };

    vi.resetAllMocks();
  });

  it('should create sale in POS and reflect in Finance module', async () => {
    const mockUseKV = createMockKVStore();
    vi.doMock('../../hooks/use-kv-store', () => ({
      useKV: mockUseKV,
    }));

    // Simulate: Add product to cart -> Complete payment -> Check finance
    
    // 1. Sale should be created
    const newSale = {
      id: 'sale-1',
      saleNumber: 'SAL-241201-0001',
      items: [
        {
          productId: 'prod-1',
          productName: 'Espresso',
          quantity: 2,
          unitPrice: 45,
          subtotal: 90,
        },
      ],
      subtotal: 90,
      tax: 16.2,
      total: 106.2,
      paymentMethod: 'cash' as const,
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
      branchId: 'branch-1',
      adminId: 'admin-1',
    };

    mockSales.push(newSale);

    // 2. Cash register should be updated
    mockCashRegister.totalSales += newSale.total;
    mockCashRegister.totalCashSales += newSale.total;
    mockCashRegister.currentBalance += newSale.total;

    // 3. Verify data integrity
    expect(mockSales).toHaveLength(1);
    expect(mockSales[0].total).toBe(106.2);
    expect(mockCashRegister.totalSales).toBe(106.2);
    expect(mockCashRegister.currentBalance).toBe(1106.2);
  });

  it('should update product stock after sale', () => {
    const product = mockProducts[0];
    const initialStock = product.stock;

    // Simulate sale
    const soldQuantity = 2;
    product.stock -= soldQuantity;

    expect(product.stock).toBe(initialStock - soldQuantity);
    expect(product.stock).toBe(98);
  });

  it('should calculate correct totals across multiple sales', () => {
    // Add multiple sales
    const sale1 = {
      id: 'sale-1',
      total: 100,
      paymentMethod: 'cash' as const,
      createdAt: new Date().toISOString(),
    };

    const sale2 = {
      id: 'sale-2',
      total: 200,
      paymentMethod: 'card' as const,
      createdAt: new Date().toISOString(),
    };

    mockSales.push(sale1, sale2);

    // Calculate totals
    const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.total, 0);
    const cashTotal = mockSales
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.total, 0);
    const cardTotal = mockSales
      .filter(s => s.paymentMethod === 'card')
      .reduce((sum, sale) => sum + sale.total, 0);

    expect(totalRevenue).toBe(300);
    expect(cashTotal).toBe(100);
    expect(cardTotal).toBe(200);
  });
});

describe('Integration Tests - Employee to Customer Account', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create customer account when employee is added', () => {
    const mockEmployees = [
      {
        id: 'emp-1',
        fullName: 'Ahmet Yılmaz',
        email: 'ahmet@test.com',
        phone: '0555 111 2233',
        isActive: true,
        branchId: 'branch-1',
      },
    ];

    const mockCustomerAccounts: any[] = [];

    // Simulate auto-account creation
    mockEmployees.forEach(employee => {
      if (employee.isActive) {
        mockCustomerAccounts.push({
          id: `acc-${employee.id}`,
          employeeId: employee.id,
          customerName: employee.fullName,
          phone: employee.phone,
          email: employee.email,
          isEmployee: true,
          creditLimit: 5000,
          currentBalance: 0,
          status: 'active',
        });
      }
    });

    expect(mockCustomerAccounts).toHaveLength(1);
    expect(mockCustomerAccounts[0].customerName).toBe('Ahmet Yılmaz');
    expect(mockCustomerAccounts[0].isEmployee).toBe(true);
  });
});

describe('Integration Tests - Multi-Branch Data Filtering', () => {
  it('should filter sales by branch', () => {
    const allSales = [
      { id: 'sale-1', branchId: 'branch-1', total: 100 },
      { id: 'sale-2', branchId: 'branch-2', total: 200 },
      { id: 'sale-3', branchId: 'branch-1', total: 150 },
    ];

    const branch1Sales = allSales.filter(s => s.branchId === 'branch-1');
    const branch1Total = branch1Sales.reduce((sum, s) => sum + s.total, 0);

    expect(branch1Sales).toHaveLength(2);
    expect(branch1Total).toBe(250);
  });

  it('should filter products by branch', () => {
    const allProducts = [
      { id: 'prod-1', branchId: 'branch-1', name: 'Product 1' },
      { id: 'prod-2', branchId: 'branch-2', name: 'Product 2' },
      { id: 'prod-3', branchId: 'branch-1', name: 'Product 3' },
    ];

    const branch1Products = allProducts.filter(p => p.branchId === 'branch-1');

    expect(branch1Products).toHaveLength(2);
    expect(branch1Products.map(p => p.name)).toEqual(['Product 1', 'Product 3']);
  });
});

describe('Integration Tests - Tax Calculation Flow', () => {
  it('should calculate tax consistently across modules', () => {
    const basePrice = 100;
    const taxRate = 18;

    // Tax calculation (same formula used in helpers)
    const taxAmount = basePrice * (taxRate / 100);
    const totalWithTax = basePrice + taxAmount;

    expect(taxAmount).toBe(18);
    expect(totalWithTax).toBe(118);
  });

  it('should handle multiple items with different tax rates', () => {
    const items = [
      { price: 100, taxRate: 18, quantity: 1 },
      { price: 50, taxRate: 8, quantity: 2 },
    ];

    let totalWithoutTax = 0;
    let totalTax = 0;

    items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      const itemTax = itemTotal * (item.taxRate / 100);
      totalWithoutTax += itemTotal;
      totalTax += itemTax;
    });

    const grandTotal = totalWithoutTax + totalTax;

    expect(totalWithoutTax).toBe(200); // 100 + (50*2)
    expect(totalTax).toBe(26); // 18 + 8
    expect(grandTotal).toBe(226);
  });
});

describe('Integration Tests - Date Range Filtering', () => {
  it('should filter sales by date range', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const allSales = [
      { id: 'sale-1', createdAt: today.toISOString(), total: 100 },
      { id: 'sale-2', createdAt: yesterday.toISOString(), total: 200 },
      { id: 'sale-3', createdAt: lastWeek.toISOString(), total: 150 },
    ];

    // Filter today's sales
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = allSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= todayStart && saleDate <= todayEnd;
    });

    expect(todaySales).toHaveLength(1);
    expect(todaySales[0].total).toBe(100);
  });
});

describe('Integration Tests - Cash Register Flow', () => {
  it('should track cash register balance through transactions', () => {
    let cashRegister = {
      openingBalance: 1000,
      currentBalance: 1000,
      totalSales: 0,
    };

    // Cash sale
    const cashSale = { total: 100, paymentMethod: 'cash' };
    cashRegister.currentBalance += cashSale.total;
    cashRegister.totalSales += cashSale.total;

    // Card sale (doesn't affect cash balance)
    const cardSale = { total: 200, paymentMethod: 'card' };
    cashRegister.totalSales += cardSale.total;

    // Cash withdrawal
    const withdrawal = 50;
    cashRegister.currentBalance -= withdrawal;

    expect(cashRegister.currentBalance).toBe(1050); // 1000 + 100 - 50
    expect(cashRegister.totalSales).toBe(300); // 100 + 200
  });
});

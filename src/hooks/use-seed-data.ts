import { useEffect, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import type { Employee, Product, Table, MenuItem } from '@/lib/types';
import { generateId } from '@/lib/helpers';

export function useSeedData() {
  const [employees, setEmployees] = useKV<Employee[]>('employees', []);
  const [products, setProducts] = useKV<Product[]>('products', []);
  const [tables, setTables] = useKV<Table[]>('tables', []);
  const [menuItems, setMenuItems] = useKV<MenuItem[]>('menuItems', []);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded) return;
    
    if (!employees || employees.length === 0) {
      const sampleEmployees: Employee[] = [
        {
          id: generateId(),
          fullName: 'Ahmet Yılmaz',
          email: 'ahmet@restoran.com',
          phone: '0555 111 2233',
          role: 'cashier',
          branchId: 'branch-1',
          isActive: true,
          hourlyRate: 85,
          employeePin: '1234',
          qrCode: 'QR001',
        },
        {
          id: generateId(),
          fullName: 'Ayşe Demir',
          email: 'ayse@restoran.com',
          phone: '0555 222 3344',
          role: 'chef',
          branchId: 'branch-1',
          isActive: true,
          hourlyRate: 95,
          employeePin: '5678',
          qrCode: 'QR002',
        },
        {
          id: generateId(),
          fullName: 'Mehmet Kaya',
          email: 'mehmet@restoran.com',
          phone: '0555 333 4455',
          role: 'staff',
          branchId: 'branch-1',
          isActive: true,
          hourlyRate: 75,
          employeePin: '9012',
          qrCode: 'QR003',
        },
      ];
      setEmployees(sampleEmployees);
    }

    if (!products || products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: generateId(),
          sku: 'PRD001',
          name: 'Çay',
          categoryId: 'beverages',
          basePrice: 15,
          costPrice: 5,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 500,
          minStockLevel: 100,
        },
        {
          id: generateId(),
          sku: 'PRD002',
          name: 'Türk Kahvesi',
          categoryId: 'beverages',
          basePrice: 45,
          costPrice: 15,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 200,
          minStockLevel: 50,
        },
        {
          id: generateId(),
          sku: 'PRD003',
          name: 'Su',
          categoryId: 'beverages',
          basePrice: 10,
          costPrice: 3,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 300,
          minStockLevel: 100,
        },
        {
          id: generateId(),
          sku: 'PRD004',
          name: 'Hamburger',
          categoryId: 'food',
          basePrice: 120,
          costPrice: 45,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 150,
          minStockLevel: 30,
        },
        {
          id: generateId(),
          sku: 'PRD005',
          name: 'Pizza',
          categoryId: 'food',
          basePrice: 180,
          costPrice: 65,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 100,
          minStockLevel: 20,
        },
        {
          id: generateId(),
          sku: 'PRD006',
          name: 'Salata',
          categoryId: 'food',
          basePrice: 75,
          costPrice: 25,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 80,
          minStockLevel: 20,
        },
        {
          id: generateId(),
          sku: 'PRD007',
          name: 'Labne Peyniri',
          categoryId: 'ingredients',
          basePrice: 0,
          costPrice: 80,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 50,
          minStockLevel: 10,
        },
        {
          id: generateId(),
          sku: 'PRD008',
          name: 'Krema',
          categoryId: 'ingredients',
          basePrice: 0,
          costPrice: 45,
          taxRate: 18,
          unit: 'lt',
          isActive: true,
          stock: 30,
          minStockLevel: 10,
        },
        {
          id: generateId(),
          sku: 'PRD009',
          name: 'Un',
          categoryId: 'ingredients',
          basePrice: 0,
          costPrice: 20,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 100,
          minStockLevel: 20,
        },
        {
          id: generateId(),
          sku: 'PRD010',
          name: 'Şeker',
          categoryId: 'ingredients',
          basePrice: 0,
          costPrice: 25,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 80,
          minStockLevel: 20,
        },
        {
          id: generateId(),
          sku: 'PRD011',
          name: 'Yumurta',
          categoryId: 'ingredients',
          basePrice: 0,
          costPrice: 5,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 200,
          minStockLevel: 50,
        },
        {
          id: generateId(),
          sku: 'PRD012',
          name: 'Tereyağı',
          categoryId: 'ingredients',
          basePrice: 0,
          costPrice: 180,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 25,
          minStockLevel: 5,
        },
        {
          id: generateId(),
          sku: 'PRD013',
          name: 'Vanilya',
          categoryId: 'ingredients',
          basePrice: 0,
          costPrice: 150,
          taxRate: 18,
          unit: 'gr',
          isActive: true,
          stock: 500,
          minStockLevel: 100,
        },
        {
          id: generateId(),
          sku: 'PRD014',
          name: 'Limon Suyu',
          categoryId: 'ingredients',
          basePrice: 0,
          costPrice: 15,
          taxRate: 18,
          unit: 'lt',
          isActive: true,
          stock: 20,
          minStockLevel: 5,
        },
      ];
      setProducts(sampleProducts);
    }

    if (!tables || tables.length === 0) {
      const sampleTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
        id: generateId(),
        branchId: 'branch-1',
        tableNumber: (i + 1).toString(),
        capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
        status: 'available' as const,
        section: i < 6 ? 'İç Salon' : 'Dış Mekan',
      }));
      setTables(sampleTables);
    }

    if (!menuItems || menuItems.length === 0) {
      const sampleMenuItems: MenuItem[] = [
        {
          id: generateId(),
          name: 'Cheesecake',
          category: 'Tatlılar',
          description: 'Klasik New York usulü cheesecake',
          sellingPrice: 150,
          costPrice: 0,
          targetCostPercentage: 30,
          isActive: true,
          popularity: 0.8,
          profitMargin: 0,
          servingSize: 12,
          isProduced: false,
        },
        {
          id: generateId(),
          name: 'Tiramisu',
          category: 'Tatlılar',
          description: 'İtalyan tiramisu',
          sellingPrice: 120,
          costPrice: 0,
          targetCostPercentage: 30,
          isActive: true,
          popularity: 0.7,
          profitMargin: 0,
          servingSize: 8,
          isProduced: true,
        },
        {
          id: generateId(),
          name: 'Makarna Carbonara',
          category: 'Ana Yemekler',
          description: 'Kremalı carbonara sosu ile',
          sellingPrice: 180,
          costPrice: 0,
          targetCostPercentage: 25,
          isActive: true,
          popularity: 0.85,
          profitMargin: 0,
          servingSize: 1,
          isProduced: true,
        },
        {
          id: generateId(),
          name: 'Sezar Salata',
          category: 'Salatalar',
          description: 'Tavuklu sezar salata',
          sellingPrice: 95,
          costPrice: 0,
          targetCostPercentage: 28,
          isActive: true,
          popularity: 0.65,
          profitMargin: 0,
          servingSize: 1,
          isProduced: true,
        },
      ];
      setMenuItems(sampleMenuItems);
    }

    setSeeded(true);
  }, [employees, products, tables, menuItems, setEmployees, setProducts, setTables, setMenuItems, seeded]);

  return { seeded };
}

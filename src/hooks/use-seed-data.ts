import { useEffect, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import type { Employee, Product, Table } from '@/lib/types';
import { generateId } from '@/lib/helpers';

export function useSeedData() {
  const [employees, setEmployees] = useKV<Employee[]>('employees', []);
  const [products, setProducts] = useKV<Product[]>('products', []);
  const [tables, setTables] = useKV<Table[]>('tables', []);
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

    setSeeded(true);
  }, [employees, products, tables, setEmployees, setProducts, setTables, seeded]);

  return { seeded };
}

import { useEffect, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import type { Employee, Product, Table, MenuItem, Category, Branch, Sale, SaleItem } from '@/lib/types';
import { generateId, generateSaleNumber, calculateTax } from '@/lib/helpers';

export function useSeedData() {
  const [employees, setEmployees] = useKV<Employee[]>('employees', []);
  const [products, setProducts] = useKV<Product[]>('products', []);
  const [categories, setCategories] = useKV<Category[]>('categories', []);
  const [tables, setTables] = useKV<Table[]>('tables', []);
  const [menuItems, setMenuItems] = useKV<MenuItem[]>('menuItems', []);
  const [branches, setBranches] = useKV<Branch[]>('branches', []);
  const [sales, setSales] = useKV<Sale[]>('sales', []);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded) return;
    
    if (!branches || branches.length === 0) {
      const sampleBranches: Branch[] = [
        {
          id: 'branch-1',
          name: 'Kadıköy Şubesi',
          code: 'KDK001',
          address: 'Kadıköy, İstanbul',
          phone: '0216 555 0001',
          isActive: true,
        },
        {
          id: 'branch-2',
          name: 'Beşiktaş Şubesi',
          code: 'BJK002',
          address: 'Beşiktaş, İstanbul',
          phone: '0212 555 0002',
          isActive: true,
        },
        {
          id: 'branch-3',
          name: 'Üsküdar Şubesi',
          code: 'USK003',
          address: 'Üsküdar, İstanbul',
          phone: '0216 555 0003',
          isActive: true,
        },
      ];
      setBranches(sampleBranches);
    }
    
    if (!categories || categories.length === 0) {
      const sampleCategories: Category[] = [
        {
          id: 'beverages',
          name: 'İçecek',
          description: 'Sıcak ve soğuk içecekler',
          showInPOS: true,
          sortOrder: 0,
        },
        {
          id: 'food',
          name: 'Yiyecek',
          description: 'Ana yemekler ve atıştırmalıklar',
          showInPOS: true,
          sortOrder: 1,
        },
        {
          id: 'dessert',
          name: 'Tatlı',
          description: 'Tatlılar ve unlu mamuller',
          showInPOS: true,
          sortOrder: 2,
        },
        {
          id: 'coffee',
          name: 'Kahve',
          description: 'Kahve çeşitleri',
          showInPOS: true,
          sortOrder: 3,
        },
        {
          id: 'ingredients',
          name: 'Malzeme',
          description: 'Ham maddeler ve malzemeler',
          showInPOS: false,
          sortOrder: 4,
        },
      ];
      setCategories(sampleCategories);
    }
    
    if (!employees || employees.length === 0) {
      const sampleEmployees: Employee[] = [
        {
          id: 'emp-001',
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
          id: 'emp-002',
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
          id: 'emp-003',
          fullName: 'Mehmet Kaya',
          email: 'mehmet@restoran.com',
          phone: '0555 333 4455',
          role: 'waiter',
          branchId: 'branch-1',
          isActive: true,
          hourlyRate: 75,
          employeePin: '9012',
          qrCode: 'QR003',
        },
        {
          id: 'emp-004',
          fullName: 'Zeynep Öztürk',
          email: 'zeynep@restoran.com',
          phone: '0555 444 5566',
          role: 'waiter',
          branchId: 'branch-1',
          isActive: true,
          hourlyRate: 75,
          employeePin: '3456',
          qrCode: 'QR004',
        },
        {
          id: 'emp-005',
          fullName: 'Can Aydın',
          email: 'can@restoran.com',
          phone: '0555 555 6677',
          role: 'waiter',
          branchId: 'branch-2',
          isActive: true,
          hourlyRate: 75,
          employeePin: '7890',
          qrCode: 'QR005',
        },
        {
          id: 'emp-006',
          fullName: 'Elif Aksoy',
          email: 'elif@restoran.com',
          phone: '0555 666 7788',
          role: 'waiter',
          branchId: 'branch-2',
          isActive: true,
          hourlyRate: 75,
          employeePin: '2345',
          qrCode: 'QR006',
        },
        {
          id: 'emp-007',
          fullName: 'Burak Çelik',
          email: 'burak@restoran.com',
          phone: '0555 777 8899',
          role: 'waiter',
          branchId: 'branch-3',
          isActive: true,
          hourlyRate: 75,
          employeePin: '6789',
          qrCode: 'QR007',
        },
        {
          id: 'emp-008',
          fullName: 'Selin Yıldız',
          email: 'selin@restoran.com',
          phone: '0555 888 9900',
          role: 'manager',
          branchId: 'branch-2',
          isActive: true,
          hourlyRate: 120,
          employeePin: '1111',
          qrCode: 'QR008',
        },
      ];
      setEmployees(sampleEmployees);
    }

    if (!products || products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: 'prod-001',
          sku: 'PRD001',
          name: 'Çay',
          categoryId: 'beverages',
          category: 'İçecek',
          basePrice: 15,
          costPrice: 5,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 500,
          minStockLevel: 100,
        },
        {
          id: 'prod-002',
          sku: 'PRD002',
          name: 'Türk Kahvesi',
          categoryId: 'coffee',
          category: 'Kahve',
          basePrice: 45,
          costPrice: 15,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 200,
          minStockLevel: 50,
        },
        {
          id: 'prod-003',
          sku: 'PRD003',
          name: 'Su',
          categoryId: 'beverages',
          category: 'İçecek',
          basePrice: 10,
          costPrice: 3,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 300,
          minStockLevel: 100,
        },
        {
          id: 'prod-004',
          sku: 'PRD004',
          name: 'Hamburger',
          categoryId: 'food',
          category: 'Yiyecek',
          basePrice: 120,
          costPrice: 45,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 150,
          minStockLevel: 30,
        },
        {
          id: 'prod-005',
          sku: 'PRD005',
          name: 'Pizza',
          categoryId: 'food',
          category: 'Yiyecek',
          basePrice: 180,
          costPrice: 65,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 100,
          minStockLevel: 20,
        },
        {
          id: 'prod-006',
          sku: 'PRD006',
          name: 'Salata',
          categoryId: 'food',
          category: 'Yiyecek',
          basePrice: 75,
          costPrice: 25,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 80,
          minStockLevel: 20,
        },
        {
          id: 'prod-007',
          sku: 'PRD016',
          name: 'Baklava',
          categoryId: 'dessert',
          category: 'Tatlı',
          basePrice: 85,
          costPrice: 30,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 60,
          minStockLevel: 15,
        },
        {
          id: 'prod-008',
          sku: 'PRD017',
          name: 'Sütlaç',
          categoryId: 'dessert',
          category: 'Tatlı',
          basePrice: 50,
          costPrice: 18,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 70,
          minStockLevel: 20,
        },
        {
          id: 'prod-009',
          sku: 'PRD018',
          name: 'Latte',
          categoryId: 'coffee',
          category: 'Kahve',
          basePrice: 55,
          costPrice: 20,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 180,
          minStockLevel: 40,
        },
        {
          id: 'prod-010',
          sku: 'PRD019',
          name: 'Cappuccino',
          categoryId: 'coffee',
          category: 'Kahve',
          basePrice: 50,
          costPrice: 18,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 180,
          minStockLevel: 40,
        },
        {
          id: 'prod-011',
          sku: 'PRD020',
          name: 'Kola',
          categoryId: 'beverages',
          category: 'İçecek',
          basePrice: 25,
          costPrice: 8,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 250,
          minStockLevel: 80,
        },
        {
          id: 'prod-012',
          sku: 'PRD007',
          name: 'Labne Peyniri',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 80,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 50,
          minStockLevel: 10,
        },
        {
          id: 'prod-013',
          sku: 'PRD008',
          name: 'Krema',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 45,
          taxRate: 18,
          unit: 'lt',
          isActive: true,
          stock: 30,
          minStockLevel: 10,
        },
        {
          id: 'prod-014',
          sku: 'PRD009',
          name: 'Un',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 20,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 100,
          minStockLevel: 20,
        },
        {
          id: 'prod-015',
          sku: 'PRD010',
          name: 'Şeker',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 25,
          taxRate: 18,
          unit: 'kg',
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

    if (!menuItems || menuItems.length === 0) {
      const menuItemsData = [
        {
          id: 'menu-001',
          name: 'Cheesecake',
          category: 'Tatlılar',
          description: 'Klasik New York usulü cheesecake',
          sellingPrice: 150,
          costPrice: 45,
          targetCostPercentage: 30,
          isActive: true,
          popularity: 0.8,
          profitMargin: 0.7,
          servingSize: 12,
          isProduced: false,
        },
        {
          id: 'menu-002',
          name: 'Tiramisu',
          category: 'Tatlılar',
          description: 'İtalyan tiramisu',
          sellingPrice: 120,
          costPrice: 38,
          targetCostPercentage: 30,
          isActive: true,
          popularity: 0.7,
          profitMargin: 0.68,
          servingSize: 8,
          isProduced: true,
        },
        {
          id: 'menu-003',
          name: 'Makarna Carbonara',
          category: 'Ana Yemekler',
          description: 'Kremalı carbonara sosu ile',
          sellingPrice: 180,
          costPrice: 52,
          targetCostPercentage: 25,
          isActive: true,
          popularity: 0.85,
          profitMargin: 0.71,
          servingSize: 1,
          isProduced: true,
        },
        {
          id: 'menu-004',
          name: 'Sezar Salata',
          category: 'Salatalar',
          description: 'Tavuklu sezar salata',
          sellingPrice: 95,
          costPrice: 32,
          targetCostPercentage: 28,
          isActive: true,
          popularity: 0.65,
          profitMargin: 0.66,
          servingSize: 1,
          isProduced: true,
        },
      ];
      
      setMenuItems(menuItemsData);
      
      const menuProducts: Product[] = menuItemsData.map(item => ({
        id: item.id,
        sku: `MENU-${item.id}`,
        name: item.name,
        description: item.description,
        categoryId: 'cat-menu',
        category: item.category,
        basePrice: item.sellingPrice,
        costPrice: item.costPrice,
        taxRate: 18,
        unit: 'porsiyon',
        isActive: true,
        stock: 999999,
        minStockLevel: 0,
        trackStock: false,
      }));
      
      setProducts((current) => [...(current || []), ...menuProducts]);
    }

    if (!sales || sales.length === 0) {
      const now = new Date();
      const productList = [
        { id: 'prod-001', name: 'Çay', price: 15, taxRate: 18 },
        { id: 'prod-002', name: 'Türk Kahvesi', price: 45, taxRate: 18 },
        { id: 'prod-003', name: 'Su', price: 10, taxRate: 18 },
        { id: 'prod-004', name: 'Hamburger', price: 120, taxRate: 18 },
        { id: 'prod-005', name: 'Pizza', price: 180, taxRate: 18 },
        { id: 'prod-006', name: 'Salata', price: 75, taxRate: 18 },
        { id: 'prod-007', name: 'Baklava', price: 85, taxRate: 18 },
        { id: 'prod-008', name: 'Sütlaç', price: 50, taxRate: 18 },
        { id: 'prod-009', name: 'Latte', price: 55, taxRate: 18 },
        { id: 'prod-010', name: 'Cappuccino', price: 50, taxRate: 18 },
        { id: 'prod-011', name: 'Kola', price: 25, taxRate: 18 },
        { id: 'menu-001', name: 'Cheesecake', price: 150, taxRate: 18 },
        { id: 'menu-002', name: 'Tiramisu', price: 120, taxRate: 18 },
        { id: 'menu-003', name: 'Makarna Carbonara', price: 180, taxRate: 18 },
        { id: 'menu-004', name: 'Sezar Salata', price: 95, taxRate: 18 },
      ];

      const branchIds = ['branch-1', 'branch-2', 'branch-3'];
      const waiterIds = ['emp-003', 'emp-004', 'emp-005', 'emp-006', 'emp-007'];
      const paymentMethods: ('cash' | 'card' | 'mobile')[] = ['cash', 'card', 'mobile'];

      const sampleSales: Sale[] = [];

      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date(now);
        date.setDate(date.getDate() - dayOffset);
        date.setHours(0, 0, 0, 0);

        const salesPerDay = Math.floor(Math.random() * 30) + 50;

        for (let i = 0; i < salesPerDay; i++) {
          const saleDate = new Date(date);
          saleDate.setHours(Math.floor(Math.random() * 12) + 8);
          saleDate.setMinutes(Math.floor(Math.random() * 60));

          const branchId = branchIds[Math.floor(Math.random() * branchIds.length)];
          const waiterId = waiterIds[Math.floor(Math.random() * waiterIds.length)];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

          const itemCount = Math.floor(Math.random() * 4) + 1;
          const items: SaleItem[] = [];

          for (let j = 0; j < itemCount; j++) {
            const product = productList[Math.floor(Math.random() * productList.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;
            const unitPrice = product.price;
            const subtotal = unitPrice * quantity;

            items.push({
              id: generateId(),
              productId: product.id,
              productName: product.name,
              quantity,
              unitPrice,
              taxRate: product.taxRate,
              discountAmount: 0,
              subtotal,
            });
          }

          const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
          const taxAmount = items.reduce((sum, item) => sum + calculateTax(item.subtotal, item.taxRate), 0);
          const totalAmount = subtotal + taxAmount;

          sampleSales.push({
            id: generateId(),
            branchId,
            cashierId: waiterId,
            saleNumber: generateSaleNumber(),
            saleDate: saleDate.toISOString(),
            subtotal,
            taxAmount,
            discountAmount: 0,
            totalAmount,
            paymentMethod,
            paymentStatus: 'completed',
            items,
          });
        }
      }

      setSales(sampleSales);
    }

    setSeeded(true);
  }, [employees, products, categories, tables, menuItems, branches, sales, seeded]);

  return { seeded };
}

import { useEffect, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import type { Employee, Product, Table, MenuItem, Category, Branch, Sale, SaleItem, B2BSupplier, B2BProduct, Admin, TableSection } from '@/lib/types';
import { generateId, generateSaleNumber, calculateTax, getBaseCategories } from '@/lib/helpers';

export function useSeedData() {
  const [admins, setAdmins] = useKV<Admin[]>('admins', []);
  const [employees, setEmployees] = useKV<Employee[]>('employees', []);
  const [products, setProducts] = useKV<Product[]>('products', []);
  const [categories, setCategories] = useKV<Category[]>('categories', []);
  const [tables, setTables] = useKV<Table[]>('tables', []);
  const [tableSections, setTableSections] = useKV<TableSection[]>('tableSections', []);
  const [menuItems, setMenuItems] = useKV<MenuItem[]>('menuItems', []);
  const [branches, setBranches] = useKV<Branch[]>('branches', []);
  const [sales, setSales] = useKV<Sale[]>('sales', []);
  const [b2bSuppliers, setB2BSuppliers] = useKV<B2BSupplier[]>('b2b-suppliers', []);
  const [b2bProducts, setB2BProducts] = useKV<B2BProduct[]>('b2b-products', []);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded) return;
    
    if (!admins || admins.length === 0) {
      const demoAdmin: Admin = {
        id: 'demo-admin',
        email: 'demo@posaca.com',
        password: 'demo123',
        businessName: 'Demo Restoran',
        phone: '0555 000 0000',
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      setAdmins([demoAdmin]);
    }
    
    if (!b2bSuppliers || b2bSuppliers.length === 0) {
      const sampleSuppliers: B2BSupplier[] = [
        {
          id: 'supplier-1',
          companyName: 'Anadolu Tekstil A.Ş.',
          contactName: 'Ahmet Yılmaz',
          email: 'info@anadolutekstil.com',
          phone: '0216 555 1000',
          address: 'Organize Sanayi Bölgesi, İstanbul',
          taxNumber: '1234567890',
          rating: 4.5,
          totalProducts: 5,
          isActive: true,
          createdAt: new Date().toISOString(),
          adminId: 'demo-admin',
        },
        {
          id: 'supplier-2',
          companyName: 'Bayrak Promosyon Ltd.',
          contactName: 'Mehmet Kaya',
          email: 'info@bayrakpromosyon.com',
          phone: '0212 555 2000',
          address: 'Bayrampaşa, İstanbul',
          rating: 4.8,
          totalProducts: 3,
          isActive: true,
          createdAt: new Date().toISOString(),
          adminId: 'demo-admin',
        },
        {
          id: 'supplier-3',
          companyName: 'Çamlıca Ambalaj San.',
          contactName: 'Ayşe Demir',
          email: 'info@camlicaambalaj.com',
          phone: '0216 555 3000',
          address: 'Çamlıca, İstanbul',
          rating: 4.2,
          totalProducts: 4,
          isActive: true,
          createdAt: new Date().toISOString(),
          adminId: 'demo-admin',
        },
      ];
      setB2BSuppliers(sampleSuppliers);

      const sampleB2BProducts: B2BProduct[] = [
        {
          id: 'b2b-prod-1',
          supplierId: 'supplier-1',
          supplierName: 'Anadolu Tekstil A.Ş.',
          name: 'Baskılı Tişört',
          description: 'Pamuklu, yüksek kaliteli baskılı tişört',
          category: 'Tekstil',
          unitPrice: 45,
          minOrderQuantity: 100,
          unit: 'adet',
          canProvideSample: true,
          requiresDesign: true,
          shippingMethod: 'buyer_pays',
          stock: 5000,
          isActive: true,
          createdAt: new Date().toISOString(),
          adminId: 'demo-admin',
        },
        {
          id: 'b2b-prod-2',
          supplierId: 'supplier-1',
          supplierName: 'Anadolu Tekstil A.Ş.',
          name: 'Nakışlı Polar',
          description: 'Özel nakış işlemeli polar',
          category: 'Tekstil',
          unitPrice: 85,
          minOrderQuantity: 50,
          unit: 'adet',
          canProvideSample: true,
          requiresDesign: true,
          shippingMethod: 'free',
          stock: 2000,
          isActive: true,
          createdAt: new Date().toISOString(),
          adminId: 'demo-admin',
        },
        {
          id: 'b2b-prod-3',
          supplierId: 'supplier-2',
          supplierName: 'Bayrak Promosyon Ltd.',
          name: 'USB Bellek (Logo Baskılı)',
          description: '16GB USB bellek, logo baskı dahil',
          category: 'Elektronik',
          unitPrice: 35,
          minOrderQuantity: 200,
          unit: 'adet',
          canProvideSample: true,
          requiresDesign: true,
          shippingMethod: 'buyer_pays',
          stock: 10000,
          isActive: true,
          createdAt: new Date().toISOString(),
          adminId: 'demo-admin',
        },
        {
          id: 'b2b-prod-4',
          supplierId: 'supplier-2',
          supplierName: 'Bayrak Promosyon Ltd.',
          name: 'Kalem Seti',
          description: 'Lüks kutuda metal kalem seti',
          category: 'Kırtasiye',
          unitPrice: 55,
          minOrderQuantity: 50,
          unit: 'set',
          canProvideSample: true,
          requiresDesign: false,
          shippingMethod: 'free',
          stock: 3000,
          isActive: true,
          createdAt: new Date().toISOString(),
          adminId: 'demo-admin',
        },
        {
          id: 'b2b-prod-5',
          supplierId: 'supplier-3',
          supplierName: 'Çamlıca Ambalaj San.',
          name: 'Karton Kutu (Özel Baskı)',
          description: 'Ofset baskılı karton kutu',
          category: 'Ambalaj',
          unitPrice: 8,
          minOrderQuantity: 1000,
          unit: 'adet',
          canProvideSample: true,
          requiresDesign: true,
          shippingMethod: 'buyer_pays',
          stock: 50000,
          isActive: true,
          createdAt: new Date().toISOString(),
          adminId: 'demo-admin',
        },
      ];
      setB2BProducts(sampleB2BProducts);
    }
    
    if (!branches || branches.length === 0) {
      const sampleBranches: Branch[] = [
        {
          id: 'branch-1',
          name: 'Kadıköy Şubesi',
          code: 'KDK001',
          address: 'Kadıköy, İstanbul',
          phone: '0216 555 0001',
          isActive: true,
          adminId: 'demo-admin',
        },
        {
          id: 'branch-2',
          name: 'Beşiktaş Şubesi',
          code: 'BJK002',
          address: 'Beşiktaş, İstanbul',
          phone: '0212 555 0002',
          isActive: true,
          adminId: 'demo-admin',
        },
        {
          id: 'branch-3',
          name: 'Üsküdar Şubesi',
          code: 'USK003',
          address: 'Üsküdar, İstanbul',
          phone: '0216 555 0003',
          isActive: true,
          adminId: 'demo-admin',
        },
      ];
      setBranches(sampleBranches);
    }
    
    if (!categories || categories.length === 0) {
      const sampleCategories: Category[] = getBaseCategories().map(cat => ({
        ...cat,
        adminId: 'demo-admin',
        branchId: 'branch-1',
      }));
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
          adminId: 'demo-admin',
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
          adminId: 'demo-admin',
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
          adminId: 'demo-admin',
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
          adminId: 'demo-admin',
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
          adminId: 'demo-admin',
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
          adminId: 'demo-admin',
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
          adminId: 'demo-admin',
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
          adminId: 'demo-admin',
        },
      ];
      setEmployees(sampleEmployees);
    }

    if (!products || products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: 'prod-001',
          sku: 'PRD001',
          name: 'Çay Yaprağı',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 120,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 50,
          minStockLevel: 10,
        },
        {
          id: 'prod-002',
          sku: 'PRD002',
          name: 'Kahve Çekirdeği',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 350,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 30,
          minStockLevel: 5,
        },
        {
          id: 'prod-003',
          sku: 'PRD003',
          name: 'Su (İçme Suyu)',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 5,
          taxRate: 18,
          unit: 'litre',
          isActive: true,
          stock: 500,
          minStockLevel: 100,
        },
        {
          id: 'prod-004',
          sku: 'PRD004',
          name: 'Hamburger Köftesi',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 85,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 40,
          minStockLevel: 10,
        },
        {
          id: 'prod-005',
          sku: 'PRD005',
          name: 'Pizza Hamuru',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 45,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 30,
          minStockLevel: 10,
        },
        {
          id: 'prod-006',
          sku: 'PRD006',
          name: 'Marul',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 30,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 20,
          minStockLevel: 5,
        },
        {
          id: 'prod-007',
          sku: 'PRD007',
          name: 'Baklava Hamuru',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 60,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 25,
          minStockLevel: 5,
        },
        {
          id: 'prod-008',
          sku: 'PRD008',
          name: 'Süt',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 35,
          taxRate: 18,
          unit: 'litre',
          isActive: true,
          stock: 60,
          minStockLevel: 15,
        },
        {
          id: 'prod-009',
          sku: 'PRD009',
          name: 'Espresso',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 400,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 20,
          minStockLevel: 5,
        },
        {
          id: 'prod-010',
          sku: 'PRD010',
          name: 'Süt (Kahve)',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 40,
          taxRate: 18,
          unit: 'litre',
          isActive: true,
          stock: 50,
          minStockLevel: 10,
        },
        {
          id: 'prod-011',
          sku: 'PRD011',
          name: 'Kola (Şişe)',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 12,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 200,
          minStockLevel: 50,
        },
        {
          id: 'prod-012',
          sku: 'PRD012',
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
          sku: 'PRD013',
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
          sku: 'PRD014',
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
          sku: 'PRD015',
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
        {
          id: 'prod-016',
          sku: 'PRD016',
          name: 'Domates',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 28,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 40,
          minStockLevel: 10,
        },
        {
          id: 'prod-017',
          sku: 'PRD017',
          name: 'Peynir',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 95,
          taxRate: 18,
          unit: 'kg',
          isActive: true,
          stock: 30,
          minStockLevel: 5,
        },
        {
          id: 'prod-018',
          sku: 'PRD018',
          name: 'Ekmek',
          categoryId: 'ingredients',
          category: 'Malzeme',
          basePrice: 0,
          costPrice: 15,
          taxRate: 18,
          unit: 'adet',
          isActive: true,
          stock: 100,
          minStockLevel: 20,
        },
      ].map(p => ({ ...p, adminId: 'demo-admin', branchId: 'branch-1' }));
      setProducts(sampleProducts);
    }

    if (!tableSections || tableSections.length === 0) {
      const sampleSections: TableSection[] = [
        {
          id: 'section-1',
          branchId: 'branch-1',
          adminId: 'demo-admin',
          name: 'İç Salon',
          description: 'Restoran iç mekan masaları',
          color: '#4F46E5',
          isActive: true,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'section-2',
          branchId: 'branch-1',
          adminId: 'demo-admin',
          name: 'Dış Mekan',
          description: 'Teras ve bahçe masaları',
          color: '#10B981',
          isActive: true,
          sortOrder: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'section-3',
          branchId: 'branch-1',
          adminId: 'demo-admin',
          name: 'VIP Salon',
          description: 'Özel rezervasyon alanı',
          color: '#F59E0B',
          isActive: true,
          sortOrder: 2,
          createdAt: new Date().toISOString(),
        },
      ];
      setTableSections(sampleSections);
    }

    if (!tables || tables.length === 0) {
      const sampleTables: Table[] = Array.from({ length: 15 }, (_, i) => {
        let sectionId = 'section-1';
        let section = 'İç Salon';
        
        if (i >= 6 && i < 12) {
          sectionId = 'section-2';
          section = 'Dış Mekan';
        } else if (i >= 12) {
          sectionId = 'section-3';
          section = 'VIP Salon';
        }
        
        return {
          id: generateId(),
          branchId: 'branch-1',
          adminId: 'demo-admin',
          tableNumber: (i + 1).toString(),
          capacity: i >= 12 ? 8 : i < 4 ? 2 : i < 8 ? 4 : 6,
          status: 'available' as const,
          section,
          sectionId,
          isActive: true,
          sortOrder: i,
          createdAt: new Date().toISOString(),
        };
      });
      setTables(sampleTables);
    }

    if (!menuItems || menuItems.length === 0) {
      const menuItemsData = [
        {
          id: 'menu-001',
          name: 'Çay',
          category: 'İçecek',
          description: 'Geleneksel Türk çayı',
          sellingPrice: 15,
          costPrice: 5,
          targetCostPercentage: 33,
          isActive: true,
          popularity: 0.9,
          profitMargin: 0.67,
          servingSize: 1,
          isProduced: false,
          imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cda9?w=400',
        },
        {
          id: 'menu-002',
          name: 'Türk Kahvesi',
          category: 'Kahve',
          description: 'Klasik Türk kahvesi',
          sellingPrice: 45,
          costPrice: 15,
          targetCostPercentage: 33,
          isActive: true,
          popularity: 0.75,
          profitMargin: 0.67,
          servingSize: 1,
          isProduced: false,
          imageUrl: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=400',
          hasOptions: true,
          options: [
            {
              id: 'opt-kahve-seker',
              name: 'Şeker Durumu',
              required: true,
              multiSelect: false,
              choices: [
                { id: 'choice-sade', name: 'Sade', priceModifier: 0 },
                { id: 'choice-az', name: 'Az Şekerli', priceModifier: 0 },
                { id: 'choice-orta', name: 'Orta Şekerli', priceModifier: 0 },
                { id: 'choice-sekerli', name: 'Şekerli', priceModifier: 0 },
              ],
            },
          ],
        },
        {
          id: 'menu-003',
          name: 'Su',
          category: 'İçecek',
          description: 'İçme suyu',
          sellingPrice: 10,
          costPrice: 3,
          targetCostPercentage: 30,
          isActive: true,
          popularity: 0.85,
          profitMargin: 0.70,
          servingSize: 1,
          isProduced: false,
          imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        },
        {
          id: 'menu-004',
          name: 'Latte',
          category: 'Kahve',
          description: 'Espresso ve sütle hazırlanan latte',
          sellingPrice: 55,
          costPrice: 20,
          targetCostPercentage: 36,
          isActive: true,
          popularity: 0.8,
          profitMargin: 0.64,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400',
        },
        {
          id: 'menu-005',
          name: 'Cappuccino',
          category: 'Kahve',
          description: 'Espresso, süt ve süt köpüğü',
          sellingPrice: 50,
          costPrice: 18,
          targetCostPercentage: 36,
          isActive: true,
          popularity: 0.75,
          profitMargin: 0.64,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
        },
        {
          id: 'menu-006',
          name: 'Kola',
          category: 'İçecek',
          description: 'Soğuk kola',
          sellingPrice: 25,
          costPrice: 8,
          targetCostPercentage: 32,
          isActive: true,
          popularity: 0.7,
          profitMargin: 0.68,
          servingSize: 1,
          isProduced: false,
          imageUrl: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400',
        },
        {
          id: 'menu-007',
          name: 'Hamburger',
          category: 'Yiyecek',
          description: 'Özel soslu hamburger',
          sellingPrice: 120,
          costPrice: 45,
          targetCostPercentage: 38,
          isActive: true,
          popularity: 0.85,
          profitMargin: 0.63,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        },
        {
          id: 'menu-008',
          name: 'Pizza',
          category: 'Yiyecek',
          description: 'Özel karışık pizza',
          sellingPrice: 180,
          costPrice: 65,
          targetCostPercentage: 36,
          isActive: true,
          popularity: 0.8,
          profitMargin: 0.64,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
          hasOptions: true,
          options: [
            {
              id: 'opt-pizza-boyut',
              name: 'Pizza Boyutu',
              required: true,
              multiSelect: false,
              choices: [
                { id: 'choice-kucuk', name: 'Küçük (25cm)', priceModifier: -30 },
                { id: 'choice-orta', name: 'Orta (30cm)', priceModifier: 0 },
                { id: 'choice-buyuk', name: 'Büyük (35cm)', priceModifier: 40 },
                { id: 'choice-xl', name: 'XL (40cm)', priceModifier: 70 },
              ],
            },
            {
              id: 'opt-pizza-malzeme',
              name: 'Ekstra Malzeme',
              required: false,
              multiSelect: true,
              choices: [
                { id: 'choice-sucuk', name: 'Sucuk', priceModifier: 15 },
                { id: 'choice-sosis', name: 'Sosis', priceModifier: 12 },
                { id: 'choice-mantar', name: 'Mantar', priceModifier: 10 },
                { id: 'choice-zeytin', name: 'Zeytin', priceModifier: 8 },
                { id: 'choice-peynir', name: 'Ekstra Peynir', priceModifier: 20 },
                { id: 'choice-misir', name: 'Mısır', priceModifier: 8 },
              ],
            },
            {
              id: 'opt-pizza-hamur',
              name: 'Hamur Tipi',
              required: false,
              multiSelect: false,
              choices: [
                { id: 'choice-ince', name: 'İnce Hamur', priceModifier: 0 },
                { id: 'choice-kalin', name: 'Kalın Hamur', priceModifier: 5 },
                { id: 'choice-peynirli', name: 'Peynirli Kenar', priceModifier: 25 },
              ],
            },
          ],
        },
        {
          id: 'menu-009',
          name: 'Salata',
          category: 'Yiyecek',
          description: 'Mevsim salatası',
          sellingPrice: 75,
          costPrice: 25,
          targetCostPercentage: 33,
          isActive: true,
          popularity: 0.65,
          profitMargin: 0.67,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        },
        {
          id: 'menu-010',
          name: 'Baklava',
          category: 'Tatlı',
          description: 'Fıstıklı baklava',
          sellingPrice: 85,
          costPrice: 30,
          targetCostPercentage: 35,
          isActive: true,
          popularity: 0.7,
          profitMargin: 0.65,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1598110750624-207050c4f28c?w=400',
        },
        {
          id: 'menu-011',
          name: 'Sütlaç',
          category: 'Tatlı',
          description: 'Fırında sütlaç',
          sellingPrice: 50,
          costPrice: 18,
          targetCostPercentage: 36,
          isActive: true,
          popularity: 0.6,
          profitMargin: 0.64,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
        },
        {
          id: 'menu-012',
          name: 'Cheesecake',
          category: 'Tatlı',
          description: 'Klasik New York usulü cheesecake',
          sellingPrice: 150,
          costPrice: 45,
          targetCostPercentage: 30,
          isActive: true,
          popularity: 0.8,
          profitMargin: 0.70,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400',
        },
        {
          id: 'menu-013',
          name: 'Tiramisu',
          category: 'Tatlı',
          description: 'İtalyan tiramisu',
          sellingPrice: 120,
          costPrice: 38,
          targetCostPercentage: 32,
          isActive: true,
          popularity: 0.7,
          profitMargin: 0.68,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
        },
        {
          id: 'menu-014',
          name: 'Makarna Carbonara',
          category: 'Yiyecek',
          description: 'Kremalı carbonara sosu ile',
          sellingPrice: 180,
          costPrice: 52,
          targetCostPercentage: 29,
          isActive: true,
          popularity: 0.85,
          profitMargin: 0.71,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
        },
        {
          id: 'menu-015',
          name: 'Sezar Salata',
          category: 'Yiyecek',
          description: 'Tavuklu sezar salata',
          sellingPrice: 95,
          costPrice: 32,
          targetCostPercentage: 34,
          isActive: true,
          popularity: 0.65,
          profitMargin: 0.66,
          servingSize: 1,
          isProduced: true,
          imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
        },
      ];
      
      setMenuItems(menuItemsData.map(item => ({ ...item, adminId: 'demo-admin', branchId: 'branch-1' })));
      
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
        imageUrl: item.imageUrl,
        hasOptions: item.hasOptions,
        options: item.options,
        adminId: 'demo-admin',
        branchId: 'branch-1',
      }));
      
      setProducts((current) => [...(current || []), ...menuProducts]);
    }

    if (!sales || sales.length === 0) {
      const now = new Date();
      const productList = [
        { id: 'menu-001', name: 'Çay', price: 15, taxRate: 18 },
        { id: 'menu-002', name: 'Türk Kahvesi', price: 45, taxRate: 18 },
        { id: 'menu-003', name: 'Su', price: 10, taxRate: 18 },
        { id: 'menu-004', name: 'Latte', price: 55, taxRate: 18 },
        { id: 'menu-005', name: 'Cappuccino', price: 50, taxRate: 18 },
        { id: 'menu-006', name: 'Kola', price: 25, taxRate: 18 },
        { id: 'menu-007', name: 'Hamburger', price: 120, taxRate: 18 },
        { id: 'menu-008', name: 'Pizza', price: 180, taxRate: 18 },
        { id: 'menu-009', name: 'Salata', price: 75, taxRate: 18 },
        { id: 'menu-010', name: 'Baklava', price: 85, taxRate: 18 },
        { id: 'menu-011', name: 'Sütlaç', price: 50, taxRate: 18 },
        { id: 'menu-012', name: 'Cheesecake', price: 150, taxRate: 18 },
        { id: 'menu-013', name: 'Tiramisu', price: 120, taxRate: 18 },
        { id: 'menu-014', name: 'Makarna Carbonara', price: 180, taxRate: 18 },
        { id: 'menu-015', name: 'Sezar Salata', price: 95, taxRate: 18 },
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
  }, [seeded, admins, setAdmins, employees, setEmployees, products, setProducts, categories, setCategories, tables, setTables, menuItems, setMenuItems, branches, setBranches, sales, setSales, b2bSuppliers, setB2BSuppliers, b2bProducts, setB2BProducts]);

  return { seeded };
}

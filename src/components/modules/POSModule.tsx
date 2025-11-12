import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash, Check, Table as TableIcon, CreditCard, Money, DeviceMobile, Users, FloppyDisk, Gift, Percent, ArrowsLeftRight, X, Eye, Warning, Clock, Sparkle, Bank, Ticket, CaretDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Numpad from '@/components/Numpad';
import KeyboardInput from '@/components/KeyboardInput';
import ProductOptionsSelector from '@/components/ProductOptionsSelector';
import type { Product, Sale, SaleItem, PaymentMethod, Table, TableOrder, Category, UserRole, CashRegister, MenuItem, CustomerAccount, CustomerTransaction, AuthSession } from '@/lib/types';
import { formatCurrency, generateId, generateSaleNumber, calculateTax } from '@/lib/helpers';
import { useBranchFilter } from '@/hooks/use-branch-filter';

interface POSModuleProps {
  onBack: () => void;
  currentUserRole?: UserRole;
  authSession?: AuthSession | null;
}

interface CartItem extends SaleItem {
  productName: string;
  isComplimentary?: boolean;
}

interface AppSettings {
  taxRates: any[];
  paymentMethods: PaymentMethodSetting[];
  stockAlerts: boolean;
  autoCalculateSalary: boolean;
  pricesIncludeVAT: boolean;
  lazyTableWarningMinutes?: number;
  requireGuestCount?: boolean;
}

interface PaymentMethodSetting {
  method: PaymentMethod;
  displayName: string;
  isActive: boolean;
  icon: string;
}

interface SplitPayment {
  method: PaymentMethod;
  amount: number;
}

interface SelectedPaymentItem {
  itemId: string;
  quantity: number;
}

export default function POSModule({ onBack, currentUserRole = 'cashier' }: POSModuleProps) {
  const [products, setProducts] = useKV<Product[]>('products', []);
  const [menuItems] = useKV<MenuItem[]>('menuItems', []);
  const [categories] = useKV<Category[]>('categories', []);
  const [sales, setSales] = useKV<Sale[]>('sales', []);
  const [tables, setTables] = useKV<Table[]>('tables', []);
  const [tableOrders, setTableOrders] = useKV<TableOrder[]>('tableOrders', []);
  const [cashRegister, setCashRegister] = useKV<CashRegister>('cashRegister', {
    id: generateId(),
    branchId: 'branch-1',
    date: new Date().toISOString().split('T')[0],
    openingBalance: 0,
    currentBalance: 0,
    totalCashSales: 0,
    totalCardSales: 0,
    totalMobileSales: 0,
    totalTransferSales: 0,
    totalMultinetSales: 0,
    totalSales: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [settings] = useKV<AppSettings>('appSettings', {
    taxRates: [],
    paymentMethods: [
      { method: 'cash', displayName: 'Nakit', isActive: true, icon: 'Money' },
      { method: 'card', displayName: 'Kredi Kartı', isActive: true, icon: 'CreditCard' },
      { method: 'mobile', displayName: 'Mobil Ödeme', isActive: true, icon: 'DeviceMobile' },
      { method: 'transfer', displayName: 'Havale/EFT', isActive: true, icon: 'Bank' },
      { method: 'multinet', displayName: 'Multinet Açık Hesap', isActive: true, icon: 'Ticket' },
    ],
    stockAlerts: true,
    autoCalculateSalary: false,
    pricesIncludeVAT: false,
    lazyTableWarningMinutes: 120,
    requireGuestCount: false,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'quick-sale' | 'tables'>('quick-sale');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [showGuestCountDialog, setShowGuestCountDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [transferTargetTable, setTransferTargetTable] = useState<string>('');
  const [selectedItemsForTransfer, setSelectedItemsForTransfer] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState('0');
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [currentSplitMethod, setCurrentSplitMethod] = useState<PaymentMethod>('cash');
  const [currentSplitAmount, setCurrentSplitAmount] = useState('');
  const [showNumpad, setShowNumpad] = useState(false);
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const [guestCount, setGuestCount] = useState('');
  const [showPartialPaymentDialog, setShowPartialPaymentDialog] = useState(false);
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<SelectedPaymentItem[]>([]);
  const [showRemoveQuantityDialog, setShowRemoveQuantityDialog] = useState(false);
  const [showComplimentaryQuantityDialog, setShowComplimentaryQuantityDialog] = useState(false);
  const [quantityDialogItem, setQuantityDialogItem] = useState<CartItem | null>(null);
  const [quantityToProcess, setQuantityToProcess] = useState('');
  const [showCartSplitDialog, setShowCartSplitDialog] = useState(false);
  const [cartSplitCount, setCartSplitCount] = useState<number | 'custom'>(2);
  const [showOptionsSelector, setShowOptionsSelector] = useState(false);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<Product | null>(null);
  const [showCustomerAccountDialog, setShowCustomerAccountDialog] = useState(false);
  const [selectedCustomerAccount, setSelectedCustomerAccount] = useState<string>('');
  const [customerAccounts] = useKV<CustomerAccount[]>('customerAccounts', []);
  const [customerTransactions, setCustomerTransactions] = useKV<CustomerTransaction[]>('customerTransactions', []);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isTableLegendOpen, setIsTableLegendOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState('');

  const activePaymentMethods = (settings?.paymentMethods || []).filter(pm => pm.isActive);
  const pricesIncludeVAT = settings?.pricesIncludeVAT || false;
  const lazyTableWarningMinutes = settings?.lazyTableWarningMinutes || 120;
  const requireGuestCount = settings?.requireGuestCount || false;
  const isWaiter = currentUserRole === 'waiter';

  const visibleCategories = (categories || []).filter(cat => cat.showInPOS !== false);

  const isRecentlyAdded = (createdAt?: string): boolean => {
    if (!createdAt) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const productDate = new Date(createdAt);
    return productDate >= sevenDaysAgo;
  };

  const getRippleColor = (product: Product): string => {
    if (product.hasActiveCampaign && product.campaignDetails) {
      return 'rgba(16, 185, 129, 0.6)';
    }
    
    const categoryColors: { [key: string]: string } = {
      'İçecekler': 'rgba(59, 130, 246, 0.6)',
      'Yiyecekler': 'rgba(249, 115, 22, 0.6)',
      'Tatlılar': 'rgba(236, 72, 153, 0.6)',
      'Kahvaltı': 'rgba(234, 179, 8, 0.6)',
      'Ana Yemek': 'rgba(239, 68, 68, 0.6)',
      'Aperatifler': 'rgba(168, 85, 247, 0.6)',
      'Salatalar': 'rgba(34, 197, 94, 0.6)',
      'Alkollü İçecekler': 'rgba(190, 18, 60, 0.6)',
      'Alkolsüz İçecekler': 'rgba(14, 165, 233, 0.6)',
      'Sıcak İçecekler': 'rgba(217, 70, 239, 0.6)',
    };
    
    const category = (categories || []).find(cat => 
      cat.id === product.categoryId || cat.name === product.category
    );
    
    if (category && categoryColors[category.name]) {
      return categoryColors[category.name];
    }
    
    return 'rgba(255, 255, 255, 0.6)';
  };

  const menuItemsAsProducts = (menuItems || []).map(item => ({
    id: item.id,
    sku: item.id,
    name: item.name,
    description: item.description,
    categoryId: item.category,
    category: item.category,
    basePrice: item.sellingPrice,
    costPrice: item.costPrice,
    taxRate: 18,
    unit: 'adet',
    imageUrl: item.imageUrl,
    isActive: item.isActive,
    stock: 999,
    minStockLevel: 0,
    trackStock: false,
    hasActiveCampaign: item.hasActiveCampaign,
    campaignDetails: item.campaignDetails,
    hasOptions: item.hasOptions,
    options: item.options,
    createdAt: item.createdAt,
  }));

  const getTimeSinceLastOrder = (table: Table): number | null => {
    if (!table.lastOrderTime) return null;
    const lastOrder = new Date(table.lastOrderTime);
    const now = new Date();
    return Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60));
  };

  const getOrderDuration = (table: Table): string | null => {
    if (!table.firstOrderTime) return null;
    const firstOrder = new Date(table.firstOrderTime);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - firstOrder.getTime()) / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  const isLazyTable = (table: Table): boolean => {
    if (!table.currentSaleId || !table.lastOrderTime) return false;
    const minutesSinceLastOrder = getTimeSinceLastOrder(table);
    return minutesSinceLastOrder !== null && minutesSinceLastOrder >= lazyTableWarningMinutes;
  };

  const filteredProducts = (menuItemsAsProducts || []).filter((product) => {
    const matchesSearch = product.isActive &&
      (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory || product.categoryId === selectedCategory;
    
    const productCategory = (categories || []).find(cat => 
      cat.id === product.categoryId || cat.name === product.category
    );
    const isVisibleCategory = !productCategory || productCategory.showInPOS !== false;
    
    return matchesSearch && matchesCategory && isVisibleCategory;
  });

  const campaignProducts = (menuItemsAsProducts || []).filter(p => 
    p.isActive && p.hasActiveCampaign && p.campaignDetails
  );

  const availableTables = (tables || []).filter(t => t.status === 'available' || t.status === 'occupied');

  useEffect(() => {
    if (selectedTable) {
      if (selectedTable.currentSaleId) {
        const existingOrder = (tableOrders || []).find(o => o.saleId === selectedTable.currentSaleId);
        if (existingOrder) {
          const sale = (sales || []).find(s => s.id === selectedTable.currentSaleId);
          if (sale) {
            setCart(sale.items.map(item => ({
              ...item,
              productName: item.productName || (menuItemsAsProducts || []).find(p => p.id === item.productId)?.name || 'Unknown',
            })));
            setOrderDiscount(sale.discountAmount || 0);
          }
        }
      } else {
        setCart([]);
        setOrderDiscount(0);
      }
    }
  }, [selectedTable]);

  const selectTable = (table: Table) => {
    if (requireGuestCount && !table.currentSaleId) {
      setPendingTable(table);
      setGuestCount('');
      setShowGuestCountDialog(true);
      return;
    }

    finalizeTableSelection(table);
  };

  const finalizeTableSelection = (table: Table, customersCount?: number) => {
    setSelectedTable(table);
    setShowTableSelect(false);
    setActiveTab('quick-sale');
    
    if (table.currentSaleId) {
      const existingOrder = (tableOrders || []).find(o => o.saleId === table.currentSaleId);
      if (existingOrder) {
        const sale = (sales || []).find(s => s.id === table.currentSaleId);
        if (sale) {
          setCart(sale.items.map(item => ({
            ...item,
            productName: item.productName || (menuItemsAsProducts || []).find(p => p.id === item.productId)?.name || 'Unknown',
          })));
          setOrderDiscount(sale.discountAmount || 0);
        }
        toast.info(`Masa ${table.tableNumber} siparişi yüklendi`);
      }
    } else {
      setCart([]);
      setOrderDiscount(0);
      
      setTables((current) =>
        (current || []).map(t =>
          t.id === table.id ? { ...t, status: 'occupied' as const } : t
        )
      );
      
      if (customersCount !== undefined && requireGuestCount) {
        const newOrder: TableOrder = {
          id: generateId(),
          tableId: table.id,
          saleId: '',
          openedAt: new Date().toISOString(),
          customersCount: customersCount,
        };
        setTableOrders((current) => [...(current || []), newOrder]);
      }
    }
  };

  const confirmGuestCount = () => {
    const count = parseInt(guestCount);
    if (!count || count < 1) {
      toast.error('Geçerli bir kişi sayısı girin');
      return;
    }
    
    if (pendingTable) {
      finalizeTableSelection(pendingTable, count);
      setShowGuestCountDialog(false);
      setPendingTable(null);
      setGuestCount('');
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.hasOptions && product.options && product.options.length > 0) {
      setSelectedProductForOptions(product);
      setShowOptionsSelector(true);
      return;
    }

    const existingItem = cart.find((item) => item.productId === product.id && !item.isComplimentary && !item.selectedOptions);

    let unitPrice = product.basePrice;
    let subtotal = unitPrice * quantity;

    if (pricesIncludeVAT) {
      unitPrice = product.basePrice / (1 + product.taxRate / 100);
      subtotal = unitPrice * quantity;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: product.taxRate,
        discountAmount: 0,
        subtotal: subtotal,
        isComplimentary: false,
      };
      setCart([...cart, newItem]);
    }
    toast.success(`${quantity} adet ${product.name} sepete eklendi`);
  };

  const addToCartWithOptions = (
    product: Product,
    selectedOptions: {
      optionName: string;
      choiceName: string;
      priceModifier: number;
    }[]
  ) => {
    let unitPrice = product.basePrice;
    
    selectedOptions.forEach(option => {
      unitPrice += option.priceModifier;
    });

    if (pricesIncludeVAT) {
      unitPrice = unitPrice / (1 + product.taxRate / 100);
    }

    const subtotal = unitPrice;

    const newItem: CartItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: unitPrice,
      taxRate: product.taxRate,
      discountAmount: 0,
      subtotal: subtotal,
      isComplimentary: false,
      selectedOptions: selectedOptions,
    };
    
    setCart([...cart, newItem]);
    
    const optionsText = selectedOptions.map(o => o.choiceName).join(', ');
    toast.success(`${product.name} (${optionsText}) sepete eklendi`);
    
    setShowOptionsSelector(false);
    setSelectedProductForOptions(null);
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = Math.max(0, item.quantity + change);
            return {
              ...item,
              quantity: newQuantity,
              subtotal: item.isComplimentary ? 0 : newQuantity * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.quantity > 1) {
      setQuantityDialogItem(item);
      setQuantityToProcess('');
      setShowRemoveQuantityDialog(true);
    } else {
      setCart(cart.filter((item) => item.id !== itemId));
      toast.success('Ürün sepetten çıkarıldı');
    }
  };

  const confirmRemoveQuantity = () => {
    if (!quantityDialogItem) return;
    
    const qty = parseInt(quantityToProcess);
    if (!qty || qty < 1) {
      toast.error('Geçerli bir miktar girin');
      return;
    }
    
    if (qty >= quantityDialogItem.quantity) {
      setCart(cart.filter(item => item.id !== quantityDialogItem.id));
      toast.success(`${quantityDialogItem.productName} sepetten çıkarıldı`);
    } else {
      setCart(cart.map(item => 
        item.id === quantityDialogItem.id
          ? { ...item, quantity: item.quantity - qty, subtotal: (item.quantity - qty) * item.unitPrice }
          : item
      ));
      toast.success(`${qty} adet ${quantityDialogItem.productName} sepetten çıkarıldı`);
    }
    
    setShowRemoveQuantityDialog(false);
    setQuantityDialogItem(null);
    setQuantityToProcess('');
  };

  const makeComplimentary = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    
    if (item.isComplimentary) {
      setCart(cart.map(i => 
        i.id === itemId 
          ? { ...i, isComplimentary: false, subtotal: i.quantity * i.unitPrice }
          : i
      ));
      toast.success('İkram iptal edildi');
    } else if (item.quantity > 1) {
      setQuantityDialogItem(item);
      setQuantityToProcess('');
      setShowComplimentaryQuantityDialog(true);
    } else {
      setCart(cart.map(i => 
        i.id === itemId 
          ? { ...i, isComplimentary: true, subtotal: 0 }
          : i
      ));
      toast.success(`${item.productName} ikram edildi`);
    }
  };

  const confirmComplimentaryQuantity = () => {
    if (!quantityDialogItem) return;
    
    const qty = parseInt(quantityToProcess);
    if (!qty || qty < 1) {
      toast.error('Geçerli bir miktar girin');
      return;
    }
    
    if (qty >= quantityDialogItem.quantity) {
      setCart(cart.map(item => 
        item.id === quantityDialogItem.id
          ? { ...item, isComplimentary: true, subtotal: 0 }
          : item
      ));
      toast.success(`${quantityDialogItem.productName} tamamen ikram edildi`);
    } else {
      const remainingQuantity = quantityDialogItem.quantity - qty;
      const newComplimentaryItem: CartItem = {
        ...quantityDialogItem,
        id: generateId(),
        quantity: qty,
        isComplimentary: true,
        subtotal: 0,
      };
      
      setCart([
        ...cart.map(item => 
          item.id === quantityDialogItem.id
            ? { ...item, quantity: remainingQuantity, subtotal: remainingQuantity * item.unitPrice }
            : item
        ),
        newComplimentaryItem
      ]);
      toast.success(`${qty} adet ${quantityDialogItem.productName} ikram edildi`);
    }
    
    setShowComplimentaryQuantityDialog(false);
    setQuantityDialogItem(null);
    setQuantityToProcess('');
  };

  const saveOrder = () => {
    if (cart.length === 0) {
      toast.error('Sepette ürün yok');
      return;
    }

    if (!selectedTable) {
      toast.error('Lütfen önce bir masa seçin');
      return;
    }

    const totals = calculateTotals();
    const saleId = selectedTable.currentSaleId || generateId();
    const now = new Date().toISOString();
    
    const currentSale = selectedTable.currentSaleId ? (sales || []).find(s => s.id === selectedTable.currentSaleId) : null;
    const existingPaidAmount = currentSale?.paidAmount || 0;
    
    const newSale: Sale = {
      id: saleId,
      branchId: 'branch-1',
      cashierId: 'cashier-1',
      saleNumber: generateSaleNumber(),
      saleDate: now,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: orderDiscount,
      totalAmount: totals.total,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      items: cart,
      paidAmount: existingPaidAmount,
      remainingAmount: totals.total,
    };

    if (selectedTable.currentSaleId) {
      setSales((currentSales) => 
        (currentSales || []).map(s => s.id === saleId ? newSale : s)
      );
      
      setTables((current) =>
        (current || []).map(t =>
          t.id === selectedTable.id
            ? { ...t, lastOrderTime: now }
            : t
        )
      );
    } else {
      setSales((currentSales) => [...(currentSales || []), newSale]);
      
      const existingOrder = (tableOrders || []).find(o => o.tableId === selectedTable.id && !o.closedAt);
      if (existingOrder) {
        setTableOrders((current) =>
          (current || []).map(o =>
            o.id === existingOrder.id
              ? { ...o, saleId: saleId }
              : o
          )
        );
      } else {
        const newOrder: TableOrder = {
          id: generateId(),
          tableId: selectedTable.id,
          saleId: saleId,
          openedAt: now,
          customersCount: undefined,
        };
        setTableOrders((current) => [...(current || []), newOrder]);
      }
      
      setTables((current) =>
        (current || []).map(t =>
          t.id === selectedTable.id
            ? { ...t, currentSaleId: saleId, status: 'occupied' as const, firstOrderTime: now, lastOrderTime: now }
            : t
        )
      );
    }

    toast.success(`Sipariş kaydedildi - Masa ${selectedTable.tableNumber}`);
    setCart([]);
    setOrderDiscount(0);
    setSelectedTable(null);
    setActiveTab('tables');
  };

  const deleteOrder = () => {
    if (!selectedTable || !selectedTable.currentSaleId) {
      toast.error('Silinecek sipariş yok');
      return;
    }

    setSales((currentSales) => 
      (currentSales || []).filter(s => s.id !== selectedTable.currentSaleId)
    );

    setTableOrders((current) =>
      (current || []).filter(o => o.saleId !== selectedTable.currentSaleId)
    );

    setTables((current) =>
      (current || []).map(t =>
        t.id === selectedTable.id
          ? { ...t, status: 'available' as const, currentSaleId: undefined, firstOrderTime: undefined, lastOrderTime: undefined }
          : t
      )
    );

    setCart([]);
    setOrderDiscount(0);
    setSelectedTable(null);
    toast.success('Sipariş silindi');
  };

  const transferItems = () => {
    if (!selectedTable || selectedItemsForTransfer.length === 0 || !transferTargetTable) {
      toast.error('Transfer için gerekli bilgiler eksik');
      return;
    }

    const targetTable = tables?.find(t => t.id === transferTargetTable);
    if (!targetTable) {
      toast.error('Hedef masa bulunamadı');
      return;
    }

    const itemsToTransfer = cart.filter(item => selectedItemsForTransfer.includes(item.id));
    const remainingItems = cart.filter(item => !selectedItemsForTransfer.includes(item.id));

    if (targetTable.currentSaleId) {
      const targetSale = (sales || []).find(s => s.id === targetTable.currentSaleId);
      if (targetSale) {
        setSales((currentSales) =>
          (currentSales || []).map(s =>
            s.id === targetTable.currentSaleId
              ? { ...s, items: [...s.items, ...itemsToTransfer] }
              : s
          )
        );
      }
    } else {
      const newSaleId = generateId();
      const totals = itemsToTransfer.reduce((acc, item) => ({
        subtotal: acc.subtotal + item.subtotal,
        taxAmount: acc.taxAmount + calculateTax(item.subtotal, item.taxRate),
      }), { subtotal: 0, taxAmount: 0 });

      const newSale: Sale = {
        id: newSaleId,
        branchId: 'branch-1',
        cashierId: 'cashier-1',
        saleNumber: generateSaleNumber(),
        saleDate: new Date().toISOString(),
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: 0,
        totalAmount: totals.subtotal + totals.taxAmount,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        items: itemsToTransfer,
      };

      setSales((currentSales) => [...(currentSales || []), newSale]);

      const newOrder: TableOrder = {
        id: generateId(),
        tableId: targetTable.id,
        saleId: newSaleId,
        openedAt: new Date().toISOString(),
        customersCount: targetTable.capacity,
      };
      setTableOrders((current) => [...(current || []), newOrder]);

      setTables((current) =>
        (current || []).map(t =>
          t.id === targetTable.id
            ? { ...t, currentSaleId: newSaleId, status: 'occupied' as const }
            : t
        )
      );
    }

    setCart(remainingItems);
    if (remainingItems.length === 0) {
      deleteOrder();
    } else if (selectedTable.currentSaleId) {
      const currentSale = (sales || []).find(s => s.id === selectedTable.currentSaleId);
      if (currentSale) {
        const totals = remainingItems.reduce((acc, item) => ({
          subtotal: acc.subtotal + item.subtotal,
          taxAmount: acc.taxAmount + calculateTax(item.subtotal, item.taxRate),
        }), { subtotal: 0, taxAmount: 0 });

        setSales((currentSales) =>
          (currentSales || []).map(s =>
            s.id === selectedTable.currentSaleId
              ? { ...s, items: remainingItems, subtotal: totals.subtotal, taxAmount: totals.taxAmount, totalAmount: totals.subtotal + totals.taxAmount }
              : s
          )
        );
      }
    }

    setSelectedItemsForTransfer([]);
    setShowTransferDialog(false);
    toast.success(`${itemsToTransfer.length} ürün Masa ${targetTable.tableNumber}'e taşındı`);
  };

  const applyDiscount = () => {
    const value = parseFloat(discountValue) || 0;
    const totals = calculateTotals();
    
    let discount = 0;
    if (discountType === 'percentage') {
      discount = (totals.subtotal * value) / 100;
    } else {
      discount = value;
    }

    if (discount > totals.total) {
      toast.error('İndirim tutarı toplam tutardan büyük olamaz');
      return;
    }

    setOrderDiscount(discount);
    setDiscountValue('0');
    toast.success(`${formatCurrency(discount)} indirim uygulandı`);
  };

  const addSplitPayment = () => {
    const amount = parseFloat(currentSplitAmount) || 0;
    if (amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    const totals = calculateTotals();
    const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = totals.total - totalPaid;
    
    if (amount > remaining + 0.01) {
      toast.error(`Ödeme tutarı kalan tutardan fazla olamaz (Kalan: ${formatCurrency(remaining)})`);
      return;
    }

    setSplitPayments([...splitPayments, { method: currentSplitMethod, amount }]);
    setCurrentSplitAmount('');
    setShowNumpad(false);
    toast.success('Ödeme eklendi');
  };

  const fillRemainingAmount = () => {
    const totals = calculateTotals();
    const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = totals.total - totalPaid;
    setCurrentSplitAmount(remaining.toFixed(2));
  };

  const removeSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = cart.reduce(
      (sum, item) => sum + (item.isComplimentary ? 0 : calculateTax(item.subtotal, item.taxRate)),
      0
    );
    return {
      subtotal,
      taxAmount,
      discount: orderDiscount,
      total: Math.max(0, subtotal + taxAmount - orderDiscount),
    };
  };

  const calculatePartialTotals = () => {
    const selectedItems = cart.filter(item => 
      selectedPaymentItems.some(si => si.itemId === item.id)
    );
    
    let subtotal = 0;
    let taxAmount = 0;
    
    selectedItems.forEach(item => {
      const selectedQty = selectedPaymentItems.find(si => si.itemId === item.id)?.quantity || 0;
      const itemSubtotal = item.unitPrice * selectedQty;
      subtotal += itemSubtotal;
      if (!item.isComplimentary) {
        taxAmount += calculateTax(itemSubtotal, item.taxRate);
      }
    });
    
    return {
      subtotal,
      taxAmount,
      discount: 0,
      total: Math.max(0, subtotal + taxAmount),
    };
  };

  const toggleItemForPartialPayment = (itemId: string, maxQuantity: number) => {
    const existing = selectedPaymentItems.find(si => si.itemId === itemId);
    
    if (existing) {
      setSelectedPaymentItems(selectedPaymentItems.filter(si => si.itemId !== itemId));
    } else {
      setSelectedPaymentItems([...selectedPaymentItems, { itemId, quantity: maxQuantity }]);
    }
  };

  const updatePartialPaymentQuantity = (itemId: string, quantity: number) => {
    setSelectedPaymentItems(selectedPaymentItems.map(si => 
      si.itemId === itemId ? { ...si, quantity } : si
    ));
  };

  const completePartialPayment = () => {
    if (selectedPaymentItems.length === 0) {
      toast.error('Ödeme için ürün seçin');
      return;
    }

    const partialTotals = calculatePartialTotals();
    const finalPaymentMethod = splitPayments.length > 0 ? 'card' : paymentMethod;

    const selectedPaymentMethodSetting = (settings?.paymentMethods || []).find(pm => pm.method === finalPaymentMethod);
    if (!selectedPaymentMethodSetting || !selectedPaymentMethodSetting.isActive) {
      toast.error(`${finalPaymentMethod} ödeme yöntemi şu anda pasif durumda. Lütfen başka bir yöntem seçin.`);
      return;
    }

    if (splitPayments.length > 0) {
      for (const split of splitPayments) {
        const splitMethodSetting = (settings?.paymentMethods || []).find(pm => pm.method === split.method);
        if (!splitMethodSetting || !splitMethodSetting.isActive) {
          toast.error(`${split.method} ödeme yöntemi şu anda pasif durumda. Lütfen parçalı ödemeleri kontrol edin.`);
          return;
        }
      }

      const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - partialTotals.total) > 0.01) {
        toast.error(`Toplam ödeme ${formatCurrency(totalPaid)} - Kalan: ${formatCurrency(partialTotals.total - totalPaid)}`);
        return;
      }
    }

    const paidItems: CartItem[] = [];
    const remainingItems: CartItem[] = [];

    cart.forEach(item => {
      const selectedItem = selectedPaymentItems.find(si => si.itemId === item.id);
      
      if (selectedItem) {
        if (selectedItem.quantity >= item.quantity) {
          paidItems.push(item);
        } else {
          paidItems.push({
            ...item,
            quantity: selectedItem.quantity,
            subtotal: item.unitPrice * selectedItem.quantity,
          });
          remainingItems.push({
            ...item,
            quantity: item.quantity - selectedItem.quantity,
            subtotal: item.unitPrice * (item.quantity - selectedItem.quantity),
          });
        }
      } else {
        remainingItems.push(item);
      }
    });

    const saleId = generateId();
    const newSale: Sale = {
      id: saleId,
      branchId: 'branch-1',
      cashierId: 'cashier-1',
      saleNumber: generateSaleNumber(),
      saleDate: new Date().toISOString(),
      subtotal: partialTotals.subtotal,
      taxAmount: partialTotals.taxAmount,
      discountAmount: 0,
      totalAmount: partialTotals.total,
      paymentMethod: finalPaymentMethod,
      paymentStatus: 'completed',
      items: paidItems,
      paidAmount: partialTotals.total,
      remainingAmount: 0,
      notes: splitPayments.length > 0 
        ? `Parçalı ödeme: ${splitPayments.map(p => `${p.method}=${formatCurrency(p.amount)}`).join(', ')}`
        : selectedTable 
          ? `Masa ${selectedTable.tableNumber} - Parçalı ödeme` 
          : 'Parçalı ödeme',
    };

    setSales((currentSales) => [...(currentSales || []), newSale]);
    updateCashRegister(finalPaymentMethod, partialTotals.total, splitPayments);

    deductStock(paidItems);

    setCart(remainingItems);

    if (selectedTable && remainingItems.length === 0) {
      setTables((current) =>
        (current || []).map(t =>
          t.id === selectedTable.id
            ? { ...t, status: 'available' as const, currentSaleId: undefined, firstOrderTime: undefined, lastOrderTime: undefined }
            : t
        )
      );

      const existingOrder = (tableOrders || []).find(o => o.tableId === selectedTable.id && !o.closedAt);
      if (existingOrder) {
        setTableOrders((current) =>
          (current || []).map(o =>
            o.id === existingOrder.id
              ? { ...o, closedAt: new Date().toISOString() }
              : o
          )
        );
      }

      setSelectedTable(null);
      setActiveTab('tables');
    } else if (selectedTable && selectedTable.currentSaleId) {
      const currentSale = (sales || []).find(s => s.id === selectedTable.currentSaleId);
      if (currentSale) {
        const totals = remainingItems.reduce((acc, item) => ({
          subtotal: acc.subtotal + item.subtotal,
          taxAmount: acc.taxAmount + calculateTax(item.subtotal, item.taxRate),
        }), { subtotal: 0, taxAmount: 0 });

        const currentPaidAmount = (currentSale.paidAmount || 0) + partialTotals.total;
        const totalTableAmount = totals.subtotal + totals.taxAmount + currentPaidAmount;
        const remainingTableAmount = Math.max(0, totals.subtotal + totals.taxAmount);

        setSales((currentSales) =>
          (currentSales || []).map(s =>
            s.id === selectedTable.currentSaleId
              ? { 
                  ...s, 
                  items: remainingItems, 
                  subtotal: totals.subtotal, 
                  taxAmount: totals.taxAmount, 
                  totalAmount: totals.subtotal + totals.taxAmount,
                  paidAmount: currentPaidAmount,
                  remainingAmount: remainingTableAmount,
                  paymentStatus: remainingTableAmount > 0 ? 'pending' as const : 'completed' as const,
                }
              : s
          )
        );
      }
    }

    toast.success(`Parçalı ödeme tamamlandı! Fiş No: ${newSale.saleNumber}`);
    setShowPartialPaymentDialog(false);
    setSelectedPaymentItems([]);
    setSplitPayments([]);
    setPaymentMethod('cash');
  };

  const splitCartEqually = (parts: number) => {
    if (parts < 2) {
      toast.error('En az 2 parçaya bölünebilir');
      return;
    }

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const itemsPerPart = Math.ceil(totalItems / parts);

    if (itemsPerPart < 1) {
      toast.error('Yeterli ürün yok');
      return;
    }

    const totals = calculateTotals();
    const amountPerPart = totals.total / parts;

    toast.success(`Sepet ${parts} kişiye bölünecek. Her kişi: ${formatCurrency(amountPerPart)}`);
    setShowCartSplitDialog(false);
  };

  const completeSale = () => {
    if (cart.length === 0) {
      toast.error('Sepette ürün yok');
      return;
    }

    const selectedPaymentMethodSetting = (settings?.paymentMethods || []).find(pm => pm.method === paymentMethod);
    if (!selectedPaymentMethodSetting || !selectedPaymentMethodSetting.isActive) {
      toast.error(`${paymentMethod} ödeme yöntemi şu anda pasif durumda. Lütfen başka bir yöntem seçin.`);
      return;
    }

    const totals = calculateTotals();

    if (splitPayments.length > 0) {
      for (const split of splitPayments) {
        const splitMethodSetting = (settings?.paymentMethods || []).find(pm => pm.method === split.method);
        if (!splitMethodSetting || !splitMethodSetting.isActive) {
          toast.error(`${split.method} ödeme yöntemi şu anda pasif durumda. Lütfen parçalı ödemeleri kontrol edin.`);
          return;
        }
      }

      const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPaid - totals.total) > 0.01) {
        toast.error(`Toplam ödeme ${formatCurrency(totalPaid)} - Kalan: ${formatCurrency(totals.total - totalPaid)}`);
        return;
      }
    }

    const saleId = selectedTable?.currentSaleId || generateId();
    const finalPaymentMethod = splitPayments.length > 0 ? 'card' : paymentMethod;
    
    const currentSale = selectedTable?.currentSaleId ? (sales || []).find(s => s.id === selectedTable.currentSaleId) : null;
    const previousPaidAmount = currentSale?.paidAmount || 0;
    const totalPaidAmount = previousPaidAmount + totals.total;
    
    const newSale: Sale = {
      id: saleId,
      branchId: 'branch-1',
      cashierId: 'cashier-1',
      saleNumber: generateSaleNumber(),
      saleDate: new Date().toISOString(),
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: orderDiscount,
      totalAmount: totals.total,
      paymentMethod: finalPaymentMethod,
      paymentStatus: 'completed',
      items: cart,
      paidAmount: totalPaidAmount,
      remainingAmount: 0,
      notes: splitPayments.length > 0 ? `Parçalı ödeme: ${splitPayments.map(p => `${p.method}=${formatCurrency(p.amount)}`).join(', ')}` : undefined,
    };

    if (selectedTable?.currentSaleId) {
      setSales((currentSales) => 
        (currentSales || []).map(s => s.id === saleId ? newSale : s)
      );
    } else {
      setSales((currentSales) => [...(currentSales || []), newSale]);
    }

    updateCashRegister(finalPaymentMethod, totals.total, splitPayments);

    deductStock(cart);

    if (selectedTable) {
      setTables((current) =>
        (current || []).map(t =>
          t.id === selectedTable.id
            ? { ...t, status: 'available' as const, currentSaleId: undefined, firstOrderTime: undefined, lastOrderTime: undefined }
            : t
        )
      );

      const existingOrder = (tableOrders || []).find(o => o.tableId === selectedTable.id && !o.closedAt);
      if (existingOrder) {
        setTableOrders((current) =>
          (current || []).map(o =>
            o.id === existingOrder.id
              ? { ...o, closedAt: new Date().toISOString() }
              : o
          )
        );
      }
    }
    
    toast.success(`Satış tamamlandı! Fiş No: ${newSale.saleNumber}`);
    setCart([]);
    setSelectedTable(null);
    setShowCheckout(false);
    setSplitPayments([]);
    setOrderDiscount(0);
    setPaymentMethod('cash');
    setCashReceived('');
    setActiveTab('tables');
  };

  const completeCustomerAccountSale = () => {
    if (!selectedCustomerAccount) {
      toast.error('Lütfen bir cari hesap seçin');
      return;
    }

    const account = (customerAccounts || []).find(a => a.id === selectedCustomerAccount);
    if (!account) {
      toast.error('Seçili hesap bulunamadı');
      return;
    }

    if (account.status !== 'active') {
      toast.error('Bu hesap aktif değil');
      return;
    }

    const totals = calculateTotals();

    if (cart.length === 0) {
      toast.error('Sepette ürün yok');
      return;
    }

    const saleId = selectedTable?.currentSaleId || generateId();
    
    const currentSale = selectedTable?.currentSaleId ? (sales || []).find(s => s.id === selectedTable.currentSaleId) : null;
    const previousPaidAmount = currentSale?.paidAmount || 0;
    const totalPaidAmount = previousPaidAmount + totals.total;
    
    const newSale: Sale = {
      id: saleId,
      branchId: 'branch-1',
      cashierId: 'cashier-1',
      saleNumber: generateSaleNumber(),
      saleDate: new Date().toISOString(),
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: orderDiscount,
      totalAmount: totals.total,
      paymentMethod: 'card',
      paymentStatus: 'completed',
      items: cart,
      paidAmount: totalPaidAmount,
      remainingAmount: 0,
      notes: `Cari Hesap: ${account.customerName} (${account.accountNumber})`,
    };

    if (selectedTable?.currentSaleId) {
      setSales((currentSales) => 
        (currentSales || []).map(s => s.id === saleId ? newSale : s)
      );
    } else {
      setSales((currentSales) => [...(currentSales || []), newSale]);
    }

    const balanceBefore = account.currentBalance;
    const balanceAfter = balanceBefore + totals.total;

    const transaction: CustomerTransaction = {
      id: generateId(),
      customerAccountId: account.id,
      type: 'debit',
      amount: totals.total,
      description: 'Satış',
      saleId: saleId,
      saleNumber: newSale.saleNumber,
      date: new Date().toISOString(),
      createdBy: 'current-user',
      createdByName: 'Kullanıcı',
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      notes: selectedTable ? `Masa ${selectedTable.tableNumber}` : undefined,
    };

    setCustomerTransactions((current) => [...(current || []), transaction]);

    const accountsToUpdate = customerAccounts || [];
    const updatedAccounts = accountsToUpdate.map((acc) =>
      acc.id === account.id
        ? {
            ...acc,
            currentBalance: balanceAfter,
            totalDebt: acc.totalDebt + totals.total,
          }
        : acc
    );

    (window as any).spark.kv.set('customerAccounts', updatedAccounts);

    deductStock(cart);

    if (selectedTable) {
      setTables((current) =>
        (current || []).map(t =>
          t.id === selectedTable.id
            ? { ...t, status: 'available' as const, currentSaleId: undefined, firstOrderTime: undefined, lastOrderTime: undefined }
            : t
        )
      );

      const existingOrder = (tableOrders || []).find(o => o.tableId === selectedTable.id && !o.closedAt);
      if (existingOrder) {
        setTableOrders((current) =>
          (current || []).map(o =>
            o.id === existingOrder.id
              ? { ...o, closedAt: new Date().toISOString() }
              : o
          )
        );
      }

      setSelectedTable(null);
      setActiveTab('tables');
    }

    toast.success(`Satış tamamlandı! Fiş No: ${newSale.saleNumber}. Müşteri borcu: ${formatCurrency(balanceAfter)}`);
    setCart([]);
    setOrderDiscount(0);
    setPaymentMethod('cash');
    setShowCustomerAccountDialog(false);
    setSelectedCustomerAccount('');
  };

  const deductStock = (items: CartItem[]) => {
    items.forEach(item => {
      if (!item.isComplimentary) {
        setProducts((currentProducts) =>
          (currentProducts || []).map((p) => {
            if (p.id === item.productId && p.trackStock !== false) {
              const newStock = Math.max(0, p.stock - item.quantity);
              if (newStock === 0) {
                toast.warning(`⚠️ ${p.name} stokta kalmadı!`);
              } else if (newStock <= p.minStockLevel) {
                toast.warning(`⚠️ ${p.name} stok seviyesi düşük (${newStock} ${p.unit})`);
              }
              return { ...p, stock: newStock };
            }
            return p;
          })
        );
      }
    });
  };

  const updateCashRegister = (method: PaymentMethod, amount: number, splits: SplitPayment[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    setCashRegister((current) => {
      if (!current || current.date !== today) {
        const newRegister: CashRegister = {
          id: generateId(),
          branchId: 'branch-1',
          date: today,
          openingBalance: current?.currentBalance || 0,
          currentBalance: current?.currentBalance || 0,
          totalCashSales: 0,
          totalCardSales: 0,
          totalMobileSales: 0,
          totalTransferSales: 0,
          totalMultinetSales: 0,
          totalSales: 0,
          lastUpdated: new Date().toISOString(),
        };
        current = newRegister;
      }

      let cashAmount = 0;
      let cardAmount = 0;
      let mobileAmount = 0;
      let transferAmount = 0;
      let multinetAmount = 0;

      if (splits.length > 0) {
        splits.forEach(split => {
          if (split.method === 'cash') cashAmount += split.amount;
          else if (split.method === 'card') cardAmount += split.amount;
          else if (split.method === 'mobile') mobileAmount += split.amount;
          else if (split.method === 'transfer') transferAmount += split.amount;
          else if (split.method === 'multinet') multinetAmount += split.amount;
        });
      } else {
        if (method === 'cash') cashAmount = amount;
        else if (method === 'card') cardAmount = amount;
        else if (method === 'mobile') mobileAmount = amount;
        else if (method === 'transfer') transferAmount = amount;
        else if (method === 'multinet') multinetAmount = amount;
      }

      return {
        ...current,
        currentBalance: current.currentBalance + cashAmount,
        totalCashSales: current.totalCashSales + cashAmount,
        totalCardSales: current.totalCardSales + cardAmount,
        totalMobileSales: current.totalMobileSales + mobileAmount,
        totalTransferSales: current.totalTransferSales + transferAmount,
        totalMultinetSales: current.totalMultinetSales + multinetAmount,
        totalSales: current.totalSales + amount,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">POS - Satış Noktası</h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">Hızlı satış işlemleri ve masa yönetimi</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {selectedTable && (
            <>
              <Badge variant="default" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 shrink-0">
                <TableIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" weight="bold" />
                Masa {selectedTable.tableNumber}
              </Badge>
              {selectedTable.currentSaleId && (
                <Button variant="outline" size="sm" onClick={() => setShowOrderDetailsDialog(true)} className="text-xs shrink-0">
                  <Eye className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Sipariş Detayları</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowTransferDialog(true)} disabled={cart.length === 0} className="shrink-0">
                <ArrowsLeftRight className="h-4 w-4 sm:h-5 sm:w-5" weight="bold" />
              </Button>
            </>
          )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'quick-sale' | 'tables')} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="quick-sale" className="flex-1 sm:flex-none">Hızlı Satış</TabsTrigger>
          <TabsTrigger value="tables" className="flex-1 sm:flex-none">Masalar</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-sale" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4">
              {campaignProducts.length > 0 && (
                <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkle className="h-4 w-4 text-accent animate-pulse" weight="fill" />
                      <CardTitle className="text-base text-accent">Aktif Kampanyalar</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      İndirimli ürünler - müşterilere öner!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {campaignProducts.slice(0, 6).map((product) => (
                        <Card
                          key={product.id}
                          className="hover:shadow-md transition-all border-accent/50 bg-card relative overflow-hidden"
                        >
                          <CardContent className="p-2 space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs leading-tight truncate">{product.name}</p>
                                {product.hasOptions && product.options && product.options.length > 0 && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 mt-0.5">
                                    Seçenekli
                                  </Badge>
                                )}
                              </div>
                              <Gift className="h-3 w-3 text-accent flex-shrink-0" weight="fill" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {formatCurrency(product.campaignDetails?.originalPrice || 0)}
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-3.5 px-1">
                                  %{product.campaignDetails?.discountPercentage}
                                </Badge>
                              </div>
                              <div className="text-sm font-bold text-accent">
                                {formatCurrency(product.basePrice)}
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 pt-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-5 text-[9px] px-0.5 relative overflow-hidden"
                                onClick={(e) => {
                                  const ripple = document.createElement('span');
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const size = Math.max(rect.width, rect.height);
                                  const x = e.clientX - rect.left - size / 2;
                                  const y = e.clientY - rect.top - size / 2;
                                  
                                  ripple.style.width = ripple.style.height = `${size}px`;
                                  ripple.style.left = `${x}px`;
                                  ripple.style.top = `${y}px`;
                                  ripple.style.background = getRippleColor(product);
                                  ripple.classList.add('ripple-effect');
                                  
                                  e.currentTarget.appendChild(ripple);
                                  
                                  setTimeout(() => ripple.remove(), 600);
                                  e.stopPropagation();
                                  addToCart(product, 1);
                                }}
                              >
                                +1
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-5 text-[9px] px-0.5 relative overflow-hidden"
                                onClick={(e) => {
                                  const ripple = document.createElement('span');
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const size = Math.max(rect.width, rect.height);
                                  const x = e.clientX - rect.left - size / 2;
                                  const y = e.clientY - rect.top - size / 2;
                                  
                                  ripple.style.width = ripple.style.height = `${size}px`;
                                  ripple.style.left = `${x}px`;
                                  ripple.style.top = `${y}px`;
                                  ripple.style.background = getRippleColor(product);
                                  ripple.classList.add('ripple-effect');
                                  
                                  e.currentTarget.appendChild(ripple);
                                  
                                  setTimeout(() => ripple.remove(), 600);
                                  e.stopPropagation();
                                  addToCart(product, 2);
                                }}
                              >
                                +2
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-5 text-[9px] px-0.5 relative overflow-hidden"
                                onClick={(e) => {
                                  const ripple = document.createElement('span');
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const size = Math.max(rect.width, rect.height);
                                  const x = e.clientX - rect.left - size / 2;
                                  const y = e.clientY - rect.top - size / 2;
                                  
                                  ripple.style.width = ripple.style.height = `${size}px`;
                                  ripple.style.left = `${x}px`;
                                  ripple.style.top = `${y}px`;
                                  ripple.style.background = getRippleColor(product);
                                  ripple.classList.add('ripple-effect');
                                  
                                  e.currentTarget.appendChild(ripple);
                                  
                                  setTimeout(() => ripple.remove(), 600);
                                  e.stopPropagation();
                                  addToCart(product, 3);
                                }}
                              >
                                +3
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Ürün Ara</CardTitle>
                    {!selectedTable && (
                      <Button size="sm" variant="outline" onClick={() => setShowTableSelect(true)}>
                        <TableIcon className="h-4 w-4 mr-2" />
                        Masa Seç
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Ürün adı veya SKU ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory('all')}
                    >
                      Tümü
                    </Button>
                    {visibleCategories.map((category) => (
                      <Button
                        key={category.id}
                        size="sm"
                        variant={selectedCategory === category.id || selectedCategory === category.name ? 'default' : 'outline'}
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Collapsible open={isLegendOpen} onOpenChange={setIsLegendOpen}>
                <Card className="bg-muted/30">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/80 to-primary" />
                          Kategori Renk Kodu
                        </div>
                        <CaretDown 
                          className={`h-4 w-4 transition-transform duration-200 ${isLegendOpen ? 'rotate-180' : ''}`}
                          weight="bold"
                        />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(16, 185, 129, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Kampanya</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">İçecekler</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(249, 115, 22, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Yiyecekler</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(236, 72, 153, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Tatlılar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(234, 179, 8, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Kahvaltı</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Ana Yemek</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(168, 85, 247, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Aperatifler</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Salatalar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(190, 18, 60, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Alkollü</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(14, 165, 233, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Alkolsüz</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'rgba(217, 70, 239, 0.8)' }} />
                          <span className="text-xs text-muted-foreground">Sıcak İçecek</span>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {filteredProducts.map((product) => {
                  const hasCampaign = product.hasActiveCampaign && product.campaignDetails;
                  const isNew = isRecentlyAdded((product as any).createdAt);
                  return (
                    <motion.div
                      key={product.id}
                      whileTap={{ scale: 0.95 }}
                      className="relative overflow-hidden"
                    >
                      <Card
                        className={`hover:shadow-lg transition-all cursor-pointer relative overflow-hidden ${hasCampaign ? 'ring-2 ring-accent bg-accent/5' : ''}`}
                        onClick={(e) => {
                          const ripple = document.createElement('span');
                          const rect = e.currentTarget.getBoundingClientRect();
                          const size = Math.max(rect.width, rect.height);
                          const x = e.clientX - rect.left - size / 2;
                          const y = e.clientY - rect.top - size / 2;
                          
                          ripple.style.width = ripple.style.height = `${size}px`;
                          ripple.style.left = `${x}px`;
                          ripple.style.top = `${y}px`;
                          ripple.style.background = getRippleColor(product);
                          ripple.classList.add('ripple-effect');
                          
                          e.currentTarget.appendChild(ripple);
                          
                          setTimeout(() => ripple.remove(), 600);
                          addToCart(product, 1);
                        }}
                      >
                        <CardContent className="p-2 space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs leading-tight truncate">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {isNew && (
                                  <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] h-4 px-1">
                                    <Sparkle className="h-2.5 w-2.5 mr-0.5" weight="fill" />
                                    Yeni
                                  </Badge>
                                )}
                                {hasCampaign && (
                                  <Badge variant="default" className="bg-accent animate-pulse text-[10px] h-4 px-1">
                                    <Gift className="h-2.5 w-2.5 mr-0.5" weight="fill" />
                                    Kampanya
                                  </Badge>
                                )}
                                {product.hasOptions && product.options && product.options.length > 0 && (
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                    Seçenekli
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant={product.stock > product.minStockLevel ? 'default' : 'destructive'} className="text-[10px] h-4 px-1 shrink-0">
                              {product.stock}
                            </Badge>
                          </div>
                          
                          {hasCampaign && product.campaignDetails && (
                            <div className="pt-1 mt-1 border-t border-accent/20 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="line-through text-muted-foreground text-[10px]">
                                  {formatCurrency(product.campaignDetails.originalPrice)}
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-3.5 px-1">
                                  %{product.campaignDetails.discountPercentage}
                                </Badge>
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-1 text-center">
                            <span className={`text-lg font-bold font-tabular-nums block ${hasCampaign ? 'text-accent' : ''}`}>
                              {formatCurrency(product.basePrice)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" weight="bold" />
                      <CardTitle className="text-lg">Sepet</CardTitle>
                    </div>
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => { setCart([]); setOrderDiscount(0); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Sepet boş
                    </p>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className={`space-y-2 p-3 rounded-lg ${item.isComplimentary ? 'bg-accent/20 border border-accent' : 'bg-muted/50'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm leading-tight">
                                    {item.productName}
                                  </p>
                                  {item.isComplimentary && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Gift className="h-3 w-3 mr-1" />
                                      İkram
                                    </Badge>
                                  )}
                                </div>
                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                  <p className="text-xs text-muted-foreground italic mt-1">
                                    {item.selectedOptions.map(opt => opt.choiceName).join(', ')}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground font-tabular-nums">
                                  {formatCurrency(item.unitPrice)} × {item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => makeComplimentary(item.id)}
                                  title="İkram et"
                                >
                                  <Gift className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center font-tabular-nums">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className={`text-sm font-semibold font-tabular-nums ${item.isComplimentary ? 'line-through text-muted-foreground' : ''}`}>
                                {formatCurrency(item.isComplimentary ? item.quantity * item.unitPrice : item.subtotal)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ara Toplam</span>
                          <span className="font-tabular-nums">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">KDV</span>
                          <span className="font-tabular-nums">{formatCurrency(totals.taxAmount)}</span>
                        </div>
                        {orderDiscount > 0 && (
                          <div className="flex items-center justify-between text-sm text-destructive">
                            <span>İndirim</span>
                            <span className="font-tabular-nums">-{formatCurrency(orderDiscount)}</span>
                          </div>
                        )}
                        <Separator />
                        {selectedTable?.currentSaleId && (() => {
                          const currentSale = (sales || []).find(s => s.id === selectedTable.currentSaleId);
                          const paidAmount = currentSale?.paidAmount || 0;
                          const remainingAmount = totals.total;
                          
                          if (paidAmount > 0) {
                            return (
                              <>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-emerald-600 font-medium">Alınan Ödeme</span>
                                  <span className="font-tabular-nums text-emerald-600 font-semibold">
                                    {formatCurrency(paidAmount)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-amber-600">Kalan Ödeme</span>
                                  <span className="text-xl font-bold font-tabular-nums text-amber-600">
                                    {formatCurrency(remainingAmount)}
                                  </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold">Genel Toplam</span>
                                  <span className="text-xl font-bold font-tabular-nums">
                                    {formatCurrency(paidAmount + remainingAmount)}
                                  </span>
                                </div>
                              </>
                            );
                          }
                          return null;
                        })()}
                        {(!selectedTable?.currentSaleId || !((sales || []).find(s => s.id === selectedTable.currentSaleId)?.paidAmount)) && (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Toplam</span>
                            <span className="text-xl font-bold font-tabular-nums">
                              {formatCurrency(totals.total)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {selectedTable && (
                            <Button
                              variant="outline"
                              size="lg"
                              className="flex-1"
                              onClick={saveOrder}
                            >
                              <FloppyDisk className="h-5 w-5 mr-2" weight="bold" />
                              Kaydet
                            </Button>
                          )}
                          {!isWaiter && (
                            <Button
                              className="flex-1"
                              size="lg"
                              onClick={() => setShowCheckout(true)}
                            >
                              <Check className="h-5 w-5 mr-2" weight="bold" />
                              Ödeme Al
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Collapsible open={isTableLegendOpen} onOpenChange={setIsTableLegendOpen}>
            <Card className="bg-muted/30">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4" weight="fill" />
                      Masa Durumu Açıklaması
                    </div>
                    <CaretDown 
                      className={`h-4 w-4 transition-transform duration-200 ${isTableLegendOpen ? 'rotate-180' : ''}`}
                      weight="bold"
                    />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/50 border border-emerald-500/30">
                      <div className="h-8 w-8 rounded-md bg-emerald-500 flex items-center justify-center">
                        <TableIcon className="h-5 w-5 text-white" weight="bold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Boş Masa</p>
                        <p className="text-xs text-muted-foreground">Hazır ve müsait</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 border border-amber-500/30">
                      <div className="h-8 w-8 rounded-md bg-amber-500 flex items-center justify-center">
                        <TableIcon className="h-5 w-5 text-white" weight="bold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Dolu Masa</p>
                        <p className="text-xs text-muted-foreground">Aktif sipariş var</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                      <div className="h-8 w-8 rounded-md bg-destructive flex items-center justify-center">
                        <Warning className="h-5 w-5 text-white" weight="bold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tembel Masa</p>
                        <p className="text-xs text-muted-foreground">{lazyTableWarningMinutes}+ dk bekleme</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Card>
            <CardHeader>
              <CardTitle>Masa Yönetimi</CardTitle>
              <CardDescription>Mevcut masaları görüntüle ve yönet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {availableTables.map((table) => {
                  const hasOrder = table.status === 'occupied' && table.currentSaleId;
                  const isLazy = isLazyTable(table);
                  const duration = getOrderDuration(table);
                  const minutesSinceLastOrder = getTimeSinceLastOrder(table);
                  
                  return (
                    <Card
                      key={table.id}
                      className={`cursor-pointer transition-all hover:shadow-md relative ${
                        hasOrder ? 'border-amber-500 bg-amber-50/50' : 'border-emerald-500 bg-emerald-50/50'
                      } ${selectedTable?.id === table.id ? 'ring-2 ring-primary' : ''} ${
                        isLazy ? 'ring-2 ring-destructive' : ''
                      }`}
                      onClick={() => selectTable(table)}
                    >
                      {isLazy && (
                        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-md z-10">
                          <Warning className="h-3 w-3" weight="bold" />
                          TEMBEL MASA
                        </div>
                      )}
                      <CardContent className="p-6 text-center space-y-2">
                        <TableIcon
                          className={`h-10 w-10 mx-auto ${
                            hasOrder ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                          weight="bold"
                        />
                        <div>
                          <p className="font-semibold text-lg">Masa {table.tableNumber}</p>
                          <Badge
                            variant={hasOrder ? 'default' : 'secondary'}
                            className={`text-xs mt-1 ${hasOrder ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                          >
                            {hasOrder ? 'Dolu' : 'Boş'}
                          </Badge>
                        </div>
                        {hasOrder && (
                          <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t">
                            {duration && (
                              <div className="flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Süre: {duration}</span>
                              </div>
                            )}
                            {minutesSinceLastOrder !== null && (
                              <div className="flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Son: {minutesSinceLastOrder}dk</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showTableSelect} onOpenChange={setShowTableSelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masa Seç</DialogTitle>
            <DialogDescription>
              Sipariş için bir masa seçin
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {availableTables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  table.status === 'occupied' ? 'border-accent' : ''
                }`}
                onClick={() => selectTable(table)}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <TableIcon
                    className={`h-8 w-8 mx-auto ${
                      table.status === 'occupied' ? 'text-accent' : 'text-muted-foreground'
                    }`}
                    weight="bold"
                  />
                  <div>
                    <p className="font-medium">Masa {table.tableNumber}</p>
                    <Badge
                      variant={table.status === 'occupied' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {table.status === 'occupied' ? 'Dolu' : 'Boş'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderDetailsDialog} onOpenChange={setShowOrderDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sipariş Detayları - Masa {selectedTable?.tableNumber}</DialogTitle>
            <DialogDescription>
              Masa siparişi detaylarını görüntüle ve yönet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Sipariş bulunamadı</p>
            ) : (
              <>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className={`p-3 rounded-lg border ${item.isComplimentary ? 'bg-accent/20 border-accent' : 'bg-muted/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.productName}</p>
                            {item.isComplimentary && (
                              <Badge variant="secondary" className="text-xs">
                                <Gift className="h-3 w-3 mr-1" />
                                İkram
                              </Badge>
                            )}
                          </div>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              {item.selectedOptions.map(opt => opt.choiceName).join(', ')}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground font-tabular-nums">
                            {item.quantity} adet × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <span className={`font-semibold font-tabular-nums ${item.isComplimentary ? 'line-through text-muted-foreground' : ''}`}>
                          {formatCurrency(item.isComplimentary ? item.quantity * item.unitPrice : item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ara Toplam</span>
                    <span className="font-tabular-nums">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">KDV</span>
                    <span className="font-tabular-nums">{formatCurrency(totals.taxAmount)}</span>
                  </div>
                  {orderDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm text-destructive">
                      <span>İndirim</span>
                      <span className="font-tabular-nums">-{formatCurrency(orderDiscount)}</span>
                    </div>
                  )}
                  <Separator />
                  {selectedTable?.currentSaleId && (() => {
                    const currentSale = (sales || []).find(s => s.id === selectedTable.currentSaleId);
                    const paidAmount = currentSale?.paidAmount || 0;
                    const remainingAmount = totals.total;
                    
                    if (paidAmount > 0) {
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-emerald-600 font-medium">Alınan Ödeme</span>
                            <span className="font-tabular-nums text-emerald-600 font-semibold">
                              {formatCurrency(paidAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-600">Kalan Ödeme</span>
                            <span className="text-lg font-bold font-tabular-nums text-amber-600">
                              {formatCurrency(remainingAmount)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Genel Toplam</span>
                            <span className="text-xl font-bold font-tabular-nums">
                              {formatCurrency(paidAmount + remainingAmount)}
                            </span>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                  {(!selectedTable?.currentSaleId || !((sales || []).find(s => s.id === selectedTable.currentSaleId)?.paidAmount)) && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Toplam</span>
                      <span className="text-xl font-bold font-tabular-nums">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      deleteOrder();
                      setShowOrderDetailsDialog(false);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Siparişi Sil
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowOrderDetailsDialog(false)}
                  >
                    Kapat
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ürün Taşı</DialogTitle>
            <DialogDescription>
              Başka bir masaya taşınacak ürünleri seçin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    checked={selectedItemsForTransfer.includes(item.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedItemsForTransfer([...selectedItemsForTransfer, item.id]);
                      } else {
                        setSelectedItemsForTransfer(selectedItemsForTransfer.filter(id => id !== item.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} adet × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-semibold font-tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Hedef Masa</Label>
              <Select value={transferTargetTable} onValueChange={setTransferTargetTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Masa seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables
                    .filter(t => t.id !== selectedTable?.id)
                    .map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Masa {table.tableNumber} ({table.status === 'occupied' ? 'Dolu' : 'Boş'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTransferDialog(false);
              setSelectedItemsForTransfer([]);
              setTransferTargetTable('');
            }}>
              İptal
            </Button>
            <Button onClick={transferItems} disabled={selectedItemsForTransfer.length === 0 || !transferTargetTable}>
              <ArrowsLeftRight className="h-4 w-4 mr-2" weight="bold" />
              Taşı
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCheckout} onOpenChange={(open) => {
        setShowCheckout(open);
        if (!open) {
          setCashReceived('');
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ödeme İşlemleri</DialogTitle>
            <DialogDescription>
              Ödeme türünü seçin veya doğrudan ödeme alın
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex-col gap-3"
                onClick={() => {
                  setShowCheckout(false);
                  setSelectedPaymentItems([]);
                  setShowPartialPaymentDialog(true);
                }}
              >
                <Users className="h-10 w-10" weight="bold" />
                <div className="text-center">
                  <div className="font-semibold">Parçalı Ödeme</div>
                  <div className="text-xs text-muted-foreground">Ürün seçerek ödeme al</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex-col gap-3"
                onClick={() => {
                  setShowCheckout(false);
                  setShowCartSplitDialog(true);
                }}
              >
                <ArrowsLeftRight className="h-10 w-10" weight="bold" />
                <div className="text-center">
                  <div className="font-semibold">Sepeti Böl</div>
                  <div className="text-xs text-muted-foreground">Eşit bölümlere ayır</div>
                </div>
              </Button>
            </div>

            <Separator />
            
            <Tabs defaultValue="payment" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="payment">Ödeme</TabsTrigger>
                <TabsTrigger value="discount">İndirim</TabsTrigger>
                <TabsTrigger value="split">Çoklu Ödeme</TabsTrigger>
              </TabsList>

              <TabsContent value="payment" className="space-y-4">
                <div className="space-y-3">
                  <Label>Ödeme Yöntemi</Label>
                  <div className={`grid gap-3 ${activePaymentMethods.length >= 5 ? 'grid-cols-2' : activePaymentMethods.length === 4 ? 'grid-cols-2' : activePaymentMethods.length === 3 ? 'grid-cols-3' : activePaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {activePaymentMethods.map((pm) => {
                      const Icon = pm.method === 'cash' ? Money : pm.method === 'card' ? CreditCard : pm.method === 'mobile' ? DeviceMobile : pm.method === 'transfer' ? Bank : Ticket;
                      return (
                        <Button
                          key={pm.method}
                          variant={paymentMethod === pm.method ? 'default' : 'outline'}
                          className="h-24 flex-col gap-2"
                          onClick={() => {
                            setPaymentMethod(pm.method);
                            if (pm.method !== 'cash') {
                              setCashReceived('');
                            }
                          }}
                        >
                          <Icon className="h-8 w-8" weight="bold" />
                          <span className="text-xs sm:text-sm">{pm.displayName}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-20 flex-col gap-2"
                    onClick={() => {
                      setShowCheckout(false);
                      setShowCustomerAccountDialog(true);
                    }}
                  >
                    <Users className="h-8 w-8" weight="bold" />
                    <span>Cari Hesap (Açık Hesap)</span>
                  </Button>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="space-y-2">
                    <Label>Alınan Tutar (Opsiyonel)</Label>
                    <Input
                      type="number"
                      placeholder="Müşteriden alınan nakit tutar"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    {cashReceived && parseFloat(cashReceived) > 0 && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-emerald-700">Para Üstü</span>
                          <span className="text-lg font-bold text-emerald-700 font-tabular-nums">
                            {formatCurrency(Math.max(0, parseFloat(cashReceived) - totals.total))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ara Toplam</span>
                    <span className="font-tabular-nums">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">KDV</span>
                    <span className="font-tabular-nums">{formatCurrency(totals.taxAmount)}</span>
                  </div>
                  {orderDiscount > 0 && (
                    <div className="flex items-center justify-between text-destructive">
                      <span className="text-sm">İndirim</span>
                      <span className="font-tabular-nums">-{formatCurrency(orderDiscount)}</span>
                    </div>
                  )}
                  <Separator />
                  {selectedTable?.currentSaleId && (() => {
                    const currentSale = (sales || []).find(s => s.id === selectedTable.currentSaleId);
                    const paidAmount = currentSale?.paidAmount || 0;
                    
                    if (paidAmount > 0) {
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-600 font-medium">Alınan Ödeme</span>
                            <span className="font-tabular-nums text-emerald-600 font-semibold">
                              {formatCurrency(paidAmount)}
                            </span>
                          </div>
                          <Separator />
                        </>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Ödenecek Tutar</span>
                    <span className="text-xl font-bold font-tabular-nums text-accent">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
                </div>
              </TabsContent>

            <TabsContent value="discount" className="space-y-4">
              <div className="space-y-2">
                <Label>İndirim Tipi</Label>
                <Select value={discountType} onValueChange={(value: 'percentage' | 'amount') => setDiscountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Yüzde (%)</SelectItem>
                    <SelectItem value="amount">Tutar (₺)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>İndirim {discountType === 'percentage' ? 'Yüzdesi' : 'Tutarı'}</Label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? '0' : '0.00'}
                  min="0"
                  max={discountType === 'percentage' ? '100' : totals.subtotal.toString()}
                />
              </div>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Ara Toplam</span>
                  <span className="font-tabular-nums">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>İndirim Tutarı</span>
                  <span className="font-tabular-nums text-destructive">
                    -{formatCurrency(
                      discountType === 'percentage' 
                        ? (totals.subtotal * (parseFloat(discountValue) || 0)) / 100
                        : parseFloat(discountValue) || 0
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Yeni Toplam</span>
                  <span className="font-tabular-nums">
                    {formatCurrency(
                      Math.max(0, totals.subtotal + totals.taxAmount - (
                        discountType === 'percentage' 
                          ? (totals.subtotal * (parseFloat(discountValue) || 0)) / 100
                          : parseFloat(discountValue) || 0
                      ))
                    )}
                  </span>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => {
                  applyDiscount();
                }}
              >
                <Percent className="h-4 w-4 mr-2" weight="bold" />
                İndirim Uygula
              </Button>
            </TabsContent>

            <TabsContent value="split" className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toplam Tutar</span>
                  <span className="font-bold font-tabular-nums text-lg">{formatCurrency(totals.total)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Alınan Ödeme</span>
                  <span className="font-tabular-nums text-emerald-600 font-semibold">
                    {formatCurrency(splitPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Kalan Ödeme</span>
                  <span className="font-bold font-tabular-nums text-accent">
                    {formatCurrency(totals.total - splitPayments.reduce((sum, p) => sum + p.amount, 0))}
                  </span>
                </div>
              </div>

              {splitPayments.length > 0 && (
                <div className="space-y-2">
                  <Label>Eklenen Ödemeler</Label>
                  <div className="space-y-2">
                    {splitPayments.map((payment, index) => {
                      const pm = activePaymentMethods.find(p => p.method === payment.method);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm font-medium">{pm?.displayName}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold font-tabular-nums">{formatCurrency(payment.amount)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeSplitPayment(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label>Yeni Ödeme Ekle</Label>
                <div className="grid grid-cols-3 gap-2">
                  {activePaymentMethods.map((pm) => {
                    const Icon = pm.method === 'cash' ? Money : pm.method === 'card' ? CreditCard : pm.method === 'mobile' ? DeviceMobile : pm.method === 'transfer' ? Bank : Ticket;
                    return (
                      <Button
                        key={pm.method}
                        variant={currentSplitMethod === pm.method ? 'default' : 'outline'}
                        className="h-16 flex-col gap-1"
                        onClick={() => setCurrentSplitMethod(pm.method)}
                      >
                        <Icon className="h-6 w-6" weight="bold" />
                        <span className="text-xs">{pm.displayName}</span>
                      </Button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Tutar"
                      value={currentSplitAmount}
                      onChange={(e) => setCurrentSplitAmount(e.target.value)}
                      onClick={() => setShowNumpad(true)}
                      readOnly
                      min="0"
                      step="0.01"
                    />
                    <Button variant="outline" onClick={fillRemainingAmount}>
                      Kalan
                    </Button>
                    <Button onClick={addSplitPayment}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ekle
                    </Button>
                  </div>
                  {showNumpad && (
                    <Numpad
                      value={currentSplitAmount}
                      onChange={setCurrentSplitAmount}
                      onEnter={addSplitPayment}
                    />
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCheckout(false);
              setSplitPayments([]);
              setCashReceived('');
            }}>
              İptal
            </Button>
            <Button 
              onClick={() => {
                if (splitPayments.length > 0) {
                  const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
                  if (Math.abs(totalPaid - totals.total) > 0.01) {
                    toast.error(`Toplam ödeme ${formatCurrency(totalPaid)} - Kalan: ${formatCurrency(totals.total - totalPaid)}`);
                    return;
                  }
                }
                completeSale();
              }}
              disabled={splitPayments.length > 0 && Math.abs(splitPayments.reduce((sum, p) => sum + p.amount, 0) - totals.total) > 0.01}
            >
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Satışı Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGuestCountDialog} onOpenChange={(open) => {
        if (!open) {
          setShowGuestCountDialog(false);
          setPendingTable(null);
          setGuestCount('');
        }
      }}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Kişi Sayısı Gir</DialogTitle>
            <DialogDescription>
              {pendingTable ? `Masa ${pendingTable.tableNumber} için kişi sayısı girin` : 'Kişi sayısı girin'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kişi Sayısı</Label>
              <Input
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="Örn: 4"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    confirmGuestCount();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGuestCountDialog(false);
                setPendingTable(null);
                setGuestCount('');
              }}
            >
              İptal
            </Button>
            <Button onClick={confirmGuestCount}>
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRemoveQuantityDialog} onOpenChange={setShowRemoveQuantityDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Çıkarılacak Miktarı Gir</DialogTitle>
            <DialogDescription>
              {quantityDialogItem ? `${quantityDialogItem.productName} - Sepette: ${quantityDialogItem.quantity} adet` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Çıkarılacak Miktar</Label>
              <Input
                type="number"
                min="1"
                max={quantityDialogItem?.quantity}
                value={quantityToProcess}
                onChange={(e) => setQuantityToProcess(e.target.value)}
                placeholder={`1 - ${quantityDialogItem?.quantity}`}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    confirmRemoveQuantity();
                  }
                }}
              />
              <div className="flex gap-2">
                {[1, 2, 3, 5].filter(n => (quantityDialogItem?.quantity || 0) >= n).map(num => (
                  <Button
                    key={num}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantityToProcess(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantityToProcess((quantityDialogItem?.quantity || 0).toString())}
                >
                  Tümü
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveQuantityDialog(false);
                setQuantityDialogItem(null);
                setQuantityToProcess('');
              }}
            >
              İptal
            </Button>
            <Button onClick={confirmRemoveQuantity}>
              <Trash className="h-4 w-4 mr-2" />
              Çıkar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showComplimentaryQuantityDialog} onOpenChange={setShowComplimentaryQuantityDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>İkram Edilecek Miktarı Gir</DialogTitle>
            <DialogDescription>
              {quantityDialogItem ? `${quantityDialogItem.productName} - Sepette: ${quantityDialogItem.quantity} adet` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>İkram Edilecek Miktar</Label>
              <Input
                type="number"
                min="1"
                max={quantityDialogItem?.quantity}
                value={quantityToProcess}
                onChange={(e) => setQuantityToProcess(e.target.value)}
                placeholder={`1 - ${quantityDialogItem?.quantity}`}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    confirmComplimentaryQuantity();
                  }
                }}
              />
              <div className="flex gap-2">
                {[1, 2, 3, 5].filter(n => (quantityDialogItem?.quantity || 0) >= n).map(num => (
                  <Button
                    key={num}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantityToProcess(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantityToProcess((quantityDialogItem?.quantity || 0).toString())}
                >
                  Tümü
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowComplimentaryQuantityDialog(false);
                setQuantityDialogItem(null);
                setQuantityToProcess('');
              }}
            >
              İptal
            </Button>
            <Button onClick={confirmComplimentaryQuantity}>
              <Gift className="h-4 w-4 mr-2" weight="fill" />
              İkram Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCartSplitDialog} onOpenChange={setShowCartSplitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sepeti Böl</DialogTitle>
            <DialogDescription>
              Sepetteki ürünleri kaç kişiye böleceğinizi seçin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <Button
                  key={num}
                  variant={cartSplitCount === num ? 'default' : 'outline'}
                  onClick={() => setCartSplitCount(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>veya Özel Sayı</Label>
              <Input
                type="number"
                min="2"
                placeholder="Özel bir sayı girin"
                onFocus={() => setCartSplitCount('custom')}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val && val >= 2) {
                    setCartSplitCount(val);
                  }
                }}
              />
            </div>
            {typeof cartSplitCount === 'number' && cartSplitCount >= 2 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  Her kişi ödeyecek:
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(calculateTotals().total / cartSplitCount)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCartSplitDialog(false);
                setCartSplitCount(2);
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={() => {
                if (typeof cartSplitCount === 'number') {
                  splitCartEqually(cartSplitCount);
                }
              }}
              disabled={typeof cartSplitCount !== 'number' || cartSplitCount < 2}
            >
              Böl
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPartialPaymentDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPartialPaymentDialog(false);
          setSelectedPaymentItems([]);
          setSplitPayments([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Parçalı Ödeme - Ürün Seç</DialogTitle>
            <DialogDescription>
              Ödeme alınacak ürünleri seçin ve miktarlarını belirleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Sepetteki Ürünler</Label>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {cart.map((item) => {
                    const selectedItem = selectedPaymentItems.find(si => si.itemId === item.id);
                    const isSelected = !!selectedItem;
                    
                    return (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                        onClick={() => toggleItemForPartialPayment(item.id, item.quantity)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={isSelected} onCheckedChange={() => {}} />
                                  <div>
                                    <p className="font-medium">{item.productName}</p>
                                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                                      <p className="text-xs text-muted-foreground italic">
                                        {item.selectedOptions.map(opt => opt.choiceName).join(', ')}
                                      </p>
                                    )}
                                    {item.isComplimentary && (
                                      <Badge variant="secondary" className="text-xs mt-1">
                                        <Gift className="h-3 w-3 mr-1" />
                                        İkram
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formatCurrency(item.unitPrice)} × {item.quantity} adet
                                </p>
                              </div>
                              <span className="font-bold font-tabular-nums">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                            
                            {isSelected && item.quantity > 1 && (
                              <div className="space-y-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                                <Label className="text-xs">Ödeme alınacak miktar</Label>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedItem && selectedItem.quantity > 1) {
                                        updatePartialPaymentQuantity(item.id, selectedItem.quantity - 1);
                                      }
                                    }}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-sm font-medium w-12 text-center">
                                    {selectedItem?.quantity || item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedItem && selectedItem.quantity < item.quantity) {
                                        updatePartialPaymentQuantity(item.id, selectedItem.quantity + 1);
                                      }
                                    }}
                                    disabled={selectedItem?.quantity === item.quantity}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    / {item.quantity}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Ödeme Detayları</Label>
                
                {selectedPaymentItems.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Ürün seçin</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label className="text-sm font-medium">Seçilen Ürünler</Label>
                        {selectedPaymentItems.map(si => {
                          const item = cart.find(i => i.id === si.itemId);
                          if (!item) return null;
                          
                          return (
                            <div key={si.itemId} className="flex flex-col gap-1 text-sm p-2 bg-muted/50 rounded">
                              <div className="flex items-center justify-between">
                                <span>{item.productName} × {si.quantity}</span>
                                <span className="font-semibold font-tabular-nums">
                                  {formatCurrency(item.unitPrice * si.quantity)}
                                </span>
                              </div>
                              {item.selectedOptions && item.selectedOptions.length > 0 && (
                                <span className="text-xs text-muted-foreground italic">
                                  {item.selectedOptions.map(opt => opt.choiceName).join(', ')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ara Toplam</span>
                          <span className="font-tabular-nums">{formatCurrency(calculatePartialTotals().subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">KDV</span>
                          <span className="font-tabular-nums">{formatCurrency(calculatePartialTotals().taxAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Ödenecek Tutar</span>
                          <span className="text-xl font-bold font-tabular-nums text-accent">
                            {formatCurrency(calculatePartialTotals().total)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Tabs defaultValue="payment" className="space-y-3">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="payment">Ödeme</TabsTrigger>
                        <TabsTrigger value="split">Parçalı</TabsTrigger>
                      </TabsList>

                      <TabsContent value="payment" className="space-y-3">
                        <Label>Ödeme Yöntemi</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {activePaymentMethods.map((pm) => {
                            const Icon = pm.method === 'cash' ? Money : pm.method === 'card' ? CreditCard : DeviceMobile;
                            return (
                              <Button
                                key={pm.method}
                                variant={paymentMethod === pm.method ? 'default' : 'outline'}
                                className="h-20 flex-col gap-2"
                                onClick={() => setPaymentMethod(pm.method)}
                              >
                                <Icon className="h-6 w-6" weight="bold" />
                                <span className="text-xs">{pm.displayName}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="split" className="space-y-3">
                        {splitPayments.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs">Eklenen Ödemeler</Label>
                            <div className="space-y-1">
                              {splitPayments.map((payment, index) => {
                                const pm = activePaymentMethods.find(p => p.method === payment.method);
                                return (
                                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                                    <span>{pm?.displayName}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold font-tabular-nums">{formatCurrency(payment.amount)}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeSplitPayment(index)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs">Yeni Ödeme</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {activePaymentMethods.map((pm) => {
                              const Icon = pm.method === 'cash' ? Money : pm.method === 'card' ? CreditCard : DeviceMobile;
                              return (
                                <Button
                                  key={pm.method}
                                  variant={currentSplitMethod === pm.method ? 'default' : 'outline'}
                                  className="h-16 flex-col gap-1"
                                  size="sm"
                                  onClick={() => setCurrentSplitMethod(pm.method)}
                                >
                                  <Icon className="h-5 w-5" weight="bold" />
                                  <span className="text-xs">{pm.displayName}</span>
                                </Button>
                              );
                            })}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Tutar"
                              value={currentSplitAmount}
                              onChange={(e) => setCurrentSplitAmount(e.target.value)}
                              onClick={() => setShowNumpad(true)}
                              readOnly
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const partialTotals = calculatePartialTotals();
                                const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
                                const remaining = partialTotals.total - totalPaid;
                                setCurrentSplitAmount(remaining.toFixed(2));
                              }}
                            >
                              Kalan
                            </Button>
                            <Button size="sm" onClick={addSplitPayment}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {showNumpad && (
                            <Numpad
                              value={currentSplitAmount}
                              onChange={setCurrentSplitAmount}
                              onEnter={addSplitPayment}
                            />
                          )}
                        </div>

                        <div className="p-3 bg-muted rounded-lg space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Toplam</span>
                            <span className="font-tabular-nums">{formatCurrency(calculatePartialTotals().total)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Alınan Ödeme</span>
                            <span className="font-tabular-nums text-emerald-600 font-semibold">
                              {formatCurrency(splitPayments.reduce((sum, p) => sum + p.amount, 0))}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between font-semibold">
                            <span>Kalan Ödeme</span>
                            <span className="font-tabular-nums text-accent">
                              {formatCurrency(calculatePartialTotals().total - splitPayments.reduce((sum, p) => sum + p.amount, 0))}
                            </span>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPartialPaymentDialog(false);
                setSelectedPaymentItems([]);
                setSplitPayments([]);
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={completePartialPayment}
              disabled={selectedPaymentItems.length === 0}
            >
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Ödemeyi Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedProductForOptions && (
        <ProductOptionsSelector
          product={selectedProductForOptions}
          open={showOptionsSelector}
          onClose={() => {
            setShowOptionsSelector(false);
            setSelectedProductForOptions(null);
          }}
          onConfirm={(selectedOptions) => addToCartWithOptions(selectedProductForOptions, selectedOptions)}
        />
      )}

      <Dialog open={showCustomerAccountDialog} onOpenChange={setShowCustomerAccountDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cari Hesap Seçimi</DialogTitle>
            <DialogDescription>
              Müşteriye açık hesap tanımlayarak ödeme alın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Ödenecek Tutar</span>
                <span className="text-2xl font-bold font-tabular-nums text-accent">
                  {formatCurrency(calculateTotals().total)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Müşteri Hesabı Seçin</Label>
              <Select value={selectedCustomerAccount} onValueChange={setSelectedCustomerAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Cari hesap seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {(customerAccounts || [])
                    .filter(acc => acc.status === 'active')
                    .map((account) => {
                      const availableCredit = account.creditLimit - account.currentBalance;
                      const canAfford = availableCredit >= calculateTotals().total;
                      return (
                        <SelectItem key={account.id} value={account.id} disabled={!canAfford}>
                          <div className="flex items-center justify-between w-full">
                            <span>{account.customerName} ({account.accountNumber})</span>
                            <span className={`text-xs ml-4 ${!canAfford ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {formatCurrency(availableCredit)} kullanılabilir
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {(customerAccounts || []).filter(acc => acc.status === 'active').length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aktif cari hesap bulunamadı. Lütfen önce bir müşteri hesabı oluşturun.
                </p>
              )}
            </div>

            {selectedCustomerAccount && (() => {
              const account = (customerAccounts || []).find(a => a.id === selectedCustomerAccount);
              if (!account) return null;
              
              const totals = calculateTotals();
              const newBalance = account.currentBalance + totals.total;
              const remainingCredit = account.creditLimit - newBalance;
              
              return (
                <div className="space-y-3">
                  <Separator />
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mevcut Borç</span>
                      <span className="font-tabular-nums font-semibold">{formatCurrency(account.currentBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Eklenecek Tutar</span>
                      <span className="font-tabular-nums font-semibold text-accent">{formatCurrency(totals.total)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Yeni Borç</span>
                      <span className="text-lg font-bold font-tabular-nums text-destructive">
                        {formatCurrency(newBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Kredi Limiti</span>
                      <span className="font-tabular-nums">{formatCurrency(account.creditLimit)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Kalan Kredi</span>
                      <span className={`font-tabular-nums font-semibold ${remainingCredit < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {formatCurrency(remainingCredit)}
                      </span>
                    </div>
                  </div>

                  {remainingCredit < 0 && (
                    <div className="p-3 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-2">
                      <Warning className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" weight="bold" />
                      <div className="text-sm text-destructive">
                        <p className="font-semibold">Kredi limiti aşılıyor!</p>
                        <p>Bu işlem gerçekleştirilemez.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCustomerAccountDialog(false);
                setSelectedCustomerAccount('');
              }}
            >
              İptal
            </Button>
            <Button 
              onClick={completeCustomerAccountSale}
              disabled={!selectedCustomerAccount || (() => {
                const account = (customerAccounts || []).find(a => a.id === selectedCustomerAccount);
                if (!account) return true;
                const totals = calculateTotals();
                return account.currentBalance + totals.total > account.creditLimit;
              })()}
            >
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Ödemeyi Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

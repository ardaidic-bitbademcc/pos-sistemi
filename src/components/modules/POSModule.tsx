import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash, Check, Table as TableIcon, CreditCard, Money, DeviceMobile, Users } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Product, Sale, SaleItem, PaymentMethod, Table, TableOrder } from '@/lib/types';
import { formatCurrency, generateId, generateSaleNumber, calculateTax } from '@/lib/helpers';

interface POSModuleProps {
  onBack: () => void;
}

interface CartItem extends SaleItem {
  productName: string;
}

export default function POSModule({ onBack }: POSModuleProps) {
  const [products] = useKV<Product[]>('products', []);
  const [sales, setSales] = useKV<Sale[]>('sales', []);
  const [tables, setTables] = useKV<Table[]>('tables', []);
  const [tableOrders, setTableOrders] = useKV<TableOrder[]>('tableOrders', []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const filteredProducts = (products || []).filter((product) =>
    product.isActive &&
    (product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const availableTables = (tables || []).filter(t => t.status === 'available' || t.status === 'occupied');

  const selectTable = (table: Table) => {
    setSelectedTable(table);
    setShowTableSelect(false);
    
    if (table.currentSaleId) {
      const existingOrder = (tableOrders || []).find(o => o.saleId === table.currentSaleId);
      if (existingOrder) {
        toast.info(`Masa ${table.tableNumber} sipariş devam ediyor`);
      }
    } else {
      setTables((current) =>
        (current || []).map(t =>
          t.id === table.id ? { ...t, status: 'occupied' as const } : t
        )
      );
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.basePrice,
        taxRate: product.taxRate,
        discountAmount: 0,
        subtotal: product.basePrice,
      };
      setCart([...cart, newItem]);
    }
    toast.success(`${product.name} sepete eklendi`);
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
              subtotal: newQuantity * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = cart.reduce(
      (sum, item) => sum + calculateTax(item.subtotal, item.taxRate),
      0
    );
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const completeSale = () => {
    if (cart.length === 0) {
      toast.error('Sepette ürün yok');
      return;
    }

    const totals = calculateTotals();
    const newSale: Sale = {
      id: generateId(),
      branchId: 'branch-1',
      cashierId: 'cashier-1',
      saleNumber: generateSaleNumber(),
      saleDate: new Date().toISOString(),
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: 0,
      totalAmount: totals.total,
      paymentMethod,
      paymentStatus: 'completed',
      items: cart,
    };

    setSales((currentSales) => [...(currentSales || []), newSale]);

    if (selectedTable) {
      setTables((current) =>
        (current || []).map(t =>
          t.id === selectedTable.id
            ? { ...t, status: 'available' as const, currentSaleId: undefined }
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
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">POS - Satış Noktası</h1>
            <p className="text-muted-foreground text-sm">Hızlı satış işlemleri ve masa yönetimi</p>
          </div>
        </div>
        {selectedTable && (
          <Badge variant="default" className="text-sm px-3 py-2">
            <TableIcon className="h-4 w-4 mr-2" weight="bold" />
            Masa {selectedTable.tableNumber}
          </Badge>
        )}
      </header>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Ürünler</TabsTrigger>
          <TabsTrigger value="tables">Masalar</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
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
                <CardContent>
                  <Input
                    placeholder="Ürün adı veya SKU ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base leading-tight">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            SKU: {product.sku}
                          </CardDescription>
                        </div>
                        <Badge variant={product.stock > product.minStockLevel ? 'default' : 'destructive'}>
                          {product.stock}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-semibold font-tabular-nums">
                          {formatCurrency(product.basePrice)}
                        </span>
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" weight="bold" />
                    <CardTitle className="text-lg">Sepet</CardTitle>
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
                          <div key={item.id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm leading-tight">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-muted-foreground font-tabular-nums">
                                  {formatCurrency(item.unitPrice)} × {item.quantity}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
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
                              <span className="text-sm font-semibold font-tabular-nums">
                                {formatCurrency(item.subtotal)}
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
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Toplam</span>
                          <span className="text-xl font-bold font-tabular-nums">
                            {formatCurrency(totals.total)}
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => setShowCheckout(true)}
                      >
                        <Check className="h-5 w-5 mr-2" weight="bold" />
                        Ödeme Al
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Masa Yönetimi</CardTitle>
              <CardDescription>Mevcut masaları görüntüle ve yönet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {availableTables.map((table) => (
                  <Card
                    key={table.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      table.status === 'occupied' ? 'border-accent' : ''
                    } ${selectedTable?.id === table.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => selectTable(table)}
                  >
                    <CardContent className="p-6 text-center space-y-2">
                      <TableIcon
                        className={`h-10 w-10 mx-auto ${
                          table.status === 'occupied' ? 'text-accent' : 'text-muted-foreground'
                        }`}
                        weight="bold"
                      />
                      <div>
                        <p className="font-semibold text-lg">Masa {table.tableNumber}</p>
                        <Badge
                          variant={table.status === 'occupied' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {table.status === 'occupied' ? 'Dolu' : 'Boş'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{table.capacity} kişi</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme</DialogTitle>
            <DialogDescription>
              Ödeme yöntemini seçin ve satışı tamamlayın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Ödeme Yöntemi</p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="h-24 flex-col gap-2"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Money className="h-8 w-8" weight="bold" />
                  <span>Nakit</span>
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="h-24 flex-col gap-2"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-8 w-8" weight="bold" />
                  <span>Kredi Kartı</span>
                </Button>
                <Button
                  variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                  className="h-24 flex-col gap-2"
                  onClick={() => setPaymentMethod('mobile')}
                >
                  <DeviceMobile className="h-8 w-8" weight="bold" />
                  <span>Mobil Ödeme</span>
                </Button>
              </div>
            </div>
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
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Ödenecek Tutar</span>
                <span className="text-xl font-bold font-tabular-nums text-accent">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              İptal
            </Button>
            <Button onClick={completeSale}>
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Satışı Tamamla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

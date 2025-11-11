import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Package, ShoppingBag, Truck, CheckCircle, XCircle, Clock, Storefront, Eye, EyeSlash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { B2BProduct, B2BOrder, SampleRequest, UserRole, ShippingMethod, OrderStatus, SampleRequestStatus } from '@/lib/types';

interface B2BModuleProps {
  onBack: () => void;
  currentUserRole: UserRole;
  currentUserName: string;
}

export default function B2BModule({ onBack, currentUserRole, currentUserName }: B2BModuleProps) {
  const [isSupplierMode, setIsSupplierMode] = useKV<boolean>('b2b-is-supplier-mode', false);
  const [products, setProducts] = useKV<B2BProduct[]>('b2b-products', []);
  const [orders, setOrders] = useKV<B2BOrder[]>('b2b-orders', []);
  const [sampleRequests, setSampleRequests] = useKV<SampleRequest[]>('b2b-sample-requests', []);
  const [commissionRate] = useKV<number>('b2b-commission-rate', 10);
  const actualCommissionRate = commissionRate ?? 10;
  
  const currentUserId = 'user-1';

  const getAnonymousSupplierName = (supplierId: string): string => {
    const allSuppliers = [...new Set((products || []).map(p => p.supplierId))];
    const sortedSuppliers = allSuppliers.sort();
    const index = sortedSuppliers.indexOf(supplierId);
    return `Tedarikçi ${String.fromCharCode(65 + index)}`;
  };

  const addProduct = (productData: Omit<B2BProduct, 'id' | 'createdAt' | 'supplierId' | 'supplierName'>) => {
    const newProduct: B2BProduct = {
      ...productData,
      id: `product-${Date.now()}`,
      supplierId: currentUserId,
      supplierName: currentUserName,
      createdAt: new Date().toISOString(),
    };
    setProducts((current) => [...(current || []), newProduct]);
    toast.success('Ürün başarıyla eklendi ve yayınlandı');
  };

  const requestSample = (productId: string) => {
    const product = (products || []).find(p => p.id === productId);
    if (!product) return;

    const request: SampleRequest = {
      id: `sample-${Date.now()}`,
      productId,
      productName: product.name,
      customerId: currentUserId,
      customerName: currentUserName,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      deliveryAddress: 'Demo Adres, İstanbul',
      status: 'pending',
      requestDate: new Date().toISOString(),
    };
    setSampleRequests((current) => [...(current || []), request]);
    toast.success('Numune talebi gönderildi');
  };

  const updateSampleRequest = (requestId: string, status: SampleRequestStatus, rejectionReason?: string) => {
    setSampleRequests((current) =>
      (current || []).map(req =>
        req.id === requestId
          ? { ...req, status, responseDate: new Date().toISOString(), rejectionReason }
          : req
      )
    );
    toast.success(`Numune talebi ${status === 'approved' ? 'onaylandı' : 'reddedildi'}`);
  };

  const createOrder = (productId: string, quantity: number) => {
    const product = (products || []).find(p => p.id === productId);
    if (!product) return;

    const subtotal = product.unitPrice * quantity;
    const shippingCost = product.shippingMethod === 'free' ? 0 : 150;
    const taxAmount = subtotal * 0.18;
    const totalAmount = subtotal + shippingCost + taxAmount;

    const order: B2BOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `B2B-${Date.now()}`,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      customerId: currentUserId,
      customerName: currentUserName,
      items: [{
        id: `item-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.unitPrice,
        totalPrice: subtotal,
        requiresDesign: product.requiresDesign,
      }],
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount,
      status: 'pending',
      deliveryAddress: 'Demo Adres, İstanbul',
      orderDate: new Date().toISOString(),
      statusHistory: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        updatedBy: currentUserName,
      }],
    };

    setOrders((current) => [...(current || []), order]);
    toast.success('Sipariş oluşturuldu - platform onayı bekleniyor');
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, notes?: string) => {
    setOrders((current) =>
      (current || []).map(order =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
              statusHistory: [
                ...order.statusHistory,
                {
                  status: newStatus,
                  timestamp: new Date().toISOString(),
                  updatedBy: currentUserName,
                  notes,
                }
              ]
            }
          : order
      )
    );
    toast.success('Sipariş durumu güncellendi');
  };

  const activateSupplierMode = () => {
    setIsSupplierMode(true);
    toast.success('Tedarikçi paneli aktifleştirildi');
  };

  const myProducts = (products || []).filter(p => p.supplierId === currentUserId);
  const mySupplierOrders = (orders || []).filter(o => o.supplierId === currentUserId);
  const myCustomerOrders = (orders || []).filter(o => o.customerId === currentUserId);
  const mySupplierSampleRequests = (sampleRequests || []).filter(r => r.supplierId === currentUserId);
  const myCustomerSampleRequests = (sampleRequests || []).filter(r => r.customerId === currentUserId);
  const availableProducts = (products || []).filter(p => p.supplierId !== currentUserId && p.isActive);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">B2B Tedarik Platformu</h1>
            <p className="text-muted-foreground">Ürün siparişi ver veya tedarikçi olarak ürün sat</p>
          </div>
        </div>

        {!isSupplierMode && (
          <Alert className="mb-6">
            <Storefront className="h-4 w-4" />
            <AlertDescription>
              Kendi ürettiğiniz ürünleri (kahve, pasta, çikolata vb.) satmak ister misiniz?
              <Button
                variant="link"
                className="ml-2"
                onClick={activateSupplierMode}
              >
                Tedarikçi Panelini Aktifleştir
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="customer" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="customer">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Sipariş Ver
            </TabsTrigger>
            {isSupplierMode && (
              <TabsTrigger value="supplier">
                <Storefront className="h-4 w-4 mr-2" />
                Tedarikçi Panelim
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="customer" className="space-y-6">
            <CustomerPanel
              products={availableProducts}
              orders={myCustomerOrders}
              sampleRequests={myCustomerSampleRequests}
              onRequestSample={requestSample}
              onCreateOrder={createOrder}
              onUpdateOrderStatus={updateOrderStatus}
              getAnonymousSupplierName={getAnonymousSupplierName}
              commissionRate={actualCommissionRate}
            />
          </TabsContent>

          {isSupplierMode && (
            <TabsContent value="supplier" className="space-y-6">
              <SupplierPanel
                products={myProducts}
                orders={mySupplierOrders}
                sampleRequests={mySupplierSampleRequests}
                onAddProduct={addProduct}
                onUpdateSampleRequest={updateSampleRequest}
                onUpdateOrderStatus={updateOrderStatus}
                commissionRate={actualCommissionRate}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function SupplierPanel({
  products,
  orders,
  sampleRequests,
  onAddProduct,
  onUpdateSampleRequest,
  onUpdateOrderStatus,
  commissionRate,
}: {
  products: B2BProduct[];
  orders: B2BOrder[];
  sampleRequests: SampleRequest[];
  onAddProduct: (data: Omit<B2BProduct, 'id' | 'createdAt' | 'supplierId' | 'supplierName'>) => void;
  onUpdateSampleRequest: (id: string, status: SampleRequestStatus, reason?: string) => void;
  onUpdateOrderStatus: (id: string, status: OrderStatus, notes?: string) => void;
  commissionRate: number;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    unitPrice: 0,
    minOrderQuantity: 1,
    unit: 'adet',
    canProvideSample: false,
    requiresDesign: false,
    shippingMethod: 'buyer_pays' as ShippingMethod,
    stock: 0,
    isActive: true,
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category || newProduct.unitPrice <= 0) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    onAddProduct(newProduct);
    setShowAddDialog(false);
    setNewProduct({
      name: '',
      description: '',
      category: '',
      unitPrice: 0,
      minOrderQuantity: 1,
      unit: 'adet',
      canProvideSample: false,
      requiresDesign: false,
      shippingMethod: 'buyer_pays',
      stock: 0,
      isActive: true,
    });
  };

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  
  const platformCommission = totalRevenue * (commissionRate / 100);
  const netRevenue = totalRevenue - platformCommission;

  return (
    <div className="space-y-6">
      <Alert>
        <EyeSlash className="h-4 w-4" />
        <AlertDescription>
          Müşteriler sizin adınızı göremez. Ürünleriniz anonim kod ile gösterilir. Tüm iletişim platform üzerinden yapılır.
          Platform komisyon oranı: <strong>%{commissionRate}</strong>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bekleyen Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} ₺</div>
            <p className="text-xs text-muted-foreground mt-1">Net: {netRevenue.toFixed(2)} ₺</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Numune Talepleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleRequests.filter(r => r.status === 'pending').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ürünlerim</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Yeni Ürün Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Yeni Ürün Ekle</DialogTitle>
                  <DialogDescription>Ürününüz anonim kod ile müşterilere gösterilecek</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ürün Adı *</Label>
                      <Input
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Örn: Organik Arabica Kahve"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kategori *</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kahve">Kahve</SelectItem>
                          <SelectItem value="Ambalaj">Ambalaj</SelectItem>
                          <SelectItem value="İçecek">İçecek</SelectItem>
                          <SelectItem value="Gıda">Gıda</SelectItem>
                          <SelectItem value="Pasta/Çikolata">Pasta/Çikolata</SelectItem>
                          <SelectItem value="Ekipman">Ekipman</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Ürün detayları..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Birim Fiyat (₺) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newProduct.unitPrice || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min. Sipariş Adedi *</Label>
                      <Input
                        type="number"
                        value={newProduct.minOrderQuantity || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, minOrderQuantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Birim</Label>
                      <Input
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                        placeholder="adet, kg, litre"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kargo Koşulu</Label>
                      <Select
                        value={newProduct.shippingMethod}
                        onValueChange={(v) => setNewProduct({ ...newProduct, shippingMethod: v as ShippingMethod })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Ücretsiz Kargo</SelectItem>
                          <SelectItem value="buyer_pays">Alıcı Ödemeli</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Stok</Label>
                      <Input
                        type="number"
                        value={newProduct.stock || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Numune Verilebilir</Label>
                      <p className="text-xs text-muted-foreground">Müşterilere ücretsiz numune gönderebilir misiniz?</p>
                    </div>
                    <Switch
                      checked={newProduct.canProvideSample}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, canProvideSample: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Baskılı/Tasarım Gerektiriyor</Label>
                      <p className="text-xs text-muted-foreground">Ürün özel tasarım veya logo baskısı gerektiriyor mu?</p>
                    </div>
                    <Switch
                      checked={newProduct.requiresDesign}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, requiresDesign: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>İptal</Button>
                  <Button onClick={handleAddProduct}>Ekle ve Yayınla</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz ürün eklemediniz. Yeni ürün ekleyerek başlayın.
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(product => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{product.name}</h3>
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        <div className="flex gap-4 text-sm">
                          <span>Fiyat: <strong>{product.unitPrice} ₺/{product.unit}</strong></span>
                          <span>Min. Sipariş: <strong>{product.minOrderQuantity} {product.unit}</strong></span>
                          <span>Stok: <strong>{product.stock}</strong></span>
                        </div>
                        <div className="flex gap-2">
                          {product.canProvideSample && (
                            <Badge variant="outline">Numune Verilebilir</Badge>
                          )}
                          {product.requiresDesign && (
                            <Badge variant="outline">Tasarım Gerekir</Badge>
                          )}
                          <Badge variant="outline">
                            {product.shippingMethod === 'free' ? 'Ücretsiz Kargo' : 'Alıcı Ödemeli'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Siparişler</CardTitle>
          <CardDescription>Müşteri isimleri anonim gösterilir</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz sipariş yok
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{order.orderNumber}</span>
                          <Badge>{getOrderStatusBadge(order.status)}</Badge>
                        </div>
                        <p className="text-sm">Müşteri: <strong>Müşteri X</strong> (Anonim)</p>
                        <div className="text-sm space-y-1">
                          {order.items.map(item => (
                            <div key={item.id}>
                              {item.productName} - {item.quantity} adet - {item.totalPrice.toFixed(2)} ₺
                            </div>
                          ))}
                        </div>
                        <p className="text-sm">Toplam: <strong>{order.totalAmount.toFixed(2)} ₺</strong></p>
                        <p className="text-xs text-muted-foreground">
                          Platform komisyonu (%{commissionRate}): {(order.totalAmount * commissionRate / 100).toFixed(2)} ₺
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => onUpdateOrderStatus(order.id, 'approved')}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Onayla
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reddet
                            </Button>
                          </>
                        )}
                        {order.status === 'approved' && (
                          <Button size="sm" onClick={() => onUpdateOrderStatus(order.id, 'preparing')}>
                            <Clock className="h-4 w-4 mr-1" />
                            Hazırlanıyor
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button size="sm" onClick={() => onUpdateOrderStatus(order.id, 'shipped')}>
                            <Truck className="h-4 w-4 mr-1" />
                            Kargoya Ver
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Numune Talepleri</CardTitle>
          <CardDescription>Müşteri bilgileri anonim gösterilir</CardDescription>
        </CardHeader>
        <CardContent>
          {sampleRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz numune talebi yok
            </div>
          ) : (
            <div className="space-y-3">
              {sampleRequests.map(request => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{request.productName}</h3>
                        <p className="text-sm">Müşteri: <strong>Müşteri X</strong> (Anonim)</p>
                        <p className="text-xs text-muted-foreground">Talep: {new Date(request.requestDate).toLocaleDateString('tr-TR')}</p>
                        <Badge>{getSampleStatusBadge(request.status)}</Badge>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => onUpdateSampleRequest(request.id, 'approved')}>
                            Onayla
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onUpdateSampleRequest(request.id, 'rejected', 'Stok yok')}>
                            Reddet
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerPanel({
  products,
  orders,
  sampleRequests,
  onRequestSample,
  onCreateOrder,
  onUpdateOrderStatus,
  getAnonymousSupplierName,
  commissionRate,
}: {
  products: B2BProduct[];
  orders: B2BOrder[];
  sampleRequests: SampleRequest[];
  onRequestSample: (productId: string) => void;
  onCreateOrder: (productId: string, quantity: number) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getAnonymousSupplierName: (supplierId: string) => string;
  commissionRate: number;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<B2BProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleOrderClick = (product: B2BProduct) => {
    setSelectedProduct(product);
    setOrderQuantity(product.minOrderQuantity);
    setShowOrderDialog(true);
  };

  const handleCreateOrder = () => {
    if (!selectedProduct) return;
    if (orderQuantity < selectedProduct.minOrderQuantity) {
      toast.error(`Minimum sipariş miktarı: ${selectedProduct.minOrderQuantity}`);
      return;
    }
    onCreateOrder(selectedProduct.id, orderQuantity);
    setShowOrderDialog(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          Tedarikçi isimleri gizlidir. Tüm sipariş ve iletişim platform üzerinden yapılır. Platform komisyon oranı: %{commissionRate}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Siparişlerim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bekleyen Talepler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleRequests.filter(r => r.status === 'pending').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ürün Kataloğu</CardTitle>
          <CardDescription>Tedarikçi isimleri anonim gösterilir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'Tümü' : cat}
                </Button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Bu kategoride ürün bulunmuyor
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            <Badge variant="secondary">{getAnonymousSupplierName(product.supplierId)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Fiyat:</span>
                            <strong>{product.unitPrice} ₺/{product.unit}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Min. Sipariş:</span>
                            <strong>{product.minOrderQuantity} {product.unit}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Kargo:</span>
                            <span>{product.shippingMethod === 'free' ? 'Ücretsiz' : 'Alıcı Ödemeli'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {product.canProvideSample && (
                            <Badge variant="outline" className="text-xs">Numune Var</Badge>
                          )}
                          {product.requiresDesign && (
                            <Badge variant="outline" className="text-xs">Tasarım Gerekir</Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {product.canProvideSample && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => onRequestSample(product.id)}
                            >
                              Numune İste
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleOrderClick(product)}
                          >
                            <ShoppingBag className="h-4 w-4 mr-1" />
                            Sipariş Ver
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Siparişlerim</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz sipariş vermediniz
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{order.orderNumber}</span>
                          <Badge>{getOrderStatusBadge(order.status)}</Badge>
                        </div>
                        <p className="text-sm">Tedarikçi: <strong>{getAnonymousSupplierName(order.supplierId)}</strong></p>
                        <div className="text-sm space-y-1">
                          {order.items.map(item => (
                            <div key={item.id}>
                              {item.productName} - {item.quantity} adet - {item.totalPrice.toFixed(2)} ₺
                            </div>
                          ))}
                        </div>
                        <p className="text-sm">Toplam: <strong>{order.totalAmount.toFixed(2)} ₺</strong></p>
                        <p className="text-xs text-muted-foreground">
                          Sipariş tarihi: {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div>
                        {order.status === 'delivered' && (
                          <Button size="sm" variant="outline" disabled>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Teslim Alındı
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Ver</DialogTitle>
            <DialogDescription>
              Sipariş detaylarını belirleyin
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">Tedarikçi: {getAnonymousSupplierName(selectedProduct.supplierId)}</p>
              </div>
              <div className="space-y-2">
                <Label>Miktar ({selectedProduct.unit})</Label>
                <Input
                  type="number"
                  min={selectedProduct.minOrderQuantity}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || selectedProduct.minOrderQuantity)}
                />
                <p className="text-xs text-muted-foreground">
                  Min. sipariş: {selectedProduct.minOrderQuantity} {selectedProduct.unit}
                </p>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Birim Fiyat:</span>
                  <span>{selectedProduct.unitPrice} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ara Toplam:</span>
                  <span>{(selectedProduct.unitPrice * orderQuantity).toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>KDV (%18):</span>
                  <span>{(selectedProduct.unitPrice * orderQuantity * 0.18).toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kargo:</span>
                  <span>{selectedProduct.shippingMethod === 'free' ? 'Ücretsiz' : '150 ₺'}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Toplam:</span>
                  <span>
                    {(
                      selectedProduct.unitPrice * orderQuantity * 1.18 +
                      (selectedProduct.shippingMethod === 'free' ? 0 : 150)
                    ).toFixed(2)} ₺
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>İptal</Button>
            <Button onClick={handleCreateOrder}>Siparişi Onayla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getOrderStatusBadge(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    pending: 'Bekliyor',
    approved: 'Onaylandı',
    cancelled: 'İptal',
    preparing: 'Hazırlanıyor',
    shipped: 'Kargoda',
    delivered: 'Teslim Edildi',
  };
  return statusMap[status] || status;
}

function getSampleStatusBadge(status: SampleRequestStatus): string {
  const statusMap: Record<SampleRequestStatus, string> = {
    pending: 'Bekliyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    sent: 'Gönderildi',
  };
  return statusMap[status] || status;
}

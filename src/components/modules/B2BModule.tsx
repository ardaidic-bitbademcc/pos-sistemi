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
import { ArrowLeft, Package, Users, ShoppingBag, Truck, FileText, CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { B2BSupplier, B2BProduct, B2BOrder, SampleRequest, UserRole, ShippingMethod, OrderStatus, SampleRequestStatus } from '@/lib/types';

interface B2BModuleProps {
  onBack: () => void;
  currentUserRole: UserRole;
  currentUserName: string;
}

export default function B2BModule({ onBack, currentUserRole, currentUserName }: B2BModuleProps) {
  const [activeTab, setActiveTab] = useState<'supplier' | 'customer'>('supplier');
  const [suppliers, setSuppliers] = useKV<B2BSupplier[]>('b2b-suppliers', []);
  const [products, setProducts] = useKV<B2BProduct[]>('b2b-products', []);
  const [orders, setOrders] = useKV<B2BOrder[]>('b2b-orders', []);
  const [sampleRequests, setSampleRequests] = useKV<SampleRequest[]>('b2b-sample-requests', []);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  
  const currentSupplierId = 'supplier-1';
  const currentCustomerId = 'customer-1';

  const addProduct = (productData: Omit<B2BProduct, 'id' | 'createdAt' | 'supplierId' | 'supplierName'>) => {
    const newProduct: B2BProduct = {
      ...productData,
      id: `product-${Date.now()}`,
      supplierId: currentSupplierId,
      supplierName: 'Demo Tedarikçi',
      createdAt: new Date().toISOString(),
    };
    setProducts((current) => [...(current || []), newProduct]);
    toast.success('Ürün başarıyla eklendi');
  };

  const requestSample = (productId: string) => {
    const product = (products || []).find(p => p.id === productId);
    if (!product) return;

    const request: SampleRequest = {
      id: `sample-${Date.now()}`,
      productId,
      productName: product.name,
      customerId: currentCustomerId,
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

  const createOrder = (productId: string, quantity: number, designFiles?: File[]) => {
    const product = (products || []).find(p => p.id === productId);
    if (!product) return;

    const order: B2BOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `B2B-${Date.now()}`,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      customerId: currentCustomerId,
      customerName: currentUserName,
      items: [{
        id: `item-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.unitPrice * quantity,
        requiresDesign: product.requiresDesign,
      }],
      subtotal: product.unitPrice * quantity,
      shippingCost: product.shippingMethod === 'free' ? 0 : 150,
      taxAmount: (product.unitPrice * quantity) * 0.18,
      totalAmount: (product.unitPrice * quantity) * 1.18 + (product.shippingMethod === 'free' ? 0 : 150),
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
    toast.success('Sipariş oluşturuldu');
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

  const groupSuppliersByLetter = () => {
    const grouped: Record<string, B2BSupplier[]> = {};
    (suppliers || []).forEach(supplier => {
      const letter = supplier.companyName[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(supplier);
    });
    return grouped;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">B2B Platform</h1>
            <p className="text-muted-foreground">Tedarikçi ve müşteri yönetimi</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'supplier' | 'customer')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="supplier">Tedarikçi Paneli</TabsTrigger>
            <TabsTrigger value="customer">Müşteri Paneli</TabsTrigger>
          </TabsList>

          <TabsContent value="supplier" className="space-y-6">
            <SupplierPanel
              products={(products || []).filter(p => p.supplierId === currentSupplierId)}
              orders={(orders || []).filter(o => o.supplierId === currentSupplierId)}
              sampleRequests={(sampleRequests || []).filter(r => r.supplierId === currentSupplierId)}
              onAddProduct={addProduct}
              onUpdateSampleRequest={updateSampleRequest}
              onUpdateOrderStatus={updateOrderStatus}
            />
          </TabsContent>

          <TabsContent value="customer" className="space-y-6">
            <CustomerPanel
              suppliers={suppliers || []}
              products={products || []}
              orders={(orders || []).filter(o => o.customerId === currentCustomerId)}
              sampleRequests={(sampleRequests || []).filter(r => r.customerId === currentCustomerId)}
              selectedSupplier={selectedSupplier}
              onSelectSupplier={setSelectedSupplier}
              onRequestSample={requestSample}
              onCreateOrder={createOrder}
              onUpdateOrderStatus={updateOrderStatus}
              groupedSuppliers={groupSuppliersByLetter()}
            />
          </TabsContent>
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
}: {
  products: B2BProduct[];
  orders: B2BOrder[];
  sampleRequests: SampleRequest[];
  onAddProduct: (data: Omit<B2BProduct, 'id' | 'createdAt' | 'supplierId' | 'supplierName'>) => void;
  onUpdateSampleRequest: (id: string, status: SampleRequestStatus, reason?: string) => void;
  onUpdateOrderStatus: (id: string, status: OrderStatus, notes?: string) => void;
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

  return (
    <div className="space-y-6">
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
            <CardTitle className="text-sm font-medium">Bekleyen Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
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
                  <DialogDescription>Ürün bilgilerini girin</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ürün Adı *</Label>
                      <Input
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kategori *</Label>
                      <Input
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Birim Fiyat (₺) *</Label>
                      <Input
                        type="number"
                        value={newProduct.unitPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min. Sipariş Adedi *</Label>
                      <Input
                        type="number"
                        value={newProduct.minOrderQuantity}
                        onChange={(e) => setNewProduct({ ...newProduct, minOrderQuantity: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Birim</Label>
                      <Input
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
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
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label>Numune Verilebilir</Label>
                    <Switch
                      checked={newProduct.canProvideSample}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, canProvideSample: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label>Baskılı/Tasarım Gerektiriyor</Label>
                    <Switch
                      checked={newProduct.requiresDesign}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, requiresDesign: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>İptal</Button>
                  <Button onClick={handleAddProduct}>Ekle</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map(product => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{product.category}</Badge>
                        {product.canProvideSample && <Badge variant="outline">Numune Verilebilir</Badge>}
                        {product.requiresDesign && <Badge variant="outline">Tasarım Gerekli</Badge>}
                        <Badge>{product.shippingMethod === 'free' ? 'Ücretsiz Kargo' : 'Alıcı Ödemeli'}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{product.unitPrice.toLocaleString('tr-TR')} ₺</div>
                      <div className="text-sm text-muted-foreground">Min: {product.minOrderQuantity} {product.unit}</div>
                      <div className="text-sm text-muted-foreground">Stok: {product.stock}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Numune Talepleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleRequests.filter(r => r.status === 'pending').map(request => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{request.productName}</h3>
                      <p className="text-sm text-muted-foreground">Müşteri: {request.customerName}</p>
                      <p className="text-sm text-muted-foreground">{request.deliveryAddress}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onUpdateSampleRequest(request.id, 'approved')}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Onayla
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => onUpdateSampleRequest(request.id, 'rejected')}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reddet
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateOrderStatus} isSupplier />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerPanel({
  suppliers,
  products,
  orders,
  sampleRequests,
  selectedSupplier,
  onSelectSupplier,
  onRequestSample,
  onCreateOrder,
  onUpdateOrderStatus,
  groupedSuppliers,
}: {
  suppliers: B2BSupplier[];
  products: B2BProduct[];
  orders: B2BOrder[];
  sampleRequests: SampleRequest[];
  selectedSupplier: string;
  onSelectSupplier: (id: string) => void;
  onRequestSample: (productId: string) => void;
  onCreateOrder: (productId: string, quantity: number) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  groupedSuppliers: Record<string, B2BSupplier[]>;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const supplierProducts = selectedSupplier ? products.filter(p => p.supplierId === selectedSupplier) : products;
  const filteredProducts = supplierProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tedarikçiler</CardTitle>
          <CardDescription>Alfabetik sıralama ile tedarikçi listesi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.keys(groupedSuppliers).sort().map(letter => (
              <div key={letter}>
                <h3 className="text-2xl font-bold text-primary mb-3">{letter}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedSuppliers[letter].map(supplier => (
                    <Card
                      key={supplier.id}
                      className={`cursor-pointer transition-colors ${selectedSupplier === supplier.id ? 'border-primary' : ''}`}
                      onClick={() => onSelectSupplier(supplier.id)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{supplier.companyName}</h4>
                        <p className="text-sm text-muted-foreground">{supplier.contactName}</p>
                        <Badge variant="secondary" className="mt-2">{supplier.totalProducts} ürün</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ürün Kataloğu</CardTitle>
          <Input
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onRequestSample={onRequestSample}
                onCreateOrder={onCreateOrder}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Siparişlerim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={onUpdateOrderStatus} isSupplier={false} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductCard({
  product,
  onRequestSample,
  onCreateOrder,
}: {
  product: B2BProduct;
  onRequestSample: (id: string) => void;
  onCreateOrder: (id: string, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(product.minOrderQuantity);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.description}</p>
            <Badge variant="secondary" className="mt-1">{product.category}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">{product.unitPrice.toLocaleString('tr-TR')} ₺</div>
              <div className="text-sm text-muted-foreground">Min: {product.minOrderQuantity} {product.unit}</div>
            </div>
            <div className="flex gap-2">
              {product.canProvideSample && (
                <Button size="sm" variant="outline" onClick={() => onRequestSample(product.id)}>
                  Numune İstiyorum
                </Button>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">Sipariş Ver</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sipariş Oluştur</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Miktar</Label>
                      <Input
                        type="number"
                        value={quantity}
                        min={product.minOrderQuantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                      />
                    </div>
                    <div className="text-lg font-semibold">
                      Toplam: {(product.unitPrice * quantity).toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => onCreateOrder(product.id, quantity)}>Sipariş Oluştur</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({
  order,
  onUpdateStatus,
  isSupplier,
}: {
  order: B2BOrder;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  isSupplier: boolean;
}) {
  const statusConfig = {
    pending: { label: 'Bekliyor', icon: Clock, color: 'text-yellow-600' },
    approved: { label: 'Onaylandı', icon: CheckCircle, color: 'text-green-600' },
    preparing: { label: 'Hazırlanıyor', icon: Package, color: 'text-blue-600' },
    shipped: { label: 'Kargoda', icon: Truck, color: 'text-purple-600' },
    delivered: { label: 'Teslim Edildi', icon: CheckCircle, color: 'text-green-600' },
    cancelled: { label: 'İptal Edildi', icon: XCircle, color: 'text-red-600' },
  };

  const StatusIcon = statusConfig[order.status].icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Sipariş #{order.orderNumber}</h3>
              <p className="text-sm text-muted-foreground">
                {isSupplier ? `Müşteri: ${order.customerName}` : `Tedarikçi: ${order.supplierName}`}
              </p>
            </div>
            <Badge className={statusConfig[order.status].color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[order.status].label}
            </Badge>
          </div>
          <div className="space-y-1">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.productName} x {item.quantity}</span>
                <span className="font-medium">{item.totalPrice.toLocaleString('tr-TR')} ₺</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-semibold">
              <span>Toplam</span>
              <span>{order.totalAmount.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>
          {isSupplier && order.status === 'pending' && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onUpdateStatus(order.id, 'approved')}>Onayla</Button>
              <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(order.id, 'cancelled')}>İptal Et</Button>
            </div>
          )}
          {isSupplier && order.status === 'approved' && (
            <Button size="sm" onClick={() => onUpdateStatus(order.id, 'preparing')}>Hazırlanıyor Olarak İşaretle</Button>
          )}
          {isSupplier && order.status === 'preparing' && (
            <Button size="sm" onClick={() => onUpdateStatus(order.id, 'shipped')}>Kargoya Verildi</Button>
          )}
          {!isSupplier && order.status === 'shipped' && (
            <Button size="sm" onClick={() => onUpdateStatus(order.id, 'delivered')}>Teslim Alındı</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
import { ArrowLeft, Package, ShoppingBag, Truck, CheckCircle, XCircle, Clock, Storefront, Eye, EyeSlash, Plus, Trash, Power, Pause, AirplaneTilt, ToggleLeft, ToggleRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { B2BProduct, B2BOrder, SampleRequest, UserRole, ShippingMethod, OrderStatus, SampleRequestStatus, ProductVariant, SupplierPanelStatus } from '@/lib/types';

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
  const [supplierPanelStatus, setSupplierPanelStatus] = useKV<SupplierPanelStatus>('b2b-supplier-panel-status', 'active');
  const [supplierPausedUntil, setSupplierPausedUntil] = useKV<string | null>('b2b-supplier-paused-until', null);
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

  const createOrder = (productId: string, quantity: number, variantId?: string) => {
    const product = (products || []).find(p => p.id === productId);
    if (!product) return;

    let unitPrice = product.unitPrice;
    let variantName: string | undefined = undefined;
    
    if (variantId && product.hasVariants && product.variants) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        unitPrice = variant.unitPrice;
        variantName = variant.name;
      }
    }

    const subtotal = unitPrice * quantity;
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
        unitPrice,
        totalPrice: subtotal,
        requiresDesign: product.requiresDesign,
        variantId,
        variantName,
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

  const toggleProductActive = (productId: string) => {
    setProducts((current) =>
      (current || []).map(p =>
        p.id === productId ? { ...p, isActive: !p.isActive } : p
      )
    );
    const product = (products || []).find(p => p.id === productId);
    if (product) {
      toast.success(`Ürün ${!product.isActive ? 'aktifleştirildi' : 'pasife alındı'}`);
    }
  };

  const toggleVariantActive = (productId: string, variantId: string) => {
    setProducts((current) =>
      (current || []).map(p =>
        p.id === productId && p.variants
          ? {
              ...p,
              variants: p.variants.map(v =>
                v.id === variantId ? { ...v, isActive: !v.isActive } : v
              )
            }
          : p
      )
    );
    toast.success('Varyant durumu güncellendi');
  };

  const setSupplierPanelVacation = (until: string, reason?: string) => {
    setSupplierPanelStatus('vacation');
    setSupplierPausedUntil(until);
    toast.success('Tedarikçi paneli tatil moduna alındı');
  };

  const setSupplierPanelPaused = (reason?: string) => {
    setSupplierPanelStatus('paused');
    setSupplierPausedUntil(null);
    toast.success('Tedarikçi paneli duraklatıldı');
  };

  const setSupplierPanelActive = () => {
    setSupplierPanelStatus('active');
    setSupplierPausedUntil(null);
    toast.success('Tedarikçi paneli aktifleştirildi');
  };

  const myProducts = (products || []).filter(p => p.supplierId === currentUserId);
  const mySupplierOrders = (orders || []).filter(o => o.supplierId === currentUserId);
  const myCustomerOrders = (orders || []).filter(o => o.customerId === currentUserId);
  const mySupplierSampleRequests = (sampleRequests || []).filter(r => r.supplierId === currentUserId);
  const myCustomerSampleRequests = (sampleRequests || []).filter(r => r.customerId === currentUserId);
  const availableProducts = (products || []).filter(p => {
    if (p.supplierId === currentUserId) return false;
    if (!p.isActive) return false;
    const supplierProducts = (products || []).filter(prod => prod.supplierId === p.supplierId);
    const supplierHasActivePanel = supplierProducts.length > 0;
    return supplierHasActivePanel;
  });

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
                onToggleProductActive={toggleProductActive}
                onToggleVariantActive={toggleVariantActive}
                commissionRate={actualCommissionRate}
                panelStatus={supplierPanelStatus ?? 'active'}
                pausedUntil={supplierPausedUntil ?? null}
                onSetPanelVacation={setSupplierPanelVacation}
                onSetPanelPaused={setSupplierPanelPaused}
                onSetPanelActive={setSupplierPanelActive}
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
  onToggleProductActive,
  onToggleVariantActive,
  commissionRate,
  panelStatus,
  pausedUntil,
  onSetPanelVacation,
  onSetPanelPaused,
  onSetPanelActive,
}: {
  products: B2BProduct[];
  orders: B2BOrder[];
  sampleRequests: SampleRequest[];
  onAddProduct: (data: Omit<B2BProduct, 'id' | 'createdAt' | 'supplierId' | 'supplierName'>) => void;
  onUpdateSampleRequest: (id: string, status: SampleRequestStatus, reason?: string) => void;
  onUpdateOrderStatus: (id: string, status: OrderStatus, notes?: string) => void;
  onToggleProductActive: (productId: string) => void;
  onToggleVariantActive: (productId: string, variantId: string) => void;
  commissionRate: number;
  panelStatus: SupplierPanelStatus;
  pausedUntil: string | null;
  onSetPanelVacation: (until: string, reason?: string) => void;
  onSetPanelPaused: (reason?: string) => void;
  onSetPanelActive: () => void;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPanelStatusDialog, setShowPanelStatusDialog] = useState(false);
  const [vacationUntilDate, setVacationUntilDate] = useState('');
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
    hasVariants: false,
    variants: [] as ProductVariant[],
  });
  const [newVariant, setNewVariant] = useState({
    name: '',
    unitPrice: 0,
    stock: 0,
    minOrderQuantity: 1,
  });

  const handleAddVariant = () => {
    if (!newVariant.name || newVariant.unitPrice <= 0) {
      toast.error('Lütfen varyant adı ve fiyat girin');
      return;
    }
    const variant: ProductVariant = {
      id: `variant-${Date.now()}-${Math.random()}`,
      name: newVariant.name,
      unitPrice: newVariant.unitPrice,
      stock: newVariant.stock,
      minOrderQuantity: newVariant.minOrderQuantity,
      isActive: true,
    };
    setNewProduct(prev => ({
      ...prev,
      variants: [...prev.variants, variant],
    }));
    setNewVariant({ name: '', unitPrice: 0, stock: 0, minOrderQuantity: 1 });
    toast.success('Varyant eklendi');
  };

  const handleRemoveVariant = (variantId: string) => {
    setNewProduct(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId),
    }));
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category) {
      toast.error('Lütfen ürün adı ve kategori girin');
      return;
    }
    if (newProduct.hasVariants && newProduct.variants.length === 0) {
      toast.error('Varyantlı ürün için en az bir varyant ekleyin');
      return;
    }
    if (!newProduct.hasVariants && newProduct.unitPrice <= 0) {
      toast.error('Lütfen geçerli bir fiyat girin');
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
      hasVariants: false,
      variants: [],
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

      <Card>
        <CardHeader>
          <CardTitle>Tedarikçi Paneli Durumu</CardTitle>
          <CardDescription>
            {panelStatus === 'active' && 'Paneliniz aktif - sipariş alabilirsiniz'}
            {panelStatus === 'paused' && 'Paneliniz duraklatıldı - yeni sipariş alamazsınız'}
            {panelStatus === 'vacation' && pausedUntil && `Tatil modunda - ${new Date(pausedUntil).toLocaleDateString('tr-TR')} tarihine kadar`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {panelStatus === 'active' && (
                <Badge variant="default" className="text-sm">
                  <Power className="h-4 w-4 mr-1" weight="fill" />
                  Aktif
                </Badge>
              )}
              {panelStatus === 'paused' && (
                <Badge variant="secondary" className="text-sm">
                  <Pause className="h-4 w-4 mr-1" weight="fill" />
                  Duraklatıldı
                </Badge>
              )}
              {panelStatus === 'vacation' && (
                <Badge variant="outline" className="text-sm">
                  <AirplaneTilt className="h-4 w-4 mr-1" weight="fill" />
                  Tatil Modu
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPanelStatusDialog(true)}>
              Durumu Değiştir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPanelStatusDialog} onOpenChange={setShowPanelStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tedarikçi Paneli Durumu</DialogTitle>
            <DialogDescription>
              Panel durumunuzu değiştirin. Pasif veya tatil modunda yeni sipariş alamazsınız.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant={panelStatus === 'active' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => {
                onSetPanelActive();
                setShowPanelStatusDialog(false);
              }}
            >
              <Power className="h-5 w-5 mr-3" weight="fill" />
              <div className="text-left">
                <div className="font-semibold">Aktif</div>
                <div className="text-xs opacity-80">Yeni siparişler alabilirsiniz</div>
              </div>
            </Button>
            <Button
              variant={panelStatus === 'paused' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => {
                onSetPanelPaused();
                setShowPanelStatusDialog(false);
              }}
            >
              <Pause className="h-5 w-5 mr-3" weight="fill" />
              <div className="text-left">
                <div className="font-semibold">Duraklatıldı</div>
                <div className="text-xs opacity-80">Geçici olarak sipariş almayı durdurun</div>
              </div>
            </Button>
            <div className="space-y-2">
              <Button
                variant={panelStatus === 'vacation' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <AirplaneTilt className="h-5 w-5 mr-3" weight="fill" />
                <div className="text-left">
                  <div className="font-semibold">Tatil Modu</div>
                  <div className="text-xs opacity-80">Belirli bir tarihe kadar tatilde olun</div>
                </div>
              </Button>
              <div className="pl-11 space-y-2">
                <Label className="text-xs">Tatil Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={vacationUntilDate}
                  onChange={(e) => setVacationUntilDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!vacationUntilDate}
                  onClick={() => {
                    if (vacationUntilDate) {
                      onSetPanelVacation(vacationUntilDate);
                      setShowPanelStatusDialog(false);
                      setVacationUntilDate('');
                    }
                  }}
                >
                  Tatil Modunu Aktifleştir
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPanelStatusDialog(false)}>
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Varyantlı Ürün</Label>
                      <p className="text-xs text-muted-foreground">Farklı gramaj/boyut seçenekleri var mı? (Örn: 250gr, 500gr, 1kg)</p>
                    </div>
                    <Switch
                      checked={newProduct.hasVariants}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, hasVariants: checked })}
                    />
                  </div>

                  {newProduct.hasVariants ? (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold text-sm">Varyantlar</h3>
                      
                      {newProduct.variants.length > 0 && (
                        <div className="space-y-2">
                          {newProduct.variants.map((variant) => (
                            <div key={variant.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{variant.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {variant.unitPrice} ₺ - Min: {variant.minOrderQuantity} {newProduct.unit} - Stok: {variant.stock}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveVariant(variant.id)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3 p-3 border rounded-lg bg-background">
                        <Label className="text-sm">Yeni Varyant Ekle</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Varyant Adı *</Label>
                            <Input
                              placeholder="Örn: 250 gram"
                              value={newVariant.name}
                              onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Fiyat (₺) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newVariant.unitPrice || ''}
                              onChange={(e) => setNewVariant({ ...newVariant, unitPrice: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Stok</Label>
                            <Input
                              type="number"
                              value={newVariant.stock || ''}
                              onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Min. Sipariş</Label>
                            <Input
                              type="number"
                              value={newVariant.minOrderQuantity || ''}
                              onChange={(e) => setNewVariant({ ...newVariant, minOrderQuantity: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleAddVariant}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Varyant Ekle
                        </Button>
                      </div>
                    </div>
                  ) : (
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
                        <Label>Stok</Label>
                        <Input
                          type="number"
                          value={newProduct.stock || ''}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Birim</Label>
                      <Input
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                        placeholder="adet, kg, gram, litre"
                      />
                    </div>
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
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{product.name}</h3>
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                          {product.hasVariants && (
                            <Badge variant="outline">Varyantlı</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                        
                        {product.hasVariants && product.variants && product.variants.length > 0 ? (
                          <div className="space-y-2 mt-3">
                            <p className="text-xs font-medium text-muted-foreground">Varyantlar:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {product.variants.map(variant => (
                                <div key={variant.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => onToggleVariantActive(product.id, variant.id)}
                                    >
                                      {variant.isActive ? (
                                        <ToggleRight className="h-5 w-5 text-primary" weight="fill" />
                                      ) : (
                                        <ToggleLeft className="h-5 w-5 text-muted-foreground" weight="fill" />
                                      )}
                                    </Button>
                                    <span className={`font-medium ${!variant.isActive ? 'text-muted-foreground line-through' : ''}`}>
                                      {variant.name}
                                    </span>
                                  </div>
                                  <div className="flex gap-3 text-xs">
                                    <span><strong>{variant.unitPrice} ₺</strong></span>
                                    <span className="text-muted-foreground">Min: {variant.minOrderQuantity}</span>
                                    <span className="text-muted-foreground">Stok: {variant.stock}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 text-sm">
                            <span>Fiyat: <strong>{product.unitPrice} ₺/{product.unit}</strong></span>
                            <span>Min. Sipariş: <strong>{product.minOrderQuantity} {product.unit}</strong></span>
                            <span>Stok: <strong>{product.stock}</strong></span>
                          </div>
                        )}
                        
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
                      <div className="flex flex-col gap-2">
                        <Button
                          variant={product.isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onToggleProductActive(product.id)}
                        >
                          {product.isActive ? (
                            <>
                              <Power className="h-4 w-4 mr-1" weight="fill" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Pasif
                            </>
                          )}
                        </Button>
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
                              {item.productName}{item.variantName ? ` (${item.variantName})` : ''} - {item.quantity} adet - {item.totalPrice.toFixed(2)} ₺
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
  onCreateOrder: (productId: string, quantity: number, variantId?: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getAnonymousSupplierName: (supplierId: string) => string;
  commissionRate: number;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<B2BProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleOrderClick = (product: B2BProduct) => {
    setSelectedProduct(product);
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      const activeVariants = product.variants.filter(v => v.isActive);
      if (activeVariants.length > 0) {
        const firstVariant = activeVariants[0];
        setSelectedVariantId(firstVariant.id);
        setOrderQuantity(firstVariant.minOrderQuantity);
      } else {
        setSelectedVariantId(undefined);
        setOrderQuantity(product.minOrderQuantity);
      }
    } else {
      setSelectedVariantId(undefined);
      setOrderQuantity(product.minOrderQuantity);
    }
    setShowOrderDialog(true);
  };

  const getSelectedVariant = () => {
    if (!selectedProduct || !selectedVariantId || !selectedProduct.hasVariants || !selectedProduct.variants) {
      return null;
    }
    return selectedProduct.variants.find(v => v.id === selectedVariantId);
  };

  const getCurrentPrice = () => {
    if (!selectedProduct) return 0;
    const variant = getSelectedVariant();
    return variant ? variant.unitPrice : selectedProduct.unitPrice;
  };

  const getMinOrderQuantity = () => {
    if (!selectedProduct) return 1;
    const variant = getSelectedVariant();
    return variant ? variant.minOrderQuantity : selectedProduct.minOrderQuantity;
  };

  const handleCreateOrder = () => {
    if (!selectedProduct) return;
    const minQty = getMinOrderQuantity();
    if (orderQuantity < minQty) {
      toast.error(`Minimum sipariş miktarı: ${minQty}`);
      return;
    }
    onCreateOrder(selectedProduct.id, orderQuantity, selectedVariantId);
    setShowOrderDialog(false);
    setSelectedProduct(null);
    setSelectedVariantId(undefined);
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

                        {product.hasVariants && product.variants && product.variants.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Seçenekler:</p>
                            <div className="space-y-1">
                              {product.variants.filter(v => v.isActive).slice(0, 3).map((variant) => (
                                <div key={variant.id} className="flex justify-between text-xs p-2 border rounded">
                                  <span className="font-medium">{variant.name}</span>
                                  <span className="text-primary font-semibold">{variant.unitPrice} ₺</span>
                                </div>
                              ))}
                              {product.variants.filter(v => v.isActive).length > 3 && (
                                <p className="text-xs text-muted-foreground text-center">+{product.variants.filter(v => v.isActive).length - 3} seçenek daha</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Fiyat:</span>
                              <strong>{product.unitPrice} ₺/{product.unit}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Min. Sipariş:</span>
                              <strong>{product.minOrderQuantity} {product.unit}</strong>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between text-sm">
                          <span>Kargo:</span>
                          <span>{product.shippingMethod === 'free' ? 'Ücretsiz' : 'Alıcı Ödemeli'}</span>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {product.canProvideSample && (
                            <Badge variant="outline" className="text-xs">Numune Var</Badge>
                          )}
                          {product.requiresDesign && (
                            <Badge variant="outline" className="text-xs">Tasarım Gerekir</Badge>
                          )}
                          {product.hasVariants && (
                            <Badge variant="outline" className="text-xs">Çoklu Seçenek</Badge>
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
                              {item.productName}{item.variantName ? ` (${item.variantName})` : ''} - {item.quantity} adet - {item.totalPrice.toFixed(2)} ₺
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
              
              {selectedProduct.hasVariants && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="space-y-2">
                  <Label>Seçenek</Label>
                  <Select
                    value={selectedVariantId}
                    onValueChange={(v) => {
                      setSelectedVariantId(v);
                      const variant = selectedProduct.variants?.find(variant => variant.id === v);
                      if (variant) {
                        setOrderQuantity(variant.minOrderQuantity);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçenek seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProduct.variants.filter(v => v.isActive).map(variant => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.name} - {variant.unitPrice} ₺ (Min: {variant.minOrderQuantity} {selectedProduct.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Miktar ({selectedProduct.unit})</Label>
                <Input
                  type="number"
                  min={getMinOrderQuantity()}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || getMinOrderQuantity())}
                />
                <p className="text-xs text-muted-foreground">
                  Min. sipariş: {getMinOrderQuantity()} {selectedProduct.unit}
                </p>
              </div>
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Birim Fiyat:</span>
                  <span>{getCurrentPrice()} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ara Toplam:</span>
                  <span>{(getCurrentPrice() * orderQuantity).toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>KDV (%18):</span>
                  <span>{(getCurrentPrice() * orderQuantity * 0.18).toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kargo:</span>
                  <span>{selectedProduct.shippingMethod === 'free' ? 'Ücretsiz' : '150 ₺'}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Toplam:</span>
                  <span>
                    {(
                      getCurrentPrice() * orderQuantity * 1.18 +
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

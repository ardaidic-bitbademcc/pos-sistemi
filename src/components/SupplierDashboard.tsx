import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  SignOut, 
  Package, 
  ShoppingCart, 
  TrendUp, 
  CurrencyCircleDollar, 
  ChartLine, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus,
  Trash,
  Power,
  Pause,
  AirplaneTilt,
  ToggleLeft,
  ToggleRight,
  Eye
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { B2BProduct, B2BOrder, SampleRequest, SupplierAuthSession, ProductVariant, ShippingMethod, OrderStatus, SampleRequestStatus } from '@/lib/types';

interface SupplierDashboardProps {
  session: SupplierAuthSession;
  onLogout: () => void;
}

export default function SupplierDashboard({ session, onLogout }: SupplierDashboardProps) {
  const [products, setProducts] = useKV<B2BProduct[]>('b2b-products', []);
  const [orders, setOrders] = useKV<B2BOrder[]>('b2b-orders', []);
  const [sampleRequests, setSampleRequests] = useKV<SampleRequest[]>('b2b-sample-requests', []);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPanelStatusDialog, setShowPanelStatusDialog] = useState(false);
  const [vacationUntilDate, setVacationUntilDate] = useState('');
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    unitPrice: 0,
    taxRate: 20,
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
  
  const [editingProduct, setEditingProduct] = useState<B2BProduct | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const [newVariant, setNewVariant] = useState({
    name: '',
    unitPrice: 0,
    stock: 0,
    minOrderQuantity: 1,
  });

  const myProducts = useMemo(() => 
    (products || []).filter(p => p.supplierId === session.supplierId),
    [products, session.supplierId]
  );

  const myOrders = useMemo(() => 
    (orders || []).filter(o => o.supplierId === session.supplierId),
    [orders, session.supplierId]
  );

  const mySampleRequests = useMemo(() => 
    (sampleRequests || []).filter(r => r.supplierId === session.supplierId),
    [sampleRequests, session.supplierId]
  );

  const stats = useMemo(() => {
    const activeProducts = myProducts.filter(p => p.isActive).length;
    const totalStock = myProducts.reduce((sum, p) => {
      if (p.hasVariants && p.variants) {
        return sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0);
      }
      return sum + p.stock;
    }, 0);
    
    const completedOrders = myOrders.filter(o => o.status === 'delivered');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const platformCommission = totalRevenue * 0.1;
    const netProfit = totalRevenue - platformCommission;
    
    const pendingOrders = myOrders.filter(o => o.status === 'pending').length;
    const preparingOrders = myOrders.filter(o => o.status === 'preparing').length;
    const shippedOrders = myOrders.filter(o => o.status === 'shipped').length;
    
    const pendingSamples = mySampleRequests.filter(r => r.status === 'pending').length;
    
    const thisMonth = new Date().getMonth();
    const thisMonthOrders = completedOrders.filter(o => {
      const orderDate = new Date(o.orderDate);
      return orderDate.getMonth() === thisMonth;
    });
    const monthlyRevenue = thisMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    return {
      activeProducts,
      totalStock,
      totalRevenue,
      netProfit,
      pendingOrders,
      preparingOrders,
      shippedOrders,
      pendingSamples,
      completedOrders: completedOrders.length,
      monthlyRevenue,
      averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
    };
  }, [myProducts, myOrders, mySampleRequests]);

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
    if (!newProduct.taxRate || newProduct.taxRate <= 0) {
      toast.error('KDV oranı girilmesi zorunludur');
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

    const product: B2BProduct = {
      ...newProduct,
      id: `product-${Date.now()}`,
      supplierId: session.supplierId,
      supplierName: session.supplierName,
      createdAt: new Date().toISOString(),
    };

    setProducts((current) => [...(current || []), product]);
    toast.success('Ürün başarıyla eklendi');
    setShowAddDialog(false);
    setNewProduct({
      name: '',
      description: '',
      category: '',
      unitPrice: 0,
      taxRate: 20,
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
  
  const handleEditProduct = (product: B2BProduct) => {
    setEditingProduct(product);
    setShowEditDialog(true);
  };
  
  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    
    if (!editingProduct.name || !editingProduct.category) {
      toast.error('Lütfen ürün adı ve kategori girin');
      return;
    }
    if (!editingProduct.taxRate || editingProduct.taxRate <= 0) {
      toast.error('KDV oranı girilmesi zorunludur');
      return;
    }
    if (editingProduct.hasVariants && (!editingProduct.variants || editingProduct.variants.length === 0)) {
      toast.error('Varyantlı ürün için en az bir varyant ekleyin');
      return;
    }
    if (!editingProduct.hasVariants && editingProduct.unitPrice <= 0) {
      toast.error('Lütfen geçerli bir fiyat girin');
      return;
    }

    setProducts((current) =>
      (current || []).map(p => p.id === editingProduct.id ? editingProduct : p)
    );
    toast.success('Ürün güncellendi');
    setShowEditDialog(false);
    setEditingProduct(null);
  };

  const toggleProductActive = (productId: string) => {
    setProducts((current) =>
      (current || []).map(p =>
        p.id === productId ? { ...p, isActive: !p.isActive } : p
      )
    );
    const product = myProducts.find(p => p.id === productId);
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
                  updatedBy: session.supplierName,
                  notes,
                }
              ]
            }
          : order
      )
    );
    toast.success('Sipariş durumu güncellendi');
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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{session.supplierName}</h1>
              <p className="text-sm text-muted-foreground">Tedarikçi Paneli</p>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <SignOut className="h-4 w-4 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Aktif Ürünler</CardTitle>
                <Package className="h-5 w-5 text-primary" weight="fill" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Toplam Stok: {stats.totalStock}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Bekleyen Siparişler</CardTitle>
                <Clock className="h-5 w-5 text-orange-500" weight="fill" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Hazırlanıyor: {stats.preparingOrders} | Kargoda: {stats.shippedOrders}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
                <CurrencyCircleDollar className="h-5 w-5 text-green-500" weight="fill" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRevenue.toFixed(2)} ₺</div>
              <p className="text-xs text-muted-foreground mt-1">
                Net Kar: {stats.netProfit.toFixed(2)} ₺ (Komis. -%10)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
                <ChartLine className="h-5 w-5 text-blue-500" weight="fill" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.monthlyRevenue.toFixed(2)} ₺</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ort. Sipariş: {stats.averageOrderValue.toFixed(2)} ₺
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Satış Performansı</CardTitle>
                <CardDescription>Sipariş durumu ve analizi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tamamlanan Siparişler</span>
                  <CheckCircle className="h-5 w-5 text-green-500" weight="fill" />
                </div>
                <div className="text-2xl font-bold">{stats.completedOrders}</div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${myOrders.length > 0 ? (stats.completedOrders / myOrders.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">İşlemde</span>
                  <Clock className="h-5 w-5 text-orange-500" weight="fill" />
                </div>
                <div className="text-2xl font-bold">{stats.preparingOrders + stats.shippedOrders}</div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500" 
                    style={{ width: `${myOrders.length > 0 ? ((stats.preparingOrders + stats.shippedOrders) / myOrders.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Numune Talepleri</span>
                  <Eye className="h-5 w-5 text-blue-500" weight="fill" />
                </div>
                <div className="text-2xl font-bold">{stats.pendingSamples}</div>
                <p className="text-xs text-muted-foreground">Bekleyen talep sayısı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Ürünlerim ({myProducts.length})</TabsTrigger>
            <TabsTrigger value="orders">Siparişler ({myOrders.length})</TabsTrigger>
            <TabsTrigger value="samples">Numune Talepleri ({mySampleRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ürün Yönetimi</CardTitle>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Ürün Ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Yeni Ürün Ekle</DialogTitle>
                        <DialogDescription>E-ticaret platformuna yeni ürün ekleyin</DialogDescription>
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
                            <p className="text-xs text-muted-foreground">Farklı gramaj/boyut seçenekleri (Örn: 250gr, 500gr, 1kg)</p>
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
                          <div className="grid grid-cols-4 gap-4">
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
                              <Label>KDV (%) *</Label>
                              <Input
                                type="number"
                                step="1"
                                value={newProduct.taxRate || ''}
                                onChange={(e) => setNewProduct({ ...newProduct, taxRate: parseFloat(e.target.value) || 0 })}
                                placeholder="20"
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
                {myProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz ürün eklemediniz</p>
                    <p className="text-sm">Yeni ürün ekleyerek başlayın</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myProducts.map(product => (
                      <Card key={product.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
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
                                            onClick={() => toggleVariantActive(product.id, variant.id)}
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
                              
                              <div className="flex gap-2 flex-wrap">
                                {product.canProvideSample && (
                                  <Badge variant="outline" className="text-xs">Numune Verilebilir</Badge>
                                )}
                                {product.requiresDesign && (
                                  <Badge variant="outline" className="text-xs">Tasarım Gerekir</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {product.shippingMethod === 'free' ? 'Ücretsiz Kargo' : 'Alıcı Ödemeli'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                Düzenle
                              </Button>
                              <Button
                                variant={product.isActive ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleProductActive(product.id)}
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
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Siparişler</CardTitle>
                <CardDescription>Müşteri isimleri gizlidir</CardDescription>
              </CardHeader>
              <CardContent>
                {myOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz sipariş yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map(order => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                                <Badge>{getOrderStatusBadge(order.status)}</Badge>
                              </div>
                              <p className="text-sm">Müşteri: <strong>Anonim</strong></p>
                              
                              {order.billingInfo && (
                                <div className="mt-3 p-3 border rounded-lg bg-muted/30 space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground mb-1">Fatura Bilgileri</p>
                                  {order.billingInfo.companyName && (
                                    <p className="text-sm"><strong>Firma:</strong> {order.billingInfo.companyName}</p>
                                  )}
                                  {order.billingInfo.taxNumber && order.billingInfo.taxOffice && (
                                    <p className="text-sm"><strong>Vergi No:</strong> {order.billingInfo.taxNumber} - {order.billingInfo.taxOffice}</p>
                                  )}
                                  {order.billingInfo.address && (
                                    <p className="text-sm"><strong>Adres:</strong> {order.billingInfo.address}</p>
                                  )}
                                  {order.billingInfo.phone && (
                                    <p className="text-sm"><strong>Tel:</strong> {order.billingInfo.phone}</p>
                                  )}
                                  {order.billingInfo.email && (
                                    <p className="text-sm"><strong>E-posta:</strong> {order.billingInfo.email}</p>
                                  )}
                                </div>
                              )}
                              
                              <div className="text-sm space-y-1 mt-2">
                                {order.items.map(item => (
                                  <div key={item.id}>
                                    {item.productName}{item.variantName ? ` (${item.variantName})` : ''} - {item.quantity} adet - {item.totalPrice.toFixed(2)} ₺
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm">Toplam: <strong>{order.totalAmount.toFixed(2)} ₺</strong></p>
                              <p className="text-xs text-muted-foreground">
                                Platform komisyonu (%10): {(order.totalAmount * 0.1).toFixed(2)} ₺ | 
                                Net: {(order.totalAmount * 0.9).toFixed(2)} ₺
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              {order.status === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => updateOrderStatus(order.id, 'approved')}>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Onayla
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reddet
                                  </Button>
                                </>
                              )}
                              {order.status === 'approved' && (
                                <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                                  <Clock className="h-4 w-4 mr-1" />
                                  Hazırlanıyor
                                </Button>
                              )}
                              {order.status === 'preparing' && (
                                <Button size="sm" onClick={() => updateOrderStatus(order.id, 'shipped')}>
                                  <TrendUp className="h-4 w-4 mr-1" />
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
          </TabsContent>

          <TabsContent value="samples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Numune Talepleri</CardTitle>
                <CardDescription>Müşteri bilgileri gizlidir</CardDescription>
              </CardHeader>
              <CardContent>
                {mySampleRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz numune talebi yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySampleRequests.map(request => (
                      <Card key={request.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold">{request.productName}</h3>
                              <p className="text-sm">Müşteri: <strong>Anonim</strong></p>
                              <p className="text-xs text-muted-foreground">Talep: {new Date(request.requestDate).toLocaleDateString('tr-TR')}</p>
                              <Badge>{getSampleStatusBadge(request.status)}</Badge>
                            </div>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateSampleRequest(request.id, 'approved')}>
                                  Onayla
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => updateSampleRequest(request.id, 'rejected', 'Stok yok')}>
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
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ürünü Düzenle</DialogTitle>
            <DialogDescription>Ürün bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ürün Adı *</Label>
                  <Input
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori *</Label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={(v) => setEditingProduct({ ...editingProduct, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              {!editingProduct.hasVariants && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Birim Fiyat (₺) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingProduct.unitPrice || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>KDV (%) *</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editingProduct.taxRate || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, taxRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min. Sipariş *</Label>
                    <Input
                      type="number"
                      value={editingProduct.minOrderQuantity || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, minOrderQuantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stok</Label>
                    <Input
                      type="number"
                      value={editingProduct.stock || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Birim</Label>
                  <Input
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kargo Koşulu</Label>
                  <Select
                    value={editingProduct.shippingMethod}
                    onValueChange={(v) => setEditingProduct({ ...editingProduct, shippingMethod: v as ShippingMethod })}
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
                  checked={editingProduct.canProvideSample}
                  onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, canProvideSample: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Baskılı/Tasarım Gerektiriyor</Label>
                  <p className="text-xs text-muted-foreground">Ürün özel tasarım veya logo baskısı gerektiriyor mu?</p>
                </div>
                <Switch
                  checked={editingProduct.requiresDesign}
                  onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, requiresDesign: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setEditingProduct(null); }}>İptal</Button>
            <Button onClick={handleUpdateProduct}>Güncelle</Button>
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

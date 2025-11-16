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
import { ArrowLeft, Package, ShoppingBag, Truck, CheckCircle, XCircle, Clock, Storefront, Eye, EyeSlash, Plus, Trash, Power, Pause, AirplaneTilt, ToggleLeft, ToggleRight, ClipboardText, ListChecks } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { B2BProduct, B2BOrder, SampleRequest, UserRole, ShippingMethod, OrderStatus, SampleRequestStatus, ProductVariant, SupplierPanelStatus, AuthSession, Product, MenuItem } from '@/lib/types';

interface B2BModuleProps {
  onBack: () => void;
  currentUserRole: UserRole;
  currentUserName: string;
  authSession?: AuthSession | null;
}

export default function B2BModule({ onBack, currentUserRole, currentUserName, authSession }: B2BModuleProps) {
  const [isSupplierMode, setIsSupplierMode] = useKV<boolean>('b2b-is-supplier-mode', false);
  const [products, setProducts] = useKV<B2BProduct[]>('b2b-products', []);
  const [orders, setOrders] = useKV<B2BOrder[]>('b2b-orders', []);
  const [sampleRequests, setSampleRequests] = useKV<SampleRequest[]>('b2b-sample-requests', []);
  const [commissionRate] = useKV<number>('b2b-commission-rate', 10);
  const [supplierPanelStatus, setSupplierPanelStatus] = useKV<SupplierPanelStatus>('b2b-supplier-panel-status', 'active');
  const [supplierPausedUntil, setSupplierPausedUntil] = useKV<string | null>('b2b-supplier-paused-until', null);
  const [stockProducts, setStockProducts] = useKV<Product[]>('products', []);
  const [menuItems, setMenuItems] = useKV<MenuItem[]>('menuItems', []);
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

  const createOrder = (productId: string, quantity: number, variantId?: string, billingInfo?: any) => {
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
    const taxAmount = subtotal * (product.taxRate / 100);
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
      billingInfo: billingInfo && (billingInfo.companyName || billingInfo.taxNumber) ? billingInfo : undefined,
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

  const confirmDelivery = (orderId: string, withTracking: boolean = false) => {
    const order = (orders || []).find(o => o.id === orderId);
    if (!order) {
      toast.error('Sipariş bulunamadı');
      return;
    }

    if (order.status !== 'delivered' && order.status !== 'shipped') {
      toast.error('Sadece kargoda veya teslim edildi durumundaki siparişler için teslim alınabilir');
      return;
    }

    setOrders((current) =>
      (current || []).map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'delivered' as OrderStatus,
              deliveredDate: new Date().toISOString(),
              statusHistory: [
                ...o.statusHistory,
                {
                  status: 'delivered' as OrderStatus,
                  timestamp: new Date().toISOString(),
                  updatedBy: currentUserName,
                  notes: withTracking ? 'Müşteri tarafından stok takibi ile teslim alındı' : 'Müşteri tarafından teslim alındı',
                }
              ]
            }
          : o
      )
    );

    order.items.forEach(item => {
      const b2bProduct = (products || []).find(p => p.id === item.productId);
      if (!b2bProduct) return;

      const matchingStockProduct = (stockProducts || []).find(p => 
        p.name.toLowerCase().trim() === b2bProduct.name.toLowerCase().trim()
      );

      if (matchingStockProduct) {
        setStockProducts((current) =>
          (current || []).map(p =>
            p.id === matchingStockProduct.id
              ? {
                  ...p,
                  stock: p.stock + item.quantity,
                  costPrice: item.unitPrice,
                }
              : p
          )
        );
        
        const relatedMenuItem = (menuItems || []).find(m => 
          m.name.toLowerCase().trim() === b2bProduct.name.toLowerCase().trim()
        );
        
        if (relatedMenuItem) {
          setMenuItems((current) =>
            (current || []).map(m =>
              m.id === relatedMenuItem.id
                ? {
                    ...m,
                    costPrice: item.unitPrice,
                  }
                : m
            )
          );
        }
      } else {
        const newStockProduct: Product = {
          id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sku: `B2B-${Date.now()}`,
          name: b2bProduct.name,
          description: b2bProduct.description,
          categoryId: 'b2b-import',
          category: b2bProduct.category,
          basePrice: item.unitPrice * 1.3,
          costPrice: item.unitPrice,
          taxRate: b2bProduct.taxRate,
          unit: b2bProduct.unit,
          imageUrl: b2bProduct.imageUrl,
          isActive: true,
          stock: item.quantity,
          minStockLevel: Math.ceil(item.quantity * 0.2),
          trackStock: true,
          branchId: authSession?.branchId,
          adminId: authSession?.adminId,
        };
        
        setStockProducts((current) => [...(current || []), newStockProduct]);
      }
    });

    toast.success('Sipariş teslim alındı! Ürünler stoklara eklendi ve maliyet fiyatları güncellendi.', {
      duration: 5000,
    });
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
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-semibold truncate">B2B Tedarik Platformu</h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">Ürün siparişi ver veya tedarikçi olarak ürün sat</p>
          </div>
        </div>

        {!isSupplierMode && (
          <Alert className="mb-4 sm:mb-6">
            <Storefront className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              Tedarikçi paneline erişmek için ana ekranda <strong>"Tedarikçi Girişi"</strong> butonunu kullanın.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="customer" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-1">
            <TabsTrigger value="customer" className="text-xs sm:text-sm">
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              E-Ticaret Platformu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-6">
            <CustomerPanel
              products={availableProducts}
              orders={myCustomerOrders}
              sampleRequests={myCustomerSampleRequests}
              onRequestSample={requestSample}
              onCreateOrder={createOrder}
              onUpdateOrderStatus={updateOrderStatus}
              onConfirmDelivery={confirmDelivery}
              getAnonymousSupplierName={getAnonymousSupplierName}
              commissionRate={actualCommissionRate}
            />
          </TabsContent>
        </Tabs>
      </div>
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
  onConfirmDelivery,
  getAnonymousSupplierName,
  commissionRate,
}: {
  products: B2BProduct[];
  orders: B2BOrder[];
  sampleRequests: SampleRequest[];
  onRequestSample: (productId: string) => void;
  onCreateOrder: (productId: string, quantity: number, variantId?: string, billingInfo?: any) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onConfirmDelivery: (orderId: string, withTracking?: boolean) => void;
  getAnonymousSupplierName: (supplierId: string) => string;
  commissionRate: number;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<B2BProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showBulkDeliveryDialog, setShowBulkDeliveryDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<B2BOrder | null>(null);
  const [trackingQuantities, setTrackingQuantities] = useState<Record<string, number>>({});
  const [billingInfo, setBillingInfo] = useState({
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    address: '',
    phone: '',
    email: '',
  });

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
    onCreateOrder(selectedProduct.id, orderQuantity, selectedVariantId, billingInfo);
    setShowOrderDialog(false);
    setSelectedProduct(null);
    setSelectedVariantId(undefined);
    setBillingInfo({
      companyName: '',
      taxNumber: '',
      taxOffice: '',
      address: '',
      phone: '',
      email: '',
    });
  };

  const deliverableOrders = orders.filter(
    order => (order.status === 'delivered' || order.status === 'shipped') && !order.deliveredDate
  );

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === deliverableOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(deliverableOrders.map(o => o.id)));
    }
  };

  const handleBulkDelivery = () => {
    if (selectedOrders.size === 0) {
      toast.error('Lütfen en az bir sipariş seçin');
      return;
    }
    setShowBulkDeliveryDialog(true);
  };

  const confirmBulkDelivery = () => {
    selectedOrders.forEach(orderId => {
      onConfirmDelivery(orderId);
    });
    setSelectedOrders(new Set());
    setShowBulkDeliveryDialog(false);
    toast.success(`${selectedOrders.size} sipariş teslim alındı!`);
  };

  const openTrackingDialog = (order: B2BOrder) => {
    setSelectedOrderForTracking(order);
    const initialQuantities: Record<string, number> = {};
    order.items.forEach(item => {
      initialQuantities[item.id] = item.quantity;
    });
    setTrackingQuantities(initialQuantities);
    setShowTrackingDialog(true);
  };

  const handleTrackingQuantityChange = (itemId: string, value: number) => {
    setTrackingQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, value),
    }));
  };

  const confirmDeliveryWithTracking = () => {
    if (!selectedOrderForTracking) return;

    const hasDiscrepancy = selectedOrderForTracking.items.some(
      item => trackingQuantities[item.id] !== item.quantity
    );

    if (hasDiscrepancy) {
      const discrepancies = selectedOrderForTracking.items
        .filter(item => trackingQuantities[item.id] !== item.quantity)
        .map(item => `${item.productName}: Beklenen ${item.quantity}, Sayılan ${trackingQuantities[item.id]}`)
        .join('\n');
      
      toast.warning(`Miktar farklılıkları tespit edildi:\n${discrepancies}`, {
        duration: 6000,
      });
    }

    onConfirmDelivery(selectedOrderForTracking.id, true);
    setShowTrackingDialog(false);
    setSelectedOrderForTracking(null);
    setTrackingQuantities({});
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Siparişlerim</CardTitle>
              {deliverableOrders.length > 0 && (
                <CardDescription className="mt-1">
                  {deliverableOrders.length} sipariş teslim almaya hazır
                </CardDescription>
              )}
            </div>
            {deliverableOrders.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedOrders.size === deliverableOrders.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkDelivery}
                  disabled={selectedOrders.size === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Toplu Teslim Al ({selectedOrders.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz sipariş vermediniz
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const isDeliverable = (order.status === 'delivered' || order.status === 'shipped') && !order.deliveredDate;
                const isSelected = selectedOrders.has(order.id);
                
                return (
                  <Card 
                    key={order.id}
                    className={isSelected ? 'border-primary border-2' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {isDeliverable && (
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                            />
                          </div>
                        )}
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
                          {order.deliveredDate && (
                            <p className="text-xs text-green-600 font-medium">
                              Teslim alındı: {new Date(order.deliveredDate).toLocaleDateString('tr-TR')} {new Date(order.deliveredDate).toLocaleTimeString('tr-TR')}
                            </p>
                          )}
                        </div>
                        {!isSelected && (
                          <div className="flex flex-col gap-2">
                            {isDeliverable && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => openTrackingDialog(order)}
                                  className="whitespace-nowrap"
                                >
                                  <ListChecks className="h-4 w-4 mr-1" />
                                  Stok Takibi Yap
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => onConfirmDelivery(order.id)}
                                  className="whitespace-nowrap"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Teslim Al
                                </Button>
                              </>
                            )}
                            {order.deliveredDate && (
                              <Button size="sm" variant="outline" disabled>
                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                Teslim Alındı
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
              
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-semibold text-sm">Fatura Bilgileri (İsteğe Bağlı)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Firma Adı</Label>
                    <Input
                      value={billingInfo.companyName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, companyName: e.target.value })}
                      placeholder="Şirket A.Ş."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vergi No</Label>
                    <Input
                      value={billingInfo.taxNumber}
                      onChange={(e) => setBillingInfo({ ...billingInfo, taxNumber: e.target.value })}
                      placeholder="1234567890"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Vergi Dairesi</Label>
                    <Input
                      value={billingInfo.taxOffice}
                      onChange={(e) => setBillingInfo({ ...billingInfo, taxOffice: e.target.value })}
                      placeholder="Kadıköy"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefon</Label>
                    <Input
                      value={billingInfo.phone}
                      onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                      placeholder="0555 123 45 67"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">E-posta</Label>
                    <Input
                      value={billingInfo.email}
                      onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                      placeholder="info@firma.com"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Adres</Label>
                    <Textarea
                      value={billingInfo.address}
                      onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                      placeholder="Tam adres"
                      rows={2}
                    />
                  </div>
                </div>
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
                  <span>KDV (%{selectedProduct.taxRate}):</span>
                  <span>{(getCurrentPrice() * orderQuantity * (selectedProduct.taxRate / 100)).toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kargo:</span>
                  <span>{selectedProduct.shippingMethod === 'free' ? 'Ücretsiz' : '150 ₺'}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Toplam:</span>
                  <span>
                    {(
                      getCurrentPrice() * orderQuantity * (1 + selectedProduct.taxRate / 100) +
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

      <Dialog open={showBulkDeliveryDialog} onOpenChange={setShowBulkDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Toplu Teslim Alma Onayı</DialogTitle>
            <DialogDescription>
              {selectedOrders.size} adet sipariş teslim alınacak ve otomatik olarak stoklara eklenecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                Seçili siparişlerdeki tüm ürünler stok sistemine eklenecek ve maliyet fiyatları güncellenecektir.
              </AlertDescription>
            </Alert>
            <div className="border rounded-lg p-4 space-y-2 max-h-[300px] overflow-y-auto">
              <h4 className="font-semibold text-sm mb-3">Teslim Alınacak Siparişler:</h4>
              {orders
                .filter(order => selectedOrders.has(order.id))
                .map(order => (
                  <div key={order.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs">{order.orderNumber}</span>
                      <Badge variant="secondary" className="text-xs">
                        {order.totalAmount.toFixed(2)} ₺
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {order.items.map(item => (
                        <div key={item.id}>
                          • {item.productName}{item.variantName ? ` (${item.variantName})` : ''} - {item.quantity} adet
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Toplam Sipariş:</span>
                  <span>{selectedOrders.size} adet</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Toplam Tutar:</span>
                  <span className="font-bold">
                    {orders
                      .filter(order => selectedOrders.has(order.id))
                      .reduce((sum, order) => sum + order.totalAmount, 0)
                      .toFixed(2)} ₺
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeliveryDialog(false)}>
              İptal
            </Button>
            <Button onClick={confirmBulkDelivery}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Teslim Al ve Stoklara Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stok Takibi - Teslim Alma</DialogTitle>
            <DialogDescription>
              Teslim alınan ürünleri sayın ve gerçek stok miktarlarını girin
            </DialogDescription>
          </DialogHeader>
          {selectedOrderForTracking && (
            <div className="space-y-4">
              <Alert>
                <ClipboardText className="h-4 w-4" />
                <AlertDescription>
                  Sipariş No: <strong>{selectedOrderForTracking.orderNumber}</strong> - Her ürün için fiziksel sayım yapın
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-sm mb-3">Ürün Sayım Listesi:</h4>
                {selectedOrderForTracking.items.map(item => {
                  const trackedQty = trackingQuantities[item.id] || 0;
                  const orderedQty = item.quantity;
                  const hasDiscrepancy = trackedQty !== orderedQty;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`border rounded-lg p-4 space-y-3 ${
                        hasDiscrepancy ? 'border-destructive bg-destructive/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h5 className="font-semibold">{item.productName}</h5>
                          {item.variantName && (
                            <p className="text-xs text-muted-foreground">Varyant: {item.variantName}</p>
                          )}
                        </div>
                        {hasDiscrepancy && (
                          <Badge variant="destructive" className="text-xs">
                            Fark Var
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Sipariş Edilen</Label>
                          <div className="text-2xl font-bold text-muted-foreground">{orderedQty}</div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Sayılan Miktar</Label>
                          <Input
                            type="number"
                            min="0"
                            value={trackedQty}
                            onChange={(e) => handleTrackingQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="text-2xl font-bold h-14"
                          />
                        </div>
                      </div>

                      {hasDiscrepancy && (
                        <Alert variant="destructive">
                          <AlertDescription className="text-xs">
                            Fark: {trackedQty - orderedQty > 0 ? '+' : ''}{trackedQty - orderedQty} adet
                            {trackedQty > orderedQty && ' (Fazla gelen)'}
                            {trackedQty < orderedQty && ' (Eksik gelen)'}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span className="text-muted-foreground">Birim Fiyat:</span>
                          <span className="font-semibold">{item.unitPrice.toFixed(2)} ₺</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted rounded">
                          <span className="text-muted-foreground">Stok Değeri:</span>
                          <span className="font-semibold">
                            {(trackedQty * item.unitPrice).toFixed(2)} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Özet:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Toplam Ürün Çeşidi:</span>
                    <span className="font-bold">{selectedOrderForTracking.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beklenen Toplam:</span>
                    <span className="font-bold">
                      {selectedOrderForTracking.items.reduce((sum, item) => sum + item.quantity, 0)} adet
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sayılan Toplam:</span>
                    <span className="font-bold">
                      {Object.values(trackingQuantities).reduce((sum, qty) => sum + qty, 0)} adet
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toplam Stok Değeri:</span>
                    <span className="font-bold text-lg">
                      {selectedOrderForTracking.items
                        .reduce((sum, item) => sum + (trackingQuantities[item.id] || 0) * item.unitPrice, 0)
                        .toFixed(2)} ₺
                    </span>
                  </div>
                </div>
              </div>

              {selectedOrderForTracking.items.some(item => trackingQuantities[item.id] !== item.quantity) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Dikkat:</strong> Sayılan miktarlar ile sipariş miktarları arasında fark bulunmaktadır. 
                    Stoklara sayılan miktarlar eklenecektir.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTrackingDialog(false);
                setSelectedOrderForTracking(null);
                setTrackingQuantities({});
              }}
            >
              İptal
            </Button>
            <Button onClick={confirmDeliveryWithTracking}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Teslim Al ve Stoklara Ekle
            </Button>
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

import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Gear, Plus, Trash, Package, CurrencyCircleDollar, CreditCard } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Product, PaymentMethod } from '@/lib/types';
import { formatCurrency, generateId } from '@/lib/helpers';

interface SettingsModuleProps {
  onBack: () => void;
}

interface AppSettings {
  taxRates: TaxRate[];
  paymentMethods: PaymentMethodSetting[];
  stockAlerts: boolean;
  autoCalculateSalary: boolean;
  pricesIncludeVAT: boolean;
}

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
}

interface PaymentMethodSetting {
  method: PaymentMethod;
  displayName: string;
  isActive: boolean;
  icon: string;
}

interface StockEntry {
  productId: string;
  productName: string;
  currentStock: number;
  addQuantity: number;
}

export default function SettingsModule({ onBack }: SettingsModuleProps) {
  const [products, setProducts] = useKV<Product[]>('products', []);
  
  const defaultSettings: AppSettings = {
    taxRates: [
      { id: '1', name: 'Standart KDV', rate: 18, isDefault: true },
      { id: '2', name: 'İndirimli KDV', rate: 8, isDefault: false },
      { id: '3', name: 'Özel KDV', rate: 1, isDefault: false },
    ],
    paymentMethods: [
      { method: 'cash', displayName: 'Nakit', isActive: true, icon: 'Money' },
      { method: 'card', displayName: 'Kredi Kartı', isActive: true, icon: 'CreditCard' },
      { method: 'mobile', displayName: 'Mobil Ödeme', isActive: true, icon: 'DeviceMobile' },
    ],
    stockAlerts: true,
    autoCalculateSalary: false,
    pricesIncludeVAT: false,
  };
  
  const [settings, setSettings] = useKV<AppSettings>('appSettings', defaultSettings);

  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState(18);

  const openStockDialog = (product: Product) => {
    setSelectedProduct(product);
    setStockQuantity(0);
    setShowStockDialog(true);
  };

  const addStock = () => {
    if (!selectedProduct || stockQuantity <= 0) {
      toast.error('Geçersiz miktar');
      return;
    }

    setProducts((current) =>
      (current || []).map((p) =>
        p.id === selectedProduct.id
          ? { ...p, stock: p.stock + stockQuantity }
          : p
      )
    );

    toast.success(`${selectedProduct.name} stoğuna ${stockQuantity} adet eklendi`);
    setShowStockDialog(false);
    setSelectedProduct(null);
    setStockQuantity(0);
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setSettings((current) => {
      const curr = current || defaultSettings;
      return {
        ...curr,
        paymentMethods: curr.paymentMethods.map((pm) =>
          pm.method === method ? { ...pm, isActive: !pm.isActive } : pm
        ),
      };
    });
    
    const methodSetting = (settings || defaultSettings).paymentMethods.find(pm => pm.method === method);
    if (methodSetting) {
      toast.success(`${methodSetting.displayName} ${!methodSetting.isActive ? 'aktif' : 'pasif'} edildi`);
    }
  };

  const addTaxRate = () => {
    if (!newTaxName.trim()) {
      toast.error('KDV adı gerekli');
      return;
    }

    const newTax: TaxRate = {
      id: generateId(),
      name: newTaxName,
      rate: newTaxRate,
      isDefault: false,
    };

    setSettings((current) => {
      const curr = current || defaultSettings;
      return {
        ...curr,
        taxRates: [...curr.taxRates, newTax],
      };
    });

    toast.success('Yeni KDV oranı eklendi');
    setShowTaxDialog(false);
    setNewTaxName('');
    setNewTaxRate(18);
  };

  const deleteTaxRate = (taxId: string) => {
    const tax = (settings || defaultSettings).taxRates.find(t => t.id === taxId);
    if (tax?.isDefault) {
      toast.error('Varsayılan KDV oranı silinemez');
      return;
    }

    setSettings((current) => {
      const curr = current || defaultSettings;
      return {
        ...curr,
        taxRates: curr.taxRates.filter((t) => t.id !== taxId),
      };
    });

    toast.success('KDV oranı silindi');
  };

  const setDefaultTaxRate = (taxId: string) => {
    setSettings((current) => {
      const curr = current || defaultSettings;
      return {
        ...curr,
        taxRates: curr.taxRates.map((t) => ({
          ...t,
          isDefault: t.id === taxId,
        })),
      };
    });

    toast.success('Varsayılan KDV oranı güncellendi');
  };

  const updateProductTaxRate = (productId: string, taxRate: number) => {
    setProducts((current) =>
      (current || []).map((p) =>
        p.id === productId ? { ...p, taxRate } : p
      )
    );
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Ayarlar</h1>
          <p className="text-muted-foreground text-sm">Sistem ayarlarını yönet</p>
        </div>
      </header>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Stok Yönetimi</TabsTrigger>
          <TabsTrigger value="tax">KDV Ayarları</TabsTrigger>
          <TabsTrigger value="payment">Ödeme Yöntemleri</TabsTrigger>
          <TabsTrigger value="general">Genel</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Stok Girişi</CardTitle>
                  <CardDescription>Ürün stoklarını güncelleyin</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(products || []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Henüz ürün yok
                  </p>
                ) : (
                  (products || []).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{product.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>SKU: {product.sku}</span>
                          <span className="font-tabular-nums">
                            Mevcut Stok: {product.stock} {product.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.stock <= product.minStockLevel
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-accent/10 text-accent'
                        }`}>
                          {product.stock <= product.minStockLevel ? 'Düşük' : 'Yeterli'}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openStockDialog(product)}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Stok Ekle
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">KDV Oranları</CardTitle>
                  <CardDescription>KDV oranlarını düzenleyin ve yönetin</CardDescription>
                </div>
                <Button onClick={() => setShowTaxDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni KDV Ekle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium">Tanımlı KDV Oranları</p>
                {(settings || defaultSettings).taxRates.map((tax) => (
                  <div
                    key={tax.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{tax.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Oran: %{tax.rate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tax.isDefault ? (
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          Varsayılan
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefaultTaxRate(tax.id)}
                          >
                            Varsayılan Yap
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTaxRate(tax.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">Ürün KDV Atamaları</p>
                {(products || []).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Mevcut KDV: %{product.taxRate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(settings || defaultSettings).taxRates.map((tax) => (
                        <Button
                          key={tax.id}
                          size="sm"
                          variant={product.taxRate === tax.rate ? 'default' : 'outline'}
                          onClick={() => updateProductTaxRate(product.id, tax.rate)}
                        >
                          %{tax.rate}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ödeme Yöntemleri</CardTitle>
              <CardDescription>Ödeme yöntemlerini aktif/pasif yapın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(settings || defaultSettings).paymentMethods.map((pm) => (
                  <div
                    key={pm.method}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${pm.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                        <CreditCard className={`h-6 w-6 ${pm.isActive ? 'text-primary' : 'text-muted-foreground'}`} weight="bold" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{pm.displayName}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {pm.method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        pm.isActive
                          ? 'bg-accent/10 text-accent'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {pm.isActive ? 'Aktif' : 'Pasif'}
                      </div>
                      <Switch
                        checked={pm.isActive}
                        onCheckedChange={() => togglePaymentMethod(pm.method)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Genel Ayarlar</CardTitle>
              <CardDescription>Sistem ayarlarını yapılandırın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Stok Uyarıları</p>
                  <p className="text-sm text-muted-foreground">
                    Düşük stok seviyesinde bildirim al
                  </p>
                </div>
                <Switch
                  checked={(settings || defaultSettings).stockAlerts}
                  onCheckedChange={(checked) => {
                    setSettings((current) => {
                      const curr = current || defaultSettings;
                      return { ...curr, stockAlerts: checked };
                    });
                    toast.success(`Stok uyarıları ${checked ? 'açıldı' : 'kapatıldı'}`);
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Otomatik Maaş Hesaplama</p>
                  <p className="text-sm text-muted-foreground">
                    Ay sonunda otomatik maaş hesapla
                  </p>
                </div>
                <Switch
                  checked={(settings || defaultSettings).autoCalculateSalary}
                  onCheckedChange={(checked) => {
                    setSettings((current) => {
                      const curr = current || defaultSettings;
                      return { ...curr, autoCalculateSalary: checked };
                    });
                    toast.success(`Otomatik maaş hesaplama ${checked ? 'açıldı' : 'kapatıldı'}`);
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Fiyatlar KDV Dahil</p>
                  <p className="text-sm text-muted-foreground">
                    Ürün fiyatları KDV dahil mi hesaplansın?
                  </p>
                </div>
                <Switch
                  checked={(settings || defaultSettings).pricesIncludeVAT}
                  onCheckedChange={(checked) => {
                    setSettings((current) => {
                      const curr = current || defaultSettings;
                      return { ...curr, pricesIncludeVAT: checked };
                    });
                    toast.success(`Fiyatlar KDV ${checked ? 'dahil' : 'hariç'} olarak ayarlandı`);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stok Ekle</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} için stok miktarı ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mevcut Stok</Label>
              <Input
                value={`${selectedProduct?.stock || 0} ${selectedProduct?.unit || ''}`}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Eklenecek Miktar</Label>
              <Input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Yeni Stok: {(selectedProduct?.stock || 0) + stockQuantity} {selectedProduct?.unit}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>
              İptal
            </Button>
            <Button onClick={addStock}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTaxDialog} onOpenChange={setShowTaxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni KDV Oranı</DialogTitle>
            <DialogDescription>
              Yeni bir KDV oranı tanımlayın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>KDV Adı</Label>
              <Input
                value={newTaxName}
                onChange={(e) => setNewTaxName(e.target.value)}
                placeholder="Örn: Özel KDV"
              />
            </div>
            <div className="space-y-2">
              <Label>Oran (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={newTaxRate}
                onChange={(e) => setNewTaxRate(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaxDialog(false)}>
              İptal
            </Button>
            <Button onClick={addTaxRate}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

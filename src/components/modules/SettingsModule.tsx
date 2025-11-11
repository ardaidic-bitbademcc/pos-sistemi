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
import { ArrowLeft, Gear, Plus, Trash, Package, CurrencyCircleDollar, CreditCard, Tag, Eye, EyeSlash, Palette, Money, DeviceMobile, Bank, Ticket, PencilSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Product, PaymentMethod, Category, AppTheme, AuthSession } from '@/lib/types';
import { formatCurrency, generateId } from '@/lib/helpers';
import { useBranchFilter } from '@/hooks/use-branch-filter';

interface SettingsModuleProps {
  onBack: () => void;
  authSession?: AuthSession | null;
}

interface AppSettings {
  taxRates: TaxRate[];
  paymentMethods: PaymentMethodSetting[];
  stockAlerts: boolean;
  autoCalculateSalary: boolean;
  pricesIncludeVAT: boolean;
  lazyTableWarningMinutes?: number;
  requireGuestCount?: boolean;
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
  const [categories, setCategories] = useKV<Category[]>('categories', []);
  
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
      { method: 'transfer', displayName: 'Havale/EFT', isActive: true, icon: 'Bank' },
      { method: 'multinet', displayName: 'Multinet Açık Hesap', isActive: true, icon: 'Ticket' },
    ],
    stockAlerts: true,
    autoCalculateSalary: false,
    pricesIncludeVAT: false,
    lazyTableWarningMinutes: 120,
    requireGuestCount: false,
  };
  
  const [settings, setSettings] = useKV<AppSettings>('appSettings', defaultSettings);

  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState(18);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingPayment, setEditingPayment] = useState<PaymentMethodSetting | null>(null);
  const [paymentDisplayName, setPaymentDisplayName] = useState('');
  const [paymentIcon, setPaymentIcon] = useState('');

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

  const openEditPaymentDialog = (pm: PaymentMethodSetting) => {
    setEditingPayment(pm);
    setPaymentDisplayName(pm.displayName);
    setPaymentIcon(pm.icon);
    setShowPaymentDialog(true);
  };

  const updatePaymentMethod = () => {
    if (!editingPayment) return;
    
    setSettings((current) => {
      const curr = current || defaultSettings;
      return {
        ...curr,
        paymentMethods: curr.paymentMethods.map((pm) =>
          pm.method === editingPayment.method
            ? { ...pm, displayName: paymentDisplayName, icon: paymentIcon }
            : pm
        ),
      };
    });

    toast.success('Ödeme yöntemi güncellendi');
    setShowPaymentDialog(false);
    setEditingPayment(null);
    setPaymentDisplayName('');
    setPaymentIcon('');
  };

  const getPaymentIcon = (iconName: string, isActive: boolean) => {
    const className = `h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`;
    const weight = 'bold';
    
    switch (iconName) {
      case 'Money':
        return <Money className={className} weight={weight} />;
      case 'CreditCard':
        return <CreditCard className={className} weight={weight} />;
      case 'DeviceMobile':
        return <DeviceMobile className={className} weight={weight} />;
      case 'Bank':
        return <Bank className={className} weight={weight} />;
      case 'Ticket':
        return <Ticket className={className} weight={weight} />;
      default:
        return <CreditCard className={className} weight={weight} />;
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

  const toggleCategoryPOSVisibility = (categoryId: string) => {
    setCategories((current) =>
      (current || []).map((cat) =>
        cat.id === categoryId
          ? { ...cat, showInPOS: cat.showInPOS === false ? true : false }
          : cat
      )
    );
    
    const category = (categories || []).find(c => c.id === categoryId);
    if (category) {
      const newStatus = category.showInPOS === false ? 'gösterilecek' : 'gizlenecek';
      toast.success(`${category.name} satış ekranında ${newStatus}`);
    }
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Kategori adı gerekli');
      return;
    }

    const newCategory: Category = {
      id: generateId(),
      name: newCategoryName,
      description: newCategoryDescription,
      showInPOS: true,
      sortOrder: (categories || []).length,
    };

    setCategories((current) => [...(current || []), newCategory]);
    toast.success('Yeni kategori eklendi');
    setShowCategoryDialog(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const deleteCategory = (categoryId: string) => {
    const category = (categories || []).find(c => c.id === categoryId);
    
    const productsInCategory = (products || []).filter(
      p => p.categoryId === categoryId
    );
    
    if (productsInCategory.length > 0) {
      toast.error(`Bu kategoride ${productsInCategory.length} ürün var. Önce ürünleri taşıyın.`);
      return;
    }

    setCategories((current) =>
      (current || []).filter((c) => c.id !== categoryId)
    );

    toast.success('Kategori silindi');
  };

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">Ayarlar</h1>
          <p className="text-muted-foreground text-xs sm:text-sm truncate">Sistem ayarlarını yönet</p>
        </div>
      </header>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="categories" className="text-xs sm:text-sm">Kategori Yönetimi</TabsTrigger>
          <TabsTrigger value="tax" className="text-xs sm:text-sm">KDV Ayarları</TabsTrigger>
          <TabsTrigger value="payment" className="text-xs sm:text-sm">Ödeme Yöntemleri</TabsTrigger>
          <TabsTrigger value="theme" className="text-xs sm:text-sm">Sistem Teması</TabsTrigger>
          <TabsTrigger value="general" className="text-xs sm:text-sm">Genel</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Kategori Yönetimi</CardTitle>
                  <CardDescription>Kategorileri düzenleyin ve satış ekranında görünürlüklerini kontrol edin</CardDescription>
                </div>
                <Button onClick={() => setShowCategoryDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kategori
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(categories || []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Henüz kategori yok. "Yeni Kategori" butonunu kullanarak kategori ekleyebilirsiniz.
                  </p>
                ) : (
                  (categories || []).map((category) => {
                    const productCount = (products || []).filter(
                      p => p.categoryId === category.id
                    ).length;
                    
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <Tag className="h-5 w-5 text-muted-foreground" weight="bold" />
                            <div>
                              <p className="font-medium">{category.name}</p>
                              {category.description && (
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-8">
                            <span>{productCount} ürün</span>
                            <span className="flex items-center gap-1">
                              {category.showInPOS !== false ? (
                                <>
                                  <Eye className="h-4 w-4" weight="bold" />
                                  Satış ekranında görünür
                                </>
                              ) : (
                                <>
                                  <EyeSlash className="h-4 w-4" weight="bold" />
                                  Satış ekranında gizli
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            category.showInPOS !== false
                              ? 'bg-accent/10 text-accent'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {category.showInPOS !== false ? 'Görünür' : 'Gizli'}
                          </div>
                          <Switch
                            checked={category.showInPOS !== false}
                            onCheckedChange={() => toggleCategoryPOSVisibility(category.id)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCategory(category.id)}
                            disabled={productCount > 0}
                            title={productCount > 0 ? 'Bu kategoride ürünler var' : 'Kategoriyi sil'}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
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
              <CardDescription>Ödeme yöntemlerini aktif/pasif yapın ve düzenleyin</CardDescription>
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
                        {getPaymentIcon(pm.icon, pm.isActive)}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{pm.displayName}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {pm.method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditPaymentDialog(pm)}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
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

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" weight="bold" />
                Sistem Teması
              </CardTitle>
              <CardDescription>
                Uygulamanın genel görünümünü özelleştirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Hazır Temalar</h3>
                <p className="text-sm text-muted-foreground">
                  Aşağıdaki hazır temalardan birini seçerek tüm sistem görünümünü değiştirebilirsiniz
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'default',
                      name: 'Varsayılan',
                      description: 'Modern ve dengeli',
                      primaryColor: 'oklch(0.65 0.20 160)',
                      secondaryColor: 'oklch(0.92 0.08 200)',
                      accentColor: 'oklch(0.75 0.15 280)',
                      backgroundColor: 'oklch(0.98 0.01 180)',
                      foregroundColor: 'oklch(0.15 0.02 240)',
                      borderRadius: '0.75rem',
                      fontFamily: 'Inter',
                      isDark: false,
                    },
                    {
                      id: 'professional',
                      name: 'Profesyonel',
                      description: 'İş odaklı ve ciddi',
                      primaryColor: 'oklch(0.35 0.05 240)',
                      secondaryColor: 'oklch(0.90 0.03 240)',
                      accentColor: 'oklch(0.55 0.15 220)',
                      backgroundColor: 'oklch(0.97 0.005 240)',
                      foregroundColor: 'oklch(0.20 0.02 240)',
                      borderRadius: '0.5rem',
                      fontFamily: 'Inter',
                      isDark: false,
                    },
                    {
                      id: 'warm',
                      name: 'Sıcak',
                      description: 'Samimi ve davetkar',
                      primaryColor: 'oklch(0.60 0.18 40)',
                      secondaryColor: 'oklch(0.93 0.05 60)',
                      accentColor: 'oklch(0.65 0.20 25)',
                      backgroundColor: 'oklch(0.98 0.01 50)',
                      foregroundColor: 'oklch(0.25 0.03 30)',
                      borderRadius: '1rem',
                      fontFamily: 'Inter',
                      isDark: false,
                    },
                    {
                      id: 'minimal',
                      name: 'Minimal',
                      description: 'Sade ve şık',
                      primaryColor: 'oklch(0.25 0 0)',
                      secondaryColor: 'oklch(0.95 0 0)',
                      accentColor: 'oklch(0.60 0.15 190)',
                      backgroundColor: 'oklch(1 0 0)',
                      foregroundColor: 'oklch(0.20 0 0)',
                      borderRadius: '0.375rem',
                      fontFamily: 'Inter',
                      isDark: false,
                    },
                    {
                      id: 'dark',
                      name: 'Karanlık',
                      description: 'Göz yormayan',
                      primaryColor: 'oklch(0.70 0.18 180)',
                      secondaryColor: 'oklch(0.30 0.03 240)',
                      accentColor: 'oklch(0.75 0.20 280)',
                      backgroundColor: 'oklch(0.18 0.01 240)',
                      foregroundColor: 'oklch(0.95 0.01 240)',
                      borderRadius: '0.75rem',
                      fontFamily: 'Inter',
                      isDark: true,
                    },
                    {
                      id: 'nature',
                      name: 'Doğa',
                      description: 'Organik ve ferah',
                      primaryColor: 'oklch(0.55 0.15 140)',
                      secondaryColor: 'oklch(0.93 0.05 120)',
                      accentColor: 'oklch(0.65 0.18 80)',
                      backgroundColor: 'oklch(0.97 0.01 130)',
                      foregroundColor: 'oklch(0.22 0.03 140)',
                      borderRadius: '0.875rem',
                      fontFamily: 'Inter',
                      isDark: false,
                    },
                  ].map((theme) => (
                    <Card 
                      key={theme.id}
                      className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                      onClick={() => {
                        toast.success(`${theme.name} teması uygulandı`, {
                          description: 'Sayfa yenilendiğinde tema aktif olacak',
                        });
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Palette className="h-4 w-4" weight="fill" />
                          {theme.name}
                        </CardTitle>
                        <CardDescription className="text-xs">{theme.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex gap-2">
                          <div 
                            className="w-10 h-10 rounded-md border-2 border-border shadow-sm"
                            style={{ backgroundColor: theme.primaryColor }}
                            title="Ana Renk"
                          />
                          <div 
                            className="w-10 h-10 rounded-md border-2 border-border shadow-sm"
                            style={{ backgroundColor: theme.secondaryColor }}
                            title="İkincil Renk"
                          />
                          <div 
                            className="w-10 h-10 rounded-md border-2 border-border shadow-sm"
                            style={{ backgroundColor: theme.accentColor }}
                            title="Vurgu Rengi"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Font: {theme.fontFamily}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" weight="fill" />
                  QR Menü Teması
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  QR menünüzün görünümünü özelleştirmek için <strong>QR Menü</strong> modülündeki 
                  <strong> Tema Ayarları</strong> butonunu kullanın. Müşterilerinizin göreceği menü görünümünü 
                  tamamen özelleştirebilirsiniz.
                </p>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm leading-relaxed">
                  💡 <strong>Not:</strong> Sistem teması değişiklikleri şu anda önizleme modundadır. 
                  Gelecek güncellemelerde bu özellik tam olarak aktif edilecektir. QR Menü tema özelleştirmesi 
                  ise şu anda tam çalışır durumdadır.
                </p>
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

              <div className="p-4 border rounded-lg space-y-3">
                <div className="space-y-1">
                  <p className="font-medium">Tembel Masa Uyarı Süresi</p>
                  <p className="text-sm text-muted-foreground">
                    Son sipariş sonrası kaç dakika geçince uyarı gösterilsin?
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="30"
                    max="300"
                    step="15"
                    value={(settings || defaultSettings).lazyTableWarningMinutes || 120}
                    onChange={(e) => {
                      const minutes = Number(e.target.value);
                      setSettings((current) => {
                        const curr = current || defaultSettings;
                        return { ...curr, lazyTableWarningMinutes: minutes };
                      });
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">dakika</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast.success(`Tembel masa uyarısı ${(settings || defaultSettings).lazyTableWarningMinutes || 120} dakika olarak ayarlandı`);
                    }}
                  >
                    Kaydet
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Kişi Sayısı Girişi</p>
                  <p className="text-sm text-muted-foreground">
                    Masa açılırken kişi sayısı girişi zorunlu olsun mu?
                  </p>
                </div>
                <Switch
                  checked={(settings || defaultSettings).requireGuestCount || false}
                  onCheckedChange={(checked) => {
                    setSettings((current) => {
                      const curr = current || defaultSettings;
                      return { ...curr, requireGuestCount: checked };
                    });
                    toast.success(`Kişi sayısı girişi ${checked ? 'aktif' : 'pasif'} edildi`);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kategori</DialogTitle>
            <DialogDescription>
              Yeni bir ürün kategorisi ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kategori Adı</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Örn: Malzemeler, İçecekler, Tatlılar"
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama (Opsiyonel)</Label>
              <Input
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Kategori açıklaması..."
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                ℹ️ Yeni kategoriler varsayılan olarak satış ekranında görünür. Daha sonra gizleyebilirsiniz.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              İptal
            </Button>
            <Button onClick={addCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Kategori Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme Yöntemini Düzenle</DialogTitle>
            <DialogDescription>
              Ödeme yöntemi görünen adını ve ikonunu düzenleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Görünen Ad</Label>
              <Input
                value={paymentDisplayName}
                onChange={(e) => setPaymentDisplayName(e.target.value)}
                placeholder="Örn: Nakit, Kredi Kartı"
              />
            </div>
            <div className="space-y-2">
              <Label>İkon</Label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { name: 'Money', component: Money },
                  { name: 'CreditCard', component: CreditCard },
                  { name: 'DeviceMobile', component: DeviceMobile },
                  { name: 'Bank', component: Bank },
                  { name: 'Ticket', component: Ticket },
                ].map((icon) => (
                  <Button
                    key={icon.name}
                    type="button"
                    variant={paymentIcon === icon.name ? 'default' : 'outline'}
                    className="h-16"
                    onClick={() => setPaymentIcon(icon.name)}
                  >
                    <icon.component className="h-6 w-6" weight="bold" />
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Seçilen: {paymentIcon}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              İptal
            </Button>
            <Button onClick={updatePaymentMethod}>
              <PencilSimple className="h-4 w-4 mr-2" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

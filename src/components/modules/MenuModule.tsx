import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ForkKnife, Sparkle, TrendUp, TrendDown, Plus, Trash, Package, Receipt, FileText } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MenuItem, MenuAnalysis, MenuCategory, Product, Recipe, RecipeIngredient, Invoice, InvoiceItem } from '@/lib/types';
import { formatCurrency, formatNumber, generateId, generateInvoiceNumber, calculateRecipeTotalCost, calculateCostPerServing, calculateProfitMargin } from '@/lib/helpers';

interface MenuModuleProps {
  onBack: () => void;
}

export default function MenuModule({ onBack }: MenuModuleProps) {
  const [menuItems, setMenuItems] = useKV<MenuItem[]>('menuItems', []);
  const [recipes, setRecipes] = useKV<Recipe[]>('recipes', []);
  const [products, setProducts] = useKV<Product[]>('products', []);
  const [invoices, setInvoices] = useKV<Invoice[]>('invoices', []);
  
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<MenuAnalysis[]>([]);
  
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showMenuItemDialog, setShowMenuItemDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category: '',
    description: '',
    servingSize: 1,
    isProduced: false,
  });
  
  const [recipeForm, setRecipeForm] = useState({
    menuItemId: '',
    menuItemName: '',
    servings: 1,
    instructions: '',
    prepTime: 0,
  });
  
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  
  const [invoiceForm, setInvoiceForm] = useState({
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  const runAIAnalysis = () => {
    const mockAnalysis: MenuAnalysis[] = (menuItems || []).map((item) => {
      const category: MenuCategory = 
        item.popularity > 0.6 && item.profitMargin > 0.6 ? 'star' :
        item.popularity < 0.4 && item.profitMargin > 0.6 ? 'puzzle' :
        item.popularity > 0.6 && item.profitMargin < 0.4 ? 'plow_horse' : 'dog';

      const recommendations = {
        star: 'Menüde öne çıkarın, upselling yapın. Fiyatı koruyun.',
        puzzle: 'Fiyat düşürün veya pazarlamayı artırın. Görünürlük sağlayın.',
        plow_horse: 'Maliyetleri optimize edin veya fiyat artırın.',
        dog: 'Menüden çıkarın veya tamamen yenileyin.',
      };

      return {
        menuItemId: item.id,
        category,
        totalSales: Math.floor(Math.random() * 500),
        revenue: Math.random() * 50000,
        cost: Math.random() * 20000,
        profit: Math.random() * 30000,
        popularityScore: item.popularity,
        recommendation: recommendations[category],
      };
    });

    setAnalysis(mockAnalysis);
    setShowAnalysis(true);
    toast.success('AI analizi tamamlandı');
  };

  const getCategoryBadge = (category: MenuCategory) => {
    const configs = {
      star: { label: '⭐ Yıldız', variant: 'default' as const },
      puzzle: { label: '🧩 Puzzle', variant: 'secondary' as const },
      plow_horse: { label: '🐴 İş Atı', variant: 'outline' as const },
      dog: { label: '🐕 Zayıf', variant: 'destructive' as const },
    };
    return configs[category];
  };

  const openCreateRecipeDialog = (menuItem?: MenuItem) => {
    if (menuItem) {
      setRecipeForm({
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        servings: menuItem.servingSize || 1,
        instructions: '',
        prepTime: 0,
      });
      
      const existingRecipe = (recipes || []).find(r => r.menuItemId === menuItem.id);
      if (existingRecipe) {
        setEditingRecipe(existingRecipe);
        setRecipeForm({
          menuItemId: existingRecipe.menuItemId,
          menuItemName: existingRecipe.menuItemName,
          servings: existingRecipe.servings,
          instructions: existingRecipe.instructions || '',
          prepTime: existingRecipe.prepTime || 0,
        });
        setRecipeIngredients(existingRecipe.ingredients);
      } else {
        setRecipeIngredients([]);
        setEditingRecipe(null);
      }
    } else {
      setRecipeForm({
        menuItemId: '',
        menuItemName: '',
        servings: 1,
        instructions: '',
        prepTime: 0,
      });
      setRecipeIngredients([]);
      setEditingRecipe(null);
    }
    setShowRecipeDialog(true);
  };

  const addIngredientToRecipe = () => {
    const newIngredient: RecipeIngredient = {
      id: generateId(),
      productId: '',
      productName: '',
      quantity: 0,
      unit: '',
      costPerUnit: 0,
      totalCost: 0,
    };
    setRecipeIngredients([...recipeIngredients, newIngredient]);
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...recipeIngredients];
    
    if (field === 'productId') {
      const product = (products || []).find(p => p.id === value);
      if (product) {
        updated[index].productId = product.id;
        updated[index].productName = product.name;
        updated[index].unit = product.unit;
        updated[index].costPerUnit = product.costPrice;
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    updated[index].totalCost = updated[index].quantity * updated[index].costPerUnit;
    setRecipeIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const saveRecipe = () => {
    if (!recipeForm.menuItemId || recipeIngredients.length === 0) {
      toast.error('Menü öğesi ve en az bir malzeme seçilmeli');
      return;
    }

    const totalCost = calculateRecipeTotalCost(recipeIngredients);
    const costPerServing = calculateCostPerServing(totalCost, recipeForm.servings);

    const menuItem = (menuItems || []).find(m => m.id === recipeForm.menuItemId);
    const profitMargin = menuItem ? calculateProfitMargin(menuItem.sellingPrice, costPerServing) : 0;

    const recipe: Recipe = {
      id: editingRecipe?.id || generateId(),
      menuItemId: recipeForm.menuItemId,
      menuItemName: recipeForm.menuItemName,
      servings: recipeForm.servings,
      ingredients: recipeIngredients,
      totalCost,
      costPerServing,
      profitMarginPercentage: profitMargin,
      instructions: recipeForm.instructions,
      prepTime: recipeForm.prepTime,
      createdAt: editingRecipe?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingRecipe) {
      setRecipes((current) =>
        (current || []).map((r) => (r.id === recipe.id ? recipe : r))
      );
      toast.success('Reçete güncellendi');
    } else {
      setRecipes((current) => [...(current || []), recipe]);
      toast.success('Reçete oluşturuldu');
    }

    setMenuItems((current) =>
      (current || []).map((m) =>
        m.id === recipe.menuItemId
          ? { ...m, costPrice: costPerServing, recipeId: recipe.id, profitMargin: profitMargin / 100 }
          : m
      )
    );

    setShowRecipeDialog(false);
    setRecipeIngredients([]);
    setEditingRecipe(null);
  };

  const openCreateMenuItemDialog = () => {
    setNewMenuItem({
      name: '',
      category: '',
      description: '',
      servingSize: 1,
      isProduced: false,
    });
    setShowMenuItemDialog(true);
  };

  const saveMenuItem = () => {
    if (!newMenuItem.name.trim() || !newMenuItem.category.trim()) {
      toast.error('Menü öğesi adı ve kategori gerekli');
      return;
    }

    const menuItem: MenuItem = {
      id: generateId(),
      name: newMenuItem.name,
      category: newMenuItem.category,
      description: newMenuItem.description,
      sellingPrice: 0,
      costPrice: 0,
      targetCostPercentage: 30,
      isActive: true,
      popularity: 0.5,
      profitMargin: 0,
      servingSize: newMenuItem.servingSize,
      isProduced: newMenuItem.isProduced,
    };

    setMenuItems((current) => [...(current || []), menuItem]);
    toast.success('Menü öğesi eklendi');
    setShowMenuItemDialog(false);
  };

  const openInvoiceDialog = () => {
    setInvoiceForm({
      supplierName: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setInvoiceItems([]);
    setShowInvoiceDialog(true);
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: generateId(),
      productId: undefined,
      menuItemId: undefined,
      name: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      taxRate: 18,
      taxAmount: 0,
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...invoiceItems];
    
    if (field === 'productId' && value) {
      const product = (products || []).find(p => p.id === value);
      if (product) {
        updated[index].productId = product.id;
        updated[index].name = product.name;
        updated[index].taxRate = product.taxRate;
      }
    } else if (field === 'menuItemId' && value) {
      const menuItem = (menuItems || []).find(m => m.id === value);
      if (menuItem) {
        updated[index].menuItemId = menuItem.id;
        updated[index].name = menuItem.name;
        updated[index].taxRate = 18;
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
    updated[index].taxAmount = (updated[index].totalPrice * updated[index].taxRate) / 100;
    
    setInvoiceItems(updated);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const saveInvoice = () => {
    if (!invoiceForm.supplierName.trim() || invoiceItems.length === 0) {
      toast.error('Tedarikçi adı ve en az bir ürün gerekli');
      return;
    }

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;

    const invoice: Invoice = {
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(),
      type: 'purchase',
      branchId: 'branch-1',
      supplierName: invoiceForm.supplierName,
      date: invoiceForm.date,
      items: invoiceItems,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'completed',
      notes: invoiceForm.notes,
      createdAt: new Date().toISOString(),
      autoUpdateStock: true,
    };

    setInvoices((current) => [...(current || []), invoice]);

    invoiceItems.forEach((item) => {
      if (item.productId) {
        setProducts((current) =>
          (current || []).map((p) =>
            p.id === item.productId
              ? { ...p, stock: p.stock + item.quantity, costPrice: item.unitPrice }
              : p
          )
        );
      } else if (item.menuItemId) {
        setMenuItems((current) =>
          (current || []).map((m) => {
            if (m.id === item.menuItemId) {
              const costPerServing = item.unitPrice / (m.servingSize || 1);
              const newProfitMargin = calculateProfitMargin(m.sellingPrice, costPerServing) / 100;
              return {
                ...m,
                costPrice: costPerServing,
                profitMargin: newProfitMargin,
              };
            }
            return m;
          })
        );
      }
    });

    toast.success(`Fatura oluşturuldu: ${invoice.invoiceNumber}`);
    setShowInvoiceDialog(false);
  };

  const getTotalRecipeCost = () => {
    return calculateRecipeTotalCost(recipeIngredients);
  };

  const getCostPerServing = () => {
    return calculateCostPerServing(getTotalRecipeCost(), recipeForm.servings);
  };

  const getInvoiceSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getInvoiceTaxAmount = () => {
    return invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0);
  };

  const getInvoiceTotal = () => {
    return getInvoiceSubtotal() + getInvoiceTaxAmount();
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">Menü Mühendisliği</h1>
          <p className="text-muted-foreground text-sm">Reçete yönetimi, fatura girişi ve AI destekli optimizasyon</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openInvoiceDialog}>
            <Receipt className="h-5 w-5 mr-2" />
            Fatura Gir
          </Button>
          <Button variant="outline" onClick={openCreateMenuItemDialog}>
            <Plus className="h-5 w-5 mr-2" />
            Menü Öğesi
          </Button>
        </div>
      </header>

      <Tabs defaultValue="menu" className="space-y-4">
        <TabsList>
          <TabsTrigger value="menu">Menü Öğeleri</TabsTrigger>
          <TabsTrigger value="recipes">Reçeteler</TabsTrigger>
          <TabsTrigger value="invoices">Faturalar</TabsTrigger>
          <TabsTrigger value="analysis">AI Analizi</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(menuItems || []).map((item) => {
              const recipe = (recipes || []).find(r => r.menuItemId === item.id);
              
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">
                          {item.category}
                          {item.servingSize && ` • ${item.servingSize} porsiyon`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {recipe && (
                          <div className="p-2 rounded-lg bg-accent/10">
                            <FileText className="h-4 w-4 text-accent" weight="bold" />
                          </div>
                        )}
                        <div className="p-2 rounded-lg bg-primary/10">
                          <ForkKnife className="h-4 w-4 text-primary" weight="bold" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Satış Fiyatı</span>
                      <span className="text-lg font-semibold font-tabular-nums">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Maliyet/Porsiyon</span>
                      <span className="text-sm font-tabular-nums">
                        {formatCurrency(item.costPrice)}
                      </span>
                    </div>
                    {recipe && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Malzeme</span>
                        <span className="text-sm font-tabular-nums">
                          {recipe.ingredients.length} çeşit
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Kar Marjı</span>
                      <div className="flex items-center gap-1">
                        {item.profitMargin > 0.5 ? (
                          <TrendUp className="h-4 w-4 text-accent" weight="bold" />
                        ) : (
                          <TrendDown className="h-4 w-4 text-destructive" weight="bold" />
                        )}
                        <span className="text-sm font-semibold font-tabular-nums">
                          {(item.profitMargin * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openCreateRecipeDialog(item)}
                      >
                        {recipe ? 'Reçeteyi Düzenle' : 'Reçete Oluştur'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reçete Listesi</CardTitle>
              <CardDescription>Tüm menü reçetelerini görüntüleyin ve düzenleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(recipes || []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Henüz reçete yok. Menü öğeleri sekmesinden reçete oluşturabilirsiniz.
                  </p>
                ) : (
                  (recipes || []).map((recipe) => (
                    <div key={recipe.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold">{recipe.menuItemName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {recipe.servings} porsiyon • {recipe.ingredients.length} malzeme
                          </p>
                        </div>
                        <Badge variant="outline">
                          {recipe.profitMarginPercentage?.toFixed(0)}% Kar
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Toplam Maliyet</p>
                          <p className="font-semibold font-tabular-nums">
                            {formatCurrency(recipe.totalCost)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Porsiyon Maliyeti</p>
                          <p className="font-semibold font-tabular-nums">
                            {formatCurrency(recipe.costPerServing)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Hazırlık Süresi</p>
                          <p className="font-semibold font-tabular-nums">
                            {recipe.prepTime || 0} dk
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Malzemeler:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {recipe.ingredients.map((ing) => (
                            <div key={ing.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                              <span>{ing.productName}</span>
                              <span className="font-tabular-nums text-muted-foreground">
                                {ing.quantity} {ing.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {recipe.instructions && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Tarif:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {recipe.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Satın Alma Faturaları</CardTitle>
              <CardDescription>Tüm fatura kayıtlarını görüntüleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(invoices || []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Henüz fatura yok. "Fatura Gir" butonunu kullanarak fatura ekleyebilirsiniz.
                  </p>
                ) : (
                  (invoices || []).map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                            <Badge variant="outline">{invoice.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{invoice.supplierName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.date).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Toplam Tutar</p>
                          <p className="text-lg font-bold font-tabular-nums">
                            {formatCurrency(invoice.totalAmount)}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Ürünler:</p>
                        {invoice.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span>{item.name}</span>
                            <span className="font-tabular-nums text-muted-foreground">
                              {item.quantity} adet × {formatCurrency(item.unitPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">AI Menü Analizi</CardTitle>
                  <CardDescription>
                    Menü performansını analiz edin ve optimizasyon önerileri alın
                  </CardDescription>
                </div>
                <Button onClick={runAIAnalysis}>
                  <Sparkle className="h-5 w-5 mr-2" weight="fill" />
                  Analiz Başlat
                </Button>
              </div>
            </CardHeader>
          </Card>

          {showAnalysis && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analiz Sonuçları</CardTitle>
                  <CardDescription>Menü öğeleri performans kategorilerine göre sınıflandırıldı</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['star', 'puzzle', 'plow_horse', 'dog'].map((cat) => {
                      const count = analysis.filter((a) => a.category === cat).length;
                      return (
                        <div key={cat} className="space-y-2 p-4 border rounded-lg">
                          <Badge {...getCategoryBadge(cat as MenuCategory)} />
                          <p className="text-2xl font-bold font-tabular-nums">{count}</p>
                          <p className="text-xs text-muted-foreground">ürün</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analysis.map((item) => {
                  const menuItem = menuItems?.find((m) => m.id === item.menuItemId);
                  if (!menuItem) return null;

                  const badgeConfig = getCategoryBadge(item.category);
                  
                  return (
                    <Card key={item.menuItemId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-base">{menuItem.name}</CardTitle>
                            <CardDescription className="text-xs capitalize">
                              {menuItem.category}
                            </CardDescription>
                          </div>
                          <Badge variant={badgeConfig.variant}>
                            {badgeConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Satış Adedi</p>
                            <p className="text-lg font-semibold font-tabular-nums">
                              {formatNumber(item.totalSales)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Kar</p>
                            <p className="text-lg font-semibold font-tabular-nums">
                              {formatCurrency(item.profit)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Popülerlik</span>
                            <span className="font-tabular-nums">{(item.popularityScore * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={item.popularityScore * 100} />
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">AI Önerisi</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.recommendation}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showMenuItemDialog} onOpenChange={setShowMenuItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Menü Öğesi</DialogTitle>
            <DialogDescription>
              Menüye yeni bir öğe ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ürün Adı</Label>
              <Input
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                placeholder="Örn: Cheesecake"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Input
                value={newMenuItem.category}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                placeholder="Örn: Tatlılar"
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                placeholder="Ürün açıklaması..."
              />
            </div>
            <div className="space-y-2">
              <Label>Porsiyon Sayısı</Label>
              <Input
                type="number"
                min="1"
                value={newMenuItem.servingSize}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, servingSize: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMenuItemDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveMenuItem}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecipeDialog} onOpenChange={setShowRecipeDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? 'Reçeteyi Düzenle' : 'Yeni Reçete Oluştur'}</DialogTitle>
            <DialogDescription>
              Reçete detaylarını ve malzemeleri girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Menü Öğesi</Label>
                <Select
                  value={recipeForm.menuItemId}
                  onValueChange={(value) => {
                    const menuItem = (menuItems || []).find(m => m.id === value);
                    if (menuItem) {
                      setRecipeForm({
                        ...recipeForm,
                        menuItemId: value,
                        menuItemName: menuItem.name,
                        servings: menuItem.servingSize || 1,
                      });
                    }
                  }}
                  disabled={!!editingRecipe}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(menuItems || []).map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Porsiyon Sayısı</Label>
                <Input
                  type="number"
                  min="1"
                  value={recipeForm.servings}
                  onChange={(e) => setRecipeForm({ ...recipeForm, servings: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hazırlık Süresi (dk)</Label>
                <Input
                  type="number"
                  min="0"
                  value={recipeForm.prepTime}
                  onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: Number(e.target.value) })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Malzemeler</Label>
                <Button size="sm" variant="outline" onClick={addIngredientToRecipe}>
                  <Plus className="h-4 w-4 mr-2" />
                  Malzeme Ekle
                </Button>
              </div>

              <div className="space-y-2">
                {recipeIngredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Ürün</Label>
                      <Select
                        value={ingredient.productId}
                        onValueChange={(value) => updateIngredient(index, 'productId', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(products || []).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Miktar</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Birim</Label>
                      <Input
                        value={ingredient.unit}
                        disabled
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Maliyet</Label>
                      <Input
                        value={formatCurrency(ingredient.totalCost)}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeIngredient(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Toplam Maliyet:</span>
                <span className="text-lg font-bold font-tabular-nums">
                  {formatCurrency(getTotalRecipeCost())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Porsiyon Başı Maliyet:</span>
                <span className="text-lg font-bold font-tabular-nums">
                  {formatCurrency(getCostPerServing())}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tarif / Notlar</Label>
              <Textarea
                value={recipeForm.instructions}
                onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                placeholder="Hazırlama talimatları..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecipeDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveRecipe}>
              {editingRecipe ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Satın Alma Faturası</DialogTitle>
            <DialogDescription>
              Tedarikçiden alınan ürünlerin faturasını girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tedarikçi Adı</Label>
                <Input
                  value={invoiceForm.supplierName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, supplierName: e.target.value })}
                  placeholder="Tedarikçi adı..."
                />
              </div>
              <div className="space-y-2">
                <Label>Fatura Tarihi</Label>
                <Input
                  type="date"
                  value={invoiceForm.date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ürünler</Label>
                <Button size="sm" variant="outline" onClick={addInvoiceItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ürün Ekle
                </Button>
              </div>

              <div className="space-y-2">
                {invoiceItems.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5 space-y-1">
                        <Label className="text-xs">Ürün/Menü Öğesi</Label>
                        <Select
                          value={item.productId || item.menuItemId || ''}
                          onValueChange={(value) => {
                            if (value.startsWith('product-')) {
                              updateInvoiceItem(index, 'productId', value);
                            } else {
                              updateInvoiceItem(index, 'menuItemId', value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                              Stok Ürünleri
                            </div>
                            {(products || []).map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                              Menü Öğeleri
                            </div>
                            {(menuItems || []).map((menuItem) => (
                              <SelectItem key={menuItem.id} value={menuItem.id}>
                                {menuItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Adet</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Birim Fiyat (₺)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateInvoiceItem(index, 'unitPrice', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Toplam</Label>
                        <Input
                          value={formatCurrency(item.totalPrice)}
                          disabled
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeInvoiceItem(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Ara Toplam:</span>
                <span className="font-semibold font-tabular-nums">
                  {formatCurrency(getInvoiceSubtotal())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">KDV:</span>
                <span className="font-semibold font-tabular-nums">
                  {formatCurrency(getInvoiceTaxAmount())}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Toplam:</span>
                <span className="text-xl font-bold font-tabular-nums">
                  {formatCurrency(getInvoiceTotal())}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                placeholder="Fatura notları..."
                rows={2}
              />
            </div>

            <div className="p-3 bg-accent/10 rounded-lg">
              <p className="text-sm text-accent-foreground">
                ℹ️ Fatura kaydedildiğinde, ürünler otomatik olarak stoğa eklenecek ve maliyet fiyatları güncellenecektir.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveInvoice}>
              Faturayı Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

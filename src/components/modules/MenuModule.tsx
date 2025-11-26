import { useState, useMemo } from 'react';
import { useKV } from '../../hooks/use-kv-store';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ForkKnife, Sparkle, TrendUp, TrendDown, Plus, Trash, Package, Receipt, FileText, CalendarBlank, PencilSimple, Check, X, Percent, MagnifyingGlass, SquaresFour, List, Image } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MenuItem, MenuAnalysis, MenuCategory, Product, Recipe, RecipeIngredient, Invoice, InvoiceItem, Sale, Category, ProductOption, AuthSession } from '@/lib/types';
import { formatCurrency, formatNumber, generateId, generateInvoiceNumber, calculateRecipeTotalCost, calculateCostPerServing, calculateProfitMargin } from '@/lib/helpers';
import ProductOptionsEditor from '@/components/ProductOptionsEditor';
import { useBranchFilter } from '@/hooks/use-branch-filter';

interface MenuModuleProps {
  onBack: () => void;
  authSession?: AuthSession | null;
}

interface PriceChangeProposal {
  menuItemId: string;
  currentPrice: number;
  proposedPrice: number;
  reason: string;
  expectedProfitMargin: number;
}

export default function MenuModule({ onBack, authSession }: MenuModuleProps) {
  const [menuItems, setMenuItems] = useKV<MenuItem[]>('menuItems', []);
  const [recipes, setRecipes] = useKV<Recipe[]>('recipes', []);
  const [products, setProducts] = useKV<Product[]>('products', []);
  const [categories, setCategories] = useKV<Category[]>('categories', []);
  const [invoices, setInvoices] = useKV<Invoice[]>('invoices', []);
  const [sales] = useKV<Sale[]>('sales', []);
  
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<MenuAnalysis[]>([]);
  const [analysisStartDate, setAnalysisStartDate] = useState<string>('');
  const [analysisEndDate, setAnalysisEndDate] = useState<string>('');
  
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [showMenuItemDialog, setShowMenuItemDialog] = useState(false);
  const [showEditMenuItemDialog, setShowEditMenuItemDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false);
  const [showPriceEditDialog, setShowPriceEditDialog] = useState(false);
  const [showPriceProposalDialog, setShowPriceProposalDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [showStockCountDialog, setShowStockCountDialog] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForCount, setProductForCount] = useState<Product | null>(null);
  const [countedStock, setCountedStock] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [priceProposal, setPriceProposal] = useState<PriceChangeProposal | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [campaignForm, setCampaignForm] = useState({
    menuItemId: '',
    discountPercentage: 0,
    reason: '',
    duration: 7,
  });
  
  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: 'cat-1',
    basePrice: 0,
    costPrice: 0,
    taxRate: 18,
    unit: 'adet',
    minStockLevel: 10,
    trackStock: true,
    imageUrl: '',
    hasOptions: false,
    options: [] as ProductOption[],
  });
  
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    category: '',
    description: '',
    servingSize: 1,
    basePrice: 0,
    isProduced: false,
    imageUrl: '',
    hasOptions: false,
    options: [] as ProductOption[],
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
    let filteredSales = sales || [];
    
    if (analysisStartDate || analysisEndDate) {
      const startDate = analysisStartDate ? new Date(analysisStartDate) : new Date(0);
      const endDate = analysisEndDate ? new Date(analysisEndDate) : new Date();
      endDate.setHours(23, 59, 59, 999);
      
      filteredSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= startDate && saleDate <= endDate;
      });
      
      if (filteredSales.length === 0) {
        toast.error('Seçilen tarih aralığında satış bulunamadı');
        return;
      }
    }
    
    const itemSalesMap = new Map<string, { totalSold: number; revenue: number; cost: number }>();
    
    filteredSales.forEach(sale => {
      sale.items?.forEach((saleItem) => {
        const menuItem = (menuItems || []).find(mi => mi.id === saleItem.productId);
        if (menuItem) {
          const existing = itemSalesMap.get(menuItem.id) || { totalSold: 0, revenue: 0, cost: 0 };
          existing.totalSold += saleItem.quantity;
          existing.revenue += saleItem.subtotal;
          existing.cost += menuItem.costPrice * saleItem.quantity;
          itemSalesMap.set(menuItem.id, existing);
        }
      });
    });
    
    let maxSales = 0;
    itemSalesMap.forEach(data => {
      if (data.totalSold > maxSales) maxSales = data.totalSold;
    });
    
    const newAnalysis: MenuAnalysis[] = (menuItems || []).map((item) => {
      const salesData = itemSalesMap.get(item.id) || { totalSold: 0, revenue: 0, cost: 0 };
      const profit = salesData.revenue - salesData.cost;
      
      const popularityScore = maxSales > 0 ? salesData.totalSold / maxSales : 0;
      const profitMarginScore = salesData.revenue > 0 ? profit / salesData.revenue : 0;
      
      const category: MenuCategory = 
        popularityScore > 0.6 && profitMarginScore > 0.4 ? 'star' :
        popularityScore < 0.4 && profitMarginScore > 0.4 ? 'puzzle' :
        popularityScore > 0.6 && profitMarginScore <= 0.4 ? 'plow_horse' : 'dog';

      const recommendations = {
        star: 'Menüde öne çıkarın, upselling yapın. Fiyatı koruyun.',
        puzzle: 'Fiyat düşürün veya pazarlamayı artırın. Görünürlük sağlayın.',
        plow_horse: 'Maliyetleri optimize edin veya fiyat artırın.',
        dog: 'Menüden çıkarın veya tamamen yenileyin.',
      };

      return {
        menuItemId: item.id,
        category,
        totalSales: salesData.totalSold,
        revenue: salesData.revenue,
        cost: salesData.cost,
        profit,
        popularityScore,
        recommendation: recommendations[category],
      };
    });

    setAnalysis(newAnalysis);
    setShowAnalysis(true);
    
    const dateRangeText = analysisStartDate || analysisEndDate
      ? ` (${analysisStartDate ? new Date(analysisStartDate).toLocaleDateString('tr-TR') : 'Başlangıç'} - ${analysisEndDate ? new Date(analysisEndDate).toLocaleDateString('tr-TR') : 'Bugün'})`
      : '';
    toast.success(`AI analizi tamamlandı${dateRangeText}`);
  };

  const generatePriceProposal = (menuItem: MenuItem, analysisItem: MenuAnalysis) => {
    const targetProfitMargin = 0.60;
    const minProfitMargin = 0.45;
    const moderateIncrease = 0.12;
    const maxIncrease = 0.20;
    
    let proposedPrice = menuItem.sellingPrice;
    let reason = '';
    
    if (analysisItem.category === 'plow_horse') {
      const profitMarginScore = analysisItem.revenue > 0 ? analysisItem.profit / analysisItem.revenue : 0;
      
      if (profitMarginScore < minProfitMargin) {
        const targetRevenue = analysisItem.cost / (1 - targetProfitMargin);
        const neededPriceIncrease = (targetRevenue - analysisItem.revenue) / analysisItem.totalSales;
        proposedPrice = menuItem.sellingPrice + neededPriceIncrease;
        
        if ((proposedPrice - menuItem.sellingPrice) / menuItem.sellingPrice > maxIncrease) {
          proposedPrice = menuItem.sellingPrice * (1 + maxIncrease);
        }
        
        reason = 'Ürün popüler ancak kar marjı çok düşük. Makul fiyat artışı ile karlılığı iyileştirebilirsiniz.';
      } else {
        proposedPrice = menuItem.sellingPrice * (1 + moderateIncrease);
        reason = 'Popülerliği yüksek, kar marjını artırmak için fırsat var.';
      }
    } else if (analysisItem.category === 'puzzle') {
      proposedPrice = menuItem.sellingPrice * 0.90;
      reason = 'Kar marjı yüksek ancak satışlar düşük. Fiyat düşürme ile daha fazla müşteri çekebilirsiniz.';
    } else if (analysisItem.category === 'star') {
      proposedPrice = menuItem.sellingPrice * 1.05;
      reason = 'Yıldız ürün! Küçük fiyat artışı ile karlılığı daha da artırabilirsiniz.';
    }
    
    const expectedProfitMargin = ((proposedPrice - menuItem.costPrice) / proposedPrice) * 100;
    
    const proposal: PriceChangeProposal = {
      menuItemId: menuItem.id,
      currentPrice: menuItem.sellingPrice,
      proposedPrice: Math.round(proposedPrice * 100) / 100,
      reason,
      expectedProfitMargin,
    };
    
    setPriceProposal(proposal);
    setShowPriceProposalDialog(true);
  };

  const applyPriceProposal = () => {
    if (!priceProposal) return;
    
    setMenuItems((current) =>
      (current || []).map((item) => {
        if (item.id === priceProposal.menuItemId) {
          const newProfitMargin = priceProposal.proposedPrice > 0
            ? ((priceProposal.proposedPrice - item.costPrice) / priceProposal.proposedPrice)
            : 0;
          
          return {
            ...item,
            sellingPrice: priceProposal.proposedPrice,
            profitMargin: newProfitMargin,
          };
        }
        return item;
      })
    );
    
    setProducts((current) =>
      (current || []).map((product) => {
        if (product.id === priceProposal.menuItemId) {
          return {
            ...product,
            basePrice: priceProposal.proposedPrice,
          };
        }
        return product;
      })
    );
    
    const item = (menuItems || []).find(m => m.id === priceProposal.menuItemId);
    const change = priceProposal.proposedPrice > priceProposal.currentPrice ? 'artırıldı' : 'düşürüldü';
    toast.success(`${item?.name} fiyatı ${change}: ${formatCurrency(priceProposal.proposedPrice)}`);
    
    setShowPriceProposalDialog(false);
    setPriceProposal(null);
  };

  const startCampaign = (menuItem: MenuItem, discountPercentage?: number, reason?: string) => {
    setSelectedMenuItem(menuItem);
    setCampaignForm({
      menuItemId: menuItem.id,
      discountPercentage: discountPercentage || 10,
      reason: reason || '',
      duration: 7,
    });
    setShowCampaignDialog(true);
  };

  const applyCampaign = () => {
    if (!campaignForm.menuItemId || campaignForm.discountPercentage <= 0) {
      toast.error('Geçerli bir kampanya bilgisi girin');
      return;
    }

    const menuItem = (menuItems || []).find(m => m.id === campaignForm.menuItemId);
    if (!menuItem) return;

    const originalPrice = menuItem.hasActiveCampaign 
      ? menuItem.campaignDetails?.originalPrice || menuItem.sellingPrice
      : menuItem.sellingPrice;
    
    const discountedPrice = originalPrice * (1 - campaignForm.discountPercentage / 100);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + campaignForm.duration);

    setMenuItems((current) =>
      (current || []).map((item) => {
        if (item.id === campaignForm.menuItemId) {
          const newProfitMargin = discountedPrice > 0
            ? ((discountedPrice - item.costPrice) / discountedPrice)
            : 0;
          
          return {
            ...item,
            sellingPrice: discountedPrice,
            profitMargin: newProfitMargin,
            hasActiveCampaign: true,
            campaignDetails: {
              originalPrice,
              discountPercentage: campaignForm.discountPercentage,
              startDate: new Date().toISOString(),
              endDate: endDate.toISOString(),
              reason: campaignForm.reason,
            },
          };
        }
        return item;
      })
    );

    setProducts((current) =>
      (current || []).map((product) => {
        if (product.id === campaignForm.menuItemId) {
          return {
            ...product,
            basePrice: discountedPrice,
            hasActiveCampaign: true,
            campaignDetails: {
              originalPrice,
              discountPercentage: campaignForm.discountPercentage,
              startDate: new Date().toISOString(),
              endDate: endDate.toISOString(),
              reason: campaignForm.reason,
            },
          };
        }
        return product;
      })
    );

    toast.success(`🎉 ${menuItem.name} için %${campaignForm.discountPercentage} kampanya başlatıldı!`);
    setShowCampaignDialog(false);
    setCampaignForm({
      menuItemId: '',
      discountPercentage: 0,
      reason: '',
      duration: 7,
    });
  };

  const endCampaign = (menuItemId: string) => {
    const menuItem = (menuItems || []).find(m => m.id === menuItemId);
    if (!menuItem || !menuItem.hasActiveCampaign) return;

    const originalPrice = menuItem.campaignDetails?.originalPrice || menuItem.sellingPrice;

    setMenuItems((current) =>
      (current || []).map((item) => {
        if (item.id === menuItemId) {
          const newProfitMargin = originalPrice > 0
            ? ((originalPrice - item.costPrice) / originalPrice)
            : 0;
          
          return {
            ...item,
            sellingPrice: originalPrice,
            profitMargin: newProfitMargin,
            hasActiveCampaign: false,
            campaignDetails: undefined,
          };
        }
        return item;
      })
    );

    setProducts((current) =>
      (current || []).map((product) => {
        if (product.id === menuItemId) {
          return {
            ...product,
            basePrice: originalPrice,
            hasActiveCampaign: false,
            campaignDetails: undefined,
          };
        }
        return product;
      })
    );

    toast.success(`${menuItem.name} kampanyası sonlandırıldı`);
  };

  const openPriceEditDialog = (menuItem: MenuItem) => {
    setEditingMenuItem(menuItem);
    setNewPrice(menuItem.sellingPrice.toString());
    setShowPriceEditDialog(true);
  };

  const savePriceEdit = () => {
    if (!editingMenuItem) return;
    
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Geçerli bir fiyat girin');
      return;
    }
    
    setMenuItems((current) =>
      (current || []).map((item) => {
        if (item.id === editingMenuItem.id) {
          const newProfitMargin = price > 0
            ? ((price - item.costPrice) / price)
            : 0;
          
          return {
            ...item,
            sellingPrice: price,
            profitMargin: newProfitMargin,
          };
        }
        return item;
      })
    );
    
    setProducts((current) =>
      (current || []).map((product) => {
        if (product.id === editingMenuItem.id) {
          return {
            ...product,
            basePrice: price,
          };
        }
        return product;
      })
    );
    
    toast.success(`${editingMenuItem.name} fiyatı güncellendi: ${formatCurrency(price)}`);
    setShowPriceEditDialog(false);
    setEditingMenuItem(null);
    setNewPrice('');
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
      basePrice: 0,
      isProduced: false,
      imageUrl: '',
      hasOptions: false,
      options: [],
    });
    setShowMenuItemDialog(true);
  };

  const saveMenuItem = () => {
    if (!newMenuItem.name.trim() || !newMenuItem.category.trim()) {
      toast.error('Menü öğesi adı ve kategori gerekli');
      return;
    }

    const menuItemId = generateId();
    const menuItem: MenuItem = {
      id: menuItemId,
      name: newMenuItem.name,
      category: newMenuItem.category,
      description: newMenuItem.description,
      sellingPrice: newMenuItem.basePrice,
      costPrice: 0,
      targetCostPercentage: 30,
      isActive: true,
      popularity: 0.5,
      profitMargin: 0,
      servingSize: newMenuItem.servingSize,
      isProduced: newMenuItem.isProduced,
      imageUrl: newMenuItem.imageUrl || undefined,
      hasOptions: newMenuItem.hasOptions,
      options: newMenuItem.hasOptions ? newMenuItem.options : undefined,
    };

    setMenuItems((current) => [...(current || []), menuItem]);
    
    const product: Product = {
      id: menuItemId,
      sku: `MENU-${menuItemId.substring(0, 8)}`,
      name: newMenuItem.name,
      description: newMenuItem.description,
      categoryId: 'cat-menu',
      category: newMenuItem.category,
      basePrice: newMenuItem.basePrice,
      costPrice: 0,
      taxRate: 18,
      unit: 'porsiyon',
      isActive: true,
      stock: 999999,
      minStockLevel: 0,
      trackStock: false,
      imageUrl: newMenuItem.imageUrl || undefined,
      hasOptions: newMenuItem.hasOptions,
      options: newMenuItem.hasOptions ? newMenuItem.options : undefined,
    };
    
    setProducts((current) => [...(current || []), product]);
    
    toast.success('Menü öğesi eklendi ve satış ekranında görünür hale geldi');
    setShowMenuItemDialog(false);
  };

  const openEditMenuItemDialog = (menuItem: MenuItem) => {
    setEditingMenuItem(menuItem);
    setNewMenuItem({
      name: menuItem.name,
      category: menuItem.category,
      description: menuItem.description || '',
      servingSize: menuItem.servingSize || 1,
      basePrice: menuItem.sellingPrice,
      isProduced: menuItem.isProduced || false,
      imageUrl: menuItem.imageUrl || '',
      hasOptions: menuItem.hasOptions || false,
      options: menuItem.options || [],
    });
    setShowEditMenuItemDialog(true);
  };

  const saveMenuItemEdit = () => {
    if (!editingMenuItem) return;
    
    if (!newMenuItem.name.trim() || !newMenuItem.category.trim()) {
      toast.error('Menü öğesi adı ve kategori gerekli');
      return;
    }

    setMenuItems((current) =>
      (current || []).map((item) => {
        if (item.id === editingMenuItem.id) {
          return {
            ...item,
            name: newMenuItem.name,
            category: newMenuItem.category,
            description: newMenuItem.description,
            sellingPrice: newMenuItem.basePrice,
            servingSize: newMenuItem.servingSize,
            isProduced: newMenuItem.isProduced,
            imageUrl: newMenuItem.imageUrl || undefined,
            hasOptions: newMenuItem.hasOptions,
            options: newMenuItem.hasOptions ? newMenuItem.options : undefined,
          };
        }
        return item;
      })
    );

    setProducts((current) =>
      (current || []).map((product) => {
        if (product.id === editingMenuItem.id) {
          return {
            ...product,
            name: newMenuItem.name,
            description: newMenuItem.description,
            category: newMenuItem.category,
            basePrice: newMenuItem.basePrice,
            imageUrl: newMenuItem.imageUrl || undefined,
            hasOptions: newMenuItem.hasOptions,
            options: newMenuItem.hasOptions ? newMenuItem.options : undefined,
          };
        }
        return product;
      })
    );

    toast.success(`${newMenuItem.name} güncellendi`);
    setShowEditMenuItemDialog(false);
    setEditingMenuItem(null);
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

  const filteredMenuItems = useMemo(() => {
    let filtered = menuItems || [];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    return filtered;
  }, [menuItems, searchQuery, selectedCategory]);

  const menuCategories = useMemo(() => {
    const cats = new Set<string>();
    (menuItems || []).forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [menuItems]);

  const filteredProducts = useMemo(() => {
    let filtered = (products || []).filter(p => p.isActive);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory || p.categoryId === selectedCategory);
    }
    
    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const productCategories = useMemo(() => {
    const cats = new Set<string>();
    (products || []).filter(p => p.isActive).forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const addProduct = () => {
    if (!newProduct.name.trim() || !newProduct.sku.trim()) {
      toast.error('Ürün adı ve SKU gerekli');
      return;
    }

    const product: Product = {
      id: generateId(),
      ...newProduct,
      isActive: true,
      stock: 0,
    };

    setProducts((current) => [...(current || []), product]);
    toast.success(`${newProduct.name} ürün olarak eklendi`);
    setShowProductDialog(false);
    setNewProduct({
      sku: '',
      name: '',
      description: '',
      categoryId: 'cat-1',
      basePrice: 0,
      costPrice: 0,
      taxRate: 18,
      unit: 'adet',
      minStockLevel: 10,
      trackStock: true,
      imageUrl: '',
      hasOptions: false,
      options: [],
    });
  };

  const deleteProduct = () => {
    if (!productToDelete) return;

    setProducts((current) =>
      (current || []).map(p =>
        p.id === productToDelete.id ? { ...p, isActive: false } : p
      )
    );

    toast.success(`${productToDelete.name} ürün listesinden silindi`);
    setShowDeleteProductDialog(false);
    setProductToDelete(null);
  };

  const toggleProductStockTracking = (productId: string) => {
    setProducts((current) =>
      (current || []).map(p =>
        p.id === productId ? { ...p, trackStock: !p.trackStock } : p
      )
    );
    const product = (products || []).find(p => p.id === productId);
    if (product) {
      toast.success(`${product.name} stok takibi ${product.trackStock ? 'kapatıldı' : 'açıldı'}`);
    }
  };

  const openEditProductDialog = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      costPrice: product.costPrice,
      taxRate: product.taxRate,
      unit: product.unit,
      minStockLevel: product.minStockLevel,
      trackStock: product.trackStock !== false,
      imageUrl: product.imageUrl || '',
      hasOptions: product.hasOptions || false,
      options: product.options || [],
    });
    setShowEditProductDialog(true);
  };

  const saveProductEdit = () => {
    if (!editingProduct) return;
    
    if (!newProduct.name.trim() || !newProduct.sku.trim()) {
      toast.error('Ürün adı ve SKU gerekli');
      return;
    }

    setProducts((current) =>
      (current || []).map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            sku: newProduct.sku,
            name: newProduct.name,
            description: newProduct.description,
            categoryId: newProduct.categoryId,
            basePrice: newProduct.basePrice,
            costPrice: newProduct.costPrice,
            taxRate: newProduct.taxRate,
            unit: newProduct.unit,
            minStockLevel: newProduct.minStockLevel,
            trackStock: newProduct.trackStock,
            imageUrl: newProduct.imageUrl || undefined,
            hasOptions: newProduct.hasOptions,
            options: newProduct.hasOptions ? newProduct.options : undefined,
          };
        }
        return p;
      })
    );

    toast.success(`${newProduct.name} güncellendi`);
    setShowEditProductDialog(false);
    setEditingProduct(null);
    setNewProduct({
      sku: '',
      name: '',
      description: '',
      categoryId: 'cat-1',
      basePrice: 0,
      costPrice: 0,
      taxRate: 18,
      unit: 'adet',
      minStockLevel: 10,
      trackStock: true,
      imageUrl: '',
      hasOptions: false,
      options: [],
    });
  };

  const openStockCountDialog = (product: Product) => {
    setProductForCount(product);
    setCountedStock('');
    setShowStockCountDialog(true);
  };

  const saveStockCount = () => {
    if (!productForCount) return;
    
    const newStock = parseFloat(countedStock);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Geçerli bir stok miktarı girin');
      return;
    }

    const oldStock = productForCount.stock;
    const difference = newStock - oldStock;

    setProducts((current) =>
      (current || []).map((p) => {
        if (p.id === productForCount.id) {
          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    if (difference > 0) {
      toast.success(`${productForCount.name} stoğu güncellendi: +${difference.toFixed(2)} ${productForCount.unit}`);
    } else if (difference < 0) {
      toast.success(`${productForCount.name} stoğu güncellendi: ${difference.toFixed(2)} ${productForCount.unit}`);
    } else {
      toast.success(`${productForCount.name} stoğu doğrulandı`);
    }

    setShowStockCountDialog(false);
    setProductForCount(null);
    setCountedStock('');
  };

  const saveNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Kategori adı boş olamaz');
      return;
    }

    const existingCategory = (categories || []).find(
      c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );

    if (existingCategory) {
      toast.error('Bu kategori zaten mevcut');
      return;
    }

    const newCategory: Category = {
      id: generateId(),
      name: newCategoryName.trim(),
      showInPOS: true,
      sortOrder: (categories || []).length,
    };

    setCategories((current) => [...(current || []), newCategory]);
    toast.success(`${newCategoryName} kategorisi eklendi`);
    
    setNewMenuItem({...newMenuItem, category: newCategoryName.trim()});
    
    setShowNewCategoryDialog(false);
    setNewCategoryName('');
  };

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6 pb-24">
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">Menü Mühendisliği</h1>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Reçete yönetimi, fatura girişi ve AI destekli optimizasyon</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={openInvoiceDialog} className="flex-1 sm:flex-none text-xs sm:text-sm h-9">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Fatura Gir</span>
            </Button>
            <Button variant="outline" onClick={openCreateMenuItemDialog} className="flex-1 sm:flex-none text-xs sm:text-sm h-9">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Menü Öğesi</span>
            </Button>
          </div>
        </header>

      <Tabs defaultValue="menu" className="space-y-4" onValueChange={() => {
        setSearchQuery('');
        setSelectedCategory('all');
      }}>
        <TabsList className="w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="menu" className="text-xs sm:text-sm">Menü Öğeleri</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">Ürünler</TabsTrigger>
          <TabsTrigger value="stock" className="text-xs sm:text-sm">Stok Yönetimi</TabsTrigger>
          <TabsTrigger value="recipes" className="text-xs sm:text-sm">Reçeteler</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm">Faturalar</TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs sm:text-sm">AI Analizi</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Menü öğesi ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {menuCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <SquaresFour className="h-4 w-4" weight="bold" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" weight="bold" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {filteredMenuItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Arama kriterlerine uygun menü öğesi bulunamadı' 
                    : 'Henüz menü öğesi yok'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => {
                const recipe = (recipes || []).find(r => r.menuItemId === item.id);
                
                return (
                  <Card key={item.id} className={`hover:shadow-md transition-shadow ${item.hasActiveCampaign ? 'ring-2 ring-accent' : ''}`}>
                    {item.imageUrl && (
                      <div className="w-full h-48 overflow-hidden rounded-t-lg bg-muted">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            {item.hasActiveCampaign && (
                              <Badge variant="default" className="bg-accent">
                                <Sparkle className="h-3 w-3 mr-1" weight="fill" />
                                Kampanyalı
                              </Badge>
                            )}
                          </div>
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
                      {item.hasActiveCampaign && item.campaignDetails && (
                        <div className="p-2 bg-accent/10 rounded-lg space-y-1 border border-accent/20">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Eski Fiyat</span>
                            <span className="line-through font-tabular-nums">
                              {formatCurrency(item.campaignDetails.originalPrice)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">İndirim</span>
                            <Badge variant="secondary" className="text-xs">
                              %{item.campaignDetails.discountPercentage}
                            </Badge>
                          </div>
                          {item.campaignDetails.endDate && (
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-accent/20">
                              <span className="text-muted-foreground">Bitiş</span>
                              <span className="font-tabular-nums">
                                {new Date(item.campaignDetails.endDate).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Satış Fiyatı</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-semibold font-tabular-nums ${item.hasActiveCampaign ? 'text-accent' : ''}`}>
                            {formatCurrency(item.sellingPrice)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openPriceEditDialog(item)}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                        </div>
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
                          onClick={() => openEditMenuItemDialog(item)}
                        >
                          <PencilSimple className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openCreateRecipeDialog(item)}
                        >
                          {recipe ? 'Reçete' : 'Reçete Oluştur'}
                        </Button>
                        {item.hasActiveCampaign ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => endCampaign(item.id)}
                          >
                            Kampanyayı Bitir
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => startCampaign(item)}
                          >
                            <Sparkle className="h-4 w-4" weight="fill" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredMenuItems.map((item) => {
                    const recipe = (recipes || []).find(r => r.menuItemId === item.id);
                    
                    return (
                      <div key={item.id} className={`p-4 hover:bg-muted/50 transition-colors ${item.hasActiveCampaign ? 'bg-accent/5' : ''}`}>
                        <div className="flex items-center gap-4">
                          {item.imageUrl && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{item.name}</h3>
                              {item.hasActiveCampaign && (
                                <Badge variant="default" className="bg-accent shrink-0">
                                  <Sparkle className="h-3 w-3 mr-1" weight="fill" />
                                  Kampanyalı
                                </Badge>
                              )}
                              {recipe && (
                                <Badge variant="outline" className="shrink-0">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Reçete
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                          </div>
                          
                          <div className="flex items-center gap-6 shrink-0">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Satış Fiyatı</p>
                              <p className={`text-lg font-semibold font-tabular-nums ${item.hasActiveCampaign ? 'text-accent' : ''}`}>
                                {formatCurrency(item.sellingPrice)}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Maliyet</p>
                              <p className="text-lg font-semibold font-tabular-nums">
                                {formatCurrency(item.costPrice)}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Kar Marjı</p>
                              <div className="flex items-center gap-1 justify-end">
                                {item.profitMargin > 0.5 ? (
                                  <TrendUp className="h-4 w-4 text-accent" weight="bold" />
                                ) : (
                                  <TrendDown className="h-4 w-4 text-destructive" weight="bold" />
                                )}
                                <span className="text-lg font-semibold font-tabular-nums">
                                  {(item.profitMargin * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPriceEditDialog(item)}
                              >
                                <PencilSimple className="h-4 w-4 mr-1" />
                                Fiyat
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openCreateRecipeDialog(item)}
                              >
                                {recipe ? 'Reçeteyi Düzenle' : 'Reçete Oluştur'}
                              </Button>
                              {item.hasActiveCampaign ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => endCampaign(item.id)}
                                >
                                  Kampanyayı Bitir
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => startCampaign(item)}
                                >
                                  <Sparkle className="h-4 w-4" weight="fill" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg">Ürün Yönetimi</CardTitle>
                  <CardDescription>Ürünleri ekleyin, silin ve stok takibini yönetin</CardDescription>
                </div>
                <Button onClick={() => setShowProductDialog(true)}>
                  <Plus className="h-5 w-5 mr-2" weight="bold" />
                  Yeni Ürün
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ürün ara (ad, SKU, açıklama)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {productCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <SquaresFour className="h-4 w-4" weight="bold" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" weight="bold" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Arama kriterlerine uygun ürün bulunamadı' 
                    : 'Henüz ürün yok. "Yeni Ürün" butonunu kullanarak ürün ekleyebilirsiniz.'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  {product.imageUrl && (
                    <div className="w-full h-48 overflow-hidden rounded-t-lg bg-muted">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <CardDescription className="text-xs">
                          SKU: {product.sku}
                        </CardDescription>
                      </div>
                      {product.trackStock !== false && (
                        <Badge variant="outline" className="shrink-0">
                          <Package className="h-3 w-3 mr-1" />
                          Stok Takipli
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Birim</p>
                        <p className="font-medium">{product.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Stok</p>
                        <p className="font-medium font-tabular-nums">{product.stock}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Fiyat</p>
                        <p className="font-semibold font-tabular-nums">{formatCurrency(product.basePrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Maliyet</p>
                        <p className="font-semibold font-tabular-nums">{formatCurrency(product.costPrice)}</p>
                      </div>
                    </div>
                    {product.category && (
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    )}
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openEditProductDialog(product)}
                        >
                          <PencilSimple className="h-4 w-4 mr-1" />
                          Düzenle
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setProductToDelete(product);
                            setShowDeleteProductDialog(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleProductStockTracking(product.id)}
                      >
                        {product.trackStock !== false ? 'Stok Takibini Kapat' : 'Stok Takibini Aç'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {product.imageUrl && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{product.name}</h3>
                            {product.trackStock !== false && (
                              <Badge variant="outline" className="shrink-0 text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                Stok Takipli
                              </Badge>
                            )}
                            {product.category && (
                              <Badge variant="secondary" className="shrink-0 text-xs">{product.category}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>SKU: {product.sku}</span>
                            <span>Birim: {product.unit}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Stok</p>
                            <p className="text-lg font-semibold font-tabular-nums">{product.stock}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Fiyat</p>
                            <p className="text-lg font-semibold font-tabular-nums">{formatCurrency(product.basePrice)}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Maliyet</p>
                            <p className="text-lg font-semibold font-tabular-nums">{formatCurrency(product.costPrice)}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditProductDialog(product)}
                            >
                              <PencilSimple className="h-4 w-4 mr-1" />
                              Düzenle
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleProductStockTracking(product.id)}
                            >
                              {product.trackStock !== false ? 'Stok Takibini Kapat' : 'Stok Takibini Aç'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setProductToDelete(product);
                                setShowDeleteProductDialog(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stok Sayım ve Yönetim</CardTitle>
              <CardDescription>Stok seviyelerini kontrol edin ve sayım yapın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Toplam Ürün</p>
                        <p className="text-3xl font-bold font-tabular-nums">
                          {(products || []).filter(p => p.isActive && p.trackStock !== false).length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Düşük Stok</p>
                        <p className="text-3xl font-bold font-tabular-nums text-destructive">
                          {(products || []).filter(p => p.isActive && p.trackStock !== false && p.stock <= p.minStockLevel).length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Toplam Stok Değeri</p>
                        <p className="text-3xl font-bold font-tabular-nums">
                          {formatCurrency((products || []).filter(p => p.isActive && p.trackStock !== false).reduce((sum, p) => sum + (p.stock * p.costPrice), 0))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {(products || []).filter(p => p.isActive && p.trackStock !== false).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Stok takipli ürün yok.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(products || []).filter(p => p.isActive && p.trackStock !== false).map((product) => {
                      const isLowStock = product.stock <= product.minStockLevel;
                      const stockPercentage = (product.stock / (product.minStockLevel * 3)) * 100;

                      return (
                        <div
                          key={product.id}
                          className={`p-4 border rounded-lg ${isLowStock ? 'border-destructive bg-destructive/5' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium">{product.name}</h3>
                                {isLowStock && (
                                  <Badge variant="destructive" className="text-xs">
                                    ⚠️ Düşük Stok
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                SKU: {product.sku} • Birim: {product.unit}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold font-tabular-nums">
                                {product.stock}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Min: {product.minStockLevel}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Stok Durumu</span>
                              <span>{stockPercentage.toFixed(0)}%</span>
                            </div>
                            <Progress 
                              value={Math.min(stockPercentage, 100)} 
                              className={isLowStock ? '[&>div]:bg-destructive' : ''}
                            />
                          </div>

                          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Birim Maliyet</p>
                              <p className="font-semibold font-tabular-nums">{formatCurrency(product.costPrice)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Toplam Değer</p>
                              <p className="font-semibold font-tabular-nums">{formatCurrency(product.stock * product.costPrice)}</p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="default"
                              className="w-full"
                              onClick={() => openStockCountDialog(product)}
                            >
                              <Package className="h-4 w-4 mr-2" weight="bold" />
                              Sayım Yap
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg">AI Menü Analizi</CardTitle>
                  <CardDescription>
                    Menü performansını analiz edin ve optimizasyon önerileri alın
                  </CardDescription>
                </div>
                <div className="flex items-end gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="analysis-start-date" className="text-xs">Başlangıç Tarihi</Label>
                    <div className="relative">
                      <Input
                        id="analysis-start-date"
                        type="date"
                        value={analysisStartDate}
                        onChange={(e) => setAnalysisStartDate(e.target.value)}
                        className="w-[160px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="analysis-end-date" className="text-xs">Bitiş Tarihi</Label>
                    <div className="relative">
                      <Input
                        id="analysis-end-date"
                        type="date"
                        value={analysisEndDate}
                        onChange={(e) => setAnalysisEndDate(e.target.value)}
                        className="w-[160px]"
                      />
                    </div>
                  </div>
                  <Button onClick={runAIAnalysis}>
                    <Sparkle className="h-5 w-5 mr-2" weight="fill" />
                    Analiz Başlat
                  </Button>
                </div>
              </div>
              {(analysisStartDate || analysisEndDate) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarBlank className="h-4 w-4" />
                  <span>
                    {analysisStartDate ? new Date(analysisStartDate).toLocaleDateString('tr-TR') : 'Başlangıç'} - {analysisEndDate ? new Date(analysisEndDate).toLocaleDateString('tr-TR') : 'Bugün'}
                  </span>
                  {(analysisStartDate || analysisEndDate) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setAnalysisStartDate('');
                        setAnalysisEndDate('');
                        setShowAnalysis(false);
                      }}
                    >
                      Temizle
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkle className="h-5 w-5 text-primary" weight="fill" />
                Analiz Kategorileri Rehberi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-card border-2 border-accent rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">⭐ Yıldız</Badge>
                    <span className="text-xs text-muted-foreground">(Yüksek Popülerlik + Yüksek Kar)</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    <strong>Ne Anlama Geliyor:</strong> Çok satılan ve yüksek kar getiren ürünler.
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <strong>Strateji:</strong> Bu ürünleri menüde öne çıkarın, garsonlarınıza öncelikli satışını teşvik edin. 
                    Küçük fiyat artışları yapabilir veya upselling için kullanabilirsiniz.
                  </p>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <strong>Belirleme:</strong> Popülerlik skoru {">"} %60 ve Kar marjı {">"} %40
                  </div>
                </div>

                <div className="p-4 bg-card border-2 border-secondary rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">🧩 Puzzle (Bilmece)</Badge>
                    <span className="text-xs text-muted-foreground">(Düşük Popülerlik + Yüksek Kar)</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    <strong>Ne Anlama Geliyor:</strong> Kar marjı yüksek ama az satılan ürünler.
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <strong>Strateji:</strong> Fiyatı biraz düşürerek daha fazla müşteri çekmeyi deneyin. 
                    Pazarlamayı artırın, görünürlüğünü iyileştirin veya porsiyonu küçültüp fiyatı ayarlayın.
                  </p>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <strong>Belirleme:</strong> Popülerlik skoru {"<"} %40 ve Kar marjı {">"} %40
                  </div>
                </div>

                <div className="p-4 bg-card border-2 border-border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">🐴 İş Atı</Badge>
                    <span className="text-xs text-muted-foreground">(Yüksek Popülerlik + Düşük Kar)</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    <strong>Ne Anlama Geliyor:</strong> Çok satılan ama kar marjı düşük ürünler.
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <strong>Strateji:</strong> Maliyetleri düşürmeye çalışın (tedarikçi değişimi, reçete optimizasyonu). 
                    Ya da fiyatı nazikçe artırın - müşteriler bu ürünlere alışkın olduğundan küçük artışlar kabul edilebilir.
                  </p>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <strong>Belirleme:</strong> Popülerlik skoru {">"} %60 ve Kar marjı {"<="} %40
                  </div>
                </div>

                <div className="p-4 bg-card border-2 border-destructive rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">🐕 Zayıf</Badge>
                    <span className="text-xs text-muted-foreground">(Düşük Popülerlik + Düşük Kar)</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    <strong>Ne Anlama Geliyor:</strong> Az satılan ve kar marjı da düşük ürünler.
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <strong>Strateji:</strong> Bu ürünleri menüden çıkarmayı ciddi şekilde düşünün. 
                    Eğer tutmak istiyorsanız tamamen yeniden tasarlayın - reçeteyi, fiyatı ve sunumu değiştirin.
                  </p>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <strong>Belirleme:</strong> Popülerlik skoru {"<"} %40 ve Kar marjı {"<="} %40
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>💡 İpucu:</strong> Bu analiz, satış verilerinize ve kar marjlarınıza dayanarak otomatik olarak yapılır. 
                  Her kategorinin altında size özel aksiyon önerileri bulunur. Sistem, fiyat değişikliği önerilerini 
                  gerçek verilerinizi kullanarak hesaplar.
                </p>
              </div>
            </CardContent>
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

                        <div className="p-3 bg-muted rounded-lg space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-1">AI Önerisi</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.recommendation}
                            </p>
                          </div>
                          
                          {(item.category === 'plow_horse' || item.category === 'puzzle' || item.category === 'star') && item.totalSales > 0 && (
                            <div className="flex gap-2">
                              {item.category === 'puzzle' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => generatePriceProposal(menuItem, item)}
                                  >
                                    <TrendDown className="h-4 w-4 mr-2" weight="bold" />
                                    Fiyat Düşür
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="flex-1"
                                    onClick={() => startCampaign(menuItem, 15, 'Düşük satış, kampanya ile görünürlük artırımı')}
                                  >
                                    <Sparkle className="h-4 w-4 mr-2" weight="fill" />
                                    Kampanya Başlat
                                  </Button>
                                </>
                              )}
                              {item.category === 'plow_horse' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="w-full"
                                  onClick={() => generatePriceProposal(menuItem, item)}
                                >
                                  <TrendUp className="h-4 w-4 mr-2" weight="bold" />
                                  Fiyat Arttır
                                </Button>
                              )}
                              {item.category === 'star' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="flex-1"
                                    onClick={() => generatePriceProposal(menuItem, item)}
                                  >
                                    <TrendUp className="h-4 w-4 mr-2" weight="bold" />
                                    Fiyat Arttır
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => startCampaign(menuItem, 10, 'Yıldız ürün, satışları daha da artırmak için kısa süreli kampanya')}
                                  >
                                    <Sparkle className="h-4 w-4 mr-2" weight="fill" />
                                    Kampanya
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
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
              <div className="flex gap-2">
                <Select
                  value={newMenuItem.category}
                  onValueChange={(value) => setNewMenuItem({ ...newMenuItem, category: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Kategori seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories || []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCategoryDialog(true)}
                >
                  <Plus className="h-4 w-4" weight="bold" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 İstediğiniz kategori yoksa + butonuna tıklayarak yeni kategori ekleyebilirsiniz
              </p>
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
              <Label>Görsel URL (QR Menü için)</Label>
              <Input
                value={newMenuItem.imageUrl}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
              />
              {newMenuItem.imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img 
                    src={newMenuItem.imageUrl} 
                    alt="Önizleme"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EGörsel Yüklenemedi%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                💡 Ürün görseli QR menüde ve müşteri ekranlarında gösterilecektir. Unsplash, Pexels gibi ücretsiz görsel sitelerinden URL kullanabilirsiniz.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Porsiyon Sayısı</Label>
                <Input
                  type="number"
                  min="1"
                  value={newMenuItem.servingSize}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, servingSize: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Satış Fiyatı (₺)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newMenuItem.basePrice || 0}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, basePrice: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ürün Seçenekleri</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Müşterilerin seçebileceği varyantlar ekleyin (örn: Şeker durumu, boyut)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMenuItem({ ...newMenuItem, hasOptions: !newMenuItem.hasOptions })}
                >
                  {newMenuItem.hasOptions ? 'Seçenekleri Kapat' : 'Seçenek Ekle'}
                </Button>
              </div>
              
              {newMenuItem.hasOptions && (
                <ProductOptionsEditor
                  options={newMenuItem.options}
                  onChange={(options) => setNewMenuItem({ ...newMenuItem, options })}
                />
              )}
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

      <Dialog open={showEditMenuItemDialog} onOpenChange={setShowEditMenuItemDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <DialogHeader>
              <DialogTitle>Menü Öğesini Düzenle</DialogTitle>
              <DialogDescription>
                Menü öğesi bilgilerini güncelleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 px-1">
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
                <div className="flex gap-2">
                  <Select
                    value={newMenuItem.category}
                    onValueChange={(value) => setNewMenuItem({ ...newMenuItem, category: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Kategori seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories || []).map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewCategoryDialog(true)}
                  >
                    <Plus className="h-4 w-4" weight="bold" />
                  </Button>
                </div>
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
                <Label>Görsel URL (QR Menü için)</Label>
                <Input
                  value={newMenuItem.imageUrl}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {newMenuItem.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img 
                      src={newMenuItem.imageUrl} 
                      alt="Önizleme"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EGörsel Yüklenemedi%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 Ürün görseli QR menüde ve müşteri ekranlarında gösterilecektir.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Porsiyon Sayısı</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newMenuItem.servingSize}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, servingSize: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Satış Fiyatı (₺)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newMenuItem.basePrice || 0}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, basePrice: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ürün Seçenekleri</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Müşterilerin seçebileceği varyantlar ekleyin (örn: Şeker durumu, boyut)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewMenuItem({ ...newMenuItem, hasOptions: !newMenuItem.hasOptions })}
                  >
                    {newMenuItem.hasOptions ? 'Seçenekleri Kapat' : 'Seçenek Ekle'}
                  </Button>
                </div>
                
                {newMenuItem.hasOptions && (
                  <ProductOptionsEditor
                    options={newMenuItem.options}
                    onChange={(options) => setNewMenuItem({ ...newMenuItem, options })}
                  />
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMenuItemDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveMenuItemEdit}>
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Güncelle
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

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Ürün Ekle</DialogTitle>
            <DialogDescription>
              Ürün bilgilerini doldurun
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ürün Adı *</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Cheesecake"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  placeholder="CAKE-001"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Ürün açıklaması..."
                  rows={2}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Görsel URL (Opsiyonel)</Label>
                <Input
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {newProduct.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img 
                      src={newProduct.imageUrl} 
                      alt="Önizleme"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EGörsel Yüklenemedi%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 Ürün görseli menüde ve satış ekranında görünür. Unsplash veya Pexels'den ücretsiz görseller kullanabilirsiniz.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Input
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  placeholder="adet, kg, lt"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Stok Seviyesi</Label>
                <Input
                  type="number"
                  value={newProduct.minStockLevel}
                  onChange={(e) => setNewProduct({...newProduct, minStockLevel: Number(e.target.value)})}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Satış Fiyatı (₺)</Label>
                <Input
                  type="number"
                  value={newProduct.basePrice}
                  onChange={(e) => setNewProduct({...newProduct, basePrice: Number(e.target.value)})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Maliyet Fiyatı (₺)</Label>
                <Input
                  type="number"
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>KDV Oranı (%)</Label>
                <Input
                  type="number"
                  value={newProduct.taxRate}
                  onChange={(e) => setNewProduct({...newProduct, taxRate: Number(e.target.value)})}
                  min="0"
                  max="100"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trackStock"
                  checked={newProduct.trackStock}
                  onChange={(e) => setNewProduct({...newProduct, trackStock: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="trackStock" className="cursor-pointer">
                  Stok takibi yap
                </Label>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ürün Seçenekleri</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Müşterilerin seçebileceği varyantlar ekleyin (örn: Şeker durumu, boyut)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewProduct({ ...newProduct, hasOptions: !newProduct.hasOptions })}
                >
                  {newProduct.hasOptions ? 'Seçenekleri Kapat' : 'Seçenek Ekle'}
                </Button>
              </div>
              
              {newProduct.hasOptions && (
                <ScrollArea className="max-h-[300px]">
                  <ProductOptionsEditor
                    options={newProduct.options}
                    onChange={(options) => setNewProduct({ ...newProduct, options })}
                  />
                </ScrollArea>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              İptal
            </Button>
            <Button onClick={addProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Ürün Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteProductDialog} onOpenChange={setShowDeleteProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ürün Sil</DialogTitle>
            <DialogDescription>
              {productToDelete?.name} silinecek. Emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Bu işlem ürünü pasif hale getirecektir. Geçmiş kayıtlar silinmeyecektir.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteProductDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={deleteProduct}>
              <Trash className="h-4 w-4 mr-2" />
              Ürünü Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPriceEditDialog} onOpenChange={setShowPriceEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fiyat Düzenle</DialogTitle>
            <DialogDescription>
              {editingMenuItem?.name} için yeni satış fiyatını girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mevcut Fiyat</span>
                <span className="font-semibold font-tabular-nums">
                  {formatCurrency(editingMenuItem?.sellingPrice || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Maliyet</span>
                <span className="font-semibold font-tabular-nums">
                  {formatCurrency(editingMenuItem?.costPrice || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Yeni Satış Fiyatı (₺)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {newPrice && parseFloat(newPrice) > 0 && editingMenuItem && (
              <div className="p-3 bg-accent/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Yeni Kar Marjı</span>
                  <span className="text-lg font-bold font-tabular-nums text-accent">
                    {(((parseFloat(newPrice) - editingMenuItem.costPrice) / parseFloat(newPrice)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={savePriceEdit}>
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPriceProposalDialog} onOpenChange={setShowPriceProposalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Fiyat Önerisi</DialogTitle>
            <DialogDescription>
              Sistem, veri analizine dayalı fiyat önerisi sunuyor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {priceProposal && (
              <>
                <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Mevcut Fiyat</p>
                      <p className="text-2xl font-bold font-tabular-nums">
                        {formatCurrency(priceProposal.currentPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {priceProposal.proposedPrice > priceProposal.currentPrice ? (
                        <TrendUp className="h-8 w-8 text-accent" weight="bold" />
                      ) : (
                        <TrendDown className="h-8 w-8 text-secondary" weight="bold" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Önerilen Fiyat</p>
                      <p className="text-2xl font-bold font-tabular-nums text-accent">
                        {formatCurrency(priceProposal.proposedPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className={priceProposal.proposedPrice > priceProposal.currentPrice ? 'text-accent' : 'text-secondary'}>
                      {priceProposal.proposedPrice > priceProposal.currentPrice ? '+' : ''}
                      {formatCurrency(priceProposal.proposedPrice - priceProposal.currentPrice)}
                    </span>
                    <span className="text-muted-foreground">
                      ({((priceProposal.proposedPrice - priceProposal.currentPrice) / priceProposal.currentPrice * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkle className="h-4 w-4 text-primary" weight="fill" />
                    <p className="text-sm font-medium">AI Analizi</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {priceProposal.reason}
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Beklenen Kar Marjı</span>
                    <span className="text-lg font-bold font-tabular-nums">
                      {priceProposal.expectedProfitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-900">
                    ⚠️ Bu öneri, geçmiş satış verilerine ve pazar koşullarına dayalıdır. 
                    Değişiklikleri uygulamadan önce dikkatli değerlendirin.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceProposalDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button onClick={applyPriceProposal} variant="default">
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Onayla ve Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kampanya Başlat</DialogTitle>
            <DialogDescription>
              {selectedMenuItem?.name} için indirim kampanyası başlatın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mevcut Fiyat</span>
                <span className="text-2xl font-bold font-tabular-nums">
                  {formatCurrency(selectedMenuItem?.hasActiveCampaign 
                    ? selectedMenuItem.campaignDetails?.originalPrice || selectedMenuItem.sellingPrice
                    : selectedMenuItem?.sellingPrice || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kampanya Fiyatı</span>
                <span className="text-2xl font-bold font-tabular-nums text-accent">
                  {formatCurrency((selectedMenuItem?.hasActiveCampaign 
                    ? selectedMenuItem.campaignDetails?.originalPrice || selectedMenuItem.sellingPrice
                    : selectedMenuItem?.sellingPrice || 0) * (1 - campaignForm.discountPercentage / 100))}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2 border-t">
                <Badge variant="secondary" className="text-base">
                  <Percent className="h-4 w-4 mr-1" />
                  {campaignForm.discountPercentage}% İndirim
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>İndirim Oranı (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={campaignForm.discountPercentage}
                  onChange={(e) => setCampaignForm({ ...campaignForm, discountPercentage: Number(e.target.value) })}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {[10, 15, 20, 25].map(percent => (
                    <Button
                      key={percent}
                      size="sm"
                      variant={campaignForm.discountPercentage === percent ? 'default' : 'outline'}
                      onClick={() => setCampaignForm({ ...campaignForm, discountPercentage: percent })}
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kampanya Süresi (Gün)</Label>
              <Select 
                value={campaignForm.duration.toString()} 
                onValueChange={(value) => setCampaignForm({ ...campaignForm, duration: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Gün</SelectItem>
                  <SelectItem value="3">3 Gün</SelectItem>
                  <SelectItem value="7">1 Hafta</SelectItem>
                  <SelectItem value="14">2 Hafta</SelectItem>
                  <SelectItem value="30">1 Ay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kampanya Nedeni (Opsiyonel)</Label>
              <Textarea
                value={campaignForm.reason}
                onChange={(e) => setCampaignForm({ ...campaignForm, reason: e.target.value })}
                placeholder="Örn: Düşük satışları artırmak için, Yeni ürün tanıtımı, vs."
                rows={3}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bitiş Tarihi</span>
                <span className="font-semibold">
                  {new Date(Date.now() + campaignForm.duration * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Beklenen Tasarruf</span>
                <span className="font-semibold text-destructive">
                  -{formatCurrency((selectedMenuItem?.hasActiveCampaign 
                    ? selectedMenuItem.campaignDetails?.originalPrice || selectedMenuItem.sellingPrice
                    : selectedMenuItem?.sellingPrice || 0) * (campaignForm.discountPercentage / 100))}
                </span>
              </div>
            </div>

            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="text-xs leading-relaxed">
                🎉 <strong>Kampanyalı ürünler POS ekranında özel olarak işaretlenir</strong> ve 
                garsonlar bu ürünleri öncelikli olarak görebilir ve satmaya teşvik edilir.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button onClick={applyCampaign} variant="default">
              <Sparkle className="h-4 w-4 mr-2" weight="fill" />
              Kampanyayı Başlat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ürün Düzenle</DialogTitle>
            <DialogDescription>
              Ürün bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ürün Adı *</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Cheesecake"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  placeholder="CAKE-001"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Ürün açıklaması..."
                  rows={2}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Görsel URL (Opsiyonel)</Label>
                <Input
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {newProduct.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border">
                    <img 
                      src={newProduct.imageUrl} 
                      alt="Önizleme"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EGörsel Yüklenemedi%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 Ürün görseli menüde ve satış ekranında görünür. Unsplash veya Pexels'den ücretsiz görseller kullanabilirsiniz.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Input
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  placeholder="adet, kg, lt"
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum Stok Seviyesi</Label>
                <Input
                  type="number"
                  value={newProduct.minStockLevel}
                  onChange={(e) => setNewProduct({...newProduct, minStockLevel: Number(e.target.value)})}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Satış Fiyatı (₺)</Label>
                <Input
                  type="number"
                  value={newProduct.basePrice}
                  onChange={(e) => setNewProduct({...newProduct, basePrice: Number(e.target.value)})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Maliyet Fiyatı (₺)</Label>
                <Input
                  type="number"
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>KDV Oranı (%)</Label>
                <Input
                  type="number"
                  value={newProduct.taxRate}
                  onChange={(e) => setNewProduct({...newProduct, taxRate: Number(e.target.value)})}
                  min="0"
                  max="100"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editTrackStock"
                  checked={newProduct.trackStock}
                  onChange={(e) => setNewProduct({...newProduct, trackStock: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="editTrackStock" className="cursor-pointer">
                  Stok takibi yap
                </Label>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ürün Seçenekleri</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Müşterilerin seçebileceği varyantlar ekleyin (örn: Şeker durumu, boyut)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewProduct({ ...newProduct, hasOptions: !newProduct.hasOptions })}
                >
                  {newProduct.hasOptions ? 'Seçenekleri Kapat' : 'Seçenek Ekle'}
                </Button>
              </div>
              
              {newProduct.hasOptions && (
                <ScrollArea className="max-h-[300px]">
                  <ProductOptionsEditor
                    options={newProduct.options}
                    onChange={(options) => setNewProduct({ ...newProduct, options })}
                  />
                </ScrollArea>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProductDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveProductEdit}>
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStockCountDialog} onOpenChange={setShowStockCountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stok Sayım</DialogTitle>
            <DialogDescription>
              {productForCount?.name} için fiziksel sayım yapın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Mevcut Stok (Sistemde)</p>
                  <p className="text-3xl font-bold font-tabular-nums">
                    {productForCount?.stock.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{productForCount?.unit}</p>
                </div>
                <Package className="h-12 w-12 text-primary opacity-50" weight="duotone" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sayılan Miktar ({productForCount?.unit})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={countedStock}
                onChange={(e) => setCountedStock(e.target.value)}
                placeholder="Fiziksel sayım sonucu..."
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                💡 Rafta/depoda saydığınız gerçek ürün miktarını girin
              </p>
            </div>

            {countedStock && parseFloat(countedStock) >= 0 && productForCount && (
              <>
                <Separator />
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fark</span>
                    <span className={`text-lg font-bold font-tabular-nums ${
                      parseFloat(countedStock) - productForCount.stock > 0 
                        ? 'text-accent' 
                        : parseFloat(countedStock) - productForCount.stock < 0 
                        ? 'text-destructive' 
                        : 'text-foreground'
                    }`}>
                      {parseFloat(countedStock) - productForCount.stock > 0 ? '+' : ''}
                      {(parseFloat(countedStock) - productForCount.stock).toFixed(2)} {productForCount.unit}
                    </span>
                  </div>
                  {Math.abs(parseFloat(countedStock) - productForCount.stock) > 0 && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      {parseFloat(countedStock) > productForCount.stock ? (
                        <p>✅ Sistemde eksik kayıt var, stok artırılacak</p>
                      ) : parseFloat(countedStock) < productForCount.stock ? (
                        <p>⚠️ Fire/kayıp tespit edildi, stok düşürülecek</p>
                      ) : (
                        <p>✓ Sistemle uyumlu, değişiklik yok</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900 leading-relaxed">
                ⚠️ Bu işlem stok miktarını doğrudan güncelleyecektir. 
                Sayım sonucundan emin olduğunuzda onaylayın.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockCountDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button onClick={saveStockCount} variant="default" disabled={!countedStock || parseFloat(countedStock) < 0}>
              <Check className="h-4 w-4 mr-2" weight="bold" />
              Sayımı Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Kategori Ekle</DialogTitle>
            <DialogDescription>
              Menü öğeleri için yeni bir kategori oluşturun
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kategori Adı</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Örn: Tatlılar, Ana Yemekler, İçecekler..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveNewCategory();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                💡 Kategori, menü öğelerini gruplamak için kullanılır
              </p>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Mevcut Kategoriler:</p>
              <div className="flex flex-wrap gap-2">
                {(categories || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Henüz kategori yok</p>
                ) : (
                  (categories || []).map((cat) => (
                    <Badge key={cat.id} variant="secondary">
                      {cat.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewCategoryDialog(false);
              setNewCategoryName('');
            }}>
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
            <Button onClick={saveNewCategory}>
              <Plus className="h-4 w-4 mr-2" weight="bold" />
              Kategori Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ScrollArea>
  );
}

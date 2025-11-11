import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, QrCode, ForkKnife, Sparkle, MagnifyingGlass, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MenuItem, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/helpers';

interface QRMenuModuleProps {
  onBack: () => void;
}

export default function QRMenuModule({ onBack }: QRMenuModuleProps) {
  const [menuItems] = useKV<MenuItem[]>('menuItems', []);
  const [products] = useKV<Product[]>('products', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activeMenuItems = (menuItems || []).filter(item => item.isActive);
  
  const categories = Array.from(
    new Set(activeMenuItems.map(item => item.category))
  ).sort();

  const filteredMenuItems = activeMenuItems.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedByCategory = filteredMenuItems.reduce((acc, item) => {
    const category = item.category || 'Diğer';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  useEffect(() => {
    toast.success('QR Menü modülü yüklendi - Fiyat değişiklikleri otomatik senkronize edilir');
  }, []);

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gradient-to-br from-background via-background to-primary/5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
              <QrCode className="h-8 w-8 text-primary" weight="bold" />
              QR Menü Yönetimi
            </h1>
            <p className="text-muted-foreground text-sm">
              Dijital menü - Fiyat ve ürün değişiklikleri otomatik senkronize edilir
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-2">
            <ForkKnife className="h-4 w-4 mr-2" weight="bold" />
            {activeMenuItems.length} Aktif Ürün
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-2">
            🔄 Canlı Senkronizasyon
          </Badge>
        </div>
      </header>

      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-primary" weight="fill" />
            QR Menü Özellikleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <QrCode className="h-5 w-5 text-primary" weight="bold" />
                </div>
                <h3 className="font-semibold">QR Kod Erişimi</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Müşteriler QR kod okutarak menüye masalarından ulaşabilir
              </p>
            </div>

            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Sparkle className="h-5 w-5 text-accent" weight="fill" />
                </div>
                <h3 className="font-semibold">Otomatik Senkronizasyon</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Menü mühendisliğinde yapılan fiyat ve stok değişiklikleri anında yansır
              </p>
            </div>

            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <ForkKnife className="h-5 w-5 text-secondary-foreground" weight="bold" />
                </div>
                <h3 className="font-semibold">Kampanya Gösterimi</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kampanyalı ürünler özel olarak işaretlenir ve indirimli fiyatlar gösterilir
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Menü Önizleme</CardTitle>
              <CardDescription>
                Müşterilerin göreceği dijital menü görünümü
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[300px]">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>
                Tümü ({activeMenuItems.length})
              </TabsTrigger>
              {categories.map((category) => {
                const count = activeMenuItems.filter(item => item.category === category).length;
                return (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-12">
                  <ForkKnife className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz menü öğesi yok'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedByCategory).map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">{category}</h2>
                      <Separator className="flex-1" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => {
                        const hasCampaign = item.hasActiveCampaign && item.campaignDetails;
                        
                        return (
                          <Card 
                            key={item.id} 
                            className={`hover:shadow-lg transition-all ${
                              hasCampaign ? 'ring-2 ring-accent bg-accent/5' : ''
                            }`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-1">
                                  <CardTitle className="text-base leading-tight">
                                    {item.name}
                                  </CardTitle>
                                  {item.description && (
                                    <CardDescription className="text-xs line-clamp-2">
                                      {item.description}
                                    </CardDescription>
                                  )}
                                </div>
                                {hasCampaign && (
                                  <Badge variant="default" className="bg-accent animate-pulse shrink-0">
                                    <Sparkle className="h-3 w-3 mr-1" weight="fill" />
                                    İndirim!
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-3">
                              {hasCampaign && item.campaignDetails && (
                                <div className="p-3 bg-accent/10 rounded-lg space-y-2 border border-accent/20">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground line-through">
                                      {formatCurrency(item.campaignDetails.originalPrice)}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                      %{item.campaignDetails.discountPercentage} İndirim
                                    </Badge>
                                  </div>
                                  {item.campaignDetails.reason && (
                                    <p className="text-xs text-muted-foreground italic">
                                      💡 {item.campaignDetails.reason}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-2">
                                <div className="space-y-1">
                                  <p className={`text-2xl font-bold font-tabular-nums ${
                                    hasCampaign ? 'text-accent' : 'text-foreground'
                                  }`}>
                                    {formatCurrency(item.sellingPrice)}
                                  </p>
                                  {item.servingSize && item.servingSize > 1 && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.servingSize} porsiyon
                                    </p>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  {!item.isActive && (
                                    <Badge variant="destructive" className="text-xs">
                                      Stokta Yok
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedByCategory[category]?.map((item) => {
                    const hasCampaign = item.hasActiveCampaign && item.campaignDetails;
                    
                    return (
                      <Card 
                        key={item.id} 
                        className={`hover:shadow-lg transition-all ${
                          hasCampaign ? 'ring-2 ring-accent bg-accent/5' : ''
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <CardTitle className="text-base leading-tight">
                                {item.name}
                              </CardTitle>
                              {item.description && (
                                <CardDescription className="text-xs line-clamp-2">
                                  {item.description}
                                </CardDescription>
                              )}
                            </div>
                            {hasCampaign && (
                              <Badge variant="default" className="bg-accent animate-pulse shrink-0">
                                <Sparkle className="h-3 w-3 mr-1" weight="fill" />
                                İndirim!
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          {hasCampaign && item.campaignDetails && (
                            <div className="p-3 bg-accent/10 rounded-lg space-y-2 border border-accent/20">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(item.campaignDetails.originalPrice)}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  %{item.campaignDetails.discountPercentage} İndirim
                                </Badge>
                              </div>
                              {item.campaignDetails.reason && (
                                <p className="text-xs text-muted-foreground italic">
                                  💡 {item.campaignDetails.reason}
                                </p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="space-y-1">
                              <p className={`text-2xl font-bold font-tabular-nums ${
                                hasCampaign ? 'text-accent' : 'text-foreground'
                              }`}>
                                {formatCurrency(item.sellingPrice)}
                              </p>
                              {item.servingSize && item.servingSize > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  {item.servingSize} porsiyon
                                </p>
                              )}
                            </div>
                            
                            <div className="text-right">
                              {!item.isActive && (
                                <Badge variant="destructive" className="text-xs">
                                  Stokta Yok
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Senkronizasyon Bilgisi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Sparkle className="h-4 w-4 text-primary" weight="fill" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Fiyat Değişiklikleri</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menü mühendisliği modülünden yapılan fiyat güncellemeleri QR menüde anında görünür
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
              <div className="p-2 bg-accent/10 rounded-lg shrink-0">
                <Sparkle className="h-4 w-4 text-accent" weight="fill" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Kampanya Durumu</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Başlatılan veya sonlandırılan kampanyalar otomatik olarak senkronize edilir
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
              <div className="p-2 bg-secondary/10 rounded-lg shrink-0">
                <ForkKnife className="h-4 w-4 text-secondary-foreground" weight="bold" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Ürün Durumu</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pasife alınan ürünler QR menüde otomatik olarak gizlenir
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-card rounded-lg border">
              <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
                <QrCode className="h-4 w-4 text-green-600" weight="bold" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Gerçek Zamanlı</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tüm değişiklikler anında yansır, manuel güncelleme gerekmez
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

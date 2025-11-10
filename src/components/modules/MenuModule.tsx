import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ForkKnife, Sparkle, TrendUp, TrendDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MenuItem, MenuAnalysis, MenuCategory } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/helpers';

interface MenuModuleProps {
  onBack: () => void;
}

export default function MenuModule({ onBack }: MenuModuleProps) {
  const [menuItems] = useKV<MenuItem[]>('menuItems', []);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<MenuAnalysis[]>([]);

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

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Menü Mühendisliği</h1>
          <p className="text-muted-foreground text-sm">Reçete yönetimi ve AI destekli optimizasyon</p>
        </div>
      </header>

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

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Fiyat Ayarla
                      </Button>
                      <Button size="sm" className="flex-1">
                        Öneriyi Uygula
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(menuItems || []).map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <CardDescription className="text-xs capitalize">
                    {item.category}
                  </CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-accent/10">
                  <ForkKnife className="h-5 w-5 text-accent" weight="bold" />
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
                <span className="text-sm text-muted-foreground">Maliyet</span>
                <span className="text-sm font-tabular-nums">
                  {formatCurrency(item.costPrice)}
                </span>
              </div>
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
              <Badge variant={item.isActive ? 'default' : 'secondary'}>
                {item.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Users,
  Buildings,
  ForkKnife,
  ChartLine,
  TrendUp,
  Package,
  Bell,
  ClockClockwise,
} from '@phosphor-icons/react';
import type { Module } from '@/App';
import type { DashboardStats, Sale } from '@/lib/types';
import { formatCurrency, formatNumber, getStartOfDay } from '@/lib/helpers';
import { useMemo } from 'react';

interface DashboardProps {
  onNavigate: (module: Module) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [sales] = useKV<Sale[]>('sales', []);
  const [employees] = useKV<any[]>('employees', []);
  const [products] = useKV<any[]>('products', []);

  const stats: DashboardStats = useMemo(() => {
    const today = getStartOfDay();
    const todaySales = (sales || []).filter(
      (sale) => new Date(sale.saleDate) >= today
    );

    return {
      todaySales: todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      todayTransactions: todaySales.length,
      lowStockItems: (products || []).filter((p: any) => p.stock <= p.minStockLevel).length,
      activeEmployees: (employees || []).filter((e: any) => e.isActive).length,
      pendingApprovals: 0,
    };
  }, [sales, employees, products]);

  const moduleCards = [
    {
      id: 'pos' as Module,
      title: 'POS - Satış Noktası',
      description: 'Hızlı satış işlemleri ve fatura oluşturma',
      icon: ShoppingCart,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'personnel' as Module,
      title: 'Personel Yönetimi',
      description: 'Vardiya, puantaj ve maaş hesaplama',
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      id: 'branch' as Module,
      title: 'Şube Yönetimi',
      description: 'Çoklu şube senkronizasyonu ve transfer',
      icon: Buildings,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'menu' as Module,
      title: 'Menü Mühendisliği',
      description: 'Reçete yönetimi ve AI optimizasyon',
      icon: ForkKnife,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      id: 'finance' as Module,
      title: 'Finans Yönetimi',
      description: 'Gelir-gider takibi ve kar-zarar raporu',
      icon: ChartLine,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Entegre POS Sistemi</h1>
        <p className="text-muted-foreground text-base">
          Modern restoran ve perakende yönetim platformu
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bugünkü Satışlar
            </CardTitle>
            <TrendUp className="h-5 w-5 text-accent" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
              {formatCurrency(stats.todaySales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(stats.todayTransactions)} işlem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Düşük Stok Uyarısı
            </CardTitle>
            <Package className="h-5 w-5 text-destructive" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
              {stats.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ürün minimum seviyede
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktif Personel
            </CardTitle>
            <ClockClockwise className="h-5 w-5 text-primary" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
              {stats.activeEmployees}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              çalışan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bekleyen Onaylar
            </CardTitle>
            <Bell className="h-5 w-5 text-accent" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
              {stats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              onay gerekli
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Modüller</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => onNavigate(module.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {module.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {module.description}
                      </CardDescription>
                    </div>
                    <div className={`p-3 rounded-lg ${module.bgColor}`}>
                      <Icon className={`h-6 w-6 ${module.color}`} weight="bold" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/5">
                    Modülü Aç →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

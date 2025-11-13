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
  Gear,
  ChartBar,
  Shield,
  CurrencyCircleDollar,
  QrCode,
  ListChecks,
  Handshake,
  UserGear,
} from '@phosphor-icons/react';
import type { Module } from '@/App';
import type { DashboardStats, Sale, UserRole, RolePermissions, ModulePermission, AuthSession } from '@/lib/types';
import { formatCurrency, formatNumber, getStartOfDay } from '@/lib/helpers';
import { useMemo } from 'react';
import { useBranchFilter } from '@/hooks/use-branch-filter';

interface DashboardProps {
  onNavigate: (module: Module) => void;
  currentUserRole?: UserRole;
  authSession?: AuthSession | null;
}

const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'owner',
    permissions: ['pos', 'personnel', 'branch', 'menu', 'finance', 'settings', 'reports', 'tasks'],
    canViewFinancials: true,
    canEditPrices: true,
    canManageUsers: true,
    canApprovePayments: true,
    canViewCashRegister: true,
    canAddCash: true,
    canWithdrawCash: true,
    canCloseCashRegister: true,
  },
  {
    role: 'manager',
    permissions: ['pos', 'personnel', 'branch', 'menu', 'finance', 'reports', 'tasks'],
    canViewFinancials: true,
    canEditPrices: true,
    canManageUsers: false,
    canApprovePayments: true,
    canViewCashRegister: true,
    canAddCash: true,
    canWithdrawCash: true,
    canCloseCashRegister: true,
  },
  {
    role: 'waiter',
    permissions: ['pos', 'tasks'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
    canViewCashRegister: false,
    canAddCash: false,
    canWithdrawCash: false,
    canCloseCashRegister: false,
  },
  {
    role: 'cashier',
    permissions: ['pos', 'reports', 'tasks'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
    canViewCashRegister: true,
    canAddCash: true,
    canWithdrawCash: false,
    canCloseCashRegister: false,
  },
  {
    role: 'chef',
    permissions: ['menu', 'tasks'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
    canViewCashRegister: false,
    canAddCash: false,
    canWithdrawCash: false,
    canCloseCashRegister: false,
  },
  {
    role: 'staff',
    permissions: ['tasks'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
    canViewCashRegister: false,
    canAddCash: false,
    canWithdrawCash: false,
    canCloseCashRegister: false,
  },
];

export default function Dashboard({ onNavigate, currentUserRole = 'owner', authSession }: DashboardProps) {
  const [sales] = useKV<Sale[]>('sales', []);
  const [employees] = useKV<any[]>('employees', []);
  const [products] = useKV<any[]>('products', []);
  const [rolePermissions] = useKV<RolePermissions[]>('rolePermissions', DEFAULT_ROLE_PERMISSIONS);

  const { filteredItems: filteredSales } = useBranchFilter(sales, authSession);
  const { filteredItems: filteredEmployees } = useBranchFilter(employees, authSession);
  const { filteredItems: filteredProducts } = useBranchFilter(products, authSession);

  const currentPermissions = useMemo(() => {
    return (rolePermissions || DEFAULT_ROLE_PERMISSIONS).find(rp => rp.role === currentUserRole) || DEFAULT_ROLE_PERMISSIONS[0];
  }, [rolePermissions, currentUserRole]);

  const hasModuleAccess = (module: ModulePermission): boolean => {
    if (currentUserRole === 'owner') return true;
    return currentPermissions.permissions.includes(module);
  };

  const stats: DashboardStats = useMemo(() => {
    const today = getStartOfDay();
    const todaySales = filteredSales.filter(
      (sale) => new Date(sale.saleDate) >= today
    );

    return {
      todaySales: currentPermissions.canViewFinancials 
        ? todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
        : 0,
      todayTransactions: todaySales.length,
      lowStockItems: filteredProducts.filter((p: any) => p.stock <= p.minStockLevel).length,
      activeEmployees: filteredEmployees.filter((e: any) => e.isActive).length,
      pendingApprovals: 0,
    };
  }, [filteredSales, filteredEmployees, filteredProducts, currentPermissions]);

  const allModuleCards = [
    {
      id: 'pos' as const,
      moduleId: 'pos' as Module,
      title: 'POS - Satış Noktası',
      description: 'Hızlı satış işlemleri ve fatura oluşturma',
      icon: ShoppingCart,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'personnel' as const,
      moduleId: 'personnel' as Module,
      title: 'Personel Yönetimi',
      description: 'Vardiya, puantaj ve maaş hesaplama',
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      id: 'branch' as const,
      moduleId: 'branch' as Module,
      title: 'Şube Yönetimi',
      description: 'Çoklu şube senkronizasyonu ve transfer',
      icon: Buildings,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'menu' as const,
      moduleId: 'menu' as Module,
      title: 'Menü Mühendisliği',
      description: 'Reçete, fatura ve AI optimizasyon',
      icon: ForkKnife,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      id: 'qrmenu' as any,
      moduleId: 'qrmenu' as Module,
      title: 'QR Menü',
      description: 'Dijital menü - otomatik senkronizasyon',
      icon: QrCode,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      id: 'tasks' as const,
      moduleId: 'tasks' as Module,
      title: 'Görev Yönetimi',
      description: 'Personel görev atama ve takip',
      icon: ListChecks,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'b2b' as any,
      moduleId: 'b2b' as Module,
      title: 'B2B Tedarik Platformu',
      description: 'Anonim tedarikçi ve sipariş yönetimi',
      icon: Handshake,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      id: 'customers' as any,
      moduleId: 'customers' as Module,
      title: 'Cari Hesaplar',
      description: 'Açık hesap ve müşteri borç yönetimi',
      icon: CurrencyCircleDollar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      id: 'admin' as any,
      moduleId: 'admin' as Module,
      title: 'Admin Paneli',
      description: 'Merkezi şube ve kullanıcı yönetimi',
      icon: UserGear,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600/10',
    },
    {
      id: 'cash-monitor' as any,
      moduleId: 'cash-monitor' as Module,
      title: 'Kasa İzleme',
      description: 'Gerçek zamanlı kasa operasyonları',
      icon: ClockClockwise,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    },
    {
      id: 'finance' as const,
      moduleId: 'finance' as Module,
      title: 'Finans Yönetimi',
      description: 'Gelir-gider takibi ve kar-zarar raporu',
      icon: ChartLine,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'reports' as const,
      moduleId: 'reports' as Module,
      title: 'Raporlama',
      description: 'Detaylı satış ve performans raporları',
      icon: ChartBar,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      id: 'settings' as const,
      moduleId: 'settings' as Module,
      title: 'Ayarlar',
      description: 'Stok, KDV, ödeme ve sistem ayarları',
      icon: Gear,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  const moduleCards = allModuleCards.filter(card => {
    if (card.id === 'qrmenu' || card.id === 'tasks' || card.id === 'b2b' || card.id === 'customers') return hasModuleAccess('tasks');
    if (card.id === 'admin') return currentUserRole === 'owner';
    if (card.id === 'cash-monitor') return currentUserRole === 'owner' || currentUserRole === 'manager';
    return hasModuleAccess(card.id);
  });

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6 pb-20">
      <header className="space-y-2 pt-12 sm:pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">Entegre POS Sistemi</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Modern restoran ve perakende yönetim platformu
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bugünkü Satışlar
            </CardTitle>
            <TrendUp className="h-5 w-5 text-accent" weight="bold" />
          </CardHeader>
          <CardContent>
            {currentPermissions.canViewFinancials ? (
              <>
                <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
                  {formatCurrency(stats.todaySales)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(stats.todayTransactions)} işlem
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                Finansal verileri görüntüleme yetkiniz yok
              </div>
            )}
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
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Modüller</h2>
        {moduleCards.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Bu rol için erişilebilir modül bulunmamaktadır.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {moduleCards.map((module) => {
              const Icon = module.icon;
              return (
                <Card
                  key={module.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onNavigate(module.moduleId)}
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
        )}
      </section>
    </div>
  );
}

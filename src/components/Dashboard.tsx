import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
} from '@phosphor-icons/react';
import type { Module } from '@/App';
import type { DashboardStats, Sale, UserRole, RolePermissions, ModulePermission } from '@/lib/types';
import { formatCurrency, formatNumber, getStartOfDay } from '@/lib/helpers';
import { useMemo } from 'react';

interface DashboardProps {
  onNavigate: (module: Module) => void;
  currentUserRole?: UserRole;
}

const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'owner',
    permissions: ['pos', 'personnel', 'branch', 'menu', 'finance', 'settings', 'reports'],
    canViewFinancials: true,
    canEditPrices: true,
    canManageUsers: true,
    canApprovePayments: true,
  },
  {
    role: 'manager',
    permissions: ['pos', 'personnel', 'branch', 'menu', 'finance', 'reports'],
    canViewFinancials: true,
    canEditPrices: true,
    canManageUsers: false,
    canApprovePayments: true,
  },
  {
    role: 'waiter',
    permissions: ['pos'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
  },
  {
    role: 'cashier',
    permissions: ['pos', 'reports'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
  },
  {
    role: 'chef',
    permissions: ['menu'],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
  },
  {
    role: 'staff',
    permissions: [],
    canViewFinancials: false,
    canEditPrices: false,
    canManageUsers: false,
    canApprovePayments: false,
  },
];

export default function Dashboard({ onNavigate, currentUserRole = 'owner' }: DashboardProps) {
  const [sales] = useKV<Sale[]>('sales', []);
  const [employees] = useKV<any[]>('employees', []);
  const [products] = useKV<any[]>('products', []);
  const [rolePermissions] = useKV<RolePermissions[]>('rolePermissions', DEFAULT_ROLE_PERMISSIONS);
  const [selectedRole, setSelectedRole] = useKV<UserRole>('currentUserRole', 'owner');

  const currentPermissions = useMemo(() => {
    return (rolePermissions || DEFAULT_ROLE_PERMISSIONS).find(rp => rp.role === selectedRole) || DEFAULT_ROLE_PERMISSIONS[0];
  }, [rolePermissions, selectedRole]);

  const hasModuleAccess = (module: ModulePermission): boolean => {
    if (selectedRole === 'owner') return true;
    return currentPermissions.permissions.includes(module);
  };

  const stats: DashboardStats = useMemo(() => {
    const today = getStartOfDay();
    const todaySales = (sales || []).filter(
      (sale) => new Date(sale.saleDate) >= today
    );

    return {
      todaySales: currentPermissions.canViewFinancials 
        ? todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0)
        : 0,
      todayTransactions: todaySales.length,
      lowStockItems: (products || []).filter((p: any) => p.stock <= p.minStockLevel).length,
      activeEmployees: (employees || []).filter((e: any) => e.isActive).length,
      pendingApprovals: 0,
    };
  }, [sales, employees, products, currentPermissions]);

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

  const moduleCards = allModuleCards.filter(card => hasModuleAccess(card.id));

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Entegre POS Sistemi</h1>
            <p className="text-muted-foreground text-base">
              Modern restoran ve perakende yönetim platformu
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Sahip</SelectItem>
                <SelectItem value="manager">Yönetici</SelectItem>
                <SelectItem value="waiter">Garson</SelectItem>
                <SelectItem value="cashier">Kasiyer</SelectItem>
                <SelectItem value="chef">Şef</SelectItem>
                <SelectItem value="staff">Personel</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => onNavigate('cash')}>
              <CurrencyCircleDollar className="h-4 w-4 mr-2" weight="fill" />
              Kasa Durumu
            </Button>
            {selectedRole === 'owner' && (
              <Button variant="outline" size="sm" onClick={() => onNavigate('roles')}>
                <Shield className="h-4 w-4 mr-2" weight="fill" />
                Yetki Yönetimi
              </Button>
            )}
          </div>
        </div>
        {selectedRole !== 'owner' && (
          <Badge variant="outline" className="text-xs">
            👤 Giriş Yapan: {selectedRole === 'waiter' ? 'Garson' : selectedRole === 'manager' ? 'Yönetici' : selectedRole === 'cashier' ? 'Kasiyer' : selectedRole === 'chef' ? 'Şef' : 'Personel'}
          </Badge>
        )}
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
        <h2 className="text-2xl font-semibold tracking-tight">Modüller</h2>
        {moduleCards.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Bu rol için erişilebilir modül bulunmamaktadır.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

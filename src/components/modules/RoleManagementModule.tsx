import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Shield, Check, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { RolePermissions, UserRole, ModulePermission } from '@/lib/types';

interface RoleManagementModuleProps {
  onBack: () => void;
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

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Sahip',
  manager: 'Yönetici',
  waiter: 'Garson',
  cashier: 'Kasiyer',
  chef: 'Şef',
  staff: 'Personel',
};

const MODULE_LABELS: Record<ModulePermission, string> = {
  pos: 'POS - Satış Noktası',
  personnel: 'Personel Yönetimi',
  branch: 'Şube Yönetimi',
  menu: 'Menü Mühendisliği',
  finance: 'Finans Yönetimi',
  settings: 'Ayarlar',
  reports: 'Raporlama',
};

export default function RoleManagementModule({ onBack }: RoleManagementModuleProps) {
  const [rolePermissions, setRolePermissions] = useKV<RolePermissions[]>(
    'rolePermissions',
    DEFAULT_ROLE_PERMISSIONS
  );

  const updateRolePermission = (
    role: UserRole,
    module: ModulePermission,
    hasPermission: boolean
  ) => {
    setRolePermissions((current) => {
      const updated = (current || DEFAULT_ROLE_PERMISSIONS).map((rp) => {
        if (rp.role === role) {
          const permissions = hasPermission
            ? [...rp.permissions, module]
            : rp.permissions.filter((p) => p !== module);
          return { ...rp, permissions };
        }
        return rp;
      });
      return updated;
    });
    
    toast.success(`${ROLE_LABELS[role]} yetkileri güncellendi`);
  };

  const updateRoleCapability = (
    role: UserRole,
    capability: keyof Omit<RolePermissions, 'role' | 'permissions'>,
    value: boolean
  ) => {
    setRolePermissions((current) => {
      const updated = (current || DEFAULT_ROLE_PERMISSIONS).map((rp) => {
        if (rp.role === role) {
          return { ...rp, [capability]: value };
        }
        return rp;
      });
      return updated;
    });
    
    toast.success(`${ROLE_LABELS[role]} yetkisi güncellendi`);
  };

  const hasPermission = (role: UserRole, module: ModulePermission): boolean => {
    const rolePerms = (rolePermissions || DEFAULT_ROLE_PERMISSIONS).find((rp) => rp.role === role);
    return rolePerms?.permissions.includes(module) || false;
  };

  const getCapability = (
    role: UserRole,
    capability: keyof Omit<RolePermissions, 'role' | 'permissions'>
  ): boolean => {
    const rolePerms = (rolePermissions || DEFAULT_ROLE_PERMISSIONS).find((rp) => rp.role === role);
    return rolePerms?.[capability] || false;
  };

  const resetToDefaults = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    toast.success('Yetkiler varsayılan ayarlara döndürüldü');
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">Rol Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            Kullanıcı rollerine modül erişim yetkilerini yönetin
          </p>
        </div>
        <Button variant="outline" onClick={resetToDefaults}>
          Varsayılana Dön
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['owner', 'manager', 'waiter', 'cashier', 'chef', 'staff'] as UserRole[]).map((role) => (
          <Card key={role} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" weight="fill" />
                    {ROLE_LABELS[role]}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {role === 'owner' && 'Tüm yetkilere sahip sistem sahibi'}
                    {role === 'manager' && 'Şube ve personel yönetimi yapabilir'}
                    {role === 'waiter' && 'Sadece POS ekranına erişim'}
                    {role === 'cashier' && 'POS ve raporlara erişim'}
                    {role === 'chef' && 'Menü ve reçete yönetimi'}
                    {role === 'staff' && 'Sınırlı erişim'}
                  </CardDescription>
                </div>
                <Badge variant={role === 'owner' ? 'default' : 'secondary'}>
                  {(rolePermissions || DEFAULT_ROLE_PERMISSIONS)
                    .find((rp) => rp.role === role)
                    ?.permissions.length || 0}{' '}
                  modül
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Modül Erişim Yetkileri</Label>
                <div className="space-y-2">
                  {(['pos', 'personnel', 'branch', 'menu', 'finance', 'settings', 'reports'] as ModulePermission[]).map(
                    (module) => (
                      <div key={module} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${role}-${module}`}
                            checked={hasPermission(role, module)}
                            onCheckedChange={(checked) =>
                              updateRolePermission(role, module, checked === true)
                            }
                            disabled={role === 'owner'}
                          />
                          <Label
                            htmlFor={`${role}-${module}`}
                            className="text-sm cursor-pointer"
                          >
                            {MODULE_LABELS[module]}
                          </Label>
                        </div>
                        {hasPermission(role, module) ? (
                          <Check className="h-4 w-4 text-accent" weight="bold" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Özel Yetkiler</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm cursor-pointer">Finansal Verileri Görüntüleme</Label>
                      <p className="text-xs text-muted-foreground">
                        Ciro, kar-zarar gibi finansal bilgileri görebilir
                      </p>
                    </div>
                    <Switch
                      checked={getCapability(role, 'canViewFinancials')}
                      onCheckedChange={(checked) =>
                        updateRoleCapability(role, 'canViewFinancials', checked)
                      }
                      disabled={role === 'owner'}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm cursor-pointer">Fiyat Düzenleme</Label>
                      <p className="text-xs text-muted-foreground">
                        Ürün fiyatlarını değiştirebilir
                      </p>
                    </div>
                    <Switch
                      checked={getCapability(role, 'canEditPrices')}
                      onCheckedChange={(checked) =>
                        updateRoleCapability(role, 'canEditPrices', checked)
                      }
                      disabled={role === 'owner'}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm cursor-pointer">Kullanıcı Yönetimi</Label>
                      <p className="text-xs text-muted-foreground">
                        Personel ekleyip, düzenleyebilir
                      </p>
                    </div>
                    <Switch
                      checked={getCapability(role, 'canManageUsers')}
                      onCheckedChange={(checked) =>
                        updateRoleCapability(role, 'canManageUsers', checked)
                      }
                      disabled={role === 'owner'}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm cursor-pointer">Ödeme Onaylama</Label>
                      <p className="text-xs text-muted-foreground">
                        Maaş ve faturaları onaylayabilir
                      </p>
                    </div>
                    <Switch
                      checked={getCapability(role, 'canApprovePayments')}
                      onCheckedChange={(checked) =>
                        updateRoleCapability(role, 'canApprovePayments', checked)
                      }
                      disabled={role === 'owner'}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Yetkilendirme Sistemi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Sahip</strong> rolü tüm yetkilere sahiptir ve değiştirilemez
          </p>
          <p>
            • <strong>Garson</strong> rolü varsayılan olarak sadece POS ekranına erişebilir
          </p>
          <p>
            • Her rol için modül erişimi ve özel yetkiler ayrı ayrı yapılandırılabilir
          </p>
          <p>
            • Değişiklikler anında uygulanır ve tüm kullanıcıları etkiler
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

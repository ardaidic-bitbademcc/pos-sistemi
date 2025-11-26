import { useState, useMemo } from 'react';
import { useKV } from '../../hooks/use-kv-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CurrencyCircleDollar,
  TrendUp,
  TrendDown,
  Wallet,
  Plus,
  Minus,
  ClockClockwise,
  ListBullets,
  CalendarBlank,
  LockKey,
  Warning,
  Receipt,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatCurrency, getStartOfDay } from '@/lib/helpers';
import type { CashTransaction, CashRegisterStatus, Branch, Sale, UserRole, RolePermissions, AuthSession } from '@/lib/types';
import { useBranchFilter } from '@/hooks/use-branch-filter';
import { Logger } from '@/lib/logger';

interface CashModuleProps {
  onBack: () => void;
  currentUserRole?: UserRole;
  authSession?: AuthSession | null;
}

const QUICK_ACTIONS = [
  { id: 'change', label: 'Bozuk Girişi', icon: CurrencyCircleDollar, type: 'in' as const },
  { id: 'closing', label: 'Gün Sonu Kasa Çıkışı', icon: TrendDown, type: 'out' as const },
  { id: 'opening', label: 'Gün Başı Kasa Açılışı', icon: TrendUp, type: 'in' as const },
  { id: 'expense', label: 'Genel Gider', icon: Minus, type: 'out' as const },
];

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
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canViewAllTasks: true,
    canViewTaskStatus: true,
    canRateTask: true,
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
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canViewAllTasks: true,
    canViewTaskStatus: true,
    canRateTask: true,
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
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canViewAllTasks: false,
    canViewTaskStatus: false,
    canRateTask: false,
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
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canViewAllTasks: false,
    canViewTaskStatus: false,
    canRateTask: false,
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
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canViewAllTasks: false,
    canViewTaskStatus: true,
    canRateTask: false,
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
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canViewAllTasks: false,
    canViewTaskStatus: false,
    canRateTask: false,
  },
];

export default function CashModule({ onBack, currentUserRole = 'owner', authSession }: CashModuleProps) {
  const [branches] = useKV<Branch[]>('branches', []);
  const [sales] = useKV<Sale[]>('sales', []);
  const [cashRegisters, setCashRegisters] = useKV<CashRegisterStatus[]>('cashRegisters', []);
  const [rolePermissions] = useKV<RolePermissions[]>('rolePermissions', DEFAULT_ROLE_PERMISSIONS);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [quickActionPreset, setQuickActionPreset] = useState<string>('');
  const [unpaidOrdersDialogOpen, setUnpaidOrdersDialogOpen] = useState(false);
  const [unpaidOrdersList, setUnpaidOrdersList] = useState<Sale[]>([]);

  const activeBranch = (branches || []).find((b) => b.id === selectedBranch) || (branches || [])[0];
  
  const currentPermissions = useMemo(() => {
    return (rolePermissions || DEFAULT_ROLE_PERMISSIONS).find(rp => rp.role === currentUserRole) || DEFAULT_ROLE_PERMISSIONS[0];
  }, [rolePermissions, currentUserRole]);

  const canViewCash = currentUserRole === 'owner' || currentPermissions.canViewCashRegister;
  const canAddCash = currentUserRole === 'owner' || currentPermissions.canAddCash;
  const canWithdrawCash = currentUserRole === 'owner' || currentPermissions.canWithdrawCash;
  const canCloseCash = currentUserRole === 'owner' || currentPermissions.canCloseCashRegister;
  
  const currentCashRegister = useMemo(() => {
    if (!activeBranch) return null;
    return (cashRegisters || []).find((cr) => cr.branchId === activeBranch.id && cr.isOpen) || null;
  }, [cashRegisters, activeBranch]);

  const todayTransactions = useMemo(() => {
    if (!currentCashRegister) return [];
    const today = getStartOfDay();
    return currentCashRegister.transactions.filter(
      (t) => new Date(t.date) >= today
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentCashRegister]);

  const stats = useMemo(() => {
    if (!currentCashRegister) {
      return {
        openingBalance: 0,
        currentBalance: 0,
        expectedBalance: 0,
        totalIn: 0,
        totalOut: 0,
        totalSales: 0,
        difference: 0,
      };
    }

    const today = getStartOfDay();
    const todayCashSales = (sales || [])
      .filter(
        (s) =>
          s.branchId === activeBranch.id &&
          s.paymentMethod === 'cash' &&
          s.paymentStatus === 'completed' &&
          new Date(s.saleDate) >= today
      )
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    const totalIn = currentCashRegister.transactions
      .filter((t) => t.type === 'in' && new Date(t.date) >= today)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOut = currentCashRegister.transactions
      .filter((t) => t.type === 'out' && new Date(t.date) >= today)
      .reduce((sum, t) => sum + t.amount, 0);

    const expectedBalance = currentCashRegister.openingBalance + todayCashSales + totalIn - totalOut;
    const difference = currentCashRegister.currentBalance - expectedBalance;

    return {
      openingBalance: currentCashRegister.openingBalance,
      currentBalance: currentCashRegister.currentBalance,
      expectedBalance,
      totalIn,
      totalOut,
      totalSales: todayCashSales,
      difference,
    };
  }, [currentCashRegister, sales, activeBranch]);

  const openCashRegister = () => {
    if (!activeBranch) {
      toast.error('Lütfen bir şube seçin');
      return;
    }

    const existingRegister = (cashRegisters || []).find(
      (cr) => cr.branchId === activeBranch.id && cr.isOpen
    );

    if (existingRegister) {
      toast.error('Bu şube için zaten açık bir kasa bulunmakta');
      return;
    }

    const newRegister: CashRegisterStatus = {
      id: `cash-register-${Date.now()}`,
      branchId: activeBranch.id,
      openingBalance: 0,
      currentBalance: 0,
      expectedBalance: 0,
      totalIn: 0,
      totalOut: 0,
      totalSales: 0,
      transactions: [],
      openedAt: new Date().toISOString(),
      isOpen: true,
    };

    Logger.info('cash-register', 'Cash register opened', {
      registerId: newRegister.id,
      branchId: activeBranch.id,
      branchName: activeBranch.name,
      openingBalance: 0,
      openedAt: newRegister.openedAt,
    }, {
      userId: authSession?.userId,
      userName: authSession?.userName,
      branchId: authSession?.branchId,
    });

    setCashRegisters((prev) => [...(prev || []), newRegister]);
    toast.success('Kasa açıldı');
  };

  const closeCashRegister = () => {
    if (!canCloseCash) {
      toast.error('Kasayı kapatma yetkiniz bulunmamakta');
      Logger.warn('cash-register', 'Unauthorized cash register close attempt', {
        userId: authSession?.userId,
        userRole: currentUserRole,
      });
      return;
    }

    if (!currentCashRegister) {
      toast.error('Açık kasa bulunamadı');
      return;
    }

    const unpaidOrders = (sales || []).filter(
      (sale) => 
        sale.branchId === activeBranch.id && 
        sale.paymentStatus === 'pending'
    );

    if (unpaidOrders.length > 0) {
      setUnpaidOrdersList(unpaidOrders);
      setUnpaidOrdersDialogOpen(true);
      Logger.warn('cash-register', 'Cash register close attempt with unpaid orders', {
        registerId: currentCashRegister.id,
        branchId: currentCashRegister.branchId,
        unpaidOrderCount: unpaidOrders.length,
        unpaidOrderIds: unpaidOrders.map(o => o.id),
        unpaidOrderDetails: unpaidOrders.map(o => ({
          id: o.id,
          saleNumber: o.saleNumber,
          totalAmount: o.totalAmount,
          saleDate: o.saleDate,
          itemCount: o.items.length,
        })),
      }, {
        userId: authSession?.userId,
        userName: authSession?.userName,
        branchId: authSession?.branchId,
      });
      return;
    }

    Logger.info('cash-register', 'Cash register closed', {
      registerId: currentCashRegister.id,
      branchId: currentCashRegister.branchId,
      openingBalance: currentCashRegister.openingBalance,
      closingBalance: currentCashRegister.currentBalance,
      expectedBalance: stats.expectedBalance,
      difference: stats.difference,
      totalIn: stats.totalIn,
      totalOut: stats.totalOut,
      totalSales: stats.totalSales,
      transactionCount: currentCashRegister.transactions.length,
      openedAt: currentCashRegister.openedAt,
      closedAt: new Date().toISOString(),
    }, {
      userId: authSession?.userId,
      userName: authSession?.userName,
      branchId: authSession?.branchId,
    });

    setCashRegisters((prev) =>
      (prev || []).map((cr) =>
        cr.id === currentCashRegister.id
          ? { ...cr, isOpen: false, closedAt: new Date().toISOString() }
          : cr
      )
    );

    toast.success('Kasa kapatıldı');
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.type === 'out' && !canWithdrawCash) {
      toast.error('Para çıkışı yapma yetkiniz bulunmamakta');
      return;
    }
    if (action.type === 'in' && !canAddCash) {
      toast.error('Para ekleme yetkiniz bulunmamakta');
      return;
    }

    setTransactionType(action.type);
    setQuickActionPreset(action.id);
    setTransactionDescription(action.label);
    setTransactionAmount('');
    setTransactionDialogOpen(true);
  };

  const handleAddTransaction = () => {
    if (!currentCashRegister) {
      toast.error('Önce kasayı açmanız gerekiyor');
      return;
    }

    if (transactionType === 'out' && !canWithdrawCash) {
      toast.error('Para çıkışı yapma yetkiniz bulunmamakta');
      Logger.warn('cash-register', 'Unauthorized cash withdrawal attempt', {
        userId: authSession?.userId,
        userRole: currentUserRole,
        amount: transactionAmount,
      });
      return;
    }

    if (transactionType === 'in' && !canAddCash) {
      toast.error('Para ekleme yetkiniz bulunmamakta');
      Logger.warn('cash-register', 'Unauthorized cash addition attempt', {
        userId: authSession?.userId,
        userRole: currentUserRole,
        amount: transactionAmount,
      });
      return;
    }

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      Logger.logPaymentError('Invalid cash transaction amount', {
        amount: transactionAmount,
        type: transactionType,
        userId: authSession?.userId,
      });
      return;
    }

    if (!transactionDescription.trim()) {
      toast.error('Açıklama zorunludur');
      return;
    }

    const transaction: CashTransaction = {
      id: `transaction-${Date.now()}`,
      branchId: activeBranch.id,
      adminId: authSession?.adminId,
      type: transactionType,
      amount,
      description: transactionDescription.trim(),
      date: new Date().toISOString(),
      createdBy: authSession?.userId || 'current-user',
      createdAt: new Date().toISOString(),
    };

    const balanceBefore = currentCashRegister.currentBalance;
    const balanceAfter = transactionType === 'in' ? balanceBefore + amount : balanceBefore - amount;

    Logger.logTransaction('Cash transaction recorded', {
      transactionId: transaction.id,
      transactionType: transactionType === 'in' ? 'transfer' : 'adjustment',
      amount,
      balanceBefore,
      balanceAfter,
      notes: transactionDescription.trim(),
    }, {
      userId: authSession?.userId,
      userName: authSession?.userName,
      branchId: authSession?.branchId,
    });

    Logger.info('cash-register', `Cash ${transactionType === 'in' ? 'added to' : 'withdrawn from'} register`, {
      registerId: currentCashRegister.id,
      transactionId: transaction.id,
      type: transactionType,
      amount,
      description: transactionDescription.trim(),
      balanceBefore,
      balanceAfter,
    }, {
      userId: authSession?.userId,
      userName: authSession?.userName,
      branchId: authSession?.branchId,
    });

    setCashRegisters((prev) =>
      (prev || []).map((cr) => {
        if (cr.id === currentCashRegister.id) {
          return {
            ...cr,
            currentBalance: balanceAfter,
            totalIn: transactionType === 'in' ? cr.totalIn + amount : cr.totalIn,
            totalOut: transactionType === 'out' ? cr.totalOut + amount : cr.totalOut,
            transactions: [...cr.transactions, transaction],
          };
        }
        return cr;
      })
    );

    toast.success(
      transactionType === 'in'
        ? `${formatCurrency(amount)} kasaya eklendi`
        : `${formatCurrency(amount)} kasadan çıkarıldı`
    );

    setTransactionDialogOpen(false);
    setTransactionAmount('');
    setTransactionDescription('');
    setQuickActionPreset('');
  };

  if (!activeBranch) {
    return (
      <div className="min-h-screen p-6">
        <header className="mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">Kasa Yönetimi</h1>
        </header>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Kasa yönetimi için önce bir şube oluşturmanız gerekiyor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewCash) {
    return (
      <div className="min-h-screen p-6">
        <header className="mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">Kasa Yönetimi</h1>
        </header>
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LockKey className="h-5 w-5" weight="fill" />
              Yetkisiz Erişim
            </CardTitle>
            <CardDescription>
              Bu modülü görüntüleme yetkiniz bulunmamaktadır
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kasa yönetimi ekranına erişebilmek için yöneticinizle iletişime geçin. 
              Sadece yetkili kullanıcılar kasa durumunu görüntüleyebilir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 sm:mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">Kasa Yönetimi</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 truncate">
              Nakit akışı takibi ve kasa durumu
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {(branches || []).length > 1 && (
              <Select
                value={selectedBranch || activeBranch.id}
                onValueChange={setSelectedBranch}
              >
                <SelectTrigger className="w-full sm:w-[200px] text-xs sm:text-sm h-9">
                  <SelectValue placeholder="Şube seçin" />
                </SelectTrigger>
                <SelectContent>
                  {(branches || []).map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {currentCashRegister ? (
              <Badge variant="default" className="px-3 py-1.5">
                <CurrencyCircleDollar className="h-4 w-4 mr-1.5" weight="fill" />
                Kasa Açık
              </Badge>
            ) : (
              <Badge variant="secondary" className="px-3 py-1.5">
                <CurrencyCircleDollar className="h-4 w-4 mr-1.5" weight="fill" />
                Kasa Kapalı
              </Badge>
            )}
          </div>
        </div>
      </header>

      {!currentCashRegister ? (
        <Card>
          <CardHeader>
            <CardTitle>Kasayı Açın</CardTitle>
            <CardDescription>
              Kasa işlemlerine başlamak için önce kasayı açmanız gerekiyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openCashRegister} size="lg">
              <CurrencyCircleDollar className="h-5 w-5 mr-2" weight="fill" />
              Kasayı Aç
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Açılış Bakiyesi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight font-tabular-nums">
                  {formatCurrency(stats.openingBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Kasa açılış tutarı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mevcut Bakiye
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight font-tabular-nums text-primary">
                  {formatCurrency(stats.currentBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Kasada bulunan tutar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Beklenen Bakiye
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tracking-tight font-tabular-nums">
                  {formatCurrency(stats.expectedBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Satışlar + Girişler - Çıkışlar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fark
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-semibold tracking-tight font-tabular-nums ${
                    stats.difference === 0
                      ? ''
                      : stats.difference > 0
                      ? 'text-accent'
                      : 'text-destructive'
                  }`}
                >
                  {formatCurrency(Math.abs(stats.difference))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.difference === 0
                    ? 'Bakiye uyumlu'
                    : stats.difference > 0
                    ? 'Fazla'
                    : 'Eksik'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Nakit Satışlar</CardTitle>
                  <CurrencyCircleDollar className="h-5 w-5 text-primary" weight="fill" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold font-tabular-nums">
                  {formatCurrency(stats.totalSales)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Toplam Giriş</CardTitle>
                  <TrendUp className="h-5 w-5 text-accent" weight="bold" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold font-tabular-nums text-accent">
                  {formatCurrency(stats.totalIn)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Toplam Çıkış</CardTitle>
                  <TrendDown className="h-5 w-5 text-destructive" weight="bold" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold font-tabular-nums text-destructive">
                  {formatCurrency(stats.totalOut)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ListBullets className="h-5 w-5" weight="bold" />
                      İşlem Geçmişi
                    </CardTitle>
                    <CardDescription>Bugünün kasa hareketleri</CardDescription>
                  </div>
                  <Badge variant="outline">{todayTransactions.length} işlem</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {todayTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ClockClockwise className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Henüz işlem bulunmuyor</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayTransactions.map((transaction, index) => (
                        <div key={transaction.id}>
                          {index > 0 && <Separator className="my-3" />}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div
                                className={`p-2 rounded-lg ${
                                  transaction.type === 'in'
                                    ? 'bg-accent/10'
                                    : 'bg-destructive/10'
                                }`}
                              >
                                {transaction.type === 'in' ? (
                                  <TrendUp
                                    className="h-5 w-5 text-accent"
                                    weight="bold"
                                  />
                                ) : (
                                  <TrendDown
                                    className="h-5 w-5 text-destructive"
                                    weight="bold"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  {transaction.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <CalendarBlank className="h-3.5 w-3.5 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(transaction.date).toLocaleString('tr-TR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`text-lg font-semibold font-tabular-nums ${
                                transaction.type === 'in'
                                  ? 'text-accent'
                                  : 'text-destructive'
                              }`}
                            >
                              {transaction.type === 'in' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
                <CardDescription>Sık kullanılan işlemler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3"
                    disabled={!canAddCash}
                    onClick={() => {
                      setTransactionType('in');
                      setQuickActionPreset('');
                      setTransactionDescription('');
                      setTransactionAmount('');
                      setTransactionDialogOpen(true);
                    }}
                  >
                    <Plus className="h-5 w-5 mr-3 text-accent" weight="bold" />
                    <div className="text-left">
                      <div className="font-medium">Para Ekle</div>
                      <div className="text-xs text-muted-foreground">
                        Kasaya para girişi
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto py-3"
                    disabled={!canWithdrawCash}
                    onClick={() => {
                      setTransactionType('out');
                      setQuickActionPreset('');
                      setTransactionDescription('');
                      setTransactionAmount('');
                      setTransactionDialogOpen(true);
                    }}
                  >
                    <Minus className="h-5 w-5 mr-3 text-destructive" weight="bold" />
                    <div className="text-left">
                      <div className="font-medium">Para Çıkar</div>
                      <div className="text-xs text-muted-foreground">
                        Kasadan para çıkışı
                      </div>
                    </div>
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <p className="text-sm font-medium mb-3">Kısa Yollar</p>
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    const isDisabled = action.type === 'out' ? !canWithdrawCash : !canAddCash;
                    return (
                      <Button
                        key={action.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        disabled={isDisabled}
                        onClick={() => handleQuickAction(action)}
                      >
                        <Icon className="h-4 w-4 mr-2" weight="bold" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={!canCloseCash}
                  onClick={closeCashRegister}
                >
                  <Wallet className="h-4 w-4 mr-2" weight="fill" />
                  Kasayı Kapat
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'in' ? 'Para Ekle' : 'Para Çıkar'}
            </DialogTitle>
            <DialogDescription>
              {transactionType === 'in'
                ? 'Kasaya para girişi yapın'
                : 'Kasadan para çıkışı yapın'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar (₺) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama *</Label>
              <Textarea
                id="description"
                placeholder="İşlem açıklamasını girin..."
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Açıklama zorunludur ve detaylı olmalıdır
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransactionDialogOpen(false);
                setTransactionAmount('');
                setTransactionDescription('');
                setQuickActionPreset('');
              }}
            >
              İptal
            </Button>
            <Button onClick={handleAddTransaction}>
              {transactionType === 'in' ? 'Para Ekle' : 'Para Çıkar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={unpaidOrdersDialogOpen} onOpenChange={setUnpaidOrdersDialogOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Warning className="h-6 w-6" weight="fill" />
              Kasa Kapatılamıyor!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Ödenmemiş siparişler bulunduğu için kasa kapatılamaz. Lütfen önce tüm siparişlerin ödemesini tamamlayın.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-destructive" weight="fill" />
                    <span className="font-semibold text-destructive">
                      {unpaidOrdersList.length} Ödenmemiş Sipariş
                    </span>
                  </div>
                  <span className="text-lg font-bold text-destructive font-tabular-nums">
                    {formatCurrency(unpaidOrdersList.reduce((sum, order) => sum + order.totalAmount, 0))}
                  </span>
                </div>
              </div>

              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-3">
                  {unpaidOrdersList.map((order, index) => (
                    <Card key={order.id} className="border-destructive/30">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive" className="font-mono">
                                  #{order.saleNumber}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {order.items.length} ürün
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarBlank className="h-3.5 w-3.5" />
                                {new Date(order.saleDate).toLocaleString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-destructive font-tabular-nums">
                                {formatCurrency(order.totalAmount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Toplam Tutar
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase">
                              Sipariş Detayları
                            </div>
                            <div className="space-y-1.5">
                              {order.items.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      {item.quantity}x
                                    </Badge>
                                    <span>{item.productName}</span>
                                  </div>
                                  <span className="font-medium font-tabular-nums">
                                    {formatCurrency(item.subtotal)}
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="text-xs text-muted-foreground italic">
                                  +{order.items.length - 3} ürün daha...
                                </div>
                              )}
                            </div>
                          </div>

                          {order.notes && (
                            <>
                              <Separator />
                              <div className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground uppercase">
                                  Not
                                </div>
                                <p className="text-sm text-foreground/80">
                                  {order.notes}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <AlertDialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setUnpaidOrdersDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Tamam, Anladım
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

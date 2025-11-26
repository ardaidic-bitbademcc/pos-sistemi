import { useState, useMemo, useEffect } from 'react';
import { useKV } from '../hooks/use-kv-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  CurrencyCircleDollar,
  TrendUp,
  TrendDown,
  Wallet,
  CreditCard,
  DeviceMobile,
  Bank,
  Receipt,
  Clock,
  Warning,
  CheckCircle,
  Play,
  Pause,
  Eye,
  EyeSlash,
  ChartLine,
  ListBullets,
} from '@phosphor-icons/react';
import { formatCurrency, getStartOfDay } from '@/lib/helpers';
import type { 
  CashTransaction, 
  CashRegisterStatus, 
  Sale, 
  Branch,
  PaymentMethod,
  AuthSession 
} from '@/lib/types';
import { useBranchFilter } from '@/hooks/use-branch-filter';

interface CashRegisterMonitorProps {
  onBack: () => void;
  authSession?: AuthSession | null;
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'sale' | 'transaction' | 'register';
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  status: 'success' | 'warning' | 'info';
  metadata?: Record<string, unknown>;
}

export default function CashRegisterMonitor({ onBack, authSession }: CashRegisterMonitorProps) {
  const [cashRegisters] = useKV<CashRegisterStatus[]>('cashRegisters', []);
  const [cashTransactions] = useKV<CashTransaction[]>('cashTransactions', []);
  const [sales] = useKV<Sale[]>('sales', []);
  const [branches] = useKV<Branch[]>('branches', []);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'last-hour' | 'last-15min' | 'all'>('today');

  const { filteredItems: filteredRegisters } = useBranchFilter(cashRegisters, authSession);
  const { filteredItems: filteredSales } = useBranchFilter(sales, authSession);
  const { filteredItems: filteredTransactions } = useBranchFilter(cashTransactions, authSession);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const now = new Date();
  const todayStart = getStartOfDay(now);
  const last15min = new Date(now.getTime() - 15 * 60 * 1000);
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

  const getTimeRangeStart = () => {
    switch (selectedTimeRange) {
      case 'last-15min':
        return last15min.toISOString();
      case 'last-hour':
        return lastHour.toISOString();
      case 'today':
        return todayStart.toISOString();
      default:
        return '';
    }
  };

  const timeRangeStart = getTimeRangeStart();

  const recentActivity = useMemo(() => {
    const activities: ActivityEvent[] = [];

    filteredSales
      .filter(sale => !timeRangeStart || sale.saleDate >= timeRangeStart)
      .forEach(sale => {
        const branch = branches?.find(b => b.id === sale.branchId);
        activities.push({
          id: `sale-${sale.id}`,
          timestamp: sale.saleDate,
          type: 'sale',
          description: `Satış #${sale.saleNumber} - ${branch?.name || 'N/A'}`,
          amount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          status: sale.paymentStatus === 'completed' ? 'success' : 'warning',
          metadata: {
            saleNumber: sale.saleNumber,
            items: sale.items.length,
            branch: branch?.name,
          },
        });
      });

    filteredTransactions
      .filter(tx => !timeRangeStart || tx.createdAt >= timeRangeStart)
      .forEach(tx => {
        const branch = branches?.find(b => b.id === tx.branchId);
        activities.push({
          id: `tx-${tx.id}`,
          timestamp: tx.createdAt,
          type: 'transaction',
          description: `${tx.type === 'in' ? 'Para Girişi' : 'Para Çıkışı'} - ${tx.description} - ${branch?.name || 'N/A'}`,
          amount: tx.type === 'in' ? tx.amount : -tx.amount,
          status: 'info',
          metadata: {
            type: tx.type,
            createdBy: tx.createdBy,
            branch: branch?.name,
          },
        });
      });

    filteredRegisters.forEach(register => {
      if (register.openedAt && (!timeRangeStart || register.openedAt >= timeRangeStart)) {
        const branch = branches?.find(b => b.id === register.branchId);
        activities.push({
          id: `reg-open-${register.id}`,
          timestamp: register.openedAt,
          type: 'register',
          description: `Kasa Açıldı - ${branch?.name || 'N/A'}`,
          amount: register.openingBalance,
          status: 'success',
          metadata: {
            action: 'open',
            branch: branch?.name,
          },
        });
      }
      if (register.closedAt && (!timeRangeStart || register.closedAt >= timeRangeStart)) {
        const branch = branches?.find(b => b.id === register.branchId);
        activities.push({
          id: `reg-close-${register.id}`,
          timestamp: register.closedAt,
          type: 'register',
          description: `Kasa Kapatıldı - ${branch?.name || 'N/A'}`,
          amount: register.currentBalance,
          status: 'info',
          metadata: {
            action: 'close',
            branch: branch?.name,
          },
        });
      }
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filteredSales, filteredTransactions, filteredRegisters, branches, timeRangeStart, lastRefresh]);

  const stats = useMemo(() => {
    const todayStartStr = todayStart.toISOString();
    const todaysSales = filteredSales.filter(sale => sale.saleDate >= todayStartStr);
    
    const totalRevenue = todaysSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTransactions = todaysSales.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const paymentBreakdown = {
      cash: todaysSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0),
      card: todaysSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.totalAmount, 0),
      mobile: todaysSales.filter(s => s.paymentMethod === 'mobile').reduce((sum, s) => sum + s.totalAmount, 0),
      transfer: todaysSales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.totalAmount, 0),
      multinet: todaysSales.filter(s => s.paymentMethod === 'multinet').reduce((sum, s) => sum + s.totalAmount, 0),
    };

    const todayTransactions = filteredTransactions.filter(tx => tx.createdAt >= todayStartStr);
    const cashIn = todayTransactions.filter(tx => tx.type === 'in').reduce((sum, tx) => sum + tx.amount, 0);
    const cashOut = todayTransactions.filter(tx => tx.type === 'out').reduce((sum, tx) => sum + tx.amount, 0);

    const openRegisters = filteredRegisters.filter(r => r.isOpen);
    const closedRegisters = filteredRegisters.filter(r => !r.isOpen && r.closedAt && r.closedAt >= todayStartStr);

    const discrepancies = filteredRegisters.filter(r => {
      if (!r.isOpen) return false;
      const diff = Math.abs(r.currentBalance - r.expectedBalance);
      return diff > 1;
    });

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      paymentBreakdown,
      cashIn,
      cashOut,
      netCash: cashIn - cashOut,
      openRegisters: openRegisters.length,
      closedRegisters: closedRegisters.length,
      discrepancies: discrepancies.length,
    };
  }, [filteredSales, filteredTransactions, filteredRegisters, todayStart, lastRefresh]);

  const getActivityIcon = (activity: ActivityEvent) => {
    switch (activity.type) {
      case 'sale':
        switch (activity.paymentMethod) {
          case 'cash':
            return <CurrencyCircleDollar className="h-5 w-5" weight="fill" />;
          case 'card':
            return <CreditCard className="h-5 w-5" weight="fill" />;
          case 'mobile':
            return <DeviceMobile className="h-5 w-5" weight="fill" />;
          case 'transfer':
            return <Bank className="h-5 w-5" weight="fill" />;
          default:
            return <Receipt className="h-5 w-5" weight="fill" />;
        }
      case 'transaction':
        return activity.amount > 0 ? 
          <TrendUp className="h-5 w-5" weight="fill" /> : 
          <TrendDown className="h-5 w-5" weight="fill" />;
      case 'register':
        return <Wallet className="h-5 w-5" weight="fill" />;
      default:
        return <Receipt className="h-5 w-5" weight="fill" />;
    }
  };

  const getStatusColor = (status: ActivityEvent['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-foreground';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Kasa İzleme Merkezi</h1>
              <p className="text-sm text-muted-foreground">Gerçek zamanlı kasa operasyonları</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Play className="h-4 w-4 mr-2" weight="fill" /> : <Pause className="h-4 w-4 mr-2" weight="fill" />}
              {autoRefresh ? 'Canlı' : 'Durduruldu'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <Eye className="h-4 w-4" weight="fill" /> : <EyeSlash className="h-4 w-4" weight="fill" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bugünkü Ciro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">{stats.totalTransactions} işlem</p>
                </div>
                <ChartLine className="h-8 w-8 text-primary" weight="fill" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ortalama Sepet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.averageTransaction)}</p>
                  <p className="text-xs text-muted-foreground">işlem başına</p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600" weight="fill" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Nakit Akışı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${stats.netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netCash)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Giriş: {formatCurrency(stats.cashIn)} / Çıkış: {formatCurrency(stats.cashOut)}
                  </p>
                </div>
                {stats.netCash >= 0 ? 
                  <TrendUp className="h-8 w-8 text-green-600" weight="fill" /> :
                  <TrendDown className="h-8 w-8 text-red-600" weight="fill" />
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kasa Durumu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.openRegisters}</p>
                  <p className="text-xs text-muted-foreground">Açık / {stats.closedRegisters} Kapalı</p>
                </div>
                <div className="flex flex-col items-center">
                  {stats.discrepancies > 0 ? (
                    <>
                      <Warning className="h-8 w-8 text-yellow-600" weight="fill" />
                      <Badge variant="outline" className="text-xs mt-1">{stats.discrepancies} Uyarı</Badge>
                    </>
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-600" weight="fill" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" weight="fill" />
                  Ödeme Yöntemi Dağılımı
                </CardTitle>
                <CardDescription>Bugünkü ödemelerin detaylı dökümü</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CurrencyCircleDollar className="h-5 w-5 text-green-600" weight="fill" />
                    <span className="font-medium">Nakit</span>
                  </div>
                  <span className="font-bold">{formatCurrency(stats.paymentBreakdown.cash)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600" weight="fill" />
                    <span className="font-medium">Kredi Kartı</span>
                  </div>
                  <span className="font-bold">{formatCurrency(stats.paymentBreakdown.card)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DeviceMobile className="h-5 w-5 text-purple-600" weight="fill" />
                    <span className="font-medium">Mobil Ödeme</span>
                  </div>
                  <span className="font-bold">{formatCurrency(stats.paymentBreakdown.mobile)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bank className="h-5 w-5 text-indigo-600" weight="fill" />
                    <span className="font-medium">Havale</span>
                  </div>
                  <span className="font-bold">{formatCurrency(stats.paymentBreakdown.transfer)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-orange-600" weight="fill" />
                    <span className="font-medium">Multinet</span>
                  </div>
                  <span className="font-bold">{formatCurrency(stats.paymentBreakdown.multinet)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListBullets className="h-5 w-5" weight="fill" />
                  Açık Kasalar
                </CardTitle>
                <CardDescription>Şu anda aktif kasa durumları</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px] pr-4">
                  {filteredRegisters.filter(r => r.isOpen).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" weight="thin" />
                      <p>Açık kasa bulunmuyor</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredRegisters.filter(r => r.isOpen).map(register => {
                        const branch = branches?.find(b => b.id === register.branchId);
                        const diff = register.currentBalance - register.expectedBalance;
                        const hasDiff = Math.abs(diff) > 1;
                        
                        return (
                          <div key={register.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{branch?.name || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Açılış: {new Date(register.openedAt).toLocaleTimeString('tr-TR')}
                                </p>
                              </div>
                              {hasDiff && (
                                <Badge variant="outline" className="text-yellow-600">
                                  <Warning className="h-3 w-3 mr-1" weight="fill" />
                                  Fark
                                </Badge>
                              )}
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Mevcut</p>
                                <p className="font-bold">{formatCurrency(register.currentBalance)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Beklenen</p>
                                <p className="font-bold">{formatCurrency(register.expectedBalance)}</p>
                              </div>
                            </div>
                            {hasDiff && (
                              <div className="text-xs">
                                <span className={`font-medium ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff > 0 ? '+' : ''}{formatCurrency(diff)} fark
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" weight="fill" />
                  Canlı Aktivite Akışı
                </CardTitle>
                <CardDescription>
                  Son güncelleme: {lastRefresh.toLocaleTimeString('tr-TR')}
                  {autoRefresh && ` • ${refreshInterval}s otomatik yenileme`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedTimeRange} onValueChange={(val) => setSelectedTimeRange(val as typeof selectedTimeRange)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-15min">Son 15 Dakika</SelectItem>
                    <SelectItem value="last-hour">Son 1 Saat</SelectItem>
                    <SelectItem value="today">Bugün</SelectItem>
                    <SelectItem value="all">Tümü</SelectItem>
                  </SelectContent>
                </Select>
                {autoRefresh && (
                  <Select value={refreshInterval.toString()} onValueChange={(val) => setRefreshInterval(parseInt(val))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 saniye</SelectItem>
                      <SelectItem value="5">5 saniye</SelectItem>
                      <SelectItem value="10">10 saniye</SelectItem>
                      <SelectItem value="30">30 saniye</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" weight="thin" />
                  <p className="text-lg font-medium mb-1">Henüz aktivite yok</p>
                  <p className="text-sm">Seçili zaman aralığında işlem bulunamadı</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-lg border transition-all ${
                        index === 0 && autoRefresh ? 'bg-primary/5 border-primary/20' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getStatusColor(activity.status)} bg-muted`}>
                          {getActivityIcon(activity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm leading-tight">{activity.description}</p>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant={activity.amount >= 0 ? 'default' : 'secondary'}
                                className="font-mono"
                              >
                                {activity.amount >= 0 ? '+' : ''}{formatCurrency(activity.amount)}
                              </Badge>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTime(activity.timestamp)}
                              </span>
                            </div>
                          </div>
                          {activity.metadata && showDetails && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(activity.metadata).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useKV } from '../../hooks/use-kv-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChartLine, TrendUp, TrendDown, Users, Package, Calendar, Buildings, CreditCard, Money, DeviceMobile, Bank, Ticket, Clock } from '@phosphor-icons/react';
import type { Sale, Employee, Product, Branch, BranchComparison, WaiterSalesReport, ProductSalesReport, AuthSession, Table, TableSection } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/helpers';
import { useBranchFilter } from '@/hooks/use-branch-filter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Area, AreaChart } from 'recharts';

interface ReportsModuleProps {
  onBack: () => void;
  authSession?: AuthSession | null;
}

export default function ReportsModule({ onBack, authSession }: ReportsModuleProps) {
  const [sales] = useKV<Sale[]>('sales', []);
  const [employees] = useKV<Employee[]>('employees', []);
  const [products] = useKV<Product[]>('products', []);
  const [branches] = useKV<Branch[]>('branches', []);
  const [tables] = useKV<Table[]>('tables', []);
  const [tableSections] = useKV<TableSection[]>('tableSections', []);
  
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  const getDateRange = (period: 'today' | 'week' | 'month') => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return { start: startOfToday, end: now };
      case 'week':
        const weekAgo = new Date(startOfToday);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: now };
      case 'month':
        const monthAgo = new Date(startOfToday);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return { start: monthAgo, end: now };
    }
  };

  const branchComparisons = useMemo((): BranchComparison[] => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    return (branches || []).map(branch => {
      const currentWeekSales = (sales || [])
        .filter(s => s.branchId === branch.id && new Date(s.saleDate) >= startOfWeek && new Date(s.saleDate) <= now)
        .reduce((sum, s) => sum + s.totalAmount, 0);

      const lastWeekSales = (sales || [])
        .filter(s => s.branchId === branch.id && new Date(s.saleDate) >= startOfLastWeek && new Date(s.saleDate) < startOfWeek)
        .reduce((sum, s) => sum + s.totalAmount, 0);

      const amountChange = currentWeekSales - lastWeekSales;
      const percentageChange = lastWeekSales > 0 ? (amountChange / lastWeekSales) * 100 : 0;

      return {
        branchId: branch.id,
        branchName: branch.name,
        currentWeekSales,
        lastWeekSales,
        percentageChange,
        amountChange,
      };
    });
  }, [sales, branches]);

  const waiterSalesReports = useMemo((): WaiterSalesReport[] => {
    const dateRange = getDateRange(selectedPeriod);
    const filteredSales = (sales || []).filter(s => {
      const saleDate = new Date(s.saleDate);
      const matchesBranch = selectedBranch === 'all' || s.branchId === selectedBranch;
      const matchesDate = saleDate >= dateRange.start && saleDate <= dateRange.end;
      return matchesBranch && matchesDate;
    });

    const waiterMap = new Map<string, { totalSales: number; transactionCount: number; items: Map<string, number> }>();

    filteredSales.forEach(sale => {
      const waiter = (employees || []).find(e => e.id === sale.cashierId);
      if (waiter && waiter.role === 'waiter') {
        const existing = waiterMap.get(waiter.id) || { totalSales: 0, transactionCount: 0, items: new Map() };
        existing.totalSales += sale.totalAmount;
        existing.transactionCount += 1;
        
        sale.items.forEach(item => {
          existing.items.set(item.productName, (existing.items.get(item.productName) || 0) + item.quantity);
        });
        
        waiterMap.set(waiter.id, existing);
      }
    });

    return Array.from(waiterMap.entries()).map(([waiterId, data]) => {
      const waiter = (employees || []).find(e => e.id === waiterId);
      const topSellingItem = Array.from(data.items.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      return {
        waiterId,
        waiterName: waiter?.fullName || 'Unknown',
        totalSales: data.totalSales,
        transactionCount: data.transactionCount,
        averageTransaction: data.transactionCount > 0 ? data.totalSales / data.transactionCount : 0,
        topSellingItem,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [sales, employees, selectedBranch, selectedPeriod]);

  const productSalesReports = useMemo((): ProductSalesReport[] => {
    const dateRange = getDateRange(selectedPeriod);
    const filteredSales = (sales || []).filter(s => {
      const saleDate = new Date(s.saleDate);
      const matchesBranch = selectedBranch === 'all' || s.branchId === selectedBranch;
      const matchesDate = saleDate >= dateRange.start && saleDate <= dateRange.end;
      return matchesBranch && matchesDate;
    });

    const productMap = new Map<string, { totalSold: number; totalRevenue: number; prices: number[] }>();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productMap.get(item.productId) || { totalSold: 0, totalRevenue: 0, prices: [] };
        existing.totalSold += item.quantity;
        existing.totalRevenue += item.subtotal;
        existing.prices.push(item.unitPrice);
        productMap.set(item.productId, existing);
      });
    });

    return Array.from(productMap.entries()).map(([productId, data]) => {
      const product = (products || []).find(p => p.id === productId);
      const averagePrice = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length;

      return {
        productId,
        productName: product?.name || 'Unknown',
        totalSold: data.totalSold,
        totalRevenue: data.totalRevenue,
        averagePrice,
        category: product?.category || 'Diğer',
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [sales, products, selectedBranch, selectedPeriod]);

  const overallStats = useMemo(() => {
    const dateRange = getDateRange(selectedPeriod);
    const filteredSales = (sales || []).filter(s => {
      const saleDate = new Date(s.saleDate);
      const matchesBranch = selectedBranch === 'all' || s.branchId === selectedBranch;
      const matchesDate = saleDate >= dateRange.start && saleDate <= dateRange.end;
      return matchesBranch && matchesDate;
    });

    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalTransactions = filteredSales.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const totalItems = filteredSales.reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);

    const paymentMethodBreakdown = {
      cash: 0,
      card: 0,
      mobile: 0,
      transfer: 0,
      multinet: 0,
    };

    filteredSales.forEach(sale => {
      if (sale.notes?.includes('Parçalı ödeme:')) {
        const matches = sale.notes.match(/(cash|card|mobile|transfer|multinet)=([\d.]+)/g);
        if (matches) {
          matches.forEach(match => {
            const [method, amount] = match.split('=');
            if (method in paymentMethodBreakdown) {
              paymentMethodBreakdown[method as keyof typeof paymentMethodBreakdown] += parseFloat(amount.replace(/[^0-9.]/g, ''));
            }
          });
        }
      } else {
        const method = sale.paymentMethod;
        if (method in paymentMethodBreakdown) {
          paymentMethodBreakdown[method] += sale.totalAmount;
        }
      }
    });

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      totalItems,
      paymentMethodBreakdown,
    };
  }, [sales, selectedBranch, selectedPeriod]);

  const hourlyPatterns = useMemo(() => {
    const dateRange = getDateRange(selectedPeriod);
    const filteredSales = (sales || []).filter(s => {
      const saleDate = new Date(s.saleDate);
      const matchesBranch = selectedBranch === 'all' || s.branchId === selectedBranch;
      const matchesDate = saleDate >= dateRange.start && saleDate <= dateRange.end;
      return matchesBranch && matchesDate;
    });

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      hourLabel: `${hour.toString().padStart(2, '0')}:00`,
      revenue: 0,
      transactions: 0,
      items: 0,
      averageTransaction: 0,
    }));

    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.saleDate);
      const hour = saleDate.getHours();
      
      hourlyData[hour].revenue += sale.totalAmount;
      hourlyData[hour].transactions += 1;
      hourlyData[hour].items += sale.items.reduce((sum, item) => sum + item.quantity, 0);
    });

    hourlyData.forEach(data => {
      if (data.transactions > 0) {
        data.averageTransaction = data.revenue / data.transactions;
      }
    });

    const peakHour = hourlyData.reduce((max, current) => 
      current.revenue > max.revenue ? current : max
    );

    const busiestHour = hourlyData.reduce((max, current) => 
      current.transactions > max.transactions ? current : max
    );

    return {
      hourlyData,
      peakHour,
      busiestHour,
    };
  }, [sales, selectedBranch, selectedPeriod]);

  const tableSectionStats = useMemo(() => {
    const dateRange = getDateRange(selectedPeriod);
    const filteredSales = (sales || []).filter(s => {
      const saleDate = new Date(s.saleDate);
      const matchesBranch = selectedBranch === 'all' || s.branchId === selectedBranch;
      const matchesDate = saleDate >= dateRange.start && saleDate <= dateRange.end;
      return matchesBranch && matchesDate;
    });

    const branchTables = (tables || []).filter(t => 
      selectedBranch === 'all' || t.branchId === selectedBranch
    );

    const branchSections = (tableSections || []).filter(s => 
      selectedBranch === 'all' || s.branchId === selectedBranch
    );

    const sectionMap = new Map<string, {
      sectionName: string;
      color: string;
      totalRevenue: number;
      transactionCount: number;
      totalItems: number;
      tableCount: number;
      averagePerTable: number;
      averageTransaction: number;
      occupancyRate: number;
      peakHours: Map<number, number>;
    }>();

    branchSections.forEach(section => {
      const sectionTables = branchTables.filter(t => t.sectionId === section.id);
      const tableIds = new Set(sectionTables.map(t => t.id));
      
      const sectionSales = filteredSales.filter(sale => {
        const tableId = sale.notes?.match(/Masa: ([^\|]+)/)?.[1]?.trim();
        return tableId && tableIds.has(tableId);
      });

      const totalRevenue = sectionSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const transactionCount = sectionSales.length;
      const totalItems = sectionSales.reduce((sum, s) => 
        sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0), 0
      );

      const peakHours = new Map<number, number>();
      sectionSales.forEach(sale => {
        const hour = new Date(sale.saleDate).getHours();
        peakHours.set(hour, (peakHours.get(hour) || 0) + 1);
      });

      const occupiedCount = sectionTables.filter(t => t.status === 'occupied').length;
      const occupancyRate = sectionTables.length > 0 ? (occupiedCount / sectionTables.length) * 100 : 0;

      sectionMap.set(section.id, {
        sectionName: section.name,
        color: section.color || '#666',
        totalRevenue,
        transactionCount,
        totalItems,
        tableCount: sectionTables.length,
        averagePerTable: sectionTables.length > 0 ? totalRevenue / sectionTables.length : 0,
        averageTransaction: transactionCount > 0 ? totalRevenue / transactionCount : 0,
        occupancyRate,
        peakHours,
      });
    });

    const sectionStats = Array.from(sectionMap.entries())
      .map(([sectionId, data]) => ({
        sectionId,
        ...data,
        peakHour: Array.from(data.peakHours.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalSectionRevenue = sectionStats.reduce((sum, s) => sum + s.totalRevenue, 0);

    return {
      sectionStats,
      totalSectionRevenue,
    };
  }, [sales, tables, tableSections, selectedBranch, selectedPeriod]);

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">Raporlama</h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">Detaylı satış ve performans raporları</p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Şubeler</SelectItem>
              {(branches || []).map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as 'today' | 'week' | 'month')}>
            <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="week">Son 7 Gün</SelectItem>
              <SelectItem value="month">Son 30 Gün</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Ciro
            </CardTitle>
            <ChartLine className="h-5 w-5 text-accent" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
              {formatCurrency(overallStats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(overallStats.totalTransactions)} işlem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ortalama Sepet
            </CardTitle>
            <TrendUp className="h-5 w-5 text-primary" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
              {formatCurrency(overallStats.averageTransaction)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              işlem başına
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Satılan Ürün
            </CardTitle>
            <Package className="h-5 w-5 text-accent" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
              {formatNumber(overallStats.totalItems)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              adet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktif Garson
            </CardTitle>
            <Users className="h-5 w-5 text-primary" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight font-tabular-nums">
              {waiterSalesReports.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              garson
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hourly" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="hourly" className="text-xs sm:text-sm">Saatlik Analiz</TabsTrigger>
          <TabsTrigger value="sections" className="text-xs sm:text-sm">Masa Bölgeleri</TabsTrigger>
          <TabsTrigger value="branches" className="text-xs sm:text-sm">Şube Karşılaştırma</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm">Ödeme Yöntemleri</TabsTrigger>
          <TabsTrigger value="waiters" className="text-xs sm:text-sm">Garson Satışları</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">Ürün Satışları</TabsTrigger>
        </TabsList>

        <TabsContent value="hourly" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">En Yüksek Ciro Saati</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{hourlyPatterns.peakHour.hourLabel}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatNumber(hourlyPatterns.peakHour.transactions)} işlem
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary font-tabular-nums">
                      {formatCurrency(hourlyPatterns.peakHour.revenue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ort: {formatCurrency(hourlyPatterns.peakHour.averageTransaction)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">En Yoğun Saat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{hourlyPatterns.busiestHour.hourLabel}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatNumber(hourlyPatterns.busiestHour.items)} ürün satıldı
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-accent font-tabular-nums">
                      {formatNumber(hourlyPatterns.busiestHour.transactions)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      işlem sayısı
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saatlik Ciro Grafiği</CardTitle>
              <CardDescription>
                Satışların saatlere göre dağılımı ve trend analizi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyPatterns.hourlyData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hourLabel" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Ciro']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saatlik İşlem Sayısı</CardTitle>
              <CardDescription>
                Müşteri yoğunluğunun saatlere göre dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hourlyPatterns.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hourLabel" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [formatNumber(value), 'İşlem']}
                  />
                  <Bar 
                    dataKey="transactions" 
                    fill="hsl(var(--accent))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ciro & İşlem Karşılaştırması</CardTitle>
              <CardDescription>
                Saatlik ciro ve işlem sayısı paralel karşılaştırma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyPatterns.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hourLabel" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => value === 'revenue' ? 'Ciro (₺)' : 'İşlem Sayısı'}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saatlik Ortalama Sepet Tutarı</CardTitle>
              <CardDescription>
                Her saatte gerçekleşen ortalama işlem tutarı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hourlyPatterns.hourlyData.filter(d => d.transactions > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hourLabel" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `₺${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Ortalama Sepet']}
                  />
                  <Bar 
                    dataKey="averageTransaction" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saatlik Detay Raporu</CardTitle>
              <CardDescription>
                Her saatin detaylı satış istatistikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {hourlyPatterns.hourlyData
                  .filter(d => d.transactions > 0)
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((data, index) => (
                    <div key={data.hour} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                          <span className="font-bold text-primary text-xs">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" weight="bold" />
                            <span className="font-semibold">{data.hourLabel}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatNumber(data.transactions)} işlem • {formatNumber(data.items)} ürün
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold font-tabular-nums">
                          {formatCurrency(data.revenue)}
                        </p>
                        <p className="text-xs text-muted-foreground font-tabular-nums">
                          Ort: {formatCurrency(data.averageTransaction)}
                        </p>
                      </div>
                    </div>
                  ))}
                {hourlyPatterns.hourlyData.every(d => d.transactions === 0) && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Seçili dönemde işlem yok
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Bölge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {tableSectionStats.sectionStats.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  aktif bölge
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Masa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {tableSectionStats.sectionStats.reduce((sum, s) => sum + s.tableCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  masa
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bölge Satışları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-tabular-nums">
                  {formatCurrency(tableSectionStats.totalSectionRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  toplam ciro
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Masa Bölgesi Performans Grafiği</CardTitle>
              <CardDescription>
                Bölgelerin ciro karşılaştırması
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tableSectionStats.sectionStats.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Henüz masa bölgesi verisi yok
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tableSectionStats.sectionStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="sectionName" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Ciro']}
                    />
                    <Bar 
                      dataKey="totalRevenue" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detaylı Bölge İstatistikleri</CardTitle>
              <CardDescription>
                Her bölgenin performans detayları ve metrikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tableSectionStats.sectionStats.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Henüz masa bölgesi verisi yok
                  </p>
                ) : (
                  tableSectionStats.sectionStats.map((section, index) => {
                    const revenuePercentage = tableSectionStats.totalSectionRevenue > 0 
                      ? (section.totalRevenue / tableSectionStats.totalSectionRevenue) * 100 
                      : 0;

                    return (
                      <div key={section.sectionId} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: section.color }}
                            >
                              #{index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{section.sectionName}</h3>
                              <p className="text-xs text-muted-foreground">
                                {section.tableCount} masa • {formatNumber(section.transactionCount)} işlem
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold font-tabular-nums">
                              {formatCurrency(section.totalRevenue)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Toplam satışın %{revenuePercentage.toFixed(1)}'i
                            </p>
                          </div>
                        </div>

                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full transition-all duration-300"
                            style={{ 
                              width: `${revenuePercentage}%`,
                              backgroundColor: section.color
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Masa Başına Ciro</p>
                            <p className="text-lg font-semibold font-tabular-nums">
                              {formatCurrency(section.averagePerTable)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Ortalama İşlem</p>
                            <p className="text-lg font-semibold font-tabular-nums">
                              {formatCurrency(section.averageTransaction)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Doluluk Oranı</p>
                            <p className="text-lg font-semibold font-tabular-nums">
                              %{section.occupancyRate.toFixed(0)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Yoğun Saat</p>
                            <p className="text-lg font-semibold font-tabular-nums">
                              {section.peakHour.toString().padStart(2, '0')}:00
                            </p>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Toplam Satılan Ürün</span>
                          <span className="font-semibold">{formatNumber(section.totalItems)} adet</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Performans Durumu</span>
                          <Badge 
                            variant={
                              section.occupancyRate >= 75 ? 'default' : 
                              section.occupancyRate >= 50 ? 'secondary' : 
                              'outline'
                            }
                          >
                            {section.occupancyRate >= 75 ? '🔥 Yüksek Talep' : 
                             section.occupancyRate >= 50 ? '✅ Normal' : 
                             section.occupancyRate >= 25 ? '⚠️ Düşük' : 
                             '💤 Çok Düşük'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bölgelere Göre İşlem Dağılımı</CardTitle>
              <CardDescription>
                Her bölgenin işlem sayısı karşılaştırması
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tableSectionStats.sectionStats.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Henüz masa bölgesi verisi yok
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tableSectionStats.sectionStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="sectionName" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [formatNumber(value), 'İşlem']}
                    />
                    <Bar 
                      dataKey="transactionCount" 
                      fill="hsl(var(--accent))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bölge Karşılaştırma Özeti</CardTitle>
              <CardDescription>
                Bölgelerin performans özeti ve sıralama
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tableSectionStats.sectionStats.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Henüz masa bölgesi verisi yok
                  </p>
                ) : (
                  tableSectionStats.sectionStats.map((section, index) => (
                    <div 
                      key={section.sectionId} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: section.color }}
                        >
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{section.sectionName}</p>
                          <p className="text-xs text-muted-foreground">
                            {section.tableCount} masa • Doluluk: %{section.occupancyRate.toFixed(0)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold font-tabular-nums">
                          {formatCurrency(section.totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(section.transactionCount)} işlem
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ödeme Yöntemi Dağılımı</CardTitle>
              <CardDescription>
                Seçili dönemde ödeme yöntemlerine göre satış dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { method: 'cash', label: 'Nakit', icon: Money, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
                  { method: 'card', label: 'Kredi Kartı', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-100' },
                  { method: 'mobile', label: 'Mobil Ödeme', icon: DeviceMobile, color: 'text-purple-600', bgColor: 'bg-purple-100' },
                  { method: 'transfer', label: 'Havale/EFT', icon: Bank, color: 'text-orange-600', bgColor: 'bg-orange-100' },
                  { method: 'multinet', label: 'Multinet Açık Hesap', icon: Ticket, color: 'text-pink-600', bgColor: 'bg-pink-100' },
                ].map(({ method, label, icon: Icon, color, bgColor }) => {
                  const amount = overallStats.paymentMethodBreakdown[method as keyof typeof overallStats.paymentMethodBreakdown] || 0;
                  const percentage = overallStats.totalRevenue > 0 ? (amount / overallStats.totalRevenue) * 100 : 0;
                  
                  if (amount === 0) return null;
                  
                  return (
                    <div key={method} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg ${bgColor}`}>
                            <Icon className={`h-6 w-6 ${color}`} weight="bold" />
                          </div>
                          <div>
                            <p className="font-semibold">{label}</p>
                            <p className="text-xs text-muted-foreground">
                              Toplam satışın %{percentage.toFixed(1)}'i
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold font-tabular-nums">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`absolute h-full ${bgColor} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {Object.values(overallStats.paymentMethodBreakdown).every(v => v === 0) && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Seçili dönemde ödeme yok
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Haftalık Şube Karşılaştırması</CardTitle>
              <CardDescription>
                Geçen hafta - bu hafta satış karşılaştırması (7 günlük)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branchComparisons.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Henüz şube verisi yok
                  </p>
                ) : (
                  branchComparisons.map((comparison) => (
                    <div key={comparison.branchId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Buildings className="h-5 w-5 text-primary" weight="bold" />
                            <h3 className="font-semibold text-lg">{comparison.branchName}</h3>
                          </div>
                        </div>
                        <Badge variant={comparison.percentageChange >= 0 ? 'default' : 'destructive'}>
                          {comparison.percentageChange >= 0 ? (
                            <TrendUp className="h-3 w-3 mr-1" weight="bold" />
                          ) : (
                            <TrendDown className="h-3 w-3 mr-1" weight="bold" />
                          )}
                          {Math.abs(comparison.percentageChange).toFixed(1)}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Bu Hafta</p>
                          <p className="text-xl font-semibold font-tabular-nums">
                            {formatCurrency(comparison.currentWeekSales)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Geçen Hafta</p>
                          <p className="text-xl font-semibold font-tabular-nums">
                            {formatCurrency(comparison.lastWeekSales)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Fark</p>
                          <p className={`text-xl font-semibold font-tabular-nums ${comparison.amountChange >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            {comparison.amountChange >= 0 ? '+' : ''}{formatCurrency(comparison.amountChange)}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Performans Durumu</span>
                        <span className={`font-medium ${comparison.percentageChange >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {comparison.percentageChange >= 10 ? '🎉 Mükemmel' : 
                           comparison.percentageChange >= 0 ? '✅ İyi' : 
                           comparison.percentageChange >= -10 ? '⚠️ Dikkat' : '❌ Düşük'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waiters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Garson Satış Performansı</CardTitle>
              <CardDescription>
                Garsonların bireysel satış performansı ve istatistikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {waiterSalesReports.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Seçili dönemde garson satışı yok
                  </p>
                ) : (
                  waiterSalesReports.map((report, index) => (
                    <div key={report.waiterId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                          <span className="font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{report.waiterName}</p>
                            <Badge variant="outline" className="text-xs">
                              {formatNumber(report.transactionCount)} işlem
                            </Badge>
                          </div>
                          {report.topSellingItem && (
                            <p className="text-xs text-muted-foreground">
                              En çok satan: {report.topSellingItem}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xl font-bold font-tabular-nums">
                          {formatCurrency(report.totalSales)}
                        </p>
                        <p className="text-xs text-muted-foreground font-tabular-nums">
                          Ort: {formatCurrency(report.averageTransaction)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ürün Satış Raporu</CardTitle>
              <CardDescription>
                En çok satılan ürünler ve satış istatistikleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productSalesReports.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Seçili dönemde ürün satışı yok
                  </p>
                ) : (
                  productSalesReports.map((report, index) => (
                    <div key={report.productId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
                          <span className="font-bold text-accent">#{index + 1}</span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{report.productName}</p>
                            <Badge variant="secondary" className="text-xs">
                              {report.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-tabular-nums">
                            {formatNumber(report.totalSold)} adet • Ort: {formatCurrency(report.averagePrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xl font-bold font-tabular-nums">
                          {formatCurrency(report.totalRevenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          toplam ciro
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

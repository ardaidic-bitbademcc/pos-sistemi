import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ChartLine, TrendUp, TrendDown, Users, Package, Calendar, Buildings } from '@phosphor-icons/react';
import type { Sale, Employee, Product, Branch, BranchComparison, WaiterSalesReport, ProductSalesReport } from '@/lib/types';
import { formatCurrency, formatNumber } from '@/lib/helpers';

interface ReportsModuleProps {
  onBack: () => void;
}

export default function ReportsModule({ onBack }: ReportsModuleProps) {
  const [sales] = useKV<Sale[]>('sales', []);
  const [employees] = useKV<Employee[]>('employees', []);
  const [products] = useKV<Product[]>('products', []);
  const [branches] = useKV<Branch[]>('branches', []);
  
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

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction,
      totalItems,
    };
  }, [sales, selectedBranch, selectedPeriod]);

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

      <Tabs defaultValue="branches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branches">Şube Karşılaştırma</TabsTrigger>
          <TabsTrigger value="waiters">Garson Satışları</TabsTrigger>
          <TabsTrigger value="products">Ürün Satışları</TabsTrigger>
        </TabsList>

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

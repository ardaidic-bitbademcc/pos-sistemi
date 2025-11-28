import { useMemo, useState, useEffect } from 'react';
import { useKV } from '../../hooks/use-kv-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, TrendUp, TrendDown, CurrencyCircleDollar, Wallet, CreditCard, DeviceMobile, Plus, CalendarBlank, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import type { Sale, Expense, FinancialSummary, CashRegister, AuthSession, SalaryCalculation, Invoice, B2BOrder } from '@/lib/types';
import { formatCurrency } from '@/lib/helpers';
import { toast } from 'sonner';

interface FinanceModuleProps {
  onBack: () => void;
  authSession?: AuthSession | null;
}

type PeriodType = 'day' | 'week' | 'month';

interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

export default function FinanceModule({ onBack, authSession }: FinanceModuleProps) {
  const adminId = authSession?.adminId;
  
  const [sales] = useKV<Sale[]>('sales', [], adminId);
  const [expenses, setExpenses] = useKV<Expense[]>('expenses', [], adminId);
  const [cashRegister] = useKV<CashRegister | null>('cashRegister', null, adminId);
  const [salaries] = useKV<SalaryCalculation[]>('salaries', [], adminId);
  const [invoices] = useKV<Invoice[]>('invoices', [], adminId);
  const [b2bOrders] = useKV<B2BOrder[]>('b2bOrders', [], adminId);
  
  const [periodType, setPeriodType] = useState<PeriodType>('day');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const autoUpdateExpenses = async () => {
      if (!authSession?.branchId) return;
      
      const existingExpenses = expenses || [];
      
      const approvedSalaries = (salaries || []).filter(
        (s) => s.status === 'paid' && 
        s.branchId === authSession.branchId &&
        !existingExpenses.some(e => e.sourceType === 'salary' && e.description?.includes(s.id))
      );
      
      const completedInvoices = (invoices || []).filter(
        (inv) => inv.type === 'purchase' && 
        inv.status === 'completed' && 
        inv.branchId === authSession.branchId &&
        !existingExpenses.some(e => e.sourceType === 'inventory' && e.description?.includes(inv.id))
      );
      
      const deliveredB2BOrders = (b2bOrders || []).filter(
        (order) => order.status === 'delivered' && 
        order.branchId === authSession.branchId &&
        !existingExpenses.some(e => e.sourceType === 'inventory' && e.description?.includes(order.id))
      );
      
      const newExpenses: Expense[] = [];
      
      approvedSalaries.forEach((salary) => {
        newExpenses.push({
          id: `exp-salary-${salary.id}`,
          branchId: authSession.branchId!,
          adminId: authSession.adminId,
          category: 'Personel Maaşı',
          amount: salary.netSalary,
          date: salary.periodEnd,
          description: `${salary.employeeName} - Maaş Ödemesi (${salary.id})`,
          paymentMethod: 'transfer',
          sourceType: 'salary',
        });
      });
      
      completedInvoices.forEach((invoice) => {
        newExpenses.push({
          id: `exp-invoice-${invoice.id}`,
          branchId: authSession.branchId!,
          adminId: authSession.adminId,
          category: 'Satın Alma',
          amount: invoice.totalAmount,
          date: invoice.date,
          description: `${invoice.supplierName || 'Tedarikçi'} - Fatura (${invoice.invoiceNumber})`,
          paymentMethod: 'transfer',
          sourceType: 'inventory',
        });
      });
      
      deliveredB2BOrders.forEach((order) => {
        newExpenses.push({
          id: `exp-b2b-${order.id}`,
          branchId: authSession.branchId!,
          adminId: authSession.adminId,
          category: 'B2B Satın Alma',
          amount: order.totalAmount,
          date: order.deliveredDate || order.orderDate,
          description: `${order.supplierName} - B2B Sipariş (#${order.orderNumber})`,
          paymentMethod: 'transfer',
          sourceType: 'inventory',
        });
      });
      
      if (newExpenses.length > 0) {
        setExpenses((current) => [...(current || []), ...newExpenses]);
      }
    };
    
    autoUpdateExpenses();
  }, [sales, salaries, invoices, b2bOrders, authSession]);

  const getDateRange = (type: PeriodType, offset: number = 0): { start: Date; end: Date } => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    switch (type) {
      case 'day':
        start.setDate(now.getDate() - offset);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - offset);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(now.getDate() - diff - (offset * 7));
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setMonth(now.getMonth() - offset, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }
    
    return { start, end };
  };

  const calculatePeriodData = (type: PeriodType, offset: number = 0) => {
    const { start, end } = getDateRange(type, offset);
    
    const periodSales = (sales || []).filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= start && saleDate <= end && sale.branchId === authSession?.branchId;
    });
    
    const periodExpenses = (expenses || []).filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end && expense.branchId === authSession?.branchId;
    });
    
    const income = periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const expenseTotal = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return { income, expenses: expenseTotal, profit: income - expenseTotal };
  };

  const periodComparison: PeriodComparison = useMemo(() => {
    const current = calculatePeriodData(periodType, 0);
    const previous = calculatePeriodData(periodType, 1);
    
    const incomeChange = current.income - previous.income;
    const incomeChangePercentage = previous.income > 0 ? (incomeChange / previous.income) * 100 : 0;
    
    return {
      current: current.income,
      previous: previous.income,
      change: incomeChange,
      changePercentage: incomeChangePercentage,
    };
  }, [sales, expenses, periodType, authSession]);

  const summary: FinancialSummary = useMemo(() => {
    const { start, end } = getDateRange(periodType, 0);
    const data = calculatePeriodData(periodType, 0);

    return {
      totalIncome: data.income,
      totalExpenses: data.expenses,
      grossProfit: data.income,
      netProfit: data.profit,
      profitMargin: data.income > 0 ? (data.profit / data.income) * 100 : 0,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  }, [sales, expenses, periodType, authSession]);

  const dailyAverageExpenses = useMemo(() => {
    const { start, end } = getDateRange('month', 0);
    const monthExpenses = (expenses || []).filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end && expense.branchId === authSession?.branchId;
    });
    
    const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return total / 30;
  }, [expenses, authSession]);

  const expensesByCategory = useMemo(() => {
    const { start, end } = getDateRange(periodType, 0);
    const periodExpenses = (expenses || []).filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end && expense.branchId === authSession?.branchId;
    });
    
    const grouped: Record<string, number> = {};
    periodExpenses.forEach((expense) => {
      grouped[expense.category] = (grouped[expense.category] || 0) + expense.amount;
    });
    
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, periodType, authSession]);

  const recentExpenses = useMemo(() => {
    return (expenses || [])
      .filter(e => e.branchId === authSession?.branchId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [expenses, authSession]);

  const recentSales = useMemo(() => {
    return (sales || [])
      .filter(s => s.branchId === authSession?.branchId)
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
      .slice(0, 20);
  }, [sales, authSession]);

  const handleAddExpense = () => {
    if (!newExpense.category.trim()) {
      toast.error('Lütfen kategori giriniz');
      return;
    }
    
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error('Lütfen geçerli bir tutar giriniz');
      return;
    }
    
    if (!authSession?.branchId) {
      toast.error('Şube bilgisi bulunamadı');
      return;
    }
    
    const expense: Expense = {
      id: `exp-manual-${Date.now()}`,
      branchId: authSession.branchId,
      adminId: authSession.adminId,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      date: newExpense.date,
      description: newExpense.description,
      paymentMethod: 'cash',
      sourceType: 'manual',
    };
    
    setExpenses((current) => [...(current || []), expense]);
    setNewExpense({
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsAddExpenseOpen(false);
    toast.success('Gider eklendi');
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'day':
        return 'Bugün';
      case 'week':
        return 'Bu Hafta';
      case 'month':
        return 'Bu Ay';
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">Finans Yönetimi</h1>
          <p className="text-muted-foreground text-xs sm:text-sm truncate">Gelir-gider takibi ve kar-zarar analizi</p>
        </div>
        <Select value={periodType} onValueChange={(value) => setPeriodType(value as PeriodType)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Günlük</SelectItem>
            <SelectItem value="week">Haftalık</SelectItem>
            <SelectItem value="month">Aylık</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Gelir
            </CardTitle>
            <TrendUp className="h-5 w-5 text-accent" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight font-tabular-nums text-accent">
              {formatCurrency(summary.totalIncome)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
              {periodComparison.changePercentage !== 0 && (
                <span className={`text-xs flex items-center gap-0.5 ${periodComparison.change >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {periodComparison.change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(periodComparison.changePercentage).toFixed(1)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Gider
            </CardTitle>
            <TrendDown className="h-5 w-5 text-destructive" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight font-tabular-nums text-destructive">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Kar
            </CardTitle>
            <CurrencyCircleDollar className="h-5 w-5 text-primary" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold tracking-tight font-tabular-nums ${summary.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(summary.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Günlük Ort. Gider
            </CardTitle>
            <CalendarBlank className="h-5 w-5 text-muted-foreground" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight font-tabular-nums">
              {formatCurrency(dailyAverageExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aylık ortalama</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Özet</TabsTrigger>
          <TabsTrigger value="income">Gelirler</TabsTrigger>
          <TabsTrigger value="expenses">Giderler</TabsTrigger>
          <TabsTrigger value="comparison">Karşılaştırma</TabsTrigger>
          <TabsTrigger value="cash-register">Kasa</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gelir Kategorileri</CardTitle>
                <CardDescription>{getPeriodLabel()} satış gelirleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Toplam Satış Geliri</span>
                      <span className="text-xl font-bold text-accent font-tabular-nums">
                        {formatCurrency(summary.totalIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Gider Kategorileri</CardTitle>
                    <CardDescription>{getPeriodLabel()} gider dağılımı</CardDescription>
                  </div>
                  <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Gider Ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manuel Gider Ekle</DialogTitle>
                        <DialogDescription>
                          Elektrik, su, kira gibi ekstra giderleri buradan ekleyebilirsiniz
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Kategori</Label>
                          <Input
                            id="category"
                            placeholder="Örn: Elektrik Faturası"
                            value={newExpense.category}
                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Tutar (₺)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">Tarih</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newExpense.date}
                            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
                          <Input
                            id="description"
                            placeholder="Gider detayları..."
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                          İptal
                        </Button>
                        <Button onClick={handleAddExpense}>Ekle</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expensesByCategory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Henüz gider kaydı yok
                    </p>
                  ) : (
                    expensesByCategory.map((item) => (
                      <div key={item.category} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">{item.category}</span>
                        <span className="text-sm font-semibold text-destructive font-tabular-nums">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))
                  )}
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Toplam Gider</span>
                      <span className="text-lg font-bold text-destructive font-tabular-nums">
                        {formatCurrency(summary.totalExpenses)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Finansal Özet - {getPeriodLabel()}</CardTitle>
              <CardDescription>Kar-zarar durumu ve marj analizi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                    <p className="text-2xl font-bold font-tabular-nums text-accent">
                      {formatCurrency(summary.totalIncome)}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="text-sm text-muted-foreground">Toplam Gider</p>
                    <p className="text-2xl font-bold font-tabular-nums text-destructive">
                      {formatCurrency(summary.totalExpenses)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Net Kar/Zarar</p>
                    <p className="text-xs text-muted-foreground">Kar Marjı: {summary.profitMargin.toFixed(2)}%</p>
                  </div>
                  <p className={`text-3xl font-bold font-tabular-nums ${summary.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(summary.netProfit)}
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Günlük Ortalama Gider (Aylık Bazda)</p>
                  <p className="text-xl font-bold font-tabular-nums">
                    {formatCurrency(dailyAverageExpenses)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bu ay toplam: {formatCurrency(dailyAverageExpenses * 30)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gelir Kayıtları</CardTitle>
              <CardDescription>Satışlardan gelen gelirler (Otomatik)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSales.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Henüz gelir kaydı yok
                  </p>
                ) : (
                  recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">Satış #{sale.saleNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.saleDate).toLocaleDateString('tr-TR')} -{' '}
                          {new Date(sale.saleDate).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-semibold font-tabular-nums text-accent">
                          {formatCurrency(sale.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {sale.paymentMethod}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Gider Kayıtları</CardTitle>
                  <CardDescription>Otomatik ve manuel giderler</CardDescription>
                </div>
                <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Manuel Gider Ekle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manuel Gider Ekle</DialogTitle>
                      <DialogDescription>
                        Elektrik, su, kira gibi ekstra giderleri buradan ekleyebilirsiniz
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="exp-category">Kategori</Label>
                        <Input
                          id="exp-category"
                          placeholder="Örn: Elektrik Faturası"
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp-amount">Tutar (₺)</Label>
                        <Input
                          id="exp-amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp-date">Tarih</Label>
                        <Input
                          id="exp-date"
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp-description">Açıklama (Opsiyonel)</Label>
                        <Input
                          id="exp-description"
                          placeholder="Gider detayları..."
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                        İptal
                      </Button>
                      <Button onClick={handleAddExpense}>Ekle</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExpenses.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Henüz gider kaydı yok
                  </p>
                ) : (
                  recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('tr-TR')}
                        </p>
                        {expense.description && (
                          <p className="text-xs text-muted-foreground">{expense.description}</p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-semibold font-tabular-nums text-destructive">
                          -{formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {expense.sourceType === 'manual' ? 'Manuel' : expense.sourceType === 'salary' ? 'Maaş' : 'Stok'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dönemsel Karşılaştırma</CardTitle>
              <CardDescription>Önceki dönem ile kıyaslama</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <p className="text-sm text-muted-foreground">Bu Dönem</p>
                    <p className="text-2xl font-bold text-accent font-tabular-nums">
                      {formatCurrency(periodComparison.current)}
                    </p>
                    <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
                  </div>

                  <div className="p-4 border rounded-lg space-y-2">
                    <p className="text-sm text-muted-foreground">Önceki Dönem</p>
                    <p className="text-2xl font-bold font-tabular-nums">
                      {formatCurrency(periodComparison.previous)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {periodType === 'day' ? 'Dün' : periodType === 'week' ? 'Geçen Hafta' : 'Geçen Ay'}
                    </p>
                  </div>

                  <div className={`p-4 border-2 rounded-lg space-y-2 ${periodComparison.change >= 0 ? 'border-accent/50 bg-accent/10' : 'border-destructive/50 bg-destructive/10'}`}>
                    <p className="text-sm text-muted-foreground">Değişim</p>
                    <div className="flex items-center gap-2">
                      {periodComparison.change >= 0 ? (
                        <ArrowUp className="h-6 w-6 text-accent" weight="bold" />
                      ) : (
                        <ArrowDown className="h-6 w-6 text-destructive" weight="bold" />
                      )}
                      <p className={`text-2xl font-bold font-tabular-nums ${periodComparison.change >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {Math.abs(periodComparison.changePercentage).toFixed(1)}%
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Math.abs(periodComparison.change))}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="text-sm font-medium mb-3">Performans Değerlendirmesi</h3>
                  <p className="text-sm text-muted-foreground">
                    {periodComparison.change >= 0 ? (
                      <>Harika! Gelirleriniz önceki döneme göre <strong className="text-accent">{Math.abs(periodComparison.changePercentage).toFixed(1)}%</strong> artış gösterdi.</>
                    ) : (
                      <>Gelirleriniz önceki döneme göre <strong className="text-destructive">{Math.abs(periodComparison.changePercentage).toFixed(1)}%</strong> azaldı. Giderleri ve satış stratejilerini gözden geçirmelisiniz.</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kasa Durumu</CardTitle>
              <CardDescription>
                {cashRegister ? new Date(cashRegister.date).toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Bugün'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!cashRegister ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Henüz kasa hareketi yok
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Açılış Bakiyesi</span>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-semibold font-tabular-nums">
                        {formatCurrency(cashRegister.openingBalance)}
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg space-y-2 bg-primary/5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Mevcut Bakiye</span>
                        <Wallet className="h-4 w-4 text-primary" weight="bold" />
                      </div>
                      <p className="text-2xl font-semibold font-tabular-nums text-primary">
                        {formatCurrency(cashRegister.currentBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Ödeme Yöntemine Göre Satışlar</h3>
                    
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/10">
                            <Wallet className="h-5 w-5 text-accent" weight="bold" />
                          </div>
                          <div>
                            <p className="font-medium">Nakit Satışlar</p>
                            <p className="text-xs text-muted-foreground">Kasaya giriş yapıldı</p>
                          </div>
                        </div>
                        <p className="text-lg font-semibold font-tabular-nums text-accent">
                          {formatCurrency(cashRegister.totalCashSales)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CreditCard className="h-5 w-5 text-primary" weight="bold" />
                          </div>
                          <div>
                            <p className="font-medium">Kredi Kartı Satışlar</p>
                            <p className="text-xs text-muted-foreground">Kasaya giriş yapılmadı</p>
                          </div>
                        </div>
                        <p className="text-lg font-semibold font-tabular-nums">
                          {formatCurrency(cashRegister.totalCardSales)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-secondary/10">
                            <DeviceMobile className="h-5 w-5 text-secondary-foreground" weight="bold" />
                          </div>
                          <div>
                            <p className="font-medium">Mobil Ödeme Satışlar</p>
                            <p className="text-xs text-muted-foreground">Kasaya giriş yapılmadı</p>
                          </div>
                        </div>
                        <p className="text-lg font-semibold font-tabular-nums">
                          {formatCurrency(cashRegister.totalMobileSales)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Toplam Satış</span>
                        <span className="text-xl font-bold font-tabular-nums">
                          {formatCurrency(cashRegister.totalSales)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Son güncelleme: {new Date(cashRegister.lastUpdated).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

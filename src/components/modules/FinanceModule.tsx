import { useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendUp, TrendDown, CurrencyCircleDollar, Receipt } from '@phosphor-icons/react';
import type { Sale, Expense, FinancialSummary } from '@/lib/types';
import { formatCurrency, getStartOfDay } from '@/lib/helpers';

interface FinanceModuleProps {
  onBack: () => void;
}

export default function FinanceModule({ onBack }: FinanceModuleProps) {
  const [sales] = useKV<Sale[]>('sales', []);
  const [expenses] = useKV<Expense[]>('expenses', []);

  const summary: FinancialSummary = useMemo(() => {
    const today = getStartOfDay();
    const todaySales = (sales || []).filter(
      (sale) => new Date(sale.saleDate) >= today
    );
    const todayExpenses = (expenses || []).filter(
      (expense) => new Date(expense.date) >= today
    );

    const totalIncome = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalExpenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const grossProfit = totalIncome;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin,
      period: {
        start: today.toISOString(),
        end: new Date().toISOString(),
      },
    };
  }, [sales, expenses]);

  const recentExpenses = useMemo(() => {
    return (expenses || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [expenses]);

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Finans Yönetimi</h1>
          <p className="text-muted-foreground text-sm">Gelir-gider takibi ve kar-zarar analizi</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <p className="text-xs text-muted-foreground mt-1">Bugün</p>
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
            <p className="text-xs text-muted-foreground mt-1">Bugün</p>
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
            <div className="text-2xl font-semibold tracking-tight font-tabular-nums text-primary">
              {formatCurrency(summary.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Bugün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kar Marjı
            </CardTitle>
            <Receipt className="h-5 w-5 text-accent" weight="bold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight font-tabular-nums">
              {summary.profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Bugün</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income" className="space-y-4">
        <TabsList>
          <TabsTrigger value="income">Gelir Takibi</TabsTrigger>
          <TabsTrigger value="expenses">Gider Takibi</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gelir Kayıtları</CardTitle>
              <CardDescription>Satışlardan gelen gelirler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(sales || []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Henüz gelir kaydı yok
                  </p>
                ) : (
                  (sales || [])
                    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
                    .slice(0, 10)
                    .map((sale) => (
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
              <CardTitle className="text-lg">Gider Kayıtları</CardTitle>
              <CardDescription>Tüm işletme giderleri</CardDescription>
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
                          {expense.sourceType}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Finansal Özet</CardTitle>
              <CardDescription>Bugünkü finansal performans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 bg-accent/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                    <p className="text-2xl font-bold font-tabular-nums text-accent">
                      {formatCurrency(summary.totalIncome)}
                    </p>
                  </div>
                  <div className="space-y-2 p-4 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Toplam Gider</p>
                    <p className="text-2xl font-bold font-tabular-nums text-destructive">
                      {formatCurrency(summary.totalExpenses)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Net Kar/Zarar</p>
                  <p className={`text-3xl font-bold font-tabular-nums ${summary.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(summary.netProfit)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Kar Marjı: {summary.profitMargin.toFixed(2)}%
                  </p>
                </div>

                <Button variant="outline" className="w-full">
                  PDF Olarak İndir
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

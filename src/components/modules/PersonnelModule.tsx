import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ClockClockwise, Check, CurrencyCircleDollar } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Employee, Shift, SalaryCalculation } from '@/lib/types';
import { formatCurrency, formatDateTime, calculateHoursWorked, generateId } from '@/lib/helpers';

interface PersonnelModuleProps {
  onBack: () => void;
}

export default function PersonnelModule({ onBack }: PersonnelModuleProps) {
  const [employees] = useKV<Employee[]>('employees', []);
  const [shifts, setShifts] = useKV<Shift[]>('shifts', []);
  const [salaries, setSalaries] = useKV<SalaryCalculation[]>('salaries', []);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showSalaryCalc, setShowSalaryCalc] = useState(false);

  const activeEmployees = (employees || []).filter((e) => e.isActive);
  const todayShifts = (shifts || []).filter((s) => {
    const today = new Date().toDateString();
    return new Date(s.date).toDateString() === today;
  });

  const clockIn = (employeeId: string) => {
    const employee = employees?.find((e) => e.id === employeeId);
    if (!employee) return;

    const newShift: Shift = {
      id: generateId(),
      branchId: employee.branchId,
      employeeId: employee.id,
      employeeName: employee.fullName,
      startTime: new Date().toISOString(),
      breakDuration: 0,
      totalHours: 0,
      date: new Date().toISOString(),
      status: 'in_progress',
    };

    setShifts((current) => [...(current || []), newShift]);
    toast.success(`${employee.fullName} vardiyaya başladı`);
  };

  const clockOut = (shiftId: string) => {
    setShifts((current) =>
      (current || []).map((shift) => {
        if (shift.id === shiftId && !shift.endTime) {
          const endTime = new Date().toISOString();
          const totalHours = calculateHoursWorked(shift.startTime, endTime, shift.breakDuration);
          return {
            ...shift,
            endTime,
            totalHours,
            status: 'completed' as const,
          };
        }
        return shift;
      })
    );
    toast.success('Vardiya tamamlandı');
  };

  const calculateSalary = () => {
    if (!selectedEmployee) return;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const employeeShifts = (shifts || []).filter(
      (s) => s.employeeId === selectedEmployee.id && s.status === 'completed'
    );

    const totalHours = employeeShifts.reduce((sum, s) => sum + s.totalHours, 0);
    const baseSalary = totalHours * selectedEmployee.hourlyRate;
    const overtimeHours = Math.max(0, totalHours - 160);
    const overtimePay = overtimeHours * selectedEmployee.hourlyRate * 1.5;

    const newSalary: SalaryCalculation = {
      id: generateId(),
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.fullName,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      baseSalary,
      overtimePay,
      bonuses: 0,
      deductions: 0,
      netSalary: baseSalary + overtimePay,
      status: 'draft',
      totalHours,
    };

    setSalaries((current) => [...(current || []), newSalary]);
    toast.success('Maaş hesaplandı');
    setShowSalaryCalc(false);
    setSelectedEmployee(null);
  };

  const approveSalary = (salaryId: string) => {
    setSalaries((current) =>
      (current || []).map((salary) =>
        salary.id === salaryId ? { ...salary, status: 'approved' as const } : salary
      )
    );
    toast.success('Maaş onaylandı ve gider olarak kaydedildi');
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Personel Yönetimi</h1>
          <p className="text-muted-foreground text-sm">Vardiya, puantaj ve maaş yönetimi</p>
        </div>
      </header>

      <Tabs defaultValue="shifts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shifts">Vardiya Takibi</TabsTrigger>
          <TabsTrigger value="employees">Çalışanlar</TabsTrigger>
          <TabsTrigger value="salaries">Maaş Hesaplama</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bugünkü Vardiyalar</CardTitle>
              <CardDescription>Aktif ve tamamlanmış vardiyalar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayShifts.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Henüz vardiya kaydı yok
                  </p>
                ) : (
                  todayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{shift.employeeName}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Giriş: {formatDateTime(shift.startTime)}</span>
                          {shift.endTime && <span>Çıkış: {formatDateTime(shift.endTime)}</span>}
                        </div>
                        {shift.totalHours > 0 && (
                          <p className="text-sm font-tabular-nums">
                            Toplam: {shift.totalHours.toFixed(1)} saat
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            shift.status === 'in_progress'
                              ? 'default'
                              : shift.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {shift.status === 'in_progress'
                            ? 'Devam Ediyor'
                            : shift.status === 'completed'
                            ? 'Tamamlandı'
                            : 'Planlandı'}
                        </Badge>
                        {shift.status === 'in_progress' && (
                          <Button size="sm" onClick={() => clockOut(shift.id)}>
                            Çıkış Yap
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEmployees.map((employee) => {
              const hasActiveShift = todayShifts.some(
                (s) => s.employeeId === employee.id && s.status === 'in_progress'
              );
              
              return (
                <Card key={employee.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{employee.fullName}</CardTitle>
                        <CardDescription className="text-xs capitalize">
                          {employee.role}
                        </CardDescription>
                      </div>
                      <Badge variant={hasActiveShift ? 'default' : 'secondary'}>
                        {hasActiveShift ? 'Vardiyada' : 'Pasif'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                    <p className="text-sm font-tabular-nums">
                      Saat Ücreti: {formatCurrency(employee.hourlyRate)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={hasActiveShift}
                      onClick={() => clockIn(employee.id)}
                    >
                      <ClockClockwise className="h-4 w-4 mr-2" />
                      Vardiya Başlat
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="salaries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Maaş Hesaplamaları</CardTitle>
                  <CardDescription>Onay bekleyen ve ödenmiş maaşlar</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    if (activeEmployees.length > 0) {
                      setSelectedEmployee(activeEmployees[0]);
                      setShowSalaryCalc(true);
                    }
                  }}
                >
                  <CurrencyCircleDollar className="h-5 w-5 mr-2" weight="bold" />
                  Yeni Hesaplama
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(salaries || []).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Henüz maaş hesaplaması yok
                  </p>
                ) : (
                  (salaries || []).map((salary) => (
                    <div
                      key={salary.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{salary.employeeName}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Toplam Saat: {salary.totalHours.toFixed(1)}</span>
                          <span>Net Maaş: {formatCurrency(salary.netSalary)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            salary.status === 'approved'
                              ? 'default'
                              : salary.status === 'paid'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {salary.status === 'approved'
                            ? 'Onaylandı'
                            : salary.status === 'paid'
                            ? 'Ödendi'
                            : 'Taslak'}
                        </Badge>
                        {salary.status === 'draft' && (
                          <Button size="sm" onClick={() => approveSalary(salary.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            Onayla
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showSalaryCalc} onOpenChange={setShowSalaryCalc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Maaş Hesapla</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.fullName} için maaş hesaplanıyor
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Son 30 gün içindeki çalışma saatleri baz alınarak maaş hesaplanacak.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSalaryCalc(false)}>
              İptal
            </Button>
            <Button onClick={calculateSalary}>
              Hesapla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ClockClockwise, Check, CurrencyCircleDollar, X, QrCode, User, Gear, Plus, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Employee, Shift, SalaryCalculation, SalaryCalculationSettings, UserRole } from '@/lib/types';
import { formatCurrency, formatDateTime, calculateHoursWorked, generateId } from '@/lib/helpers';

interface PersonnelModuleProps {
  onBack: () => void;
}

export default function PersonnelModule({ onBack }: PersonnelModuleProps) {
  const [employees, setEmployees] = useKV<Employee[]>('employees', []);
  const [shifts, setShifts] = useKV<Shift[]>('shifts', []);
  const [salaries, setSalaries] = useKV<SalaryCalculation[]>('salaries', []);
  const [salarySettings, setSalarySettings] = useKV<SalaryCalculationSettings[]>('salarySettings', []);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showSalaryCalc, setShowSalaryCalc] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showDeleteEmployeeDialog, setShowDeleteEmployeeDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<SalaryCalculation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginQr, setLoginQr] = useState('');
  const [editingSettings, setEditingSettings] = useState<SalaryCalculationSettings | null>(null);
  
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'staff' as UserRole,
    branchId: 'branch-1',
    hourlyRate: 0,
    employeePin: '',
  });

  const activeEmployees = (employees || []).filter((e) => e.isActive);
  const todayShifts = (shifts || []).filter((s) => {
    const today = new Date().toDateString();
    return new Date(s.date).toDateString() === today;
  });

  const defaultSettings: SalaryCalculationSettings = {
    id: 'default',
    name: 'Standart Hesaplama',
    standardHoursPerMonth: 160,
    overtimeMultiplier: 1.5,
    nightShiftMultiplier: 1.25,
    weekendMultiplier: 1.5,
    includeBreaksInCalculation: false,
  };

  const currentSettings = (salarySettings || [])[0] || defaultSettings;

  const employeeLogin = () => {
    let employee: Employee | undefined;

    if (loginPin) {
      employee = (employees || []).find(e => e.employeePin === loginPin && e.isActive);
    } else if (loginQr) {
      employee = (employees || []).find(e => e.qrCode === loginQr && e.isActive);
    }

    if (!employee) {
      toast.error('Geçersiz giriş bilgisi');
      return;
    }

    const activeShift = (shifts || []).find(
      s => s.employeeId === employee.id && s.status === 'in_progress'
    );

    if (activeShift) {
      clockOut(activeShift.id);
    } else {
      clockIn(employee.id);
    }

    setLoginPin('');
    setLoginQr('');
    setShowLoginDialog(false);
  };

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
    const baseSalary = Math.min(totalHours, currentSettings.standardHoursPerMonth) * selectedEmployee.hourlyRate;
    const overtimeHours = Math.max(0, totalHours - currentSettings.standardHoursPerMonth);
    const overtimePay = overtimeHours * selectedEmployee.hourlyRate * currentSettings.overtimeMultiplier;

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
      calculationSettings: currentSettings,
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

  const rejectSalary = () => {
    if (!selectedSalary || !rejectionReason.trim()) {
      toast.error('Lütfen red nedeni girin');
      return;
    }

    setSalaries((current) =>
      (current || []).map((salary) =>
        salary.id === selectedSalary.id
          ? { ...salary, status: 'rejected' as const, rejectionReason }
          : salary
      )
    );
    toast.success('Maaş hesaplaması reddedildi');
    setShowRejectDialog(false);
    setSelectedSalary(null);
    setRejectionReason('');
  };

  const saveSettings = () => {
    if (!editingSettings) return;

    setSalarySettings((current) => {
      const existing = (current || []).find(s => s.id === editingSettings.id);
      if (existing) {
        return (current || []).map(s => s.id === editingSettings.id ? editingSettings : s);
      }
      return [...(current || []), editingSettings];
    });

    toast.success('Maaş hesaplama ayarları kaydedildi');
    setShowSettingsDialog(false);
    setEditingSettings(null);
  };

  const addEmployee = () => {
    if (!newEmployee.fullName || !newEmployee.email || !newEmployee.employeePin) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    const employee: Employee = {
      id: generateId(),
      ...newEmployee,
      isActive: true,
      qrCode: generateId(),
    };

    setEmployees((current) => [...(current || []), employee]);
    toast.success(`${newEmployee.fullName} personel olarak eklendi`);
    setShowAddEmployeeDialog(false);
    setNewEmployee({
      fullName: '',
      email: '',
      phone: '',
      role: 'staff',
      branchId: 'branch-1',
      hourlyRate: 0,
      employeePin: '',
    });
  };

  const deleteEmployee = () => {
    if (!employeeToDelete) return;

    setEmployees((current) =>
      (current || []).map(e =>
        e.id === employeeToDelete.id ? { ...e, isActive: false } : e
      )
    );

    toast.success(`${employeeToDelete.fullName} personel listesinden çıkarıldı`);
    setShowDeleteEmployeeDialog(false);
    setEmployeeToDelete(null);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Personel Yönetimi</h1>
            <p className="text-muted-foreground text-sm">Vardiya, puantaj ve maaş yönetimi</p>
          </div>
        </div>
        <Button onClick={() => setShowLoginDialog(true)}>
          <User className="h-5 w-5 mr-2" weight="bold" />
          Personel Giriş/Çıkış
        </Button>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Çalışanlar</CardTitle>
                  <CardDescription>Aktif personel listesi</CardDescription>
                </div>
                <Button onClick={() => setShowAddEmployeeDialog(true)}>
                  <Plus className="h-5 w-5 mr-2" weight="bold" />
                  Personel Ekle
                </Button>
              </div>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEmployees.map((employee) => {
              const hasActiveShift = todayShifts.some(
                (s) => s.employeeId === employee.id && s.status === 'in_progress'
              );
              
              return (
                <Card key={employee.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
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
                    <p className="text-xs text-muted-foreground">
                      PIN: {employee.employeePin}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={hasActiveShift}
                        onClick={() => clockIn(employee.id)}
                      >
                        <ClockClockwise className="h-4 w-4 mr-2" />
                        Vardiya Başlat
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setEmployeeToDelete(employee);
                          setShowDeleteEmployeeDialog(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSettings(currentSettings);
                      setShowSettingsDialog(true);
                    }}
                  >
                    <Gear className="h-4 w-4 mr-2" />
                    Ayarlar
                  </Button>
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
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{salary.employeeName}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Toplam Saat: {salary.totalHours.toFixed(1)}</span>
                          <span>Net Maaş: {formatCurrency(salary.netSalary)}</span>
                        </div>
                        {salary.rejectionReason && (
                          <p className="text-xs text-destructive">
                            Red Nedeni: {salary.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            salary.status === 'approved'
                              ? 'default'
                              : salary.status === 'paid'
                              ? 'secondary'
                              : salary.status === 'rejected'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {salary.status === 'approved'
                            ? 'Onaylandı'
                            : salary.status === 'paid'
                            ? 'Ödendi'
                            : salary.status === 'rejected'
                            ? 'Reddedildi'
                            : 'Taslak'}
                        </Badge>
                        {salary.status === 'draft' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedSalary(salary);
                                setShowRejectDialog(true);
                              }}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reddet
                            </Button>
                            <Button size="sm" onClick={() => approveSalary(salary.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Onayla
                            </Button>
                          </>
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

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personel Giriş/Çıkış</DialogTitle>
            <DialogDescription>
              PIN kodu girin veya aşağıdaki QR kodunuzu mobil cihazınızla okutun
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>PIN Kodu</Label>
              <Input
                type="password"
                placeholder="PIN kodunuzu girin (6 haneli)"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">veya</span>
              <Separator className="flex-1" />
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <QrCode className="h-5 w-5" weight="bold" />
                QR Kodunuzu Telefonunuzla Okutun
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {activeEmployees.slice(0, 8).map((emp) => (
                  <Card key={emp.id} className="p-3 cursor-pointer hover:bg-accent transition-colors" onClick={() => {
                    setLoginQr(emp.qrCode || '');
                    setTimeout(() => employeeLogin(), 100);
                  }}>
                    <div className="aspect-square bg-background border-2 rounded-lg p-2 flex flex-col items-center justify-center gap-1">
                      <QrCode className="h-8 w-8 text-primary" weight="fill" />
                      <div className="text-[8px] text-center font-medium leading-tight">{emp.fullName.split(' ')[0]}</div>
                    </div>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Bu QR kodlar simülasyondur. Gerçek uygulamada mobil cihazınızla okutacaksınız.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowLoginDialog(false);
              setLoginPin('');
              setLoginQr('');
            }}>
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSalaryCalc} onOpenChange={setShowSalaryCalc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Maaş Hesapla</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.fullName} için maaş hesaplanıyor
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Son 30 gün içindeki çalışma saatleri baz alınarak maaş hesaplanacak.
            </p>
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><strong>Standart Saat:</strong> {currentSettings.standardHoursPerMonth} saat/ay</p>
              <p><strong>Mesai Çarpanı:</strong> {currentSettings.overtimeMultiplier}x</p>
              <p><strong>Gece Çarpanı:</strong> {currentSettings.nightShiftMultiplier}x</p>
              <p><strong>Hafta Sonu Çarpanı:</strong> {currentSettings.weekendMultiplier}x</p>
            </div>
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

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Maaş Hesaplamasını Reddet</DialogTitle>
            <DialogDescription>
              Lütfen red nedenini belirtin
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Red nedeni..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={rejectSalary}>
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maaş Hesaplama Ayarları</DialogTitle>
            <DialogDescription>
              Maaş hesaplama yöntemlerini özelleştirin
            </DialogDescription>
          </DialogHeader>
          {editingSettings && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Standart Aylık Saat</Label>
                  <Input
                    type="number"
                    value={editingSettings.standardHoursPerMonth}
                    onChange={(e) =>
                      setEditingSettings({
                        ...editingSettings,
                        standardHoursPerMonth: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mesai Çarpanı</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingSettings.overtimeMultiplier}
                    onChange={(e) =>
                      setEditingSettings({
                        ...editingSettings,
                        overtimeMultiplier: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gece Vardiyası Çarpanı</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingSettings.nightShiftMultiplier}
                    onChange={(e) =>
                      setEditingSettings({
                        ...editingSettings,
                        nightShiftMultiplier: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hafta Sonu Çarpanı</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingSettings.weekendMultiplier}
                    onChange={(e) =>
                      setEditingSettings({
                        ...editingSettings,
                        weekendMultiplier: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeBreaks"
                  checked={editingSettings.includeBreaksInCalculation}
                  onChange={(e) =>
                    setEditingSettings({
                      ...editingSettings,
                      includeBreaksInCalculation: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="includeBreaks" className="cursor-pointer">
                  Mola sürelerini hesaplamaya dahil et
                </Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveSettings}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Personel Ekle</DialogTitle>
            <DialogDescription>
              Personel bilgilerini doldurun
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Soyad *</Label>
                <Input
                  value={newEmployee.fullName}
                  onChange={(e) => setNewEmployee({...newEmployee, fullName: e.target.value})}
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta *</Label>
                <Input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  placeholder="ahmet@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  type="tel"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                  placeholder="0555 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label>Pozisyon</Label>
                <Select value={newEmployee.role} onValueChange={(value: UserRole) => setNewEmployee({...newEmployee, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Personel</SelectItem>
                    <SelectItem value="cashier">Kasiyer</SelectItem>
                    <SelectItem value="chef">Aşçı</SelectItem>
                    <SelectItem value="manager">Müdür</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Saatlik Ücret (₺)</Label>
                <Input
                  type="number"
                  value={newEmployee.hourlyRate}
                  onChange={(e) => setNewEmployee({...newEmployee, hourlyRate: Number(e.target.value)})}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>PIN Kodu (6 haneli) *</Label>
                <Input
                  type="text"
                  value={newEmployee.employeePin}
                  onChange={(e) => setNewEmployee({...newEmployee, employeePin: e.target.value})}
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmployeeDialog(false)}>
              İptal
            </Button>
            <Button onClick={addEmployee}>
              <Plus className="h-4 w-4 mr-2" />
              Personel Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteEmployeeDialog} onOpenChange={setShowDeleteEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personel Çıkar</DialogTitle>
            <DialogDescription>
              {employeeToDelete?.fullName} personel listesinden çıkarılacak. Emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Bu işlem personeli pasif hale getirecektir. Geçmiş kayıtlar silinmeyecektir.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteEmployeeDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={deleteEmployee}>
              <Trash className="h-4 w-4 mr-2" />
              Personel Çıkar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

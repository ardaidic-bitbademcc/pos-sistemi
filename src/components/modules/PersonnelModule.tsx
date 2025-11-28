import { useState } from 'react';
import { useKV } from '../../hooks/use-kv-store';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ClockClockwise, Check, CurrencyCircleDollar, X, User, Gear, Plus, Trash, PencilSimple, Receipt, Money, CreditCard, Bank, DeviceMobile, Ticket } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Employee, Shift, SalaryCalculation, SalaryCalculationSettings, UserRole, CustomerAccount, CustomerTransaction, AuthSession } from '@/lib/types';
import { formatCurrency, formatDateTime, calculateHoursWorked, generateId, formatDate } from '@/lib/helpers';
import { useBranchFilter } from '@/hooks/use-branch-filter';
import Numpad from '@/components/Numpad';
import { Logger } from '@/lib/logger';

interface PersonnelModuleProps {
  onBack: () => void;
  authSession?: AuthSession | null;
}

export default function PersonnelModule({ onBack, authSession }: PersonnelModuleProps) {
  const adminId = authSession?.adminId;
  
  const [employees, setEmployees] = useKV<Employee[]>('employees', [], adminId);
  const [shifts, setShifts] = useKV<Shift[]>('shifts', [], adminId);
  const [salaries, setSalaries] = useKV<SalaryCalculation[]>('salaries', [], adminId);
  const [salarySettings, setSalarySettings] = useKV<SalaryCalculationSettings[]>('salarySettings', [], adminId);
  const [customerAccounts] = useKV<CustomerAccount[]>('customerAccounts', [], adminId);
  const [customerTransactions, setCustomerTransactions] = useKV<CustomerTransaction[]>('customerTransactions', [], adminId);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showSalaryCalc, setShowSalaryCalc] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  const [showDeleteEmployeeDialog, setShowDeleteEmployeeDialog] = useState(false);
  const [showEmployeeAccountDialog, setShowEmployeeAccountDialog] = useState(false);
  const [selectedEmployeeForAccount, setSelectedEmployeeForAccount] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<SalaryCalculation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [editingSettings, setEditingSettings] = useState<SalaryCalculationSettings | null>(null);
  const [showSalaryDetailDialog, setShowSalaryDetailDialog] = useState(false);
  const [salaryDetailForView, setSalaryDetailForView] = useState<SalaryCalculation | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'transfer' | 'multinet'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'staff' as UserRole,
    branchId: authSession?.branchId || 'branch-1',
    hourlyRate: 0,
    employeePin: '',
  });

  const { filteredItems: activeEmployees } = useBranchFilter(
    (employees || []).filter((e) => e.isActive),
    authSession
  );
  
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
    dailyMealAllowance: 0,
    includeMealAllowance: false,
  };

  const currentSettings = (salarySettings || [])[0] || defaultSettings;

  const employeeLogin = () => {
    Logger.debug('AUTH', 'PIN doğrulama başladı', {
      pinLength: loginPin?.length,
      branchId: authSession?.branchId,
      totalEmployees: (employees || []).length
    });
    
    let employee: Employee | undefined;

    if (loginPin) {
      const trimmedPin = loginPin.trim();
      Logger.debug('AUTH', 'PIN temizlendi', { 
        trimmedPinLength: trimmedPin.length,
        originalPinLength: loginPin.length
      });
      
      const allEmployees = employees || [];
      Logger.info('AUTH', `${allEmployees.length} çalışan kontrol ediliyor`, {
        activeBranchId: authSession?.branchId,
        employees: allEmployees.map(e => ({
          id: e.id,
          fullName: e.fullName,
          employeePinLength: e.employeePin?.length,
          isActive: e.isActive,
          branchId: e.branchId
        }))
      });
      
      employee = allEmployees.find(e => {
        const hasPin = !!e.employeePin;
        const trimmedEmployeePin = e.employeePin?.trim();
        const pinMatch = trimmedEmployeePin === trimmedPin;
        const isActiveEmployee = e.isActive;
        const branchMatch = !authSession?.branchId || e.branchId === authSession.branchId;
        
        Logger.debug('AUTH', `Çalışan kontrol: ${e.fullName}`, {
          employeeId: e.id,
          hasPin,
          employeePin: trimmedEmployeePin,
          enteredPin: trimmedPin,
          pinMatch,
          isActive: isActiveEmployee,
          branchMatch,
          overallMatch: hasPin && pinMatch && isActiveEmployee && branchMatch
        });
        
        return hasPin && pinMatch && isActiveEmployee && branchMatch;
      });
      
      if (employee) {
        Logger.success('AUTH', 'Çalışan bulundu', {
          employeeId: employee.id,
          employeeName: employee.fullName,
          branchId: employee.branchId
        });
      } else {
        Logger.warn('AUTH', 'Çalışan bulunamadı', {
          enteredPin: trimmedPin,
          branchId: authSession?.branchId,
          checkedEmployeeCount: allEmployees.length
        });
      }
    }

    if (!employee) {
      Logger.error('AUTH', 'PIN doğrulama başarısız', {
        pinProvided: !!loginPin,
        pinLength: loginPin?.length,
        branchId: authSession?.branchId
      });
      toast.error('Geçersiz PIN kodu veya bu şubede yetkiniz yok');
      setLoginPin('');
      return;
    }

    Logger.success('AUTH', 'PIN doğrulama başarılı', {
      employeeId: employee.id,
      employeeName: employee.fullName,
      branchId: employee.branchId
    }, {
      userId: employee.id,
      userName: employee.fullName,
      branchId: employee.branchId
    });

    const activeShift = (shifts || []).find(
      s => s.employeeId === employee.id && s.status === 'in_progress'
    );

    Logger.info('SHIFT', `Vardiya durumu: ${activeShift ? 'Çıkış yapılacak' : 'Giriş yapılacak'}`, {
      employeeId: employee.id,
      employeeName: employee.fullName,
      hasActiveShift: !!activeShift,
      activeShiftId: activeShift?.id
    });

    if (activeShift) {
      clockOut(activeShift.id);
    } else {
      clockIn(employee.id);
    }

    setLoginPin('');
    setShowLoginDialog(false);
  };

  const clockIn = (employeeId: string) => {
    const employee = employees?.find((e) => e.id === employeeId);
    if (!employee) {
      Logger.error('SHIFT', 'Giriş yapılamadı: Çalışan bulunamadı', { employeeId });
      return;
    }

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
    
    Logger.success('SHIFT', 'Vardiya başlatıldı', {
      shiftId: newShift.id,
      employeeId: employee.id,
      employeeName: employee.fullName,
      startTime: newShift.startTime
    }, {
      userId: employee.id,
      userName: employee.fullName,
      branchId: employee.branchId
    });
    
    toast.success(`${employee.fullName} vardiyaya başladı`);
  };

  const clockOut = (shiftId: string) => {
    const shift = (shifts || []).find(s => s.id === shiftId);
    if (!shift) {
      Logger.error('SHIFT', 'Çıkış yapılamadı: Vardiya bulunamadı', { shiftId });
      return;
    }
    
    setShifts((current) =>
      (current || []).map((shift) => {
        if (shift.id === shiftId && !shift.endTime) {
          const endTime = new Date().toISOString();
          const totalHours = calculateHoursWorked(shift.startTime, endTime, shift.breakDuration);
          
          Logger.success('SHIFT', 'Vardiya tamamlandı', {
            shiftId: shift.id,
            employeeId: shift.employeeId,
            employeeName: shift.employeeName,
            startTime: shift.startTime,
            endTime,
            totalHours,
            breakDuration: shift.breakDuration
          }, {
            userId: shift.employeeId,
            userName: shift.employeeName,
            branchId: shift.branchId
          });
          
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
      (s) => s.employeeId === selectedEmployee.id && s.status === 'completed' && 
      new Date(s.date) >= startDate && new Date(s.date) <= endDate
    );

    const totalHours = employeeShifts.reduce((sum, s) => sum + s.totalHours, 0);
    const standardHours = Math.min(totalHours, currentSettings.standardHoursPerMonth);
    const overtimeHours = Math.max(0, totalHours - currentSettings.standardHoursPerMonth);
    
    const baseSalary = standardHours * selectedEmployee.hourlyRate;
    const overtimePay = overtimeHours * selectedEmployee.hourlyRate * currentSettings.overtimeMultiplier;
    
    const workDays = employeeShifts.length;
    const mealAllowance = (currentSettings.includeMealAllowance && currentSettings.dailyMealAllowance) 
      ? workDays * currentSettings.dailyMealAllowance 
      : 0;

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
      netSalary: baseSalary + overtimePay + mealAllowance,
      status: 'draft',
      totalHours,
      standardHours,
      overtimeHours,
      workDays,
      mealAllowance,
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

    if (newEmployee.employeePin.length !== 4 || !/^\d{4}$/.test(newEmployee.employeePin)) {
      toast.error('PIN kodu 4 haneli rakam olmalıdır');
      return;
    }

    const pinExists = (employees || []).some(
      e => e.isActive && e.employeePin === newEmployee.employeePin
    );

    if (pinExists) {
      toast.error('Bu PIN kodu başka bir personel tarafından kullanılıyor');
      return;
    }

    const employee: Employee = {
      id: generateId(),
      ...newEmployee,
      branchId: authSession?.branchId || newEmployee.branchId,
      adminId: authSession?.adminId,
      isActive: true,
      qrCode: generateId(),
      createdAt: new Date().toISOString(),
    };

    setEmployees((current) => [...(current || []), employee]);
    toast.success(`${newEmployee.fullName} personel olarak eklendi`);
    setShowAddEmployeeDialog(false);
    setNewEmployee({
      fullName: '',
      email: '',
      phone: '',
      role: 'staff',
      branchId: authSession?.branchId || 'branch-1',
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

  const updateEmployee = () => {
    if (!employeeToEdit) return;

    if (!employeeToEdit.fullName || !employeeToEdit.email || !employeeToEdit.employeePin) {
      toast.error('Lütfen gerekli alanları doldurun');
      return;
    }

    if (employeeToEdit.employeePin.length !== 4 || !/^\d{4}$/.test(employeeToEdit.employeePin)) {
      toast.error('PIN kodu 4 haneli rakam olmalıdır');
      return;
    }

    const pinExists = (employees || []).some(
      e => e.isActive && e.id !== employeeToEdit.id && e.employeePin === employeeToEdit.employeePin
    );

    if (pinExists) {
      toast.error('Bu PIN kodu başka bir personel tarafından kullanılıyor');
      return;
    }

    setEmployees((current) =>
      (current || []).map(e =>
        e.id === employeeToEdit.id ? { ...employeeToEdit, updatedAt: new Date().toISOString() } : e
      )
    );

    toast.success(`${employeeToEdit.fullName} bilgileri güncellendi`);
    setShowEditEmployeeDialog(false);
    setEmployeeToEdit(null);
  };

  const openEmployeeAccount = (employee: Employee) => {
    setSelectedEmployeeForAccount(employee);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setShowEmployeeAccountDialog(true);
  };

  const getEmployeeAccount = (employeeId: string): CustomerAccount | undefined => {
    return (customerAccounts || []).find(a => a.employeeId === employeeId && a.isEmployee);
  };

  const getAccountTransactions = (accountId: string): CustomerTransaction[] => {
    return (customerTransactions || [])
      .filter(t => t.customerAccountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleMakePayment = () => {
    if (!selectedEmployeeForAccount) return;

    const account = getEmployeeAccount(selectedEmployeeForAccount.id);
    if (!account) {
      toast.error('Personel cari hesabı bulunamadı');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    const balanceBefore = account.currentBalance;
    const balanceAfter = balanceBefore - amount;

    const transaction: CustomerTransaction = {
      id: generateId(),
      customerAccountId: account.id,
      type: 'credit',
      amount: amount,
      description: 'Ödeme',
      paymentMethod: paymentMethod,
      date: new Date().toISOString(),
      createdBy: 'current-user',
      createdByName: 'Kullanıcı',
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      notes: paymentNotes || undefined,
    };

    setCustomerTransactions((current) => [...(current || []), transaction]);

    const accountsToUpdate = customerAccounts || [];
    const updatedAccounts = accountsToUpdate.map((acc) =>
      acc.id === account.id
        ? {
            ...acc,
            currentBalance: balanceAfter,
            totalPaid: acc.totalPaid + amount,
          }
        : acc
    );

    (window as any).spark.kv.set('customerAccounts', updatedAccounts);

    toast.success(`${formatCurrency(amount)} ödeme alındı`);
    setPaymentAmount('');
    setPaymentNotes('');
    setShowEmployeeAccountDialog(false);
    setSelectedEmployeeForAccount(null);
  };

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight truncate">Personel Yönetimi</h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">Vardiya, puantaj ve maaş yönetimi</p>
          </div>
        </div>
        <Button onClick={() => setShowLoginDialog(true)} className="w-full sm:w-auto text-xs sm:text-sm h-9">
          <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" weight="bold" />
          <span className="hidden sm:inline">Personel Giriş/Çıkış</span>
          <span className="sm:hidden">Giriş/Çıkış</span>
        </Button>
      </header>

      <Tabs defaultValue="shifts" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="shifts" className="flex-1 sm:flex-none text-xs sm:text-sm">Vardiya Takibi</TabsTrigger>
          <TabsTrigger value="employees" className="flex-1 sm:flex-none text-xs sm:text-sm">Çalışanlar</TabsTrigger>
          <TabsTrigger value="salaries" className="flex-1 sm:flex-none text-xs sm:text-sm">Maaş Hesaplama</TabsTrigger>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEmployees.map((employee) => {
              const hasActiveShift = todayShifts.some(
                (s) => s.employeeId === employee.id && s.status === 'in_progress'
              );
              const employeeAccount = getEmployeeAccount(employee.id);
              
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
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                    <p className="text-sm font-tabular-nums">
                      Saat Ücreti: {formatCurrency(employee.hourlyRate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PIN: {employee.employeePin}
                    </p>
                    
                    {employeeAccount && (
                      <div className="p-2 bg-muted rounded-lg space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Cari Borç:</span>
                          <span className={`font-semibold ${employeeAccount.currentBalance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {formatCurrency(employeeAccount.currentBalance)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Limit:</span>
                          <span className="font-semibold">{formatCurrency(employeeAccount.creditLimit)}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={hasActiveShift}
                        onClick={() => clockIn(employee.id)}
                        className="flex-1"
                      >
                        <ClockClockwise className="h-4 w-4 mr-1" />
                        Vardiya
                      </Button>
                      {employeeAccount && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openEmployeeAccount(employee)}
                          className="flex-1"
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          Cari
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmployeeToEdit(employee);
                          setShowEditEmployeeDialog(true);
                        }}
                        className="flex-1"
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setEmployeeToDelete(employee);
                          setShowDeleteEmployeeDialog(true);
                        }}
                        className="flex-1"
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
                          {salary.workDays && <span>Çalışılan Gün: {salary.workDays}</span>}
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSalaryDetailForView(salary);
                            setShowSalaryDetailDialog(true);
                          }}
                        >
                          Detaylar
                        </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Personel Giriş/Çıkış</DialogTitle>
            <DialogDescription>
              4 haneli PIN kodunuzu girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold font-tabular-nums tracking-widest min-h-[48px] flex items-center justify-center">
                  {loginPin ? '•'.repeat(loginPin.length) : '----'}
                </div>
              </div>
            </div>
            <Numpad 
              value={loginPin} 
              onChange={(val) => {
                if (val.length <= 4) {
                  setLoginPin(val);
                  if (val.length === 4) {
                    setTimeout(() => {
                      employeeLogin();
                    }, 300);
                  }
                }
              }}
              mode="number"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowLoginDialog(false);
              setLoginPin('');
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
                <div className="space-y-2">
                  <Label>Günlük Yemek Ücreti (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingSettings.dailyMealAllowance || 0}
                    onChange={(e) =>
                      setEditingSettings({
                        ...editingSettings,
                        dailyMealAllowance: Number(e.target.value),
                      })
                    }
                    disabled={!editingSettings.includeMealAllowance}
                  />
                  <p className="text-xs text-muted-foreground">
                    Çalışılan her gün için eklenecek yemek bedeli
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeMealAllowance"
                    checked={editingSettings.includeMealAllowance || false}
                    onChange={(e) =>
                      setEditingSettings({
                        ...editingSettings,
                        includeMealAllowance: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="includeMealAllowance" className="cursor-pointer">
                    Günlük yemek ücretini maaşa ekle
                  </Label>
                </div>
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
                    <SelectItem value="waiter">Garson</SelectItem>
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
                <Label>PIN Kodu (4 haneli) *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  value={newEmployee.employeePin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 4) {
                      setNewEmployee({...newEmployee, employeePin: value});
                    }
                  }}
                  placeholder="1234"
                  maxLength={4}
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

      <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personel Bilgilerini Düzenle</DialogTitle>
            <DialogDescription>
              Personel bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {employeeToEdit && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ad Soyad *</Label>
                  <Input
                    value={employeeToEdit.fullName}
                    onChange={(e) => setEmployeeToEdit({...employeeToEdit, fullName: e.target.value})}
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-posta *</Label>
                  <Input
                    type="email"
                    value={employeeToEdit.email}
                    onChange={(e) => setEmployeeToEdit({...employeeToEdit, email: e.target.value})}
                    placeholder="ahmet@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    type="tel"
                    value={employeeToEdit.phone}
                    onChange={(e) => setEmployeeToEdit({...employeeToEdit, phone: e.target.value})}
                    placeholder="0555 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pozisyon</Label>
                  <Select value={employeeToEdit.role} onValueChange={(value: UserRole) => setEmployeeToEdit({...employeeToEdit, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Personel</SelectItem>
                      <SelectItem value="cashier">Kasiyer</SelectItem>
                      <SelectItem value="chef">Aşçı</SelectItem>
                      <SelectItem value="manager">Müdür</SelectItem>
                      <SelectItem value="waiter">Garson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Saatlik Ücret (₺)</Label>
                  <Input
                    type="number"
                    value={employeeToEdit.hourlyRate}
                    onChange={(e) => setEmployeeToEdit({...employeeToEdit, hourlyRate: Number(e.target.value)})}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PIN Kodu (4 haneli) *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    value={employeeToEdit.employeePin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 4) {
                        setEmployeeToEdit({...employeeToEdit, employeePin: value});
                      }
                    }}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEmployeeDialog(false)}>
              İptal
            </Button>
            <Button onClick={updateEmployee}>
              <PencilSimple className="h-4 w-4 mr-2" />
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSalaryDetailDialog} onOpenChange={setShowSalaryDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Maaş Hesaplama Detayı</DialogTitle>
            <DialogDescription>
              {salaryDetailForView?.employeeName} - {salaryDetailForView && formatDate(salaryDetailForView.periodStart)} / {salaryDetailForView && formatDate(salaryDetailForView.periodEnd)}
            </DialogDescription>
          </DialogHeader>
          {salaryDetailForView && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Maaş</p>
                    <p className="text-3xl font-bold font-tabular-nums">
                      {formatCurrency(salaryDetailForView.netSalary)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      salaryDetailForView.status === 'approved'
                        ? 'default'
                        : salaryDetailForView.status === 'paid'
                        ? 'secondary'
                        : salaryDetailForView.status === 'rejected'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {salaryDetailForView.status === 'approved'
                      ? 'Onaylandı'
                      : salaryDetailForView.status === 'paid'
                      ? 'Ödendi'
                      : salaryDetailForView.status === 'rejected'
                      ? 'Reddedildi'
                      : 'Taslak'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-3">Hesaplama Detayları</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Standart Saat Ücreti</TableCell>
                      <TableCell className="text-right font-tabular-nums">
                        {salaryDetailForView.standardHours?.toFixed(1) || '0.0'} saat × {formatCurrency((employees || []).find(e => e.id === salaryDetailForView.employeeId)?.hourlyRate || 0)}/saat
                      </TableCell>
                      <TableCell className="text-right font-tabular-nums font-semibold">
                        {formatCurrency(salaryDetailForView.baseSalary)}
                      </TableCell>
                    </TableRow>
                    {salaryDetailForView.overtimeHours && salaryDetailForView.overtimeHours > 0 && (
                      <TableRow>
                        <TableCell className="font-medium">Mesai Ücreti</TableCell>
                        <TableCell className="text-right font-tabular-nums">
                          {salaryDetailForView.overtimeHours.toFixed(1)} saat × {formatCurrency((employees || []).find(e => e.id === salaryDetailForView.employeeId)?.hourlyRate || 0)}/saat × {salaryDetailForView.calculationSettings?.overtimeMultiplier || 1.5}x
                        </TableCell>
                        <TableCell className="text-right font-tabular-nums font-semibold">
                          {formatCurrency(salaryDetailForView.overtimePay)}
                        </TableCell>
                      </TableRow>
                    )}
                    {salaryDetailForView.mealAllowance && salaryDetailForView.mealAllowance > 0 && (
                      <TableRow>
                        <TableCell className="font-medium">Yemek Ücreti</TableCell>
                        <TableCell className="text-right font-tabular-nums">
                          {salaryDetailForView.workDays || 0} gün × {formatCurrency(salaryDetailForView.calculationSettings?.dailyMealAllowance || 0)}/gün
                        </TableCell>
                        <TableCell className="text-right font-tabular-nums font-semibold">
                          {formatCurrency(salaryDetailForView.mealAllowance)}
                        </TableCell>
                      </TableRow>
                    )}
                    {salaryDetailForView.bonuses > 0 && (
                      <TableRow>
                        <TableCell className="font-medium">Primler</TableCell>
                        <TableCell className="text-right font-tabular-nums">-</TableCell>
                        <TableCell className="text-right font-tabular-nums font-semibold text-accent">
                          +{formatCurrency(salaryDetailForView.bonuses)}
                        </TableCell>
                      </TableRow>
                    )}
                    {salaryDetailForView.deductions > 0 && (
                      <TableRow>
                        <TableCell className="font-medium">Kesintiler</TableCell>
                        <TableCell className="text-right font-tabular-nums">-</TableCell>
                        <TableCell className="text-right font-tabular-nums font-semibold text-destructive">
                          -{formatCurrency(salaryDetailForView.deductions)}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>Toplam Net Maaş</TableCell>
                      <TableCell className="text-right font-tabular-nums text-lg">
                        {formatCurrency(salaryDetailForView.netSalary)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-3">Çalışma İstatistikleri</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Toplam Saat</p>
                    <p className="text-xl font-bold font-tabular-nums">{salaryDetailForView.totalHours.toFixed(1)}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Standart Saat</p>
                    <p className="text-xl font-bold font-tabular-nums">{salaryDetailForView.standardHours?.toFixed(1) || '0.0'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Mesai Saati</p>
                    <p className="text-xl font-bold font-tabular-nums">{salaryDetailForView.overtimeHours?.toFixed(1) || '0.0'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Çalışılan Gün</p>
                    <p className="text-xl font-bold font-tabular-nums">{salaryDetailForView.workDays || 0}</p>
                  </div>
                </div>
              </div>

              {salaryDetailForView.calculationSettings && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Hesaplama Ayarları</h3>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Standart Aylık Saat:</span>
                        <span className="font-semibold">{salaryDetailForView.calculationSettings.standardHoursPerMonth} saat</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mesai Çarpanı:</span>
                        <span className="font-semibold">{salaryDetailForView.calculationSettings.overtimeMultiplier}x</span>
                      </div>
                      {salaryDetailForView.calculationSettings.includeMealAllowance && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Günlük Yemek Ücreti:</span>
                          <span className="font-semibold">{formatCurrency(salaryDetailForView.calculationSettings.dailyMealAllowance || 0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {salaryDetailForView.rejectionReason && (
                <>
                  <Separator />
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-1">Red Nedeni</p>
                    <p className="text-sm text-muted-foreground">{salaryDetailForView.rejectionReason}</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSalaryDetailDialog(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmployeeAccountDialog} onOpenChange={setShowEmployeeAccountDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Personel Cari Hesabı</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedEmployeeForAccount?.fullName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployeeForAccount && (() => {
            const account = getEmployeeAccount(selectedEmployeeForAccount.id);
            if (!account) {
              return (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Cari hesap bulunamadı. Lütfen sayfayı yenileyin.
                </div>
              );
            }
            const transactions = getAccountTransactions(account.id);
            return (
              <div className="space-y-4 py-2 sm:py-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm">Harcama Limiti</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{formatCurrency(account.creditLimit)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm">Mevcut Borç</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-destructive">
                        {formatCurrency(account.currentBalance)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm">Toplam Harcama</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{formatCurrency(account.totalDebt)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm">Toplam Ödeme</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-primary">
                        {formatCurrency(account.totalPaid)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {account.currentBalance > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Ödeme Al</h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label htmlFor="payment-amount" className="text-xs sm:text-sm">Ödeme Tutarı *</Label>
                          <Input
                            id="payment-amount"
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="h-10 sm:h-11 text-base sm:text-lg font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm">Ödeme Yöntemi</Label>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <Button
                              type="button"
                              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                              onClick={() => setPaymentMethod('cash')}
                              className="h-16 sm:h-20 flex flex-col gap-1"
                            >
                              <Money className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                              <span className="text-xs sm:text-sm">Nakit</span>
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === 'card' ? 'default' : 'outline'}
                              onClick={() => setPaymentMethod('card')}
                              className="h-16 sm:h-20 flex flex-col gap-1"
                            >
                              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                              <span className="text-xs sm:text-sm">Kredi Kartı</span>
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                              onClick={() => setPaymentMethod('transfer')}
                              className="h-16 sm:h-20 flex flex-col gap-1"
                            >
                              <Bank className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                              <span className="text-xs sm:text-sm">Havale/EFT</span>
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                              onClick={() => setPaymentMethod('mobile')}
                              className="h-16 sm:h-20 flex flex-col gap-1"
                            >
                              <DeviceMobile className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                              <span className="text-xs sm:text-sm">Mobil Ödeme</span>
                            </Button>
                            <Button
                              type="button"
                              variant={paymentMethod === 'multinet' ? 'default' : 'outline'}
                              onClick={() => setPaymentMethod('multinet')}
                              className="h-16 sm:h-20 flex flex-col gap-1 col-span-2"
                            >
                              <Ticket className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                              <span className="text-xs sm:text-sm">Multinet Açık Hesap</span>
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                          <Label htmlFor="payment-notes" className="text-xs sm:text-sm">Notlar</Label>
                          <Textarea
                            id="payment-notes"
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            placeholder="Ödeme notu..."
                            rows={2}
                            className="text-sm resize-none"
                          />
                        </div>

                        <Button onClick={handleMakePayment} className="w-full" size="sm">
                          <Money className="h-4 w-4 mr-1.5" weight="bold" />
                          Ödeme Al
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Son Hareketler</h3>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Henüz işlem bulunmuyor
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {transactions.slice(0, 10).map((transaction) => (
                        <Card key={transaction.id}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{transaction.description}</span>
                                  {transaction.paymentMethod && (
                                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                                      {transaction.paymentMethod === 'cash' && 'Nakit'}
                                      {transaction.paymentMethod === 'card' && 'Kart'}
                                      {transaction.paymentMethod === 'transfer' && 'Havale/EFT'}
                                      {transaction.paymentMethod === 'mobile' && 'Mobil'}
                                      {transaction.paymentMethod === 'multinet' && 'Multinet'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {formatDateTime(transaction.date)}
                                </div>
                                {transaction.saleNumber && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    Fiş: {transaction.saleNumber}
                                  </div>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div
                                  className={`text-base sm:text-lg font-bold ${
                                    transaction.type === 'debit' ? 'text-destructive' : 'text-primary'
                                  }`}
                                >
                                  {transaction.type === 'debit' ? '+' : '-'}
                                  {formatCurrency(transaction.amount)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Bakiye: {formatCurrency(transaction.balanceAfter)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEmployeeAccountDialog(false)} size="sm" className="text-sm">
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

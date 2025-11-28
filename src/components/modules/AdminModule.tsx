import { useState, useEffect } from 'react';
import { useKV } from '../../hooks/use-kv-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Buildings, 
  Users, 
  Plus, 
  PencilSimple, 
  Trash,
  Check,
  X,
  Eye,
  EyeSlash,
  ShieldCheck,
  MapPin,
  Phone,
  Envelope,
  Clock,
  TrendUp,
  ChartLine,
  UserCircle,
  LockKey,
  Database,
  Warning,
  Bug
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Branch, Employee, UserRole, AuthSession, RolePermissions } from '@/lib/types';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/helpers';
import LogViewer from '@/components/LogViewer';

interface AdminModuleProps {
  onBack: () => void;
  authSession?: AuthSession | null;
}

interface BranchStats {
  totalEmployees: number;
  activeEmployees: number;
  totalSales: number;
  monthlyRevenue: number;
}

export default function AdminModule({ onBack, authSession }: AdminModuleProps) {
  const adminId = authSession?.adminId;
  
  const [branches, setBranches] = useKV<Branch[]>('branches', [], adminId);
  const [employees, setEmployees] = useKV<Employee[]>('employees', [], adminId);
  const [rolePermissions] = useKV<RolePermissions[]>('rolePermissions', [], adminId);
  const [products, setProducts] = useKV<any[]>('products', [], adminId);
  const [categories, setCategories] = useKV<any[]>('categories', [], adminId);
  const [orders, setOrders] = useKV<any[]>('orders', [], adminId);
  const [transactions, setTransactions] = useKV<any[]>('transactions', [], adminId);
  const [customers, setCustomers] = useKV<any[]>('customers', [], adminId);
  const [tasks, setTasks] = useKV<any[]>('tasks', [], adminId);
  const [b2bOrders, setB2bOrders] = useKV<any[]>('b2bOrders', [], adminId);
  const [cashRegisters, setCashRegisters] = useKV<any[]>('cashRegisters', [], adminId);
  
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showDeleteBranchDialog, setShowDeleteBranchDialog] = useState(false);
  const [showDeleteEmployeeDialog, setShowDeleteEmployeeDialog] = useState(false);
  const [showDeleteDataDialog, setShowDeleteDataDialog] = useState(false);
  const [dataTypeToDelete, setDataTypeToDelete] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    managerName: '',
    isActive: true,
  });

  const [employeeForm, setEmployeeForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'staff' as UserRole,
    branchId: '',
    hourlyRate: 0,
    employeePin: '',
    isActive: true,
  });

  const resetBranchForm = () => {
    setBranchForm({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      managerName: '',
      isActive: true,
    });
    setIsEditMode(false);
    setSelectedBranch(null);
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      fullName: '',
      email: '',
      phone: '',
      role: 'staff',
      branchId: '',
      hourlyRate: 0,
      employeePin: '',
      isActive: true,
    });
    setIsEditMode(false);
    setSelectedEmployee(null);
  };

  const generateBranchCode = (name: string): string => {
    const prefix = name
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 3);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${timestamp}`;
  };

  const generateEmployeePin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const generateId = (prefix: string = ''): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
  };

  const handleAddBranch = () => {
    resetBranchForm();
    setShowBranchDialog(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setBranchForm({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      email: branch.email || '',
      managerName: branch.managerName || '',
      isActive: branch.isActive,
    });
    setIsEditMode(true);
    setShowBranchDialog(true);
  };

  const handleSaveBranch = () => {
    if (!branchForm.name || !branchForm.address || !branchForm.phone) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (isEditMode && selectedBranch) {
      setBranches((current) => 
        (current || []).map((b) => 
          b.id === selectedBranch.id 
            ? { 
                ...b, 
                ...branchForm,
                updatedAt: new Date().toISOString(),
              } 
            : b
        )
      );
      toast.success('Şube başarıyla güncellendi');
    } else {
      const newBranch: Branch = {
        id: generateId('branch'),
        ...branchForm,
        code: branchForm.code || generateBranchCode(branchForm.name),
        adminId: authSession?.userId || 'admin-1',
        createdAt: new Date().toISOString(),
      };
      setBranches((current) => [...(current || []), newBranch]);
      toast.success('Yeni şube eklendi');
    }

    setShowBranchDialog(false);
    resetBranchForm();
  };

  const handleDeleteBranch = (branch: Branch) => {
    const branchEmployees = (employees || []).filter(e => e.branchId === branch.id);
    
    if (branchEmployees.length > 0) {
      toast.error(`Bu şubede ${branchEmployees.length} çalışan var. Önce çalışanları kaldırın veya taşıyın.`);
      return;
    }

    setBranchToDelete(branch);
    setShowDeleteBranchDialog(true);
  };

  const confirmDeleteBranch = () => {
    if (branchToDelete) {
      setBranches((current) => (current || []).filter(b => b.id !== branchToDelete.id));
      toast.success('Şube silindi');
      setShowDeleteBranchDialog(false);
      setBranchToDelete(null);
    }
  };

  const handleAddEmployee = (branchId?: string) => {
    resetEmployeeForm();
    if (branchId) {
      setEmployeeForm(prev => ({ ...prev, branchId }));
    }
    setShowEmployeeDialog(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      branchId: employee.branchId,
      hourlyRate: employee.hourlyRate,
      employeePin: employee.employeePin,
      isActive: employee.isActive,
    });
    setIsEditMode(true);
    setShowEmployeeDialog(true);
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.fullName || !employeeForm.branchId || !employeeForm.role) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (isEditMode && selectedEmployee) {
      setEmployees((current) => 
        (current || []).map((e) => 
          e.id === selectedEmployee.id 
            ? { 
                ...e, 
                ...employeeForm,
                updatedAt: new Date().toISOString(),
              } 
            : e
        )
      );
      toast.success('Çalışan bilgileri güncellendi');
    } else {
      const newEmployee: Employee = {
        id: generateId('emp'),
        ...employeeForm,
        employeePin: employeeForm.employeePin || generateEmployeePin(),
        qrCode: `QR-${generateId('qr')}`,
        joinDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setEmployees((current) => [...(current || []), newEmployee]);
      toast.success('Yeni çalışan eklendi');
    }

    setShowEmployeeDialog(false);
    resetEmployeeForm();
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteEmployeeDialog(true);
  };

  const confirmDeleteEmployee = () => {
    if (employeeToDelete) {
      setEmployees((current) => (current || []).filter(e => e.id !== employeeToDelete.id));
      toast.success('Çalışan silindi');
      setShowDeleteEmployeeDialog(false);
      setEmployeeToDelete(null);
    }
  };

  const toggleBranchStatus = (branch: Branch) => {
    setBranches((current) => 
      (current || []).map((b) => 
        b.id === branch.id 
          ? { ...b, isActive: !b.isActive, updatedAt: new Date().toISOString() } 
          : b
      )
    );
    toast.success(`Şube ${!branch.isActive ? 'aktif' : 'pasif'} edildi`);
  };

  const toggleEmployeeStatus = (employee: Employee) => {
    setEmployees((current) => 
      (current || []).map((e) => 
        e.id === employee.id 
          ? { ...e, isActive: !e.isActive, updatedAt: new Date().toISOString() } 
          : e
      )
    );
    toast.success(`Çalışan ${!employee.isActive ? 'aktif' : 'pasif'} edildi`);
  };

  const getBranchStats = (branchId: string): BranchStats => {
    const branchEmployees = (employees || []).filter(e => e.branchId === branchId);
    return {
      totalEmployees: branchEmployees.length,
      activeEmployees: branchEmployees.filter(e => e.isActive).length,
      totalSales: 0,
      monthlyRevenue: 0,
    };
  };

  const filteredBranches = (branches || []).filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         branch.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && branch.isActive) ||
                         (filterStatus === 'inactive' && !branch.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredEmployees = (employees || []).filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.employeePin.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && employee.isActive) ||
                         (filterStatus === 'inactive' && !employee.isActive);
    const matchesRole = filterRole === 'all' || employee.role === filterRole;
    const matchesBranch = selectedBranchFilter === 'all' || employee.branchId === selectedBranchFilter;
    return matchesSearch && matchesStatus && matchesRole && matchesBranch;
  });

  const getRoleName = (role: UserRole): string => {
    const roleNames: Record<UserRole, string> = {
      owner: 'Sahibi',
      manager: 'Admin/Yönetici',
      cashier: 'Kasiyer',
      chef: 'Şef',
      staff: 'Personel',
      waiter: 'Garson',
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role: UserRole): string => {
    const roleColors: Record<UserRole, string> = {
      owner: 'bg-purple-500',
      manager: 'bg-blue-500',
      cashier: 'bg-green-500',
      chef: 'bg-orange-500',
      staff: 'bg-gray-500',
      waiter: 'bg-cyan-500',
    };
    return roleColors[role] || 'bg-gray-500';
  };

  const handleDeleteData = (dataType: string) => {
    setDataTypeToDelete(dataType);
    setShowDeleteDataDialog(true);
  };

  const confirmDeleteData = () => {
    switch (dataTypeToDelete) {
      case 'products':
        setProducts([]);
        toast.success('Tüm ürünler silindi');
        break;
      case 'employees':
        setEmployees([]);
        toast.success('Tüm çalışanlar silindi');
        break;
      case 'orders':
        setOrders([]);
        toast.success('Tüm siparişler silindi');
        break;
      case 'transactions':
        setTransactions([]);
        toast.success('Tüm işlemler silindi');
        break;
      case 'customers':
        setCustomers([]);
        toast.success('Tüm müşteriler silindi');
        break;
      case 'tasks':
        setTasks([]);
        toast.success('Tüm görevler silindi');
        break;
      case 'b2bOrders':
        setB2bOrders([]);
        toast.success('Tüm B2B siparişleri silindi');
        break;
      case 'cashRegisters':
        setCashRegisters([]);
        toast.success('Tüm kasa kayıtları silindi');
        break;
      case 'all':
        setProducts([]);
        setEmployees([]);
        setOrders([]);
        setTransactions([]);
        setCustomers([]);
        setTasks([]);
        setB2bOrders([]);
        setCashRegisters([]);
        toast.success('Tüm veriler silindi');
        break;
      default:
        break;
    }
    setShowDeleteDataDialog(false);
    setDataTypeToDelete('');
  };

  const getDataTypeName = (type: string): string => {
    const names: Record<string, string> = {
      products: 'Ürünler',
      employees: 'Çalışanlar',
      orders: 'Siparişler',
      transactions: 'İşlemler',
      customers: 'Müşteriler',
      tasks: 'Görevler',
      b2bOrders: 'B2B Siparişleri',
      cashRegisters: 'Kasa Kayıtları',
      all: 'TÜM VERİLER',
    };
    return names[type] || type;
  };

  return (
    <div className="min-h-screen p-3 sm:p-6 space-y-4 sm:space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight">Admin Paneli</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Merkezi şube ve kullanıcı yönetimi</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="branches" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branches" className="flex items-center gap-2">
            <Buildings className="h-4 w-4" />
            <span>Şubeler</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Kullanıcılar</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Veri Yönetimi</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            <span>Loglar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Şube ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddBranch} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Şube
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBranches.map((branch) => {
              const stats = getBranchStats(branch.id);
              return (
                <Card key={branch.id} className={!branch.isActive ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {branch.name}
                          {!branch.isActive && (
                            <Badge variant="secondary" className="text-xs">Pasif</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Buildings className="h-3 w-3" />
                          {branch.code}
                        </CardDescription>
                      </div>
                      <Switch
                        checked={branch.isActive}
                        onCheckedChange={() => toggleBranchStatus(branch)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{branch.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{branch.phone}</span>
                      </div>
                      {branch.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Envelope className="h-4 w-4 shrink-0" />
                          <span className="truncate">{branch.email}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Çalışanlar</div>
                        <div className="font-semibold">{stats.activeEmployees} / {stats.totalEmployees}</div>
                      </div>
                      {branch.managerName && (
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Yönetici</div>
                          <div className="font-semibold truncate">{branch.managerName}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditBranch(branch)}
                      >
                        <PencilSimple className="h-4 w-4 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddEmployee(branch.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Çalışan
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBranch(branch)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredBranches.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Şube bulunamadı
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Çalışan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Şube" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şubeler</SelectItem>
                  {(branches || []).map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={(value: any) => setFilterRole(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Roller</SelectItem>
                  <SelectItem value="owner">Sahibi</SelectItem>
                  <SelectItem value="manager">Yönetici</SelectItem>
                  <SelectItem value="cashier">Kasiyer</SelectItem>
                  <SelectItem value="chef">Şef</SelectItem>
                  <SelectItem value="staff">Personel</SelectItem>
                  <SelectItem value="waiter">Garson</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleAddEmployee()} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Çalışan
            </Button>
          </div>

          <Card>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Çalışan</TableHead>
                    <TableHead>Şube</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Saat Ücreti</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const branch = (branches || []).find(b => b.id === employee.branchId);
                    return (
                      <TableRow key={employee.id} className={!employee.isActive ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-8 w-8 text-muted-foreground" weight="fill" />
                            <div>
                              <div className="font-medium">{employee.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                {employee.joinDate ? formatDateTime(employee.joinDate) : 'Tarih yok'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Buildings className="h-4 w-4 text-muted-foreground" />
                            <span>{branch?.name || 'Bilinmiyor'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(employee.role)} text-white`}>
                            {getRoleName(employee.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-mono text-sm">
                            <LockKey className="h-4 w-4 text-muted-foreground" />
                            {employee.employeePin}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {employee.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{employee.phone}</span>
                              </div>
                            )}
                            {employee.email && (
                              <div className="flex items-center gap-1">
                                <Envelope className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{employee.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(employee.hourlyRate)}/sa</TableCell>
                        <TableCell>
                          <Switch
                            checked={employee.isActive}
                            onCheckedChange={() => toggleEmployeeStatus(employee)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <PencilSimple className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>

          {filteredEmployees.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Çalışan bulunamadı
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <Card className="border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Sistem Debug Bilgileri
              </CardTitle>
              <CardDescription>
                Mevcut oturum ve şube bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <span className="font-medium">Admin ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">{authSession?.adminId || 'Yok'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium">Branch ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">{authSession?.branchId || 'Yok'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium">User ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">{authSession?.userId || 'Yok'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium">User Role:</span>
                  <p className="text-muted-foreground font-mono text-xs">{authSession?.userRole || 'Yok'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium">Toplam Şube:</span>
                  <p className="text-muted-foreground font-mono text-xs">{(branches || []).length}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium">Aktif Şube:</span>
                  <p className="text-muted-foreground font-mono text-xs">
                    {(branches || []).filter(b => b.isActive && b.adminId === authSession?.adminId).length}
                  </p>
                </div>
              </div>
              {authSession?.branchId && (
                <div className="pt-3 border-t">
                  <span className="font-medium text-sm">Mevcut Şube:</span>
                  <p className="text-muted-foreground text-sm mt-1">
                    {(branches || []).find(b => b.id === authSession.branchId)?.name || 'Şube bulunamadı!'}
                  </p>
                </div>
              )}
              {(!authSession?.branchId || !(branches || []).find(b => b.id === authSession?.branchId)) && (
                <div className="pt-3 border-t">
                  <Badge variant="destructive" className="w-full justify-center">
                    <Warning className="h-4 w-4 mr-2" />
                    Şube bilgisi bulunamadı veya geçersiz!
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Veri Yönetimi
              </CardTitle>
              <CardDescription>
                Sistemdeki verileri toplu olarak silebilirsiniz. Bu işlemler geri alınamaz!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Ürünler</CardTitle>
                    <CardDescription>
                      Toplam: {(products || []).length} ürün
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDeleteData('products')}
                      disabled={(products || []).length === 0}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Tüm Ürünleri Sil
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Çalışanlar</CardTitle>
                    <CardDescription>
                      Toplam: {(employees || []).length} çalışan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDeleteData('employees')}
                      disabled={(employees || []).length === 0}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Tüm Çalışanları Sil
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Siparişler</CardTitle>
                    <CardDescription>
                      Toplam: {(orders || []).length} sipariş
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDeleteData('orders')}
                      disabled={(orders || []).length === 0}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Tüm Siparişleri Sil
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">İşlemler</CardTitle>
                    <CardDescription>
                      Toplam: {(transactions || []).length} işlem
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDeleteData('transactions')}
                      disabled={(transactions || []).length === 0}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Tüm İşlemleri Sil
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Müşteriler</CardTitle>
                    <CardDescription>
                      Toplam: {(customers || []).length} müşteri
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDeleteData('customers')}
                      disabled={(customers || []).length === 0}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Tüm Müşterileri Sil
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Görevler</CardTitle>
                    <CardDescription>
                      Toplam: {(tasks || []).length} görev
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDeleteData('tasks')}
                      disabled={(tasks || []).length === 0}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Tüm Görevleri Sil
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">B2B Siparişleri</CardTitle>
                    <CardDescription>
                      Toplam: {(b2bOrders || []).length} sipariş
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDeleteData('b2bOrders')}
                      disabled={(b2bOrders || []).length === 0}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Tüm B2B Siparişlerini Sil
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Kasa Kayıtları</CardTitle>
                    <CardDescription>
                      Toplam: {(cashRegisters || []).length} kayıt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDeleteData('cashRegisters')}
                      disabled={(cashRegisters || []).length === 0}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Tüm Kasa Kayıtlarını Sil
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-6" />

              <Card className="border-4 border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Warning className="h-6 w-6" weight="fill" />
                    Tehlikeli Bölge
                  </CardTitle>
                  <CardDescription>
                    Aşağıdaki işlem tüm verileri kalıcı olarak silecektir. Bu işlem geri alınamaz!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    size="lg"
                    className="w-full"
                    onClick={() => handleDeleteData('all')}
                  >
                    <Trash className="h-5 w-5 mr-2" weight="fill" />
                    TÜM VERİLERİ SİL
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <LogViewer />
        </TabsContent>
      </Tabs>

      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
            </DialogTitle>
            <DialogDescription>
              Şube bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branchName">Şube Adı *</Label>
                <Input
                  id="branchName"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="Örn: Merkez Şube"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchCode">Şube Kodu</Label>
                <Input
                  id="branchCode"
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  placeholder="Otomatik oluşturulur"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchAddress">Adres *</Label>
              <Input
                id="branchAddress"
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                placeholder="Tam adres"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branchPhone">Telefon *</Label>
                <Input
                  id="branchPhone"
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="0 (555) 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchEmail">E-posta</Label>
                <Input
                  id="branchEmail"
                  type="email"
                  value={branchForm.email}
                  onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                  placeholder="sube@sirket.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="managerName">Şube Yöneticisi</Label>
              <Input
                id="managerName"
                value={branchForm.managerName}
                onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                placeholder="Yönetici adı"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="branchActive"
                checked={branchForm.isActive}
                onCheckedChange={(checked) => setBranchForm({ ...branchForm, isActive: checked })}
              />
              <Label htmlFor="branchActive">Şube aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBranchDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveBranch}>
              {isEditMode ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Çalışan Düzenle' : 'Yeni Çalışan Ekle'}
            </DialogTitle>
            <DialogDescription>
              Çalışan bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeName">Ad Soyad *</Label>
              <Input
                id="employeeName"
                value={employeeForm.fullName}
                onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeBranch">Şube *</Label>
                <Select 
                  value={employeeForm.branchId} 
                  onValueChange={(value) => setEmployeeForm({ ...employeeForm, branchId: value })}
                >
                  <SelectTrigger id="employeeBranch">
                    <SelectValue placeholder="Şube seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(branches || []).filter(b => b.isActive).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeRole">Rol *</Label>
                <Select 
                  value={employeeForm.role} 
                  onValueChange={(value: UserRole) => setEmployeeForm({ ...employeeForm, role: value })}
                >
                  <SelectTrigger id="employeeRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Personel</SelectItem>
                    <SelectItem value="waiter">Garson</SelectItem>
                    <SelectItem value="cashier">Kasiyer</SelectItem>
                    <SelectItem value="chef">Şef</SelectItem>
                    <SelectItem value="manager">Yönetici</SelectItem>
                    <SelectItem value="owner">Sahibi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeePhone">Telefon</Label>
                <Input
                  id="employeePhone"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  placeholder="0 (555) 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeEmail">E-posta</Label>
                <Input
                  id="employeeEmail"
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  placeholder="ahmet@sirket.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeRate">Saat Ücreti (₺)</Label>
                <Input
                  id="employeeRate"
                  type="number"
                  value={employeeForm.hourlyRate}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeePin">PIN Kodu (4 Haneli)</Label>
                <div className="flex gap-2">
                  <Input
                    id="employeePin"
                    value={employeeForm.employeePin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setEmployeeForm({ ...employeeForm, employeePin: value });
                    }}
                    placeholder="1234"
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmployeeForm({ ...employeeForm, employeePin: generateEmployeePin() })}
                  >
                    Oluştur
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="employeeActive"
                checked={employeeForm.isActive}
                onCheckedChange={(checked) => setEmployeeForm({ ...employeeForm, isActive: checked })}
              />
              <Label htmlFor="employeeActive">Çalışan aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveEmployee}>
              {isEditMode ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteBranchDialog} onOpenChange={setShowDeleteBranchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şube Sil</DialogTitle>
            <DialogDescription>
              {branchToDelete?.name} şubesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteBranchDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBranch}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteEmployeeDialog} onOpenChange={setShowDeleteEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Çalışan Sil</DialogTitle>
            <DialogDescription>
              {employeeToDelete?.fullName} çalışanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteEmployeeDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEmployee}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDataDialog} onOpenChange={setShowDeleteDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Warning className="h-5 w-5" weight="fill" />
              Veri Silme Onayı
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold">{getDataTypeName(dataTypeToDelete)}</span> kalıcı olarak silinecektir. Bu işlem geri alınamaz!
              <br />
              <br />
              Devam etmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDataDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmDeleteData}>
              Evet, Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

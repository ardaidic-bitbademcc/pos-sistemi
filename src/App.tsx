import { useState, useEffect, useRef } from 'react';
import { useKV } from './hooks/use-kv-store';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  SignOut, 
  CurrencyCircleDollar, 
  Shield, 
  Buildings, 
  LockKey, 
  ClockClockwise,
  Warning 
} from '@phosphor-icons/react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Login from '@/components/Login';
import RegisterLogin from '@/components/RegisterLogin';
import SupplierLogin from '@/components/SupplierLogin';
import SupplierDashboard from '@/components/SupplierDashboard';
import BranchSelector from '@/components/BranchSelector';
import Dashboard from '@/components/Dashboard';
import POSModule from '@/components/modules/POSModule';
import PersonnelModule from '@/components/modules/PersonnelModule';
import BranchModule from '@/components/modules/BranchModule';
import MenuModule from '@/components/modules/MenuModule';
import FinanceModule from '@/components/modules/FinanceModule';
import SettingsModule from '@/components/modules/SettingsModule';
import ReportsModule from '@/components/modules/ReportsModule';
import RoleManagementModule from '@/components/modules/RoleManagementModule';
import CashModule from '@/components/modules/CashModule';
import QRMenuModule from '@/components/modules/QRMenuModule';
import TaskManagementModule from '@/components/modules/TaskManagementModule';
import B2BModule from '@/components/modules/B2BModule';
import CustomerAccountModule from '@/components/modules/CustomerAccountModule';
import AdminModule from '@/components/modules/AdminModule';
import CashRegisterMonitor from '@/components/CashRegisterMonitor';
import DataMigration from '@/components/DataMigration';
import { useSeedData } from '@/hooks/use-seed-data';
import { useAutoEmployeeAccounts } from '@/hooks/use-auto-employee-accounts';
import { useTaskReminders } from '@/hooks/use-task-reminders';
import { checkMigrationStatus } from '@/lib/data-migration';
import { Logger } from '@/lib/logger';
import type { UserRole, AuthSession, Branch, SupplierAuthSession } from '@/lib/types';
import { toast } from 'sonner';

export type Module = 'dashboard' | 'pos' | 'personnel' | 'branch' | 'menu' | 'finance' | 'settings' | 'reports' | 'roles' | 'cash' | 'qrmenu' | 'tasks' | 'b2b' | 'customers' | 'admin' | 'cash-monitor';

type LoginMode = 'customer' | 'supplier' | 'demo';

function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authSession, setAuthSession] = useKV<AuthSession | null>('authSession', null);
  const [supplierSession, setSupplierSession] = useKV<SupplierAuthSession | null>('supplierSession', null);
  const [loginMode, setLoginMode] = useState<LoginMode>('customer');
  const [currentUserRole, setCurrentUserRole] = useKV<UserRole>('currentUserRole', 'owner');
  const [currentUserName, setCurrentUserName] = useState('');
  const [useOldAuth, setUseOldAuth] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState<boolean | null>(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [showBranchConfirmDialog, setShowBranchConfirmDialog] = useState(false);
  const [branches] = useKV<Branch[]>('branches', []);
  const sessionValidated = useRef(false);
  
  useSeedData();
  useAutoEmployeeAccounts();
  useTaskReminders(authSession);

  useEffect(() => {
    const checkMigration = async () => {
      const status = await checkMigrationStatus();
      setMigrationCompleted(status?.migrated || false);
    };
    checkMigration();
  }, []);

  useEffect(() => {
    if (authSession && isAuthenticated && loginMode === 'customer' && !sessionValidated.current) {
      sessionValidated.current = true;
      
      const adminBranches = (branches || []).filter(
        (b) => b.isActive && authSession.adminId && b.adminId === authSession.adminId
      );
      
      Logger.info('SESSION', 'Session doğrulanıyor', {
        adminId: authSession.adminId,
        branchId: authSession.branchId,
        totalBranches: (branches || []).length,
        adminBranches: adminBranches.length
      });
      
      if (adminBranches.length === 0) {
        Logger.error('SESSION', 'Geçersiz session: Aktif şube bulunamadı', {
          adminId: authSession.adminId,
          branchId: authSession.branchId
        });
        toast.error('Şube bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        handleSwitchUser();
        sessionValidated.current = false;
        return;
      }

      const currentBranch = adminBranches.find((b) => b.id === authSession.branchId);
      
      if (!currentBranch) {
        Logger.warn('SESSION', 'Mevcut şube bulunamadı, ilk şubeye geçiliyor', {
          oldBranchId: authSession.branchId,
          newBranchId: adminBranches[0].id,
          newBranchName: adminBranches[0].name
        });
        
        const updatedSession: AuthSession = {
          ...authSession,
          branchId: adminBranches[0].id,
        };
        setAuthSession(updatedSession);
        toast.info(`${adminBranches[0].name} şubesine geçildi`);
      } else {
        Logger.success('SESSION', 'Session geçerli', {
          branchId: currentBranch.id,
          branchName: currentBranch.name
        });
      }
    }
  }, [authSession, branches, isAuthenticated, loginMode]);

  useEffect(() => {
    if (!isAuthenticated || loginMode !== 'customer') {
      sessionValidated.current = false;
    }
  }, [isAuthenticated, loginMode]);

  const handleAuthSuccess = (session: AuthSession) => {
    setAuthSession(session);
    setCurrentUserRole(session.userRole);
    setCurrentUserName(session.userName);
    setIsAuthenticated(true);
    setLoginMode('customer');
    setActiveModule('dashboard');
  };

  const handleSupplierAuthSuccess = (session: SupplierAuthSession) => {
    setSupplierSession(session);
    setIsAuthenticated(true);
    setLoginMode('supplier');
  };

  const handleLogin = (role: UserRole, userName: string) => {
    setCurrentUserRole(role);
    setCurrentUserName(userName);
    setIsAuthenticated(true);
    setLoginMode('demo');
    setActiveModule('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSupplierSession(null);
    setLoginMode('customer');
    setActiveModule('dashboard');
    setShowBranchSelector(false);
    setUseOldAuth(false);
  };

  const handleSwitchUser = () => {
    setIsAuthenticated(false);
    setAuthSession(null);
    setSupplierSession(null);
    setLoginMode('customer');
    setActiveModule('dashboard');
    setCurrentUserName('');
    setShowBranchSelector(false);
  };

  const handleSelectBranch = (branchId: string) => {
    if (authSession) {
      const branch = branches?.find((b) => b.id === branchId);
      const updatedSession: AuthSession = {
        ...authSession,
        branchId,
      };
      setAuthSession(updatedSession);
      setShowBranchSelector(false);
      toast.success(`${branch?.name} şubesine geçildi`);
    }
  };

  const openBranchSelector = () => {
    setShowBranchConfirmDialog(true);
  };

  const handleConfirmBranchSwitch = () => {
    setShowBranchConfirmDialog(false);
    setShowBranchSelector(true);
  };

  const handleCancelBranchSwitch = () => {
    setShowBranchConfirmDialog(false);
  };

  if (migrationCompleted === null) {
    return null;
  }

  if (!migrationCompleted) {
    return <DataMigration />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} currentUserRole={currentUserRole} authSession={authSession} />;
      case 'pos':
        return <POSModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole} authSession={authSession} />;
      case 'personnel':
        return <PersonnelModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'branch':
        return <BranchModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'menu':
        return <MenuModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'finance':
        return <FinanceModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'settings':
        return <SettingsModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'reports':
        return <ReportsModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'roles':
        return <RoleManagementModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'cash':
        return <CashModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole} authSession={authSession} />;
      case 'qrmenu':
        return <QRMenuModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'tasks':
        return <TaskManagementModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole} currentUserId={authSession?.userId || 'user-1'} currentUserName={currentUserName} authSession={authSession} />;
      case 'b2b':
        return <B2BModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole || 'owner'} currentUserName={currentUserName} authSession={authSession} />;
      case 'customers':
        return <CustomerAccountModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'admin':
        return <AdminModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      case 'cash-monitor':
        return <CashRegisterMonitor onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      default:
        return <Dashboard onNavigate={setActiveModule} currentUserRole={currentUserRole} authSession={authSession} />;
    }
  };

  if (!isAuthenticated) {
    if (loginMode === 'supplier') {
      return <SupplierLogin onSuccess={handleSupplierAuthSuccess} onBack={() => setLoginMode('customer')} />;
    }
    if (useOldAuth) {
      return <Login onLogin={handleLogin} />;
    }
    return (
      <div>
        <RegisterLogin onSuccess={handleAuthSuccess} />
        <div className="fixed bottom-4 left-4 z-50">
          <Button variant="outline" size="sm" onClick={() => setUseOldAuth(true)}>
            Demo Giriş
          </Button>
        </div>
      </div>
    );
  }

  if (loginMode === 'supplier' && supplierSession) {
    return (
      <>
        <SupplierDashboard session={supplierSession} onLogout={handleLogout} />
        <Toaster position="top-right" />
      </>
    );
  }

  if (showBranchSelector && authSession) {
    return <BranchSelector authSession={authSession} onSelectBranch={handleSelectBranch} />;
  }

  const adminBranches = (branches || []).filter(
    (b) => b.isActive && authSession?.adminId && b.adminId === authSession.adminId
  );
  const currentBranch = adminBranches.find((b) => b.id === authSession?.branchId);

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Şube</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Buildings className="h-4 w-4" weight="fill" />
                    <span className="truncate">{currentBranch?.name || 'Şube'}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {adminBranches.length > 1 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={openBranchSelector}>
                      <Buildings className="h-4 w-4" weight="fill" />
                      <span>Şube Değiştir</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {(currentUserRole === 'owner' || currentUserRole === 'manager') && (
            <SidebarGroup>
              <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {currentUserRole === 'owner' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => setActiveModule('admin')}>
                        <Shield className="h-4 w-4" weight="fill" />
                        <span>Admin</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveModule('cash-monitor')}>
                      <ClockClockwise className="h-4 w-4" weight="fill" />
                      <span>İzleme</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {currentUserRole === 'owner' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => setActiveModule('roles')}>
                        <Shield className="h-4 w-4" weight="fill" />
                        <span>Yetki</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>

      <main className="flex-1 min-h-screen bg-background font-sans w-full">
        <div className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between h-14 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              {(currentUserRole === 'owner' || currentUserRole === 'manager') && (
                <Button variant="outline" size="sm" onClick={() => setActiveModule('cash')} className="h-9">
                  <CurrencyCircleDollar className="h-4 w-4 mr-2" weight="fill" />
                  <span>Kasa</span>
                </Button>
              )}
              <Badge variant="outline" className="text-sm px-3 py-1.5">
                👤 {currentUserName}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSwitchUser} className="h-9">
                <LockKey className="h-4 w-4 mr-2" weight="bold" />
                <span>Kullanıcı Değiştir</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="h-9">
                <SignOut className="h-4 w-4 mr-2" weight="bold" />
                <span>Çıkış</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4">
          {renderModule()}
        </div>
        <Toaster position="top-right" />
      </main>

      <AlertDialog open={showBranchConfirmDialog} onOpenChange={setShowBranchConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-warning/10">
                <Warning className="h-6 w-6 text-warning" weight="bold" />
              </div>
              <AlertDialogTitle className="text-xl">Şube Değiştir</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 text-base">
              <p>
                Şube değiştirmek istediğinize emin misiniz?
              </p>
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="text-sm font-medium text-foreground">Dikkat:</p>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Tamamlanmamış işlemleriniz kaybolabilir</li>
                  <li>Açık kasa oturumları etkilenmeyecek</li>
                  <li>Şube verileri değişecektir</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelBranchSwitch}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBranchSwitch} className="bg-primary">
              Devam Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

export default App;
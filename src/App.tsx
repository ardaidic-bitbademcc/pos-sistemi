import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SignOut, CurrencyCircleDollar, Shield } from '@phosphor-icons/react';
import Login from '@/components/Login';
import RegisterLogin from '@/components/RegisterLogin';
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
import DataMigration from '@/components/DataMigration';
import { useSeedData } from '@/hooks/use-seed-data';
import { useAutoEmployeeAccounts } from '@/hooks/use-auto-employee-accounts';
import { checkMigrationStatus } from '@/lib/data-migration';
import type { UserRole, AuthSession } from '@/lib/types';

export type Module = 'dashboard' | 'pos' | 'personnel' | 'branch' | 'menu' | 'finance' | 'settings' | 'reports' | 'roles' | 'cash' | 'qrmenu' | 'tasks' | 'b2b' | 'customers';

function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authSession, setAuthSession] = useKV<AuthSession | null>('authSession', null);
  const [currentUserRole, setCurrentUserRole] = useKV<UserRole>('currentUserRole', 'owner');
  const [currentUserName, setCurrentUserName] = useState('');
  const [useOldAuth, setUseOldAuth] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState<boolean | null>(null);
  
  useSeedData();
  useAutoEmployeeAccounts();

  useEffect(() => {
    const checkMigration = async () => {
      const status = await checkMigrationStatus();
      setMigrationCompleted(status?.migrated || false);
    };
    checkMigration();
  }, []);

  const handleAuthSuccess = (session: AuthSession) => {
    setAuthSession(session);
    setCurrentUserRole(session.userRole);
    setCurrentUserName(session.userName);
    setIsAuthenticated(true);
    setActiveModule('dashboard');
  };

  const handleLogin = (role: UserRole, userName: string) => {
    setCurrentUserRole(role);
    setCurrentUserName(userName);
    setIsAuthenticated(true);
    setActiveModule('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthSession(null);
    setActiveModule('dashboard');
    setCurrentUserName('');
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
        return <TaskManagementModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole} currentUserId="user-1" currentUserName={currentUserName} authSession={authSession} />;
      case 'b2b':
        return <B2BModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole || 'owner'} currentUserName={currentUserName} authSession={authSession} />;
      case 'customers':
        return <CustomerAccountModule onBack={() => setActiveModule('dashboard')} authSession={authSession} />;
      default:
        return <Dashboard onNavigate={setActiveModule} currentUserRole={currentUserRole} authSession={authSession} />;
    }
  };

  if (!isAuthenticated) {
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

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex flex-wrap items-center gap-1 sm:gap-2 max-w-[calc(100vw-1rem)]">
        {(currentUserRole === 'owner' || currentUserRole === 'manager') && (
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModule('cash')} className="h-8 px-2 sm:px-3">
              <CurrencyCircleDollar className="h-4 w-4 sm:mr-1" weight="fill" />
              <span className="hidden sm:inline">Kasa</span>
            </Button>
            {currentUserRole === 'owner' && (
              <Button variant="outline" size="sm" onClick={() => setActiveModule('roles')} className="h-8 px-2 sm:px-3">
                <Shield className="h-4 w-4 sm:mr-1" weight="fill" />
                <span className="hidden sm:inline">Yetki</span>
              </Button>
            )}
          </>
        )}
        <Badge variant="outline" className="text-xs sm:text-sm px-2 sm:px-3 py-1 max-w-[120px] truncate">
          👤 <span className="hidden sm:inline">{currentUserName}</span>
        </Badge>
        <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 px-2 sm:px-3">
          <SignOut className="h-4 w-4 sm:mr-2" weight="bold" />
          <span className="hidden sm:inline">Çıkış</span>
        </Button>
      </div>
      {renderModule()}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
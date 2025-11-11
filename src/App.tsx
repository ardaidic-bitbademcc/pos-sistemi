import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SignOut, CurrencyCircleDollar, Shield } from '@phosphor-icons/react';
import Login from '@/components/Login';
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
import { useSeedData } from '@/hooks/use-seed-data';
import type { UserRole } from '@/lib/types';

export type Module = 'dashboard' | 'pos' | 'personnel' | 'branch' | 'menu' | 'finance' | 'settings' | 'reports' | 'roles' | 'cash' | 'qrmenu' | 'tasks';

function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useKV<UserRole>('currentUserRole', 'owner');
  const [currentUserName, setCurrentUserName] = useState('');
  useSeedData();

  const handleLogin = (role: UserRole, userName: string) => {
    setCurrentUserRole(role);
    setCurrentUserName(userName);
    setIsAuthenticated(true);
    setActiveModule('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveModule('dashboard');
    setCurrentUserName('');
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} currentUserRole={currentUserRole} />;
      case 'pos':
        return <POSModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole} />;
      case 'personnel':
        return <PersonnelModule onBack={() => setActiveModule('dashboard')} />;
      case 'branch':
        return <BranchModule onBack={() => setActiveModule('dashboard')} />;
      case 'menu':
        return <MenuModule onBack={() => setActiveModule('dashboard')} />;
      case 'finance':
        return <FinanceModule onBack={() => setActiveModule('dashboard')} />;
      case 'settings':
        return <SettingsModule onBack={() => setActiveModule('dashboard')} />;
      case 'reports':
        return <ReportsModule onBack={() => setActiveModule('dashboard')} />;
      case 'roles':
        return <RoleManagementModule onBack={() => setActiveModule('dashboard')} />;
      case 'cash':
        return <CashModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole} />;
      case 'qrmenu':
        return <QRMenuModule onBack={() => setActiveModule('dashboard')} />;
      case 'tasks':
        return <TaskManagementModule onBack={() => setActiveModule('dashboard')} currentUserRole={currentUserRole} currentUserId="user-1" currentUserName={currentUserName} />;
      default:
        return <Dashboard onNavigate={setActiveModule} currentUserRole={currentUserRole} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {(currentUserRole === 'owner' || currentUserRole === 'manager') && (
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModule('cash')}>
              <CurrencyCircleDollar className="h-4 w-4 mr-1" weight="fill" />
              Kasa
            </Button>
            {currentUserRole === 'owner' && (
              <Button variant="outline" size="sm" onClick={() => setActiveModule('roles')}>
                <Shield className="h-4 w-4 mr-1" weight="fill" />
                Yetki
              </Button>
            )}
          </>
        )}
        <Badge variant="outline" className="text-sm px-3 py-1">
          👤 {currentUserName}
        </Badge>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <SignOut className="h-4 w-4 mr-2" weight="bold" />
          Çıkış
        </Button>
      </div>
      {renderModule()}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
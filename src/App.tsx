import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Toaster } from '@/components/ui/sonner';
import Dashboard from '@/components/Dashboard';
import POSModule from '@/components/modules/POSModule';
import PersonnelModule from '@/components/modules/PersonnelModule';
import BranchModule from '@/components/modules/BranchModule';
import MenuModule from '@/components/modules/MenuModule';
import FinanceModule from '@/components/modules/FinanceModule';
import SettingsModule from '@/components/modules/SettingsModule';
import ReportsModule from '@/components/modules/ReportsModule';
import RoleManagementModule from '@/components/modules/RoleManagementModule';
import { useSeedData } from '@/hooks/use-seed-data';
import type { UserRole } from '@/lib/types';

export type Module = 'dashboard' | 'pos' | 'personnel' | 'branch' | 'menu' | 'finance' | 'settings' | 'reports' | 'roles';

function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [currentUserRole] = useKV<UserRole>('currentUserRole', 'owner');
  useSeedData();

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
      default:
        return <Dashboard onNavigate={setActiveModule} currentUserRole={currentUserRole} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderModule()}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
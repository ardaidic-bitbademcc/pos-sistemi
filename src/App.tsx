import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import Dashboard from '@/components/Dashboard';
import POSModule from '@/components/modules/POSModule';
import PersonnelModule from '@/components/modules/PersonnelModule';
import BranchModule from '@/components/modules/BranchModule';
import MenuModule from '@/components/modules/MenuModule';
import FinanceModule from '@/components/modules/FinanceModule';
import SettingsModule from '@/components/modules/SettingsModule';
import { useSeedData } from '@/hooks/use-seed-data';

export type Module = 'dashboard' | 'pos' | 'personnel' | 'branch' | 'menu' | 'finance' | 'settings';

function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  useSeedData();

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'pos':
        return <POSModule onBack={() => setActiveModule('dashboard')} />;
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
      default:
        return <Dashboard onNavigate={setActiveModule} />;
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
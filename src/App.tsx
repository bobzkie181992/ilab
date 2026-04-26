import { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Sidebar, Header } from './components/layout/Shell';
import { DashboardStats } from './components/dashboard/DashboardStats';
import { EquipmentGrid } from './components/dashboard/EquipmentGrid';
import { AlertTriangle } from 'lucide-react';

function DashboardView({ onManageClick }: { onManageClick: () => void }) {
  const { state } = useAppContext();
  
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Offline warning banner */}
      {!state.isOnline && (
        <div className="flex items-center rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <AlertTriangle className="mr-3 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <h4 className="font-semibold">System is running in Offline Mode</h4>
            <p className="text-sm">Data is reading from local cache only. Telemetry updates and live tracking are suspended until network connection is restored.</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xl font-bold tracking-tight text-lab-text">Overview</h2>
        <DashboardStats />
      </div>

      <div>
         <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-lab-text">Equipment Status</h2>
          <button 
            onClick={onManageClick}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Manage Inventory
          </button>
        </div>
        <EquipmentGrid />
      </div>
    </div>
  );
}

import { ScannerView } from './components/scanner/ScannerView';
import { UsersView } from './components/users/UsersView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { SettingsView } from './components/settings/SettingsView';
import { EquipmentView } from './components/equipment/EquipmentView';
import { BookingsView } from './components/bookings/BookingsView';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { LoginView } from './components/auth/LoginView';
import { LayoutDashboard, Calendar, ScanLine, Cpu, Users, History, Settings, LogOut, Wrench } from 'lucide-react';

function AppShell() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [maintenanceEquipmentId, setMaintenanceEquipmentId] = useState<string | null>(null);
  const { state, logout } = useAppContext();

  const handleMaintenance = (id: string) => {
    setMaintenanceEquipmentId(id);
    setCurrentView('maintenance');
  };

  if (!state.currentUser) {
    return <LoginView />;
  }

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
    { id: 'scanner', label: 'Borrow/Return', icon: <ScanLine className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff'] },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" />, roles: ['Admin'] },
    { id: 'equipment', label: 'Inventory', icon: <Cpu className="h-4 w-4" />, roles: ['Admin'] },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" />, roles: ['Admin'] },
    { id: 'transactions', label: 'History', icon: <History className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff'] },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, roles: ['Admin'] },
  ];

  const visibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(state.currentUser!.role));

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Refined Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shadow-sm">
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">CC</div>
            <span className="font-bold tracking-tight text-slate-900 italic">Lab Monitor</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto min-h-0 space-y-1 px-4 py-6">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                currentView === item.id 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center space-x-3 px-2 py-2 mb-4">
            <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand">
              {state.currentUser.name[0]}
            </div>
            <div className="flex-1 overflow-hidden">
               <div className="text-xs font-bold text-slate-900 truncate">{state.currentUser.name}</div>
               <div className="text-[10px] text-slate-500 font-medium capitalize">{state.currentUser.role}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-red-100 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-3 w-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={NAV_ITEMS.find(n => n.id === currentView)?.label || 'Monitoring'} />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {currentView === 'dashboard' && <DashboardView onManageClick={() => setCurrentView('equipment')} />}
          {currentView === 'bookings' && <BookingsView />}
          {currentView === 'scanner' && <ScannerView />}
          {currentView === 'maintenance' && (
            <MaintenanceView 
              initialEquipmentId={maintenanceEquipmentId || undefined} 
              onTicketCreated={() => setMaintenanceEquipmentId(null)}
            />
          )}
          {currentView === 'equipment' && <EquipmentView onMaintenance={handleMaintenance} />}
          {currentView === 'users' && <UsersView />}
          {currentView === 'transactions' && <TransactionsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

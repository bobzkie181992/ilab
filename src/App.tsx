import { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Sidebar, Header } from './components/layout/Shell';
import { DashboardStats } from './components/dashboard/DashboardStats';
import { AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import { Activity, BarChart3 } from 'lucide-react';

function DashboardView() {
  const { state } = useAppContext();
  
  const { equipment, transactions, bookings, maintenanceTickets, users } = state;

  // Most used equipment (moved from ReportsView)
  const equipUsage = equipment.map(eq => {
    const borrowCount = transactions.filter(t => t.equipmentId === eq.id).length;
    return { name: eq.name, borrows: borrowCount };
  }).sort((a, b) => b.borrows - a.borrows).slice(0, 5);

  // Peak times (Booking durations by day of week) (moved from ReportsView)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const peakTimes = daysOfWeek.map(day => ({ day, count: 0 }));
  
  bookings.forEach(b => {
    const d = new Date(b.startTime).getDay();
    peakTimes[d].count += 1;
  });
  
  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" /> Most Used Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="borrows" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" /> Lab Booking Peak Days
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakTimes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SoftwareRequestsView } from './components/software/SoftwareRequestsView';
import { LoginView } from './components/auth/LoginView';
import { LayoutDashboard, Calendar, ScanLine, Cpu, Users, History, Settings, LogOut, Wrench, BarChart2, UserCircle, Fingerprint, Building2, Clock, TrendingUp, DownloadCloud } from 'lucide-react';
import { ConfirmationModal } from './components/ui/ConfirmationModal';

function AppShell() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [maintenanceEquipmentId, setMaintenanceEquipmentId] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { state, logout } = useAppContext();

  useEffect(() => {
    const handleChangeView = (e: any) => {
      if (e.detail) {
        setCurrentView(e.detail);
      }
    };
    window.addEventListener('changeView', handleChangeView);
    return () => window.removeEventListener('changeView', handleChangeView);
  }, []);

  const handleMaintenance = (id: string) => {
    setMaintenanceEquipmentId(id);
    setCurrentView('maintenance');
  };

  if (!state.currentUser) {
    return <LoginView />;
  }

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
    { id: 'analytics', label: 'Insights', icon: <TrendingUp className="h-4 w-4" />, roles: ['Admin', 'Faculty'] },
    { id: 'scanner', label: 'Borrow/Return', icon: <ScanLine className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
    { id: 'equipment', label: 'Equipment', icon: <Cpu className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
    { id: 'facility', label: 'Facility', icon: <Building2 className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
    { id: 'software', label: 'Software Requests', icon: <DownloadCloud className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" />, roles: ['Admin', 'Staff'] },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" />, roles: ['Admin'] },
    { id: 'transactions', label: 'History', icon: <History className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, roles: ['Admin', 'Faculty', 'Staff', 'Student'] },
  ];

  const visibleNavItems = NAV_ITEMS.filter(item => {
    return item.roles.includes(state.currentUser!.role);
  });

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
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${
              state.currentUser.role === 'Admin' ? 'bg-amber-100 text-amber-700' :
              state.currentUser.role === 'Faculty' ? 'bg-purple-100 text-purple-700' :
              state.currentUser.role === 'Staff' ? 'bg-blue-100 text-blue-700' :
              'bg-brand/10 text-brand'
            }`}>
              {state.currentUser.name[0]}
            </div>
            <div className="flex-1 overflow-hidden">
               <div className="text-xs font-bold text-slate-900 truncate">{state.currentUser.name}</div>
               <div className="flex items-center mt-0.5">
                 <div className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    state.currentUser.role === 'Admin' ? 'bg-amber-100 text-amber-700' :
                    state.currentUser.role === 'Faculty' ? 'bg-purple-100 text-purple-700' :
                    state.currentUser.role === 'Staff' ? 'bg-blue-100 text-blue-700' :
                    'bg-brand/10 text-brand'
                 }`}>
                   {state.currentUser.role}
                 </div>
               </div>
            </div>
          </div>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
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
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'scanner' && <ScannerView />}
          {currentView === 'equipment' && <EquipmentView onMaintenance={handleMaintenance} />}
          {currentView === 'facility' && <BookingsView />}
          {currentView === 'software' && <SoftwareRequestsView />}
          {currentView === 'maintenance' && (
            <MaintenanceView 
              initialEquipmentId={maintenanceEquipmentId || undefined} 
              onTicketCreated={() => setMaintenanceEquipmentId(null)}
            />
          )}
          {currentView === 'users' && <UsersView />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'transactions' && <TransactionsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      <ConfirmationModal 
        isOpen={isLogoutModalOpen}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out of the CCIS iLab Monitor?"
        confirmLabel="Sign Out"
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }}
        onCancel={() => setIsLogoutModalOpen(false)}
        variant="danger"
        icon="logout"
      />
    </div>
  );
}

import { Toaster } from 'sonner';

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-center" richColors />
      <AppShell />
    </AppProvider>
  );
}

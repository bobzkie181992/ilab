import React from 'react';
import { LayoutDashboard, Users, Monitor, ScanLine, Settings, Database, Server, Wifi, WifiOff } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface ShellProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<ShellProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="flex h-screen w-64 flex-col border-r border-lab-bg bg-lab-sidebar">
      <div className="flex h-14 items-center border-b border-lab-bg px-4">
        <Server className="mr-2 h-6 w-6 text-brand" />
        <span className="font-bold text-lab-text">CCIS iLab</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<ScanLine size={20} />} label="QR Scanner" active={currentView === 'scanner'} onClick={() => setCurrentView('scanner')} />
          <NavItem icon={<Monitor size={20} />} label="Equipment" active={currentView === 'equipment'} onClick={() => setCurrentView('equipment')} />
          <NavItem icon={<Users size={20} />} label="Borrowers" active={currentView === 'borrowers'} onClick={() => setCurrentView('borrowers')} />
          <NavItem icon={<Database size={20} />} label="Transactions" active={currentView === 'transactions'} onClick={() => setCurrentView('transactions')} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>
      </div>
      <div className="p-4 text-xs text-slate-500">
        CCIS iLab Monitor v2.0
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; count?: number; onClick: () => void }> = ({ icon, label, active, count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2 transition-colors ${
        active
          ? 'bg-brand/15 text-brand'
          : 'text-slate-700 hover:bg-lab-bg'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span className="flex-1 text-left font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-auto inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
          {count}
        </span>
      )}
    </button>
  );
};

export const Header: React.FC<{ title: string }> = ({ title }) => {
  const { state, toggleSystemMode } = useAppContext();

  return (
    <header className="flex h-14 items-center justify-between border-b border-lab-bg bg-lab-surface px-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-lab-text capitalize">{title.replace('-', ' ')}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSystemMode}
          className={`flex items-center space-x-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            state.isOnline
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          {state.isOnline ? (
            <>
              <Wifi size={16} />
              <span>Online Mode</span>
            </>
          ) : (
            <>
              <WifiOff size={16} />
              <span>Offline Mode (Local)</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import { LayoutDashboard, Users, Monitor, ScanLine, Settings, Database, Server, Wifi, WifiOff, Bell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface ShellProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Sidebar: React.FC<ShellProps> = ({ currentView, setCurrentView }) => {
  const { state } = useAppContext();
  return (
    <div className="flex h-screen w-64 flex-col border-r border-lab-bg bg-lab-sidebar">
      <div className="flex h-14 items-center border-b border-lab-bg px-4">
        <img 
          src={state.settings.logoUrl} 
          alt="Logo" 
          className="mr-2 h-8 w-8 object-contain"
          referrerPolicy="no-referrer"
        />
        <span className="font-bold text-lab-text text-sm leading-tight">{state.settings.labName} Management and Monitoring</span>
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
  const { state, toggleSystemMode, markNotificationAsRead } = useAppContext();
  const [showNotifications, setShowNotifications] = React.useState(false);

  const userNotifications = state.notifications.filter(n => n.userId === state.currentUser?.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <header className="flex h-14 items-center justify-between border-b border-lab-bg bg-[#2e5926] px-6 relative z-50">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-white capitalize">{title.replace('-', ' ')}</h1>
      </div>
      <div className="flex items-center space-x-4">
        {state.currentUser && (state.currentUser.role === 'Admin' || state.currentUser.position === 'Lab-Incharge' || state.currentUser.position === 'Dean') && (
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-white hover:text-gray-200 cursor-pointer"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#2e5926]">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-sm">Notifications</h3>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{unreadCount} New</span>
                </div>
                <div className="max-h-[400px] overflow-auto">
                  {userNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    userNotifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.targetView) {
                            // Assuming setCurrentView is available or we use a different mechanism
                            // In Shell.tsx, setCurrentView is passed to Sidebar, but Header is separate.
                            // I should check how the view is managed.
                            window.dispatchEvent(new CustomEvent('changeView', { detail: n.targetView }));
                          }
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-slate-800">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
                {userNotifications.length > 0 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button className="text-xs font-bold text-brand hover:underline">View All Notifications</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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

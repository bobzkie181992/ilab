import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Info, ShieldCheck, Database, BellRing, Save, UserCircle, Clock, Users, CheckCircle2, Settings } from 'lucide-react';
import { BorrowerRole } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const SettingsView: React.FC = () => {
  const { state, updatePolicy, clearTransactions, updateUser, changePassword, resetSystem, registerFace, updateSettings } = useAppContext();
  const { currentUser } = state;
  
  const [isDataMgmtAuthenticated, setIsDataMgmtAuthenticated] = useState(false);
  const [isDataMgmtAuthModalOpen, setIsDataMgmtAuthModalOpen] = useState(false);
  const [dataMgmtAuthPassword, setDataMgmtAuthPassword] = useState('');
  const [dataMgmtAuthError, setDataMgmtAuthError] = useState('');

  const handleTabClick = (tabId: string) => {
    if (tabId === 'data' && !isDataMgmtAuthenticated) {
      setIsDataMgmtAuthModalOpen(true);
      setDataMgmtAuthError('');
      setDataMgmtAuthPassword('');
    } else {
      setActiveTab(tabId as any);
    }
  };

  const handleDataMgmtAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.password === dataMgmtAuthPassword) {
      setIsDataMgmtAuthenticated(true);
      setActiveTab('data');
      setIsDataMgmtAuthModalOpen(false);
    } else {
      setDataMgmtAuthError('Incorrect password');
    }
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'policies' | 'system' | 'users' | 'data'>('profile');
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    idNumber: currentUser?.idNumber || '',
    departmentOrCourse: currentUser?.departmentOrCourse || '',
    contactInfo: currentUser?.contactInfo || '',
    email: currentUser?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const [autoBackupHandle, setAutoBackupHandle] = useState<any | null>(null);
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(24);

  const startAutoBackup = async () => {
    try {
      if (!(window as any).showDirectoryPicker) {
        toast.error('Your browser does not support local directory selection.');
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setAutoBackupHandle(handle);
      setIsAutoBackupEnabled(true);
      toast.success('Auto-backup folder selected successfully. Keep this tab open for auto-backups.');
      
      // Perform first backup immediately
      performAutoBackup(handle);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to select backup folder: ' + err.message);
      }
    }
  };

  const performAutoBackup = async (handle: any) => {
    try {
      const res = await fetch('/api/backup/export');
      const json = await res.json();
      if (json.success) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `lab_monitor_backup_${timestamp}.json`;
        const fileHandle = await handle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(json.data, null, 2));
        await writable.close();
        console.log(`Auto-backed up to ${filename}`);
      }
    } catch (e) {
      console.error('Auto-backup failed:', e);
    }
  };

  // Auto-backup effect
  React.useEffect(() => {
    if (!isAutoBackupEnabled || !autoBackupHandle) return;

    const intervalId = setInterval(() => {
      performAutoBackup(autoBackupHandle);
    }, autoBackupInterval * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isAutoBackupEnabled, autoBackupHandle, autoBackupInterval]);

  // Existing Backup handlers
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/backup/export');
      const json = await res.json();
      if (json.success) {
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab_monitor_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Backup exported successfully');
      } else {
        toast.error('Failed to export backup: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error exporting backup');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsedData }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Backup imported successfully. Reloading data...');
        setTimeout(() => window.location.reload(), 1500); // Reload to fetch fresh data
      } else {
        toast.error('Failed to import backup: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Invalid backup file');
    }
    
    // Reset input
    e.target.value = '';
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'Admin';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, formData);
    setIsSaved(true);
    toast.success('Profile updated successfully!');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    const result = changePassword(currentUser.id, passwordData.currentPassword, passwordData.newPassword);
    if (result.success) {
      toast.success(result.message);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(result.message);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    ...(isAdmin ? [
      { id: 'users', label: 'User Directory', icon: Users },
      { id: 'policies', label: 'Borrowing Rules', icon: ShieldCheck },
      { id: 'system', label: 'System Config', icon: BellRing },
      { id: 'data', label: 'Data Mgmt', icon: Database },
    ] : [])
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
          <p className="text-slate-500 text-sm">Manage your account and system-wide configurations.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                isActive 
                  ? 'border-brand text-brand bg-brand/5' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-brand' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-700 flex items-center">
                    <UserCircle className="mr-2 h-4 w-4" /> My QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                  <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
                    <QRCodeSVG value={currentUser.qrCode} size={160} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900">{currentUser.qrCode}</p>
                    <p className="text-xs text-slate-500">Scan this code at the lab</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</p>
                      <p className="text-sm font-medium text-slate-900">{currentUser.role}</p>
                    </div>
                    {currentUser.position && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position</p>
                        <p className="text-sm font-medium text-slate-900">{currentUser.position}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-700">Account Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">ID Number</label>
                        <input
                          type="text"
                          name="idNumber"
                          required
                          value={formData.idNumber}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Department or Course</label>
                        <input
                          type="text"
                          name="departmentOrCourse"
                          required
                          value={formData.departmentOrCourse}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Contact Number</label>
                        <input
                          type="tel"
                          name="contactInfo"
                          required
                          value={formData.contactInfo}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        className="flex items-center px-6 py-2.5 rounded-lg bg-brand text-white text-sm font-bold shadow-md shadow-brand/20 hover:bg-brand/90 transition-all active:scale-95"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaved ? 'Saved!' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-6 border-brand/20 bg-brand/[0.02]">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-brand flex items-center">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="flex items-center px-4 py-2 rounded-lg bg-slate-900 text-white text-[11px] font-bold shadow-md hover:bg-slate-800 transition-all active:scale-95"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}


        {isAdmin && activeTab === 'users' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-800">Student & Personnel Directory</CardTitle>
                <div className="flex items-center space-x-2">
                   <Users className="h-4 w-4 text-brand" />
                   <span className="text-xs font-bold text-slate-500">{state.users.length} Records</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">User Identity</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Biometrics</th>
                        <th className="px-6 py-4 text-right">Settings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {state.users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                <img src={user.imageUrl} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{user.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{user.idNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'Faculty' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.role === 'Student' && (
                               <button 
                                 onClick={() => registerFace(user.id)}
                                 className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                                   user.faceRegistered
                                     ? 'bg-brand/5 text-brand border-brand/20'
                                     : 'bg-rose-50 text-rose-500 border-rose-200'
                                 }`}
                               >
                                 {user.faceRegistered ? (
                                   <><CheckCircle2 className="h-3 w-3" /> <span>FACE ENROLLED</span></>
                                 ) : (
                                   <><ShieldCheck className="h-3 w-3" /> <span>ENROLL FACE</span></>
                                 )}
                               </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-transparent hover:border-slate-100">
                               <Settings className="h-4 w-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && activeTab === 'policies' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-brand" />
                  <CardTitle>Borrowing Rules & Policies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 font-semibold text-slate-500">Borrower Role</th>
                        <th className="pb-3 font-semibold text-slate-500">Max Items</th>
                        <th className="pb-3 font-semibold text-slate-500">Max Duration</th>
                        <th className="pb-3 font-semibold text-slate-500">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(Object.keys(state.policies) as BorrowerRole[]).map((role) => (
                        <tr key={role}>
                          <td className="py-4 font-medium text-slate-900">{role}</td>
                          <td className="py-4 text-xs">
                            <input
                              type="number"
                              value={state.policies[role].maxItems}
                              onChange={(e) => updatePolicy(role, { maxItems: parseInt(e.target.value) || 0 })}
                              className="w-16 rounded-md border border-slate-200 px-2 py-1 focus:border-brand focus:outline-none mr-1"
                            />
                            items
                          </td>
                          <td className="py-4">
                            <div className="flex gap-1 items-center">
                              <input
                                type="number"
                                value={state.policies[role].maxDurationValue}
                                onChange={(e) => updatePolicy(role, { maxDurationValue: parseInt(e.target.value) || 0 })}
                                className="w-16 rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-brand focus:outline-none"
                              />
                              <select
                                value={state.policies[role].maxDurationUnit}
                                onChange={(e) => updatePolicy(role, { maxDurationUnit: e.target.value as any })}
                                className="rounded-md border border-slate-200 px-1 py-1 text-xs outline-none"
                              >
                                <option value="Hours">Hours</option>
                                <option value="Days">Days</option>
                                <option value="Weeks">Weeks</option>
                                <option value="Months">Months</option>
                                <option value="Years">Years</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              role === 'Faculty' ? 'bg-purple-100 text-purple-700' :
                              role === 'Staff' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {role === 'Faculty' ? 'High' : role === 'Staff' ? 'Medium' : 'Standard'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && activeTab === 'system' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-brand" />
                  <CardTitle>Laboratory Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 space-y-2">
                    <label className="text-sm font-medium text-slate-700 block">Organization Logo</label>
                    <div className="relative group">
                      <div className="h-32 w-32 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                        {state.settings.logoUrl ? (
                          <img 
                            src={state.settings.logoUrl} 
                            alt="Lab Logo" 
                            className="h-full w-full object-contain p-2"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Database className="h-8 w-8 text-slate-300" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Change Logo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const formData = new FormData();
                              formData.append('logo', file);
                              try {
                                const res = await fetch('/api/settings/logo', {
                                  method: 'POST',
                                  body: formData
                                });
                                const data = await res.json();
                                if (data.success) {
                                  updateSettings({ logoUrl: data.logoUrl });
                                  toast.success('Logo updated successfully');
                                }
                              } catch (err) {
                                toast.error('Failed to upload logo');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">Recommended: Square PNG/SVG</p>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Lab Display Name</label>
                        <input
                          type="text"
                          value={state.settings.labName}
                          onChange={(e) => updateSettings({ labName: e.target.value })}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Administrator Email</label>
                        <input
                          type="email"
                          value={state.settings.adminEmail}
                          onChange={(e) => updateSettings({ adminEmail: e.target.value })}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                       <button 
                         onClick={() => toast.success('Laboratory settings saved')}
                         className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold shadow-sm"
                       >
                         Save Lab Info
                       </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <BellRing className="h-5 w-5 text-brand" />
                <CardTitle>Alerts & Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Overdue Email Alerts</div>
                    <div className="text-xs text-slate-500">Send automatic reminders to borrowers</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={state.settings.overdueAlerts} 
                    onChange={(e) => updateSettings({ overdueAlerts: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Admin Escalation</div>
                    <div className="text-xs text-slate-500">Notify admin after 48h overdue</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={state.settings.adminEscalation} 
                    onChange={(e) => updateSettings({ adminEscalation: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && activeTab === 'data' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300 max-w-md">
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2 pb-2">
                <Database className="h-5 w-5 text-brand" />
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg mb-2">
                   <div className="flex items-start space-x-3">
                      <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Destructive operations performed here cannot be reversed. Please export data before purging transactions.
                      </p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleExportBackup}
                    className="w-full rounded-md border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Export JSON
                  </button>
                  <label className="w-full rounded-md border border-brand py-2.5 text-sm font-medium text-brand hover:bg-brand/5 transition-colors flex items-center justify-center cursor-pointer">
                    <Database className="h-4 w-4 mr-2" />
                    Import JSON
                    <input 
                      type="file" 
                      accept=".json,application/json" 
                      onChange={handleImportBackup} 
                      className="hidden" 
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Auto Backup</p>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                       <label className="text-sm font-medium text-slate-700">Interval (hours):</label>
                       <input 
                         type="number" 
                         value={autoBackupInterval}
                         onChange={(e) => setAutoBackupInterval(Number(e.target.value) || 24)}
                         className="w-16 rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-brand focus:outline-none"
                         min={1}
                       />
                    </div>
                    {isAutoBackupEnabled ? (
                      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <div className="flex items-center space-x-2 text-emerald-700">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm font-medium">Auto-backup Active</span>
                        </div>
                        <button 
                          onClick={() => { setIsAutoBackupEnabled(false); setAutoBackupHandle(null); }}
                          className="text-xs font-bold text-emerald-800 hover:underline"
                        >
                          Stop
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={startAutoBackup}
                        className="w-full rounded-md border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Browse Folder & Start Auto-Backup
                      </button>
                    )}
                    <p className="text-[9px] text-slate-400 italic">
                      Requires keeping this tab open. Select a local folder to automatically save backups.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Advanced Maintenance</p>
                  <button 
                    onClick={() => setIsConfirmClearOpen(true)}
                    className="w-full rounded-md border border-red-100 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center mb-3"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Clear Transaction History
                  </button>
                  <button 
                    onClick={() => setIsConfirmResetOpen(true)}
                    className="w-full rounded-md bg-rose-50 border border-rose-200 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Reset System & Clear Cache
                  </button>
                  <p className="mt-2 text-[9px] text-slate-400 italic text-center">
                    This will wipe all local data and restore system defaults.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={isConfirmClearOpen}
        title="Clear Transaction History"
        message="Are you sure you want to clear all transaction history? This action cannot be undone and will remove all past records from the system."
        onConfirm={() => {
          clearTransactions();
          setIsConfirmClearOpen(false);
          toast.success('Transaction history cleared successfully.');
        }}
        onCancel={() => setIsConfirmClearOpen(false)}
        variant="danger"
      />

      <ConfirmationModal 
        isOpen={isConfirmResetOpen}
        title="Factory Reset System"
        message="CRITICAL ACTION: This will completely wipe all equipment data, user accounts, attendance logs, and system settings. The application will be restored to its original factory state. This cannot be undone."
        onConfirm={() => {
          resetSystem();
          setIsConfirmResetOpen(false);
        }}
        onCancel={() => setIsConfirmResetOpen(false)}
        variant="danger"
      />

      {isDataMgmtAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-brand/5 px-6 py-4 border-b border-brand/10">
              <h3 className="text-lg font-bold text-brand">Enter Password</h3>
              <p className="text-xs text-brand/70 mt-1">Authentication required to access Data Management</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleDataMgmtAuthSubmit} className="space-y-4">
                {dataMgmtAuthError && (
                  <div className="rounded-md bg-red-50 p-2 text-xs text-red-600 font-medium">
                    {dataMgmtAuthError}
                  </div>
                )}
                <div>
                  <input
                    type="password"
                    required
                    value={dataMgmtAuthPassword}
                    onChange={(e) => setDataMgmtAuthPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Enter your password"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDataMgmtAuthModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


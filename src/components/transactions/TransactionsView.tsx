import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock, CheckCircle2, Package, Loader2, Calendar, Wrench, UserCheck, Search, Building2, Printer } from 'lucide-react';
import { TransactionReceipt } from './TransactionReceipt';
import { BorrowTransaction } from '../../types';

export const TransactionsView: React.FC = () => {
  const { state, approveTransaction, releaseEquipment, completeBooking } = useAppContext();
  const [logTab, setLogTab] = useState<'borrow' | 'facility' | 'eq_maint' | 'pm_maint' | 'ojt'>('borrow');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<BorrowTransaction | null>(null);
  const currentUser = state.currentUser;
  
  const isAdminOrStaff = currentUser?.role === 'Admin' || currentUser?.position === 'Lab-Incharge' || currentUser?.position === 'Dean';

  const renderBorrowLogs = () => {
    const sorted = [...state.transactions].sort((a, b) => 
      new Date(b.checkoutTime).getTime() - new Date(a.checkoutTime).getTime()
    ).filter(tx => {
      const borrower = state.users.find(u => u.id === tx.borrowerId);
      const eq = state.equipment.find(e => e.id === tx.equipmentId);
      const matchesSearch = !searchQuery || 
        (borrower?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (eq?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (eq?.qrCode?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const hasPermission = isAdminOrStaff || tx.borrowerId === currentUser?.id;
      return matchesSearch && hasPermission;
    });

    if (sorted.length === 0) return <div className="text-center py-12 text-slate-500">No borrow transactions found.</div>;

    return sorted.map(tx => {
      const eq = state.equipment.find(e => e.id === tx.equipmentId);
      const borrower = state.users.find(u => u.id === tx.borrowerId);
      const isOverdue = tx.status === 'Overdue';
      const isReturned = tx.status === 'Returned';
      const isPendingApproval = tx.status === 'Pending Approval';
      const isApprovedLab = tx.status === 'Approved by Lab-Incharge';
      const isApprovedDean = tx.status === 'Approved by Dean';
      const isQueued = tx.status === 'Queued';

      const isLabIncharge = currentUser?.position === 'Lab-Incharge' || currentUser?.role === 'Admin';
      const isDean = currentUser?.position === 'Dean' || currentUser?.role === 'Admin';
      
      const canApproveLab = isLabIncharge && isPendingApproval;
      const canApproveDean = isDean && isApprovedLab;
      const canRelease = (currentUser?.role === 'Admin' || currentUser?.position === 'Lab-Incharge') && isApprovedDean;

      return (
        <Card key={tx.id} className={`${isOverdue ? 'border-red-300' : ''} ${isPendingApproval || isApprovedLab || isApprovedDean ? 'border-amber-200 bg-amber-50/20' : ''}`}>
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-slate-900">{borrower?.name}</span>
                <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  tx.borrowerRole === 'Student' ? 'bg-brand/10 text-brand' :
                  tx.borrowerRole === 'Faculty' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {tx.borrowerRole} {borrower?.position ? `• ${borrower.position}` : ''}
                </div>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <span className="font-medium">{eq?.name}</span>
                <span className="mx-2 text-slate-400">•</span>
                <span className="font-mono text-xs text-slate-500">{eq?.qrCode}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                <span className="font-bold">Purpose:</span> {tx.purpose || 'None'}
              </div>
            </div>

            <div className="flex flex-col space-y-2 sm:items-end">
              <div className="flex flex-col sm:items-end text-[10px] sm:text-xs text-slate-600 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Out:</span>
                  <Clock className="h-3 w-3" />
                  {new Date(tx.checkoutTime).toLocaleDateString()} {new Date(tx.checkoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Exp:</span>
                  <Clock className="h-3 w-3" />
                  {new Date(tx.expectedReturnTime).toLocaleDateString()} {new Date(tx.expectedReturnTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                {isReturned && tx.actualReturnTime && (
                  <div className="flex items-center space-x-1.5 text-emerald-600">
                    <span className="font-bold uppercase tracking-wider">In:</span>
                    <CheckCircle2 className="h-3 w-3" />
                    {new Date(tx.actualReturnTime).toLocaleDateString()} {new Date(tx.actualReturnTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap justify-end gap-2">
                {tx.status === 'Active' && <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Checked Out</Badge>}
                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                {isReturned && <Badge variant="secondary">Returned ({tx.returnCondition})</Badge>}
                {isPendingApproval && <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Pending Lab Approval</Badge>}
                {isApprovedLab && <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Pending Dean Approval</Badge>}
                {isApprovedDean && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved: Ready for Release</Badge>}
                {isQueued && <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Queued</Badge>}
                
                {canApproveLab && (
                  <button onClick={() => approveTransaction(tx.id, 'Lab-Incharge')} className="bg-brand text-white px-3 py-1 rounded text-xs font-bold hover:bg-brand/90 transition-all">Approve (Lab-Incharge)</button>
                )}
                {canApproveDean && (
                  <button onClick={() => approveTransaction(tx.id, 'Dean')} className="bg-brand text-white px-3 py-1 rounded text-xs font-bold hover:bg-brand/90 transition-all">Approve (Dean)</button>
                )}
                {canRelease && (
                  <button onClick={() => releaseEquipment(tx.id)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-700 transition-all">Release Equipment</button>
                )}
                <button 
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center space-x-1 px-3 py-1 rounded text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 transition-all border border-slate-200"
                  title="View Details"
                >
                  <span>Details</span>
                </button>
                <button 
                  onClick={() => setSelectedTx(tx)}
                  className="flex items-center space-x-1 px-3 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                  title="Print Receipt"
                >
                  <Printer className="h-3 w-3" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  const renderFacilityLogs = () => {
    const sorted = [...state.bookings].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    ).filter(bk => {
      const facility = state.facilities.find(f => f.id === bk.facilityId);
      const user = state.users.find(u => u.id === bk.userId);
      const matchesSearch = !searchQuery || 
        (facility?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (user?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const hasPermission = isAdminOrStaff || bk.userId === currentUser?.id;
      return matchesSearch && hasPermission;
    });

    if (sorted.length === 0) return <div className="text-center py-12 text-slate-500">No facility bookings found.</div>;

    return sorted.map(bk => {
      const facility = state.facilities.find(f => f.id === bk.facilityId);
      const user = state.users.find(u => u.id === bk.userId);
      return (
        <Card key={bk.id}>
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-slate-900">{user?.name}</span>
                <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  user?.role === 'Student' ? 'bg-brand/10 text-brand' :
                  user?.role === 'Faculty' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {user?.role}
                </div>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                <span className="font-medium">{facility?.name}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 italic">"{bk.purpose}"</p>
            </div>
            <div className="flex flex-col sm:items-end space-y-2">
              <div className="flex items-center space-x-2">
                {isAdminOrStaff && bk.status === 'Confirmed' && (
                  <button 
                    onClick={() => completeBooking(bk.id)}
                    className="flex items-center space-x-1 px-3 py-1 rounded text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Complete</span>
                  </button>
                )}
                <div className="text-right text-xs text-slate-600">
                  <p className="font-bold">{new Date(bk.startTime).toLocaleDateString()}</p>
                  <p>{new Date(bk.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(bk.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              <Badge className={
                bk.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                bk.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                bk.status === 'Queued' ? 'bg-indigo-100 text-indigo-700' :
                bk.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-700'
              }>
                {bk.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  const renderEqMaintLogs = () => {
    const sorted = [...state.maintenanceTickets].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ).filter(tk => {
      const eq = state.equipment.find(e => e.id === tk.equipmentId);
      const matchesSearch = !searchQuery || 
        (eq?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (tk.title?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    if (sorted.length === 0) return <div className="text-center py-12 text-slate-500">No equipment maintenance tickets found.</div>;

    return sorted.map(tk => {
      const eq = state.equipment.find(e => e.id === tk.equipmentId);
      return (
        <Card key={tk.id}>
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-slate-900">{tk.title}</span>
                <Badge className={
                  tk.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                  tk.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }>{tk.priority}</Badge>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Wrench className="h-4 w-4 mr-2 text-slate-400" />
                <span className="font-medium">{eq?.name} ({eq?.qrCode})</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{tk.description}</p>
            </div>
            <div className="flex flex-col sm:items-end space-y-2">
              <p className="text-[10px] text-slate-400">Fixed/Updated: {new Date(tk.updatedAt).toLocaleDateString()}</p>
              <Badge className={
                tk.status === 'Resolved' || tk.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-amber-100 text-amber-700'
              }>
                {tk.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  const renderPmMaintLogs = () => {
    const sorted = [...state.maintenanceLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).filter(log => {
      const matchesSearch = !searchQuery || 
        (log.lab?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (log.preparedBy?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    if (sorted.length === 0) return <div className="text-center py-12 text-slate-500">No preventive maintenance logs found.</div>;

    return sorted.map(log => (
      <Card key={log.id}>
        <CardContent className="p-4 sm:p-6 flex justify-between items-center">
           <div>
              <p className="font-bold text-slate-900">{log.lab}</p>
              <p className="text-xs text-slate-500">{log.month} {log.formDate}</p>
              <p className="text-[10px] text-slate-400 mt-1">Prepared by: {log.preparedBy}</p>
           </div>
           <div className="text-right">
              <p className="text-xs font-bold text-emerald-600">
                {Object.values(log.tasks).filter((t: any) => t.status === 'Done').length} Tasks Completed
              </p>
              <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
           </div>
        </CardContent>
      </Card>
    ));
  };

  const renderOjtLogs = () => {
    const sorted = [...state.attendanceLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).filter(log => {
      const user = state.users.find(u => u.id === log.userId);
      const matchesSearch = !searchQuery || 
        (user?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (user?.idNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const hasPermission = isAdminOrStaff || log.userId === currentUser?.id;
      return matchesSearch && hasPermission;
    });

    if (sorted.length === 0) return <div className="text-center py-12 text-slate-500">No attendance logs found.</div>;

    return sorted.map(log => {
      const user = state.users.find(u => u.id === log.userId);
      return (
        <Card key={log.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-brand/10 p-2 rounded-lg">
                <UserCheck className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">{user?.name}</p>
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-[10px] text-slate-500">{log.date}</p>
                  <div className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-tight ${
                    user?.role === 'Student' ? 'bg-brand/10 text-brand' :
                    user?.role === 'Faculty' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {user?.role}
                  </div>
                </div>
              </div>
            </div>
            <Badge className={
              log.status === 'Present' ? 'bg-green-100 text-green-700' :
              log.status === 'Late' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }>{log.status}</Badge>
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transaction History</h2>
          <p className="text-slate-500 text-sm">Review all system activities and logs.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 outline-none"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap">
        {(['borrow', 'facility', 'eq_maint', 'pm_maint', 'ojt'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setLogTab(tab)}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${
               logTab === tab ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {{
              'borrow': 'Equipment Borrowed',
              'facility': 'Facility Booked',
              'eq_maint': 'Repair Tickets',
              'pm_maint': 'PM Checklists',
              'ojt': 'Attendance'
            }[tab]}
          </button>
        ))}
      </div>
      
      <div className="space-y-4">
        {logTab === 'borrow' && renderBorrowLogs()}
        {logTab === 'facility' && renderFacilityLogs()}
        {logTab === 'eq_maint' && renderEqMaintLogs()}
        {logTab === 'pm_maint' && renderPmMaintLogs()}
        {logTab === 'ojt' && renderOjtLogs()}
      </div>

      {selectedTx && (
        <TransactionReceipt 
          transaction={selectedTx}
          equipment={state.equipment.find(e => e.id === selectedTx.equipmentId)}
          borrower={state.users.find(u => u.id === selectedTx.borrowerId)}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};


import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Mail, GraduationCap, Building2, UserCircle, Plus, Edit2, Trash2, Search, QrCode } from 'lucide-react';
import { BorrowerRole, Borrower, UserPosition, User } from '../../types';
import { UserForm } from './UserForm';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { QRCodeDisplay } from '../ui/QRCodeDisplay';

export const UsersView: React.FC = () => {
  const { state, addUser, updateUser, deleteUser } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [viewingQRCode, setViewingQRCode] = useState<{ value: string; label: string; subLabel?: string } | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning' as 'danger' | 'warning' | 'info'
  });

  const isAdmin = state.currentUser?.role === 'Admin';

  const filteredUsers = state.users.filter(u => {
    if (u.role === 'Admin') return false;
    
    const matchesSearch = 
      (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.idNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.departmentOrCourse?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleSave = (userData: Omit<User, 'id'>) => {
    const actionLabel = editingUser ? 'Update' : 'Create';
    setConfirmConfig({
      isOpen: true,
      title: `${actionLabel} User Account`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} the account for ${userData.name}?`,
      variant: 'info',
      onConfirm: () => {
        if (editingUser) {
          updateUser(editingUser.id, userData);
        } else {
          addUser(userData);
        }
        setIsFormOpen(false);
        setEditingUser(undefined);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete the account for ${name}? This will revoke their access to borrow equipment.`,
      variant: 'danger',
      onConfirm: () => {
        deleteUser(id);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">User Accounts</h2>
          <p className="text-slate-500 text-sm">Manage student and faculty borrower profiles.</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand/90 transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all outline-none text-sm"
          />
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          {['All', 'Student', 'Faculty', 'Staff'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                roleFilter === role 
                  ? 'bg-white text-brand shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {role}s
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredUsers.map(user => {
            const borrower = user as Borrower;
            const activeBorrows = state.transactions.filter(t => t.borrowerId === borrower.id && t.status !== 'Returned');
            const isOverdue = activeBorrows.some(t => t.status === 'Overdue');
            
            return (
              <Card key={borrower.id} className={`${isOverdue ? 'border-red-300' : ''} group relative`}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center space-x-3">
                  <div className={`flex shrink-0 h-10 w-10 overflow-hidden items-center justify-center rounded-full ${RoleColor(borrower.role)}`}>
                    {borrower.imageUrl ? (
                      <img src={borrower.imageUrl} alt={borrower.name} className="h-full w-full object-cover" />
                    ) : (
                      <RoleIcon role={borrower.role} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center space-x-2 truncate">
                      <span className="truncate">{borrower.name}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight ${RoleColor(borrower.role)} bg-opacity-10 border border-current border-opacity-20`}>
                        {borrower.role}
                      </div>
                      <div className="text-xs text-slate-500 font-mono italic">{borrower.idNumber}</div>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewingQRCode({
                        value: user.qrCode,
                        label: user.name,
                        subLabel: `${user.role} | ${user.idNumber}`
                      })}
                      className="p-1.5 rounded-md text-slate-400 hover:text-brand hover:bg-brand/5 transition-colors"
                      title="View QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-brand hover:bg-brand/5 transition-colors"
                      title="Edit User"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-4 text-sm text-slate-600 space-y-2">
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{borrower.departmentOrCourse}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{borrower.contactInfo}</span>
                </div>
                
                <div className="mt-2 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-500">Active Checked Out:</span>
                    <span className={`font-bold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
                      {activeBorrows.length}
                    </span>
                  </div>
                  {isOverdue && (
                     <div className="mt-1 text-xs text-red-500">Has overdue equipment!</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {viewingQRCode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <QRCodeDisplay 
            value={viewingQRCode.value} 
            label={viewingQRCode.label} 
            subLabel={viewingQRCode.subLabel}
            onClose={() => setViewingQRCode(undefined)}
          />
        </div>
      )}

      {isFormOpen && (
        <UserForm
          user={editingUser}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingUser(undefined); }}
        />
      )}

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

function RoleIcon({ role }: { role: BorrowerRole }) {
  if (role === 'Student') return <GraduationCap className="h-5 w-5" />;
  if (role === 'Faculty') return <UserCircle className="h-5 w-5" />;
  return <Building2 className="h-5 w-5" />;
}

function RoleColor(role: BorrowerRole) {
  if (role === 'Student') return 'bg-brand/10 text-brand';
  if (role === 'Faculty') return 'bg-purple-100 text-purple-600';
  return 'bg-blue-100 text-blue-600';
}

import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Calendar, Clock, X, Search, UserCheck } from 'lucide-react';
import { Equipment, User } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface WalkInBorrowModalProps {
  isOpen: boolean;
  items: Equipment[];
  onConfirm: (borrowerId: string, startTime: string, expectedReturnTime: string, purpose: string) => void;
  onCancel: () => void;
}

export const WalkInBorrowModal: React.FC<WalkInBorrowModalProps> = ({ isOpen, items, onConfirm, onCancel }) => {
  const { state } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [expectedReturnTime, setExpectedReturnTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [purpose, setPurpose] = useState('Walk-in Borrowing');

  const filteredUsers = state.users.filter(u => 
    u.role !== 'Admin' && (
      (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.idNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  ).slice(0, 5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Walk-in Borrowing</h3>
              <p className="text-xs text-slate-500">Directly release {items.length} item{items.length > 1 ? 's' : ''} to a borrower.</p>
            </div>
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Borrower Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Borrower</label>
              {!selectedUser ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search by name or ID number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm"
                    />
                  </div>
                  {searchQuery && filteredUsers.length > 0 && (
                    <div className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 text-left transition-colors border-b last:border-0"
                        >
                          <div>
                            <div className="text-sm font-bold text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.idNumber} • {user.role}</div>
                          </div>
                          <UserCheck className="h-4 w-4 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-brand/5 border border-brand/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{selectedUser.name}</div>
                      <div className="text-xs text-brand font-medium">{selectedUser.role} • {selectedUser.idNumber}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Release Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="datetime-local" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expected Return</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="datetime-local" 
                    value={expectedReturnTime}
                    onChange={(e) => setExpectedReturnTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Purpose</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm"
                placeholder="Brief purpose for direct release..."
              />
            </div>
            
            <div className="pt-4 flex space-x-3">
              <button 
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                disabled={!selectedUser}
                onClick={() => {
                  if (selectedUser) {
                    onConfirm(selectedUser.id, startTime, expectedReturnTime, purpose);
                  }
                }}
                className="flex-[2] px-4 py-2.5 text-sm font-bold text-white bg-brand hover:bg-brand/90 rounded-lg shadow-lg shadow-brand/20 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                Confirm & Release Equipment
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

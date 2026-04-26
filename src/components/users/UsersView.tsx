import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Mail, GraduationCap, Building2, UserCircle } from 'lucide-react';
import { BorrowerRole, Borrower } from '../../types';

export const UsersView: React.FC = () => {
  const { state } = useAppContext();
  
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">User Accounts</h2>
        <div className="mt-2 flex space-x-2 sm:mt-0">
          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Students</Badge>
          <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Faculty</Badge>
          <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Staff</Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.users
          .filter(u => u.role !== 'Admin')
          .map(user => {
            const borrower = user as Borrower;
            const activeBorrows = state.transactions.filter(t => t.borrowerId === borrower.id && t.status !== 'Returned');
            const isOverdue = activeBorrows.some(t => t.status === 'Overdue');
            
            return (
              <Card key={borrower.id} className={isOverdue ? 'border-red-300' : ''}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${RoleColor(borrower.role)}`}>
                    <RoleIcon role={borrower.role} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{borrower.name}</CardTitle>
                    <div className="text-xs text-slate-500 font-mono">{borrower.qrCode} • {borrower.idNumber}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-slate-600 space-y-2">
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                  {borrower.departmentOrCourse}
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
                  {borrower.contactInfo}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100">
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
    </div>
  );
};

function RoleIcon({ role }: { role: BorrowerRole }) {
  if (role === 'Student') return <GraduationCap className="h-5 w-5" />;
  if (role === 'Faculty') return <UserCircle className="h-5 w-5" />;
  return <Building2 className="h-5 w-5" />;
}

function RoleColor(role: BorrowerRole) {
  if (role === 'Student') return 'bg-blue-100 text-blue-600';
  if (role === 'Faculty') return 'bg-purple-100 text-purple-600';
  return 'bg-emerald-100 text-emerald-600';
}

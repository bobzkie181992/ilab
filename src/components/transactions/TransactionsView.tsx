import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Clock, ArrowRight } from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { state } = useAppContext();
  
  // Sort transactions by most recent first
  const sortedTransactions = [...state.transactions].sort((a, b) => 
    new Date(b.checkoutTime).getTime() - new Date(a.checkoutTime).getTime()
  );

  return (
    <div className="mx-auto max-w-7xl">
      <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900">Transaction Logs</h2>
      
      <div className="space-y-4">
        {sortedTransactions.map(tx => {
          const eq = state.equipment.find(e => e.id === tx.equipmentId);
          const borrower = state.users.find(u => u.id === tx.borrowerId);
          const isOverdue = tx.status === 'Overdue';
          const isReturned = tx.status === 'Returned';
          
          return (
            <Card key={tx.id} className={`${isOverdue ? 'border-red-300' : ''}`}>
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-slate-900">{borrower?.name}</span>
                    <span className="text-xs text-slate-500 rounded-full bg-slate-100 px-2 py-0.5 tracking-tight">
                      {tx.borrowerRole}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                     <span className="font-medium">{eq?.name}</span>
                     <span className="mx-2 text-slate-400">•</span>
                     <span className="font-mono text-xs">{eq?.qrCode}</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 sm:items-end">
                   <div className="flex items-center space-x-2">
                     <Clock className="h-4 w-4 text-slate-400" />
                     <span className="text-xs text-slate-600">
                        {new Date(tx.checkoutTime).toLocaleDateString()} {new Date(tx.checkoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                     {isReturned && (
                        <>
                          <ArrowRight className="h-3 w-3 text-slate-300" />
                          <span className="text-xs text-slate-600">
                            {new Date(tx.actualReturnTime!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </>
                     )}
                   </div>
                   
                   {tx.status === 'Active' && <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Checked Out</Badge>}
                   {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                   {isReturned && <Badge variant="secondary">Returned ({tx.returnCondition})</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Info, ShieldCheck, Database, BellRing, Save } from 'lucide-react';
import { BorrowerRole } from '../../types';

export const SettingsView: React.FC = () => {
  const { state, updatePolicy, clearTransactions } = useAppContext();
  
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">System Settings</h2>
        <div className="text-xs text-slate-500 italic">Settings are saved locally for this session.</div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Lab Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-brand" />
              <CardTitle>Laboratory Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Lab Display Name</label>
                <input
                  type="text"
                  defaultValue="CCIS Main Laboratory"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Administrator Email</label>
                <input
                  type="email"
                  defaultValue="admin@ccis.edu"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Borrowing Policies */}
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
                    <th className="pb-3 font-semibold text-slate-500">Max Duration (Hrs)</th>
                    <th className="pb-3 font-semibold text-slate-500">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(Object.keys(state.policies) as BorrowerRole[]).map((role) => (
                    <tr key={role}>
                      <td className="py-4 font-medium text-slate-900">{role}</td>
                      <td className="py-4">
                        <input
                          type="number"
                          value={state.policies[role].maxItems}
                          onChange={(e) => updatePolicy(role, { maxItems: parseInt(e.target.value) || 0 })}
                          className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-brand focus:outline-none"
                        />
                      </td>
                      <td className="py-4">
                        <input
                          type="number"
                          value={state.policies[role].maxDurationHours}
                          onChange={(e) => updatePolicy(role, { maxDurationHours: parseInt(e.target.value) || 0 })}
                          className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs focus:border-brand focus:outline-none"
                        />
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

        {/* Notifications & System */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Admin Escalation</div>
                  <div className="text-xs text-slate-500">Notify admin after 48h overdue</div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-x-2 pb-2">
              <Database className="h-5 w-5 text-brand" />
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button className="w-full rounded-md border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Export Equipment Logs (.CSV)
              </button>
              <button 
                onClick={() => {
                  if(confirm('Are you sure you want to clear all transaction history?')) {
                    clearTransactions();
                  }
                }}
                className="w-full rounded-md border border-red-100 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Clear Transaction History
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

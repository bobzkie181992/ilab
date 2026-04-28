import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Activity, ShieldAlert, BarChart3, TrendingUp } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { state } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'trends'>('overview');

  const { equipment, transactions, maintenanceTickets, bookings, users } = state;

  // Most used equipment
  const equipUsage = equipment.map(eq => {
    const borrowCount = transactions.filter(t => t.equipmentId === eq.id).length;
    return { name: eq.name, borrows: borrowCount, type: eq.type };
  }).sort((a, b) => b.borrows - a.borrows).slice(0, 5);

  // Peak times (Booking durations by day of week)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const peakTimes = daysOfWeek.map(day => ({ day, count: 0 }));
  
  bookings.forEach(b => {
    const d = new Date(b.startTime).getDay();
    peakTimes[d].count += 1;
  });

  // Equipment condition distribution
  const conditions = { Good: 0, Fair: 0, Damaged: 0 };
  equipment.forEach(eq => {
    if (conditions[eq.condition] !== undefined) {
      conditions[eq.condition]++;
    }
  });
  const pieData = [
    { name: 'Good', value: conditions.Good, color: '#10b981' },
    { name: 'Fair', value: conditions.Fair, color: '#f59e0b' },
    { name: 'Damaged', value: conditions.Damaged, color: '#ef4444' }
  ];

  // Suspicious Activity (e.g., users with multiple lost/damaged items or overdues)
  const suspiciousActivity = users.filter(u => u.role !== 'Admin').map(u => {
    const txs = transactions.filter(t => t.borrowerId === u.id);
    const lostOrDamaged = txs.filter(t => t.status === 'Lost' || t.conditionOnReturn === 'Damaged').length;
    const overdues = txs.filter(t => t.status === 'Overdue').length;
    return { user: u, score: lostOrDamaged * 2 + overdues };
  }).filter(u => u.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

  // Activity Log
  const activities = [
    ...transactions.map(t => ({
      id: `tx-${t.id}`,
      type: 'Borrow',
      date: new Date(t.borrowedAt),
      message: `${users.find(u => u.id === t.borrowerId)?.name} borrowed ${equipment.find(eq => eq.id === t.equipmentId)?.name}`
    })),
    ...maintenanceTickets.map(t => ({
      id: `mt-${t.id}`,
      type: 'Maintenance',
      date: new Date(t.createdAt),
      message: `Ticket created for ${equipment.find(eq => eq.id === t.equipmentId)?.name}`
    })),
    ...bookings.map(b => ({
      id: `bk-${b.id}`,
      type: 'Booking',
      date: new Date(b.createdAt || b.startTime),
      message: `${users.find(u => u.id === b.userId)?.name} booked a facility`
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 20);

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Analytics & Reports</h2>
          <p className="text-slate-500 text-sm">Monitor usage trends, maintenance freq, and system activity.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'overview' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'activity' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Activity Log
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-700 flex items-center">
                <Activity className="mr-2 h-4 w-4" /> Equipment Condition Overall
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72 flex items-center justify-center">
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-red-600 flex items-center">
                <ShieldAlert className="mr-2 h-4 w-4" /> Automated Alerts & High-Risk Borrowers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suspiciousActivity.length === 0 ? (
                <div className="text-sm text-slate-500 py-8 text-center bg-slate-50 rounded-lg">
                  No suspicious activity detected.
                </div>
              ) : (
                <div className="space-y-4">
                  {suspiciousActivity.map((sus, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{sus.user.name}</p>
                        <p className="text-xs text-slate-500">{sus.user.role} - {sus.user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">Risk Score</span>
                        <span className="text-lg font-black text-red-600">{sus.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">System Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? activities.map(act => (
                <div key={act.id} className="flex items-start space-x-4 border-b border-slate-100 pb-4 last:border-0">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    act.type === 'Borrow' ? 'bg-blue-100 text-blue-600' :
                    act.type === 'Maintenance' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {act.type === 'Borrow' ? <Activity className="w-4 h-4" /> :
                     act.type === 'Maintenance' ? <ShieldAlert className="w-4 h-4" /> :
                     <BarChart3 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{act.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{act.date.toLocaleString()}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-500 text-sm">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

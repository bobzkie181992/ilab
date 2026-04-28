import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { TrendingUp, Users, Laptop, Activity, Calendar } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { state } = useAppContext();
  const { equipment, transactions, bookings, maintenanceTickets } = state;

  // 1. Equipment Status Distribution
  const equipmentStats = [
    { name: 'Available', value: equipment.filter(e => e.status === 'Available').length, color: '#10b981' },
    { name: 'Borrowed', value: equipment.filter(e => e.status === 'Borrowed').length, color: '#3b82f6' },
    { name: 'Maintenance', value: equipment.filter(e => e.status === 'Maintenance').length, color: '#f59e0b' },
    { name: 'Offline', value: equipment.filter(e => e.status === 'Offline').length, color: '#64748b' },
  ];

  // 2. Ticket Trends (Last 7 Days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const ticketTrendData = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: maintenanceTickets.filter(t => t.createdAt.split('T')[0] === date).length
  }));

  // 3. Most Borrowed Equipment Types
  const typeCounts: Record<string, number> = {};
  transactions.forEach(t => {
    const item = equipment.find(e => e.id === t.equipmentId);
    if (item) {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    }
  });

  const popularTypes = Object.entries(typeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 4. Booking Utilization
  const facilityBookingStats = state.facilities.map(f => ({
    name: f.name,
    bookings: bookings.filter(b => b.facilityId === f.id).length
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Laboratory Insights</h2>
          <p className="text-slate-500 text-sm">Real-time analytics and utilization reports.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white rounded-lg border border-slate-200 px-3 py-1.5 shadow-sm text-xs font-medium text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-brand" />
          <span>Last 30 Days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: equipment.length, icon: Laptop, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Registered Users', value: state.users.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Bookings', value: bookings.length, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Asset Support', value: maintenanceTickets.length, icon: TrendingUp, color: 'text-brand', bg: 'bg-brand/5' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-4 flex items-center space-x-4">
              <stat.icon className={`h-8 w-8 ${stat.color} ${stat.bg} p-1.5 rounded-lg`} />
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Asset Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={equipmentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {equipmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Maintenance Request Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Borrowed Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Asset Category Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={80}
                />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6" 
                  radius={[0, 4, 4, 0]} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Facility Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-700">Lab Booking Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilityBookingStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

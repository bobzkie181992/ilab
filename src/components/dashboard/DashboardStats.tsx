import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useAppContext } from '../../context/AppContext';
import { Monitor, AlertCircle, ShoppingBag, Bell } from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const { state } = useAppContext();
  const { equipment, transactions } = state;

  const total = equipment.length;
  const activeBorrows = transactions.filter(t => t.status !== 'Returned').length;
  const overdueBorrows = transactions.filter(t => t.status === 'Overdue').length;
  const openTickets = state.maintenanceTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const activeBookings = state.bookings.filter(b => b.status === 'Confirmed').length;

  const isAdmin = state.currentUser?.role === 'Admin';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Total Assets</CardTitle>
          <Monitor className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-slate-500">Inventory items</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Active Borrows</CardTitle>
          <ShoppingBag className="h-4 w-4 text-brand" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-brand">{activeBorrows}</div>
          <p className="text-xs text-slate-500">Checked out items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Overdue Items</CardTitle>
          <Bell className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueBorrows}</div>
          <p className="text-xs text-slate-500">Action required</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">
            {isAdmin ? 'Active Maintenance' : 'Active Bookings'}
          </CardTitle>
          <AlertCircle className={`h-4 w-4 ${isAdmin ? 'text-amber-500' : 'text-emerald-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isAdmin ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isAdmin ? openTickets : activeBookings}
          </div>
          <p className="text-xs text-slate-500">
            {isAdmin ? 'Open support tickets' : 'Lab reservations'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

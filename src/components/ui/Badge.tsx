import React from 'react';
import { cn } from '../../lib/utils';
import { EquipmentStatus } from '../../types';

interface BadgeProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'secondary';
}

export function Badge({ className, variant = 'default', children }: BadgeProps) {
  const variants = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/80',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
    destructive: 'bg-red-500 text-slate-50 hover:bg-red-500/80',
    success: 'bg-emerald-500 text-slate-50 hover:bg-emerald-500/80',
    warning: 'bg-amber-500 text-slate-50 hover:bg-amber-500/80',
  };

  return (
    <div className={cn("inline-flex items-center rounded-md border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2", variants[variant], className)}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: EquipmentStatus }) {
  const statusConfig: Record<EquipmentStatus, { variant: BadgeProps['variant'], label: string }> = {
    Available: { variant: 'success', label: 'Available' },
    Borrowed: { variant: 'default', label: 'Borrowed' },
    Maintenance: { variant: 'warning', label: 'Maintenance' },
    Offline: { variant: 'secondary', label: 'Offline' },
    Lost: { variant: 'destructive', label: 'Lost' },
  };

  const { variant, label } = statusConfig[status] || { variant: 'default', label: status };
  
  return <Badge variant={variant}>{label}</Badge>;
}

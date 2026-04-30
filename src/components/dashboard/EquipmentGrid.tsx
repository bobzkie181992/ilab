import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { Monitor, Server, Camera, ShieldAlert, Cpu, MoreVertical, ExternalLink, Wrench, QrCode } from 'lucide-react';
import { Equipment } from '../../types';
import { ConfirmationModal } from '../ui/ConfirmationModal';

const EquipmentIconTemplate = ({ type }: { type: Equipment['type'] }) => {
  switch ((type || '').toLowerCase()) {
    case 'laptop': return <Monitor className="h-5 w-5" />;
    case 'workstation': return <Monitor className="h-5 w-5" />;
    case 'server': return <Server className="h-5 w-5" />;
    case 'camera': return <Camera className="h-5 w-5" />;
    default: return <Cpu className="h-5 w-5" />;
  }
};

import { toast } from 'sonner';

export const EquipmentGrid: React.FC = () => {
  const { state, checkoutEquipment } = useAppContext();
  const { equipment, currentUser } = state;

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning'
  });

  const handleBorrow = (item: Equipment) => {
    if (!currentUser) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Borrow Equipment',
      message: `Are you sure you want to request to borrow ${item.name}? This will send a request for approval.`,
      variant: 'info',
      onConfirm: () => {
        const result = checkoutEquipment(item.qrCode, currentUser.qrCode);
        if (!result.success) {
          toast.error(result.message);
        } else {
          toast.success(result.message);
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const isAdmin = currentUser?.role === 'Admin';
  const displayEquipment = isAdmin 
    ? equipment 
    : equipment.filter(item => item.status === 'Available');

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 pb-8">
        {displayEquipment.map(item => (
          <EquipmentCard key={item.id} item={item} onBorrow={() => handleBorrow(item)} />
        ))}
      </div>
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        variant={confirmConfig.variant}
      />
    </>
  );
};

const EquipmentCard: React.FC<{ item: Equipment; onBorrow: () => void }> = ({ item, onBorrow }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDamaged = item.condition === 'Damaged';

  return (
    <Card className="flex flex-col relative group overflow-visible">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <div className="rounded-md bg-brand/10 p-2 text-brand">
            <EquipmentIconTemplate type={item.type} />
          </div>
          <div>
            <CardTitle className="text-base text-lab-text">{item.name}</CardTitle>
            <div className="text-xs text-slate-500 font-mono">{item.qrCode} • {item.lab}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={item.status} />
          
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                    Equipment Actions
                  </div>
                  
                  {item.status === 'Available' && (
                    <button 
                      onClick={() => { onBorrow(); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-brand/5 hover:text-brand flex items-center space-x-2 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Borrow Item</span>
                    </button>
                  )}

                  <button 
                    onClick={() => { toast.info('Detailed specifications coming soon'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Specifications</span>
                  </button>

                  <button 
                    onClick={() => { toast.info('QR Code ready for printing'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Print QR Label</span>
                  </button>

                  <div className="h-px bg-slate-50 my-1" />

                  <button 
                    onClick={() => { toast.info('Maintenance ticket created'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center space-x-2 transition-colors"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Report Issue</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-slate-500 font-medium">Condition</span>
          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
            isDamaged ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
            {item.condition}
          </span>
        </div>

        {isDamaged && (
          <div className="mb-2 rounded-lg bg-red-50/50 p-3 border border-red-100">
            <div className="flex items-start text-red-600">
              <ShieldAlert className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block">Status: Restricted</span>
                Requires maintenance approval before checkout.
              </div>
            </div>
          </div>
        )}

        {item.status === 'Available' && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <button
              onClick={onBorrow}
              className="w-full px-4 py-2.5 font-bold text-xs text-white bg-brand rounded-xl hover:shadow-lg hover:shadow-brand/20 transition-all transform active:scale-95 flex items-center justify-center space-x-2 uppercase tracking-wide"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Quick Borrow</span>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { Monitor, Server, Camera, ShieldAlert, Cpu } from 'lucide-react';
import { Equipment } from '../../types';

const EquipmentIconTemplate = ({ type }: { type: Equipment['type'] }) => {
  switch (type.toLowerCase()) {
    case 'laptop': return <Monitor className="h-5 w-5" />;
    case 'workstation': return <Monitor className="h-5 w-5" />;
    case 'server': return <Server className="h-5 w-5" />;
    case 'camera': return <Camera className="h-5 w-5" />;
    default: return <Cpu className="h-5 w-5" />;
  }
};

export const EquipmentGrid: React.FC = () => {
  const { state } = useAppContext();
  const { equipment } = state;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {equipment.map(item => (
        <EquipmentCard key={item.id} item={item} />
      ))}
    </div>
  );
};

const EquipmentCard: React.FC<{ item: Equipment }> = ({ item }) => {
  const isDamaged = item.condition === 'Damaged';

  return (
    <Card className="flex flex-col">
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
        <StatusBadge status={item.status} />
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">Condition</span>
          <span className={`font-medium ${isDamaged ? 'text-red-600' : 'text-slate-900'}`}>
            {item.condition}
          </span>
        </div>

        {isDamaged && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <div className="flex items-start text-red-600">
              <ShieldAlert className="mr-2 h-4 w-4 shrink-0" />
              <div className="text-xs">
                Requires maintenance approval.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

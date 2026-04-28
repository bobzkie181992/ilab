import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { X } from 'lucide-react';
import { Equipment } from '../../types';

interface ViewEquipmentModalProps {
  isOpen: boolean;
  item: Equipment;
  onClose: () => void;
}

export const ViewEquipmentModal: React.FC<ViewEquipmentModalProps> = ({ isOpen, item, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Equipment Details: {item.name}</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold text-slate-500">QR Code:</span> {item.qrCode}</div>
            <div><span className="font-semibold text-slate-500">Status:</span> {item.status}</div>
            <div><span className="font-semibold text-slate-500">Condition:</span> {item.condition}</div>
            <div><span className="font-semibold text-slate-500">Type:</span> {item.type}</div>
            <div><span className="font-semibold text-slate-500">Lab:</span> {item.lab}</div>
            {item.brand && <div><span className="font-semibold text-slate-500">Brand:</span> {item.brand}</div>}
            {item.model && <div><span className="font-semibold text-slate-500">Model:</span> {item.model}</div>}
            {item.serialNumber && <div><span className="font-semibold text-slate-500">Serial:</span> {item.serialNumber}</div>}
            {item.cpu && <div><span className="font-semibold text-slate-500">CPU:</span> {item.cpu}</div>}
            {item.ram && <div><span className="font-semibold text-slate-500">RAM:</span> {item.ram}</div>}
            {item.storage && <div><span className="font-semibold text-slate-500">Storage:</span> {item.storage}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

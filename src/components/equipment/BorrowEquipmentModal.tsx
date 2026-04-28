import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Calendar, Clock, X } from 'lucide-react';
import { Equipment } from '../../types';

interface BorrowEquipmentModalProps {
  isOpen: boolean;
  items: Equipment[];
  onConfirm: (startTime: string, expectedReturnTime: string, purpose: string) => void;
  onCancel: () => void;
}

export const BorrowEquipmentModal: React.FC<BorrowEquipmentModalProps> = ({ isOpen, items, onConfirm, onCancel }) => {
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [expectedReturnTime, setExpectedReturnTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [purpose, setPurpose] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Borrow {items.length} Item{items.length > 1 ? 's' : ''}</h3>
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Borrow Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="datetime-local" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Return Date & Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="datetime-local" 
                  value={expectedReturnTime}
                  onChange={(e) => setExpectedReturnTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="Brief purpose for borrowing..."
              />
            </div>
            
            <div className="pt-4 flex space-x-3">
              <button 
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('Confirming borrow with:', { startTime, expectedReturnTime, purpose });
                  onConfirm(startTime, expectedReturnTime, purpose);
                }}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-brand hover:bg-brand/90 rounded-lg"
              >
                Request Borrow
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

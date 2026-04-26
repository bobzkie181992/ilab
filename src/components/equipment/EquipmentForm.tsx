import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentCondition } from '../../types';
import { X } from 'lucide-react';

interface EquipmentFormProps {
  initialData?: Equipment;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    qrCode: '',
    type: 'Laptop',
    lab: '',
    condition: 'Good' as EquipmentCondition,
    ipAddress: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        qrCode: initialData.qrCode,
        type: initialData.type,
        lab: initialData.lab,
        condition: initialData.condition,
        ipAddress: initialData.ipAddress || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {initialData ? 'Edit Equipment' : 'Add New Equipment'}
          </h3>
          <button onClick={onCancel} className="rounded-full p-1 hover:bg-slate-100 text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Display Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="e.g. MacBook Pro M2 #05"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">QR Code / ID</label>
              <input
                type="text"
                required
                value={formData.qrCode}
                onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="EQ-LAP-05"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Laptop">Laptop</option>
                <option value="Workstation">Workstation</option>
                <option value="Server">Server</option>
                <option value="Camera">Camera</option>
                <option value="Tablet">Tablet</option>
                <option value="Projector">Projector</option>
                <option value="IoT Kit">IoT Kit</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Laboratory / Storage</label>
            <input
              type="text"
              required
              value={formData.lab}
              onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="e.g. CCIS-Storage"
            />
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-700">Initial Condition</label>
             <div className="flex space-x-2">
               {(['Good', 'Fair', 'Damaged'] as EquipmentCondition[]).map((c) => (
                 <button
                   key={c}
                   type="button"
                   onClick={() => setFormData({ ...formData, condition: c })}
                   className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                     formData.condition === c
                       ? 'bg-brand text-white shadow-sm'
                       : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                   }`}
                 >
                   {c}
                 </button>
               ))}
             </div>
          </div>

          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-brand py-2 text-sm font-bold text-white shadow-md hover:bg-brand/90"
            >
              {initialData ? 'Update Equipment' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

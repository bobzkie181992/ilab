import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentCondition } from '../../types';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface EquipmentFormProps {
  initialData?: Equipment;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { state } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    qrCode: '',
    type: 'Laptop',
    lab: '',
    condition: 'Good' as EquipmentCondition,
    ipAddress: '',
    serialNumber: '',
    poNumber: '',
    brand: '',
    model: '',
    cpu: '',
    ram: '',
    storage: '',
    keyboardSerial: '',
    mouseSerial: '',
    monitorBrandModel: '',
    monitorSerial: '',
    pcType: 'Branded' as 'Branded' | 'Clone',
    systemUnitSerial: '',
    peripherals: [] as { name: string; serial: string }[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        qrCode: initialData.qrCode,
        type: initialData.type,
        lab: initialData.lab,
        condition: initialData.condition,
        ipAddress: initialData.ipAddress || '',
        serialNumber: initialData.serialNumber || '',
        poNumber: initialData.poNumber || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        cpu: initialData.cpu || '',
        ram: initialData.ram || '',
        storage: initialData.storage || '',
        keyboardSerial: initialData.keyboardSerial || '',
        mouseSerial: initialData.mouseSerial || '',
        monitorBrandModel: initialData.monitorBrandModel || '',
        monitorSerial: initialData.monitorSerial || '',
        pcType: initialData.pcType === 'Clone' ? 'Clone' : 'Branded',
        systemUnitSerial: initialData.systemUnitSerial || '',
        peripherals: initialData.peripherals || []
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isDesktopSet = formData.type === 'Desktop Set';
  const isAllInOne = formData.type === 'All-in-One Desktop';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between sticky top-0 bg-white pb-4 z-10 border-b">
          <h3 className="text-xl font-bold text-slate-900 font-sans">
            {initialData ? 'Edit Equipment' : 'Add New Equipment'}
          </h3>
          <button onClick={onCancel} className="rounded-full p-2 hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="e.g. Workstation #01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop Set">Desktop Set (System Unit + Monitor)</option>
                <option value="All-in-One Desktop">All-in-One Desktop</option>
                <option value="Tablet">Tablet</option>
                <option value="Server">Server</option>
                <option value="Projector">Projector</option>
                <option value="Camera">Camera</option>
                <option value="IoT Kit">IoT Kit</option>
                <option value="Peripheral">Peripheral / Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number (Generates QR)</label>
              <input
                type="text"
                required
                value={formData.qrCode}
                onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: EQ-IT-001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Location / Facility</label>
              <select
                required
                value={formData.lab}
                onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">Select Facility</option>
                {state.facilities.map(facility => (
                  <option key={facility.id} value={facility.name}>
                    {facility.name} ({facility.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
              <span className="w-1.5 h-1.5 bg-brand rounded-full mr-2"></span>
              Technical Specifications
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand outline-none"
                  placeholder="Dell, HP, etc."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-brand">Serial Number</label>
                <input
                  type="text"
                  required={!isDesktopSet} // Required for non-desktop sets (which have multiple serials)
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full rounded-lg border-2 border-slate-300 px-3 py-2 text-sm focus:border-brand outline-none bg-slate-50 focus:bg-white transition-colors"
                  placeholder="SN-XXXXX"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PO Number</label>
                <input
                  type="text"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand outline-none"
                />
              </div>
            </div>

            {/* Conditional Desktop Set Fields */}
            {isDesktopSet && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-slate-800">Desktop Configuration</h5>
                  <div className="flex bg-white rounded-lg p-1 border">
                    {(['Branded', 'Clone'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, pcType: type })}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                          formData.pcType === type ? 'bg-brand text-white shadow' : 'text-slate-500'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Unit Details</label>
                      <input
                        type="text"
                        required
                        value={formData.systemUnitSerial}
                        onChange={(e) => setFormData({ ...formData, systemUnitSerial: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand"
                        placeholder="System Unit Serial"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={formData.cpu}
                          onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                          className="rounded-lg border border-slate-300 px-2 py-2 text-xs"
                          placeholder="CPU (i7, etc)"
                        />
                        <input
                          type="text"
                          value={formData.ram}
                          onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                          className="rounded-lg border border-slate-300 px-2 py-2 text-xs"
                          placeholder="RAM (16GB)"
                        />
                        <input
                          type="text"
                          value={formData.storage}
                          onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                          className="rounded-lg border border-slate-300 px-2 py-2 text-xs"
                          placeholder="Disk (512GB)"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monitor Details</label>
                      <input
                        type="text"
                        value={formData.monitorBrandModel}
                        onChange={(e) => setFormData({ ...formData, monitorBrandModel: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand"
                        placeholder="Monitor Brand/Model"
                      />
                      <input
                        type="text"
                        value={formData.monitorSerial}
                        onChange={(e) => setFormData({ ...formData, monitorSerial: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand"
                        placeholder="Monitor Serial"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other Peripherals / Internal Components (Serials)</label>
                      <textarea
                        value={formData.peripherals.map(p => `${p.name}: ${p.serial}`).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          const periphs = lines.map(l => {
                            if (!l.includes(':')) return { name: 'Component', serial: l.trim() };
                            const [name, serial] = l.split(':').map(s => s.trim());
                            return { name: name || 'Component', serial: serial || '' };
                          });
                          setFormData({ ...formData, peripherals: periphs });
                        }}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1 text-xs focus:border-brand"
                        placeholder="Ex: GPU: SN-123&#10;PSU: SN-456"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keyboard Serial</label>
                    <input
                      type="text"
                      value={formData.keyboardSerial}
                      onChange={(e) => setFormData({ ...formData, keyboardSerial: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mouse Serial</label>
                    <input
                      type="text"
                      value={formData.mouseSerial}
                      onChange={(e) => setFormData({ ...formData, mouseSerial: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional All-In-One Fields */}
            {isAllInOne && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg space-y-4 border border-indigo-100">
                <h5 className="text-sm font-bold text-indigo-900 leading-none">All-in-One Configuration</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={formData.cpu}
                    onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="CPU"
                  />
                  <input
                    type="text"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="RAM"
                  />
                  <input
                    type="text"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Storage"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.keyboardSerial}
                    onChange={(e) => setFormData({ ...formData, keyboardSerial: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Keyboard Serial"
                  />
                  <input
                    type="text"
                    value={formData.mouseSerial}
                    onChange={(e) => setFormData({ ...formData, mouseSerial: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Mouse Serial"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition Status</label>
             <div className="flex space-x-2">
               {(['Good', 'Fair', 'Damaged'] as EquipmentCondition[]).map((c) => (
                 <button
                   key={c}
                   type="button"
                   onClick={() => setFormData({ ...formData, condition: c })}
                   className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                     formData.condition === c
                       ? 'bg-brand text-white shadow-lg ring-2 ring-brand ring-offset-2'
                       : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                   }`}
                 >
                   {c}
                 </button>
               ))}
             </div>
          </div>

          <div className="pt-6 flex gap-4 sticky bottom-0 bg-white pb-2 border-t mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-xl hover:bg-brand/90 hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
              {initialData ? 'Update Equipment' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Facility } from '../../types';

interface FacilityFormProps {
  facility?: Facility;
  onSave: (facility: Omit<Facility, 'id'>) => void;
  onCancel: () => void;
}

export const FacilityForm: React.FC<FacilityFormProps> = ({ facility, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Facility, 'id'>>({
    name: '',
    qrCode: '',
    type: 'Room',
    capacity: 30,
    available: true,
    location: '',
    description: '',
    amenities: []
  });

  const [amenitiesText, setAmenitiesText] = useState('');

  useEffect(() => {
    if (facility) {
      setFormData({
        name: facility.name,
        qrCode: facility.qrCode || '',
        type: facility.type,
        capacity: facility.capacity,
        available: facility.available,
        location: facility.location || '',
        description: facility.description || '',
        amenities: facility.amenities || []
      });
      setAmenitiesText((facility.amenities || []).join(', '));
    }
  }, [facility]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amenitiesArray = amenitiesText.split(',').map(item => item.trim()).filter(item => item !== '');
    
    // Auto-generate QR if creating new and none provided
    const finalQr = formData.qrCode || `FAC-${Date.now().toString().slice(-6)}`;
    
    onSave({
      ...formData,
      qrCode: finalQr,
      amenities: amenitiesArray
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-xl font-bold text-slate-900 mb-6 font-sans">
          {facility ? 'Edit Facility' : 'Add New Facility'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facility Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                placeholder="Ex: Simulation Room A"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              >
                <option value="Room">Room</option>
                <option value="Station">Station</option>
                <option value="Zone">Zone</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                placeholder="Ex: CCIS Bldg 3rd Floor"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity</label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all min-h-[80px]"
              placeholder="Provide a brief description of the facility's purpose..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amenities (Comma separated)</label>
            <input
              type="text"
              value={amenitiesText}
              onChange={(e) => setAmenitiesText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
              placeholder="Ex: Projector, High-speed Internet, AI Workstation"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.available}
              onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            <label htmlFor="available" className="text-sm font-medium text-slate-700">Available for Booking</label>
          </div>

          <div className="mt-8 flex space-x-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-brand py-3 text-sm font-bold text-white shadow-lg hover:bg-brand/90 transition-all font-sans"
            >
              {facility ? 'Save Changes' : 'Create Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { EquipmentGrid } from '../dashboard/EquipmentGrid';
import { Plus, Edit2, Trash2, Search, Filter, Wrench } from 'lucide-react';
import { EquipmentForm } from './EquipmentForm';
import { Equipment } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';

interface EquipmentViewProps {
  onMaintenance?: (equipmentId: string) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({ onMaintenance }) => {
  const { state, addEquipment, updateEquipment, deleteEquipment } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filteredEquipment = state.equipment.filter(eq => 
    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.qrCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditingEquipment(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      deleteEquipment(id);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingEquipment) {
      updateEquipment(editingEquipment.id, data);
    } else {
      addEquipment(data);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-lab-text">Equipment Inventory</h2>
          <p className="text-slate-500 text-sm">Manage and track all laboratory assets.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand/90 transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, QR code, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-sm"
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand' : 'text-slate-500 hover:text-slate-700'}`}
            >
              List
            </button>
          </div>
          <button className="flex items-center px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredEquipment.map(item => (
            <div key={item.id} className="relative group">
              <EquipmentItemCard 
                item={item} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onMaintenance={onMaintenance}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">QR Code</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.condition}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.type}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{item.qrCode}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.lab}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                         title="Maintenance"
                         onClick={() => onMaintenance?.(item.id)}
                         className="p-1.5 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      >
                         <Wrench className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-brand hover:bg-brand/5 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEquipment.length === 0 && (
            <div className="py-20 text-center text-slate-500">
              No equipment found matching your search.
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <EquipmentForm
          initialData={editingEquipment}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

const EquipmentItemCard = ({ 
  item, 
  onEdit, 
  onDelete, 
  onMaintenance 
}: { 
  item: Equipment; 
  onEdit: (eq: Equipment) => void; 
  onDelete: (id: string) => void;
  onMaintenance?: (id: string) => void;
}) => {
  return (
    <Card className="h-full flex flex-col group relative overflow-hidden">
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          title="Maintenance"
          onClick={(e) => { e.stopPropagation(); onMaintenance?.(item.id); }}
          className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-amber-500 transition-colors"
        >
          <Wrench className="h-4 w-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-brand transition-colors"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <CardContent className="p-5">
        <div className="mb-4">
          <StatusBadge status={item.status} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors">{item.name}</h4>
          <p className="text-xs text-slate-500 font-mono">{item.qrCode} • {item.type}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
            <div className="text-slate-400 mb-1">Condition</div>
            <div className="font-medium text-slate-700">{item.condition}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
            <div className="text-slate-400 mb-1">Location</div>
            <div className="font-medium text-slate-700 truncate">{item.lab}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

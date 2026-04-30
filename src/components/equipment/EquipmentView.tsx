import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { EquipmentGrid } from '../dashboard/EquipmentGrid';
import { Plus, Edit2, Trash2, Search, Filter, Wrench, Download, Upload, Eye, QrCode, Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { EquipmentForm } from './EquipmentForm';
import { BorrowEquipmentModal } from './BorrowEquipmentModal';
import { WalkInBorrowModal } from './WalkInBorrowModal';
import { ViewEquipmentModal } from './ViewEquipmentModal';
import { QRCodeDisplay } from '../ui/QRCodeDisplay';
import { BookingStatus, Equipment } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { toast } from 'sonner';

interface EquipmentViewProps {
  onMaintenance?: (equipmentId: string) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({ onMaintenance }) => {
  const { state, addEquipment, updateEquipment, deleteEquipment, checkoutEquipment, walkInCheckout } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>(undefined);
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | undefined>(undefined);
  const [viewingQRCode, setViewingQRCode] = useState<{ value: string; label: string; subLabel?: string } | undefined>(undefined);
  const [isBulkPrintMode, setIsBulkPrintMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [labFilter, setLabFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);

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

  const equipmentTypes = Array.from(new Set(state.equipment.map(e => e.type)));
  const labs = Array.from(new Set(state.equipment.map(e => e.lab)));
  const equipmentStatuses = ['All', 'Available', 'Borrowed', 'Maintenance', 'Offline', 'Lost', 'Reserved'];

  const filteredEquipment = state.equipment.filter(eq => {
    const matchesSearch = 
      (eq.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (eq.qrCode?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (eq.type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (eq.lab?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || eq.status === statusFilter;
    const matchesType = typeFilter === 'All' || eq.type === typeFilter;
    const matchesLab = labFilter === 'All' || eq.lab === labFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesLab;
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const exportEquipment = () => {
    const headers = ['name', 'type', 'condition', 'lab', 'qrCode'];
    const csvContent = [
      headers.join(','),
      ...state.equipment.map(eq => [eq.name, eq.type, eq.condition, eq.lab, eq.qrCode].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'equipment_inventory.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importEquipment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const newEquipment = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          name: values[headers.indexOf('name')],
          type: values[headers.indexOf('type')],
          condition: values[headers.indexOf('condition')],
          lab: values[headers.indexOf('lab')],
          qrCode: values[headers.indexOf('qrCode')],
        };
      });

      newEquipment.forEach(eq => addEquipment(eq as any));
      toast.success(`Imported ${newEquipment.length} items.`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Equipment',
      message: 'Are you sure you want to permanently delete this equipment from the inventory? This action cannot be undone.',
      variant: 'danger',
      onConfirm: () => {
        deleteEquipment(id);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const [selectedEquipmentQrs, setSelectedEquipmentQrs] = useState<string[]>([]);
  const [borrowItems, setBorrowItems] = useState<Equipment[]>([]);

  const toggleSelection = (qr: string) => {
    setSelectedEquipmentQrs(prev => prev.includes(qr) ? prev.filter(q => q !== qr) : [...prev, qr]);
  };

  const handleBorrowSelected = () => {
    if (!state.currentUser) {
        toast.error('Please log in to borrow equipment.');
        return;
    }
    const items = state.equipment.filter(e => selectedEquipmentQrs.includes(e.qrCode));
    if (items.length === 0) {
        toast.error('Please select at least one item.');
        return;
    }
    
    if (state.currentUser.role === 'Admin') {
      setBorrowItems(items);
      setIsWalkInModalOpen(true);
    } else {
      setBorrowItems(items);
    }
  };
    
  const handleBorrow = (item: Equipment) => {
    if (!state.currentUser) {
        toast.error('Please log in to borrow equipment.');
        return;
    }
    
    if (state.currentUser.role === 'Admin') {
      setBorrowItems([item]);
      setIsWalkInModalOpen(true);
    } else {
      setBorrowItems([item]);
    }
  };

  const handleFormSubmit = (data: any) => {
    const actionLabel = editingEquipment ? 'Update' : 'Add';
    setConfirmConfig({
      isOpen: true,
      title: `${actionLabel} Equipment`,
      message: `Do you want to save these changes to ${data.name}?`,
      variant: 'info',
      onConfirm: () => {
        if (editingEquipment) {
          updateEquipment(editingEquipment.id, data);
        } else {
          addEquipment(data);
        }
        setIsFormOpen(false);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const canManage = state.currentUser?.role === 'Admin' || state.currentUser?.role === 'Staff';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ... existing header ... */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-lab-text">Equipment</h2>
          <p className="text-slate-500 text-sm">Manage and track all laboratory equipment.</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={importEquipment}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </button>
            <button
              onClick={() => setIsBulkPrintMode(true)}
              disabled={selectedEquipmentQrs.length === 0}
              className="flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <QrCode className="mr-2 h-4 w-4" />
              Print Selected QR
            </button>
            <button
              onClick={exportEquipment}
              className="flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => { setEditingEquipment(undefined); setIsFormOpen(true); }}
              className="flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand/90 transition-all active:scale-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </button>
          </div>
        )}
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
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 rounded-lg border transition-all text-sm ${
              showFilters ? 'bg-brand text-white border-brand' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <div className="flex flex-wrap gap-2">
              {equipmentStatuses.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === status 
                      ? 'bg-brand text-white shadow-md shadow-brand/20' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  typeFilter === 'All' 
                    ? 'bg-brand text-white' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                All Types
              </button>
              {equipmentTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === type 
                      ? 'bg-brand text-white shadow-md shadow-brand/20' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location / Lab</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLabFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  labFilter === 'All' 
                    ? 'bg-brand text-white shadow-md shadow-brand/20' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                All Labs
              </button>
              {labs.map(lab => (
                <button
                  key={lab}
                  onClick={() => setLabFilter(lab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    labFilter === lab 
                      ? 'bg-brand text-white shadow-md shadow-brand/20' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {lab}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredEquipment.map(item => (
            <div key={item.id} className="relative group">
              <EquipmentItemCard 
                item={item} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onMaintenance={onMaintenance}
                onBorrow={handleBorrow}
                onView={setViewingEquipment}
                onViewQR={setViewingQRCode}
                canManage={canManage}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* ... list view ... */}
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <input 
                    type="checkbox" 
                    checked={
                      filteredEquipment.filter(e => e.status !== 'Offline' && e.status !== 'Lost').length > 0 &&
                      filteredEquipment.filter(e => e.status !== 'Offline' && e.status !== 'Lost').every(e => selectedEquipmentQrs.includes(e.qrCode))
                    }
                    onChange={(e) => {
                      const bookableQrs = filteredEquipment.filter(e => e.status !== 'Offline' && e.status !== 'Lost').map(e => e.qrCode);
                      setSelectedEquipmentQrs(e.target.checked ? bookableQrs : []);
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">QR Code</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  <button onClick={handleBorrowSelected} disabled={selectedEquipmentQrs.length === 0} className="px-3 py-1 text-xs font-bold text-white bg-brand rounded hover:bg-brand/90 disabled:bg-slate-300 transition-colors">
                    Borrow Selected ({selectedEquipmentQrs.length})
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      disabled={item.status === 'Offline' || item.status === 'Lost'}
                      checked={selectedEquipmentQrs.includes(item.qrCode)} 
                      onChange={() => toggleSelection(item.qrCode)} 
                    />
                  </td>
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
                          onClick={() => setViewingQRCode({
                            value: item.qrCode,
                            label: item.name,
                            subLabel: `${item.type} | ${item.lab}`
                          })}
                          className="p-1.5 rounded-md text-slate-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setViewingEquipment(item)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-brand hover:bg-brand/5 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      {(item.status !== 'Offline' && item.status !== 'Lost') && (
                        <button
                          onClick={() => handleBorrow(item)}
                          className={`px-3 py-1 text-xs font-bold text-white rounded transition-colors ${item.status === 'Available' ? 'bg-brand hover:bg-brand/90' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                          {item.status === 'Available' ? 'Borrow' : 'Queue'}
                        </button>
                      )}
                      {canManage && (
                        <>
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
                        </>
                      )}
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

      {viewingEquipment && (
        <ViewEquipmentModal
          isOpen={true}
          item={viewingEquipment}
          onClose={() => setViewingEquipment(undefined)}
        />
      )}

      {viewingQRCode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <QRCodeDisplay 
            value={viewingQRCode.value} 
            label={viewingQRCode.label} 
            subLabel={viewingQRCode.subLabel}
            onClose={() => setViewingQRCode(undefined)}
          />
        </div>
      )}

      {isBulkPrintMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white print:backdrop-none">
          <div className="bg-white rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0">
            <div className="flex justify-between items-center mb-6 print:hidden relative z-[100]">
              <h2 className="text-xl font-bold">Bulk Print QR Codes</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                      const contentToPrint = document.getElementById('qr-codes-container');
                      if (!contentToPrint) return;
                      const printWindow = window.open('', '_blank', 'width=800,height=600');
                      if (!printWindow) { toast.error('Please allow popups to print'); return; }
                      printWindow.document.write(`
                          <html>
                              <head>
                                  <title>Print QR Codes</title>
                                  <script src="https://cdn.tailwindcss.com"></script>
                              </head>
                              <body>
                                  ${contentToPrint.innerHTML}
                                  <script>
                                      window.onload = () => {
                                          setTimeout(() => {
                                              window.print();
                                              window.close();
                                          }, 500);
                                      }
                                  </script>
                              </body>
                          </html>
                      `);
                      printWindow.document.close();
                  }}
                  className="flex items-center space-x-2 bg-brand text-white px-4 py-2 rounded-lg font-bold"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Now</span>
                </button>
                <button 
                  onClick={() => setIsBulkPrintMode(false)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div id="qr-codes-container" className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 print:grid-cols-5 print:gap-2">
              {state.equipment
                .filter(e => selectedEquipmentQrs.includes(e.qrCode))
                .map(item => (
                  <div key={item.id} className="flex flex-col items-center p-4 border border-slate-100 rounded-xl print:border-slate-300 print:rounded-none">
                    <QRCodeSVG value={item.qrCode} size={150} level="H" includeMargin />
                    <div className="text-center mt-4">
                      <p className="text-sm font-bold truncate w-full">{item.name}</p>
                      <p className="text-[10px] font-mono mt-1">{item.qrCode}</p>
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500 print:hidden">
              Ready to print {selectedEquipmentQrs.length} QR codes.
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <EquipmentForm
          initialData={editingEquipment}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {borrowItems.length > 0 && !isWalkInModalOpen && (
        <BorrowEquipmentModal
          isOpen={true}
          items={borrowItems}
          onCancel={() => setBorrowItems([])}
          onConfirm={(start, ret, purpose) => {
            const result = checkoutEquipment(borrowItems.map(i => i.qrCode), state.currentUser!.qrCode, start, ret, purpose);
            if (result.success) {
              toast.success(result.message);
            } else {
              toast.error(result.message);
            }
            setBorrowItems([]);
            setSelectedEquipmentQrs([]);
          }}
        />
      )}

      {isWalkInModalOpen && (
        <WalkInBorrowModal 
          isOpen={true}
          items={borrowItems}
          onCancel={() => {
            setBorrowItems([]);
            setIsWalkInModalOpen(false);
          }}
          onConfirm={(borrowerId, start, ret, purpose) => {
            const result = walkInCheckout(borrowItems.map(i => i.qrCode), borrowerId, start, ret, purpose);
            if (result.success) {
              toast.success(result.message);
            } else {
              toast.error(result.message);
            }
            setBorrowItems([]);
            setSelectedEquipmentQrs([]);
            setIsWalkInModalOpen(false);
          }}
        />
      )}

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

const EquipmentItemCard = ({ 
  item, 
  onEdit, 
  onDelete, 
  onMaintenance,
  onBorrow,
  onView,
  onViewQR,
  canManage
}: { 
  item: Equipment; 
  onEdit: (eq: Equipment) => void; 
  onDelete: (id: string) => void;
  onMaintenance?: (id: string) => void;
  onBorrow: (eq: Equipment) => void;
  onView: (eq: Equipment) => void;
  onViewQR: (qr: { value: string; label: string; subLabel?: string }) => void;
  canManage: boolean;
}) => {
  return (
    <Card className="h-full flex flex-col group relative overflow-hidden">
      {canManage && (
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            title="View QR Code"
            onClick={(e) => { 
                e.stopPropagation(); 
                onViewQR({
                    value: item.qrCode,
                    label: item.name,
                    subLabel: `${item.type} | ${item.lab}`
                }); 
            }}
            className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-brand transition-colors"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <button 
            title="View Details"
            onClick={(e) => { e.stopPropagation(); onView(item); }}
            className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-slate-600 hover:text-brand transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
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
      )}
      <CardContent className="p-5">
        <div className="mb-4 flex justify-between items-start">
          <StatusBadge status={item.status} />
        </div>
        
        {item.status !== 'Offline' && item.status !== 'Lost' && (
          <div className="absolute bottom-2 right-2">
            <button
              onClick={() => onBorrow(item)}
              className={`px-3 py-1 text-xs font-bold text-white rounded transition-colors shadow-sm ${item.status === 'Available' ? 'bg-brand hover:bg-brand/90' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {item.status === 'Available' ? 'Borrow' : 'Queue'}
            </button>
          </div>
        )}
        <div className="space-y-1 mt-1">
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

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Trash2,
  MoreVertical,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { InventoryAudit, AuditRecord, Equipment, EquipmentCondition, EquipmentStatus } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export const InventoryAuditView: React.FC = () => {
  const { state, startInventoryAudit, addAuditRecord, completeInventoryAudit, deleteInventoryAudit } = useAppContext();
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [labFilter, setLabFilter] = useState('All');

  const activeAudit = useMemo(() => 
    state.inventoryAudits.find(a => a.id === activeAuditId), 
    [state.inventoryAudits, activeAuditId]
  );

  const handleStartAudit = () => {
    const month = new Date().getMonth();
    const quarter = Math.floor(month / 3) + 1 as (1 | 2 | 3 | 4);
    const year = new Date().getFullYear();
    
    const existing = state.inventoryAudits.find(a => a.quarter === quarter && a.year === year && a.status !== 'Completed');
    if (existing) {
      setActiveAuditId(existing.id);
      setIsAuditing(true);
      return;
    }

    const id = startInventoryAudit(quarter, year);
    setActiveAuditId(id);
    setIsAuditing(true);
    toast.success(`Inventory Audit for Q${quarter} ${year} started.`);
  };

  if (isAuditing && activeAudit) {
    return (
      <AuditExecution 
        audit={activeAudit} 
        onBack={() => setIsAuditing(false)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-lab-text flex items-center">
            <ClipboardCheck className="mr-2 h-6 w-6 text-brand" />
            Inventory & Audits
          </h2>
          <p className="text-slate-500 text-sm">Schedule and track quarterly equipment inventory checks.</p>
        </div>
        <button 
          onClick={handleStartAudit}
          className="flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand/90 transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          Start Quarterly Audit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.inventoryAudits.map(audit => (
          <AuditCard 
            key={audit.id} 
            audit={audit} 
            onOpen={() => {
              setActiveAuditId(audit.id);
              setIsAuditing(true);
            }}
            onDelete={() => deleteInventoryAudit(audit.id)}
          />
        ))}
        {state.inventoryAudits.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <BarChart3 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No audit history found.</p>
            <p className="text-slate-400 text-sm">Start your first quarterly audit to track equipment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface AuditCardProps {
  audit: InventoryAudit;
  onOpen: () => void;
  onDelete: () => void;
}

const AuditCard: React.FC<AuditCardProps> = ({ audit, onOpen, onDelete }) => {
  const progress = Math.round((audit.auditedItems / audit.totalItems) * 100) || 0;
  
  return (
    <Card className="hover:shadow-md transition-all group overflow-hidden border-slate-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-xl",
              audit.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-brand/10 text-brand"
            )}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Q{audit.quarter} {audit.year} Audit</h4>
              <p className="text-xs text-slate-500">Started {format(new Date(audit.startDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-400">Progress</span>
              <span className={cn(
                audit.status === 'Completed' ? "text-emerald-500" : "text-brand"
              )}>{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  audit.status === 'Completed' ? "bg-emerald-500" : "bg-brand"
                )}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>{audit.auditedItems} audited</span>
              <span>{audit.totalItems} total</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <span className={cn(
              "text-[10px] font-black uppercase px-2 py-1 rounded-md",
              audit.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            )}>
              {audit.status}
            </span>
            <button 
              onClick={onOpen}
              className="flex items-center text-xs font-bold text-brand hover:underline"
            >
              {audit.status === 'Completed' ? 'View Report' : 'Continue Audit'}
              <ChevronRight className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AuditExecution = ({ audit, onBack }: { audit: InventoryAudit; onBack: () => void }) => {
  const { state, addAuditRecord, completeInventoryAudit } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [labFilter, setLabFilter] = useState('All');
  const [viewedItemsFilter, setViewedItemsFilter] = useState<'All' | 'Pending' | 'Audited'>('All');

  const auditRecords = useMemo(() => 
    state.auditRecords.filter(r => r.inventoryAuditId === audit.id),
    [state.auditRecords, audit.id]
  );

  const auditedEquipmentIds = useMemo(() => 
    new Set(auditRecords.map(r => r.equipmentId)),
    [auditRecords]
  );

  const labs = Array.from(new Set(state.equipment.map(e => e.lab)));

  const filteredEquipment = useMemo(() => {
    return state.equipment.filter(eq => {
      const matchesSearch = 
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.qrCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLab = labFilter === 'All' || eq.lab === labFilter;
      
      const isAudited = auditedEquipmentIds.has(eq.id);
      const matchesViewFilter = 
        viewedItemsFilter === 'All' || 
        (viewedItemsFilter === 'Pending' && !isAudited) ||
        (viewedItemsFilter === 'Audited' && isAudited);

      return matchesSearch && matchesLab && matchesViewFilter;
    });
  }, [state.equipment, searchQuery, labFilter, viewedItemsFilter, auditedEquipmentIds]);

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const handleAuditItem = (eq: Equipment, condition: EquipmentCondition, status: EquipmentStatus, remarks: string) => {
    addAuditRecord({
      equipmentId: eq.id,
      inventoryAuditId: audit.id,
      condition,
      status,
      remarks
    });
    setSelectedEquipment(null);
    toast.success(`Audited ${eq.name}`);
  };

  const handleCompleteAudit = () => {
    if (audit.auditedItems < audit.totalItems) {
      if (!confirm(`Warning: You have only audited ${audit.auditedItems} out of ${audit.totalItems} items. Do you want to complete the audit anyway?`)) {
        return;
      }
    }
    completeInventoryAudit(audit.id);
    toast.success('Inventory Audit completed and archived.');
    onBack();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Q{audit.quarter} {audit.year} Quarterly Audit</h3>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-medium">{audit.auditedItems} of {audit.totalItems} items checked</span>
              <span>•</span>
              <span>{Math.round((audit.auditedItems / audit.totalItems) * 100)}% Complete</span>
            </div>
          </div>
        </div>
        {audit.status !== 'Completed' && (
          <button 
            onClick={handleCompleteAudit}
            className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600 transition-all"
          >
            Complete Audit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative col-span-1 md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search QR or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 bg-white shadow-sm text-sm"
          />
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-1 md:col-span-2">
          <select 
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="All">All Labs</option>
            {labs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {(['All', 'Pending', 'Audited'] as const).map(f => (
              <button
                key={f}
                onClick={() => setViewedItemsFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  viewedItemsFilter === f ? "bg-brand text-white shadow-sm" : "text-slate-500 hover:text-brand"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(eq => {
          const record = auditRecords.find(r => r.equipmentId === eq.id);
          const isAudited = !!record;

          return (
            <Card 
              key={eq.id} 
              onClick={() => audit.status !== 'Completed' && setSelectedEquipment(eq)}
              className={cn(
                "cursor-pointer transition-all border-slate-200",
                audit.status !== 'Completed' ? "hover:border-brand hover:shadow-md" : "",
                isAudited ? "bg-emerald-50/30 border-emerald-100" : "bg-white"
              )}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{eq.qrCode}</span>
                    <h5 className="font-bold text-slate-800 line-clamp-1">{eq.name}</h5>
                  </div>
                  {isAudited ? (
                    <div className="bg-emerald-500 text-white p-1 rounded-full">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="bg-slate-100 text-slate-400 p-1 rounded-full">
                      <Clock className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4 pb-2 border-b border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Lab: {eq.lab}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                    eq.condition === 'Good' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {eq.condition}
                  </span>
                </div>

                {record && (
                  <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center">
                      <Plus className="h-3 w-3 mr-1" /> Audited {format(new Date(record.auditDate), 'HH:mm')}
                    </p>
                    <p className="text-[10px] text-slate-400 italic truncate italic">{record.remarks || 'No remarks recorded.'}</p>
                  </div>
                )}
                {!record && audit.status !== 'Completed' && (
                  <div className="mt-3">
                    <span className="text-[10px] text-brand font-bold uppercase tracking-widest">Click to Record Check</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full animate-in zoom-in-95 duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedEquipment.name}</h3>
                  <p className="text-sm font-mono text-slate-500">{selectedEquipment.qrCode}</p>
                </div>
                <button onClick={() => setSelectedEquipment(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <AuditItemForm 
                equipment={selectedEquipment} 
                onSubmit={handleAuditItem} 
                onCancel={() => setSelectedEquipment(null)} 
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const AuditItemForm = ({ 
  equipment, 
  onSubmit, 
  onCancel 
}: { 
  equipment: Equipment; 
  onSubmit: (eq: Equipment, condition: EquipmentCondition, status: EquipmentStatus, remarks: string) => void;
  onCancel: () => void;
}) => {
  const [condition, setCondition] = useState<EquipmentCondition>(equipment.condition);
  const [status, setStatus] = useState<EquipmentStatus>(equipment.status);
  const [remarks, setRemarks] = useState('');

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mark Condition</label>
        <div className="grid grid-cols-3 gap-2">
          {(['Good', 'Fair', 'Damaged'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              className={cn(
                "py-3 rounded-xl text-xs font-bold transition-all border-2",
                condition === c 
                  ? "bg-brand/5 border-brand text-brand shadow-sm" 
                  : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Update Status</label>
        <div className="grid grid-cols-2 gap-2">
          {(['Available', 'Borrowed', 'Maintenance', 'Offline', 'Lost'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "py-3 rounded-xl text-xs font-bold transition-all border-2",
                status === s 
                  ? "bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm" 
                  : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Remarks / Observations</label>
        <textarea
          placeholder="Enter any findings or notes during the physical check..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:bg-white focus:border-brand transition-all outline-none"
        />
      </div>

      <div className="flex space-x-3">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={() => onSubmit(equipment, condition, status, remarks)}
          className="flex-[2] py-3 rounded-xl bg-brand text-white text-sm font-bold shadow-lg hover:bg-brand/90 transition-all active:scale-95"
        >
          Save Assessment
        </button>
      </div>
    </div>
  );
};

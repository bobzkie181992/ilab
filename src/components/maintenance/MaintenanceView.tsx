import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { 
  Wrench, 
  ClipboardCheck, 
  AlertCircle, 
  Plus, 
  Calendar,
  Trash2,
  Edit
} from 'lucide-react';
import { TicketPriority, TicketStatus, MaintenanceTicket } from '../../types';

const PREVENTIVE_MAINTENANCE = {
  computer_systems: {
    title: 'Computer Systems',
    tasks: [
      'Perform antivirus scan on all computer',
      'Check for and install software updates',
      'Run disk cleanup and defragmentation (if Applicable)',
      'Deep clean computer keyboard, monitor and mice',
      'Dust off CPU fans and vents'
    ]
  },
  electrical_network: {
    title: 'Electrical and Network',
    tasks: [
      'Inspect network stability and check for slowdowns',
      'Test all electrical sockets and report any issues',
      'Inspect circuit breakers for any irregularities',
      'Ensure air-conditioning filter are clean'
    ]
  },
  security_safety: {
    title: 'Security and Safety',
    tasks: [
      'Verify that all signages are still visible and intact',
      'Restock missing items in the medicine kit',
      'Ensure all security cameras (if applicable) are working'
    ]
  }
};

interface MaintenanceViewProps {
  initialEquipmentId?: string;
  onTicketCreated?: () => void;
}

import { toast } from 'sonner';

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ 
  initialEquipmentId, 
  onTicketCreated 
}) => {
  const { state, createTicket, updateTicketStatus, updateTicketChecklist, addMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } = useAppContext();
  const [isOpeningTicket, setIsOpeningTicket] = useState(false);
  const [isShowingConfirm, setIsShowingConfirm] = useState(false);
  const [isShowingValidation, setIsShowingValidation] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'tickets' | 'pm' | 'logs'>('tickets');
  const [pmTasks, setPmTasks] = useState<Record<string, {
    status: 'Pending' | 'Done';
    remarks: string;
    lab: string;
    date: string;
    week: string;
  }>>({});
  const [filterLab, setFilterLab] = useState('All');
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  
  const pmLogs = state.maintenanceLogs;
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  // Form header states
  const [formLab, setFormLab] = useState('');
  const [formMonth, setFormMonth] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWeeks, setFormWeeks] = useState<string[]>([]);
  const [additionalConcerns, setAdditionalConcerns] = useState('');
  const [formPreparedBy, setFormPreparedBy] = useState('');
  const [formPreparedDesignation, setFormPreparedDesignation] = useState('');
  const [formEvaluatedBy, setFormEvaluatedBy] = useState('');
  const [formEvaluatedDesignation, setFormEvaluatedDesignation] = useState('');
  const [formEvaluatedDate, setFormEvaluatedDate] = useState(new Date().toISOString().split('T')[0]);

  const [filterMonth, setFilterMonth] = useState('All');
  const [filterPreparedBy, setFilterPreparedBy] = useState('All');

  const [isShowingDeleteConfirm, setIsShowingDeleteConfirm] = useState(false);
  const [logIdToDelete, setLogIdToDelete] = useState<string | null>(null);

  // Removed redundant migration useEffect as it is now handled in AppContext

  const getUniqueLabs = () => {
    const labs = new Set<string>();
    // Include all defined facilities
    state.facilities.forEach(f => labs.add(f.name));
    
    // Also include labs from existing logs (historical data)
    pmLogs.forEach(log => {
      if (log.lab) labs.add(log.lab);
      Object.values(log.tasks).forEach((task: any) => {
        if (task.lab) labs.add(task.lab);
      });
    });
    return Array.from(labs).sort();
  };

  const getUniquePreparers = () => {
    const preparers = new Set<string>();
    pmLogs.forEach(log => {
      if (log.preparedBy) preparers.add(log.preparedBy);
    });
    return Array.from(preparers).sort();
  };

  const getUniqueMonths = () => {
    const months = new Set<string>();
    pmLogs.forEach(log => {
      if (log.month) months.add(log.month);
      else {
        const d = new Date(log.date);
        const m = d.toLocaleString('default', { month: 'long' });
        months.add(m);
      }
    });
    return Array.from(months).sort();
  };

  const handleExport = () => {
    const filtered = filterLogs();
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Laboratory,PreparedBy,Task,Status,Remarks,AdditionalConcerns\n"
      + filtered.flatMap(log => 
          Object.entries(log.tasks).map(([key, task]: [string, any]) => {
            const [catKey, idx] = key.split('-');
            const cat = PREVENTIVE_MAINTENANCE[catKey as keyof typeof PREVENTIVE_MAINTENANCE];
            const taskTitle = cat ? cat.tasks[parseInt(idx)] : key;
            const labName = log.lab || task.lab || 'N/A';
            const preparedBy = log.preparedBy || 'N/A';
            return `"${log.date}","${labName}","${preparedBy}","${taskTitle}","${task.status}","${task.remarks || ''}","${log.additionalConcerns || ''}"`;
          })
        ).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pm_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterLogs = () => {
    return pmLogs.filter(log => {
      const matchLab = filterLab === 'All' || log.lab === filterLab || Object.values(log.tasks).some((t: any) => t.lab === filterLab);
      
      const logMonth = log.month || new Date(log.date).toLocaleString('default', { month: 'long' });
      const matchMonth = filterMonth === 'All' || logMonth === filterMonth;
      
      const matchPrepared = filterPreparedBy === 'All' || log.preparedBy === filterPreparedBy;
      
      return matchLab && matchMonth && matchPrepared;
    });
  };

  useEffect(() => {
    if (initialEquipmentId) {
      const eq = state.equipment.find(e => e.id === initialEquipmentId);
      if (eq) {
        setSelectedEquipment(initialEquipmentId);
        setTicketTitle(`Maintenance: ${eq.name}`);
        setIsOpeningTicket(true);
      }
    }
  }, [initialEquipmentId, state.equipment]);

  const handleCreateTicket = () => {
    if (!selectedEquipment || !ticketTitle) return;

    createTicket({
      equipmentId: selectedEquipment,
      reportedBy: state.currentUser?.name || 'Unknown',
      title: ticketTitle,
      description: ticketDesc,
      priority,
      checklist: {
        id: `cl-${Date.now()}`,
        title: 'Preventive Maintenance Checklist',
        items: [
          { id: '1', task: 'Internal Cleaning & Dusting', completed: false },
          { id: '2', task: 'Software Updates & Security Patching', completed: false },
          { id: '3', task: 'Hardware Integrity Check', completed: false },
          { id: '4', task: 'Thermal Paste Re-application (if needed)', completed: false },
          { id: '5', task: 'Functional Testing', completed: false },
        ]
      }
    });

    setIsOpeningTicket(false);
    setSelectedEquipment('');
    setTicketTitle('');
    setTicketDesc('');
    onTicketCreated?.();
    toast.success('Support ticket created successfully!');
  };

  const handleUpdateTask = (cat: string, index: number, field: string, value: any) => {
    const key = `${cat}-${index}`;
    setPmTasks(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { status: 'Pending', remarks: '', lab: '', date: new Date().toISOString().split('T')[0], week: '1st' }),
        [field]: value
      }
    }));
  };

  const renderTicketsView = () => (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Statistics and PM */}
        <div className="lg:col-span-1 space-y-4">
          <button
            onClick={() => setIsOpeningTicket(true)}
            className="w-full flex items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-700 transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Support Ticket
          </button>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Ticket Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Open Tickets</span>
                <span className="text-xl font-bold text-amber-600">{state.maintenanceTickets.filter(t => t.status === 'Open').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">In Progress</span>
                <span className="text-xl font-bold text-blue-600">{state.maintenanceTickets.filter(t => t.status === 'In Progress').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Resolved Today</span>
                <span className="text-xl font-bold text-emerald-600">{state.maintenanceTickets.filter(t => t.status === 'Resolved').length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-50/50 border-amber-100">
             <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-900 flex items-center">
                   <AlertCircle className="h-4 w-4 mr-2" />
                   Pending Maintenance
                </CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-xs text-amber-800 leading-relaxed">
                   Equipment marked as "Damaged" during return automatically creates a system alert. Admins should review and open maintenance tickets.
                </p>
                <div className="mt-4 space-y-2">
                   {state.equipment.filter(eq => eq.status === 'Maintenance' && !state.maintenanceTickets.some(t => t.equipmentId === eq.id)).map(eq => (
                      <div key={eq.id} className="flex items-center justify-between p-2 rounded bg-white border border-amber-200">
                         <div className="text-[10px] font-bold text-slate-900">{eq.name}</div>
                         <button 
                            onClick={() => { setSelectedEquipment(eq.id); setTicketTitle(`Repair: ${eq.name}`); setIsOpeningTicket(true); }}
                            className="text-[10px] font-bold text-amber-600 hover:underline"
                          >
                            Open Ticket
                         </button>
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <ClipboardCheck className="h-5 w-5 text-brand" />
            <span>Active Tickets</span>
          </h3>
          
          {state.maintenanceTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-20 text-center">
              <Wrench className="mx-auto h-12 w-12 text-slate-200 mb-4" />
              <p className="text-slate-400">No active maintenance tickets found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.maintenanceTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  equipment={state.equipment.find(eq => eq.id === ticket.equipmentId)}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
  );

  const handleSavePmChecklist = () => {
    const isChecklistEmpty = Object.keys(pmTasks).length === 0 ||
      (Object.values(pmTasks) as { status: string; remarks?: string }[]).every(task =>
        task.status === 'Pending' && (!task.remarks || task.remarks.trim() === '')
      );

    if (isChecklistEmpty) {
      setIsShowingValidation(true);
      return;
    }

    if (!state.currentUser) {
      toast.error('Please login to save the checklist.');
      return;
    }

    setIsShowingConfirm(true);
  };

  const handleConfirmedSave = () => {
    setIsShowingConfirm(false);
    const logData = {
      date: new Date().toISOString(),
      lab: formLab,
      month: formMonth,
      formDate: formDate,
      weeks: formWeeks,
      tasks: pmTasks as any,
      additionalConcerns,
      preparedBy: formPreparedBy,
      preparedDesignation: formPreparedDesignation,
      evaluatedBy: formEvaluatedBy,
      evaluatedDesignation: formEvaluatedDesignation,
      evaluatedDate: formEvaluatedDate,
    };
    
    if (editingLogId) {
      updateMaintenanceLog(editingLogId, logData);
    } else {
      addMaintenanceLog(logData);
    }
    
    setPmTasks({});
    setEditingLogId(null);
    setFormLab('');
    setFormMonth('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormWeeks([]);
    setAdditionalConcerns('');
    setFormPreparedBy('');
    setFormPreparedDesignation('');
    setFormEvaluatedBy('');
    setFormEvaluatedDesignation('');
    setFormEvaluatedDate(new Date().toISOString().split('T')[0]);
    toast.success(editingLogId ? 'Preventive Maintenance Checklist updated successfully!' : 'Preventive Maintenance Checklist saved successfully!');
  };

  const handleDeleteLog = (id: string) => {
    setLogIdToDelete(id);
    setIsShowingDeleteConfirm(true);
  };

  const handleConfirmedDelete = () => {
    if (logIdToDelete) {
      deleteMaintenanceLog(logIdToDelete);
      setIsShowingDeleteConfirm(false);
      setLogIdToDelete(null);
      toast.success('Preventive Maintenance Checklist deleted successfully!');
    }
  };

  const handleEditLog = (log: any) => {
    setPmTasks(log.tasks);
    setEditingLogId(log.id);
    setFormLab(log.lab || '');
    setFormMonth(log.month || '');
    setFormDate(log.formDate || new Date().toISOString().split('T')[0]);
    setFormWeeks(log.weeks || []);
    setAdditionalConcerns(log.additionalConcerns || '');
    setFormPreparedBy(log.preparedBy || '');
    setFormPreparedDesignation(log.preparedDesignation || '');
    setFormEvaluatedBy(log.evaluatedBy || '');
    setFormEvaluatedDesignation(log.evaluatedDesignation || '');
    setFormEvaluatedDate(log.evaluatedDate || new Date().toISOString().split('T')[0]);
    setViewTab('pm');
  };

  const handleStatusUpdate = (id: string, status: TicketStatus) => {
    updateTicketStatus(id, status);
    toast.success(`Support ticket status updated to ${status} successfully!`);
  };

  const renderPmLogs = () => {
    const filtered = filterLogs();
    const uniqueLabs = getUniqueLabs();
    const uniqueMonths = getUniqueMonths();
    const uniquePreparers = getUniquePreparers();

    return (
    <Card>
       <CardHeader className="pb-2">
          <div className="flex flex-col space-y-3">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center">
               <Calendar className="mr-2 h-4 w-4" /> Checklist Logs ({filtered.length})
            </CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select value={filterLab} onChange={e => setFilterLab(e.target.value)} className="text-[10px] p-1 border rounded bg-slate-50">
                    <option value="All">All Labs</option>
                    {uniqueLabs.map(lab => <option key={lab} value={lab}>{lab}</option>)}
                </select>
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="text-[10px] p-1 border rounded bg-slate-50">
                    <option value="All">All Months</option>
                    {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={filterPreparedBy} onChange={e => setFilterPreparedBy(e.target.value)} className="text-[10px] p-1 border rounded bg-slate-50">
                    <option value="All">All Preparers</option>
                    {uniquePreparers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={handleExport} className="text-xs font-bold text-brand hover:underline p-1 border rounded bg-white">Export CSV</button>
            </div>
          </div>
       </CardHeader>
       <CardContent>
          <div className="space-y-4">
             {filtered.length === 0 ? (
               <p className="text-sm text-slate-500 italic">No logs available.</p>
             ) : (
                filtered.map(log => {
                  const tasksList = Object.values(log.tasks) as any[];
                  const logLab = log.lab || Array.from(new Set(tasksList.map(t => t.lab).filter(Boolean))).join(', ');
                  return (
                  <div key={log.id} className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-600">{new Date(log.date).toLocaleString()}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          {logLab && <p className="text-[10px] text-brand font-medium">Laboratory: {logLab}</p>}
                          {log.preparedBy && <p className="text-[10px] text-slate-500 font-medium">Prepared by: {log.preparedBy}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditLog(log)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteLog(log.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-700 flex justify-between items-center">
                      <span>Completed {tasksList.filter((t: any) => t.status === 'Done').length} tasks.</span>
                      <button 
                        onClick={() => setExpandedLogs(prev => ({...prev, [log.id]: !prev[log.id]}))}
                        className="text-brand font-bold text-[10px]"
                      >
                         {expandedLogs[log.id] ? 'See Less' : 'See More'}
                      </button>
                    </div>
                    {log.additionalConcerns && (
                       <p className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded italic border border-slate-100">
                          <strong>Note:</strong> {log.additionalConcerns}
                       </p>
                    )}
                    {expandedLogs[log.id] && (
                        <div className="mt-2 text-[10px] space-y-2">
                             <div className="bg-slate-100 p-2 rounded-lg grid grid-cols-1 gap-1">
                                {Object.entries(log.tasks).map(([key, task]: [string, any]) => {
                                    const [catKey, idx] = key.split('-');
                                    const cat = PREVENTIVE_MAINTENANCE[catKey as keyof typeof PREVENTIVE_MAINTENANCE];
                                    const taskTitle = cat ? cat.tasks[parseInt(idx)] : key;
                                    
                                    if (task.status === 'Pending' && !task.remarks) return null; // Skip empty pending tasks

                                    return (
                                        <div key={key} className="p-2 bg-white rounded border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-2">
                                                    <p className="font-bold text-slate-800">{taskTitle}</p>
                                                    {task.remarks && <p className="text-slate-500 italic mt-0.5 font-normal">"{task.remarks}"</p>}
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <span className={task.status === 'Done' ? 'text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded' : 'text-amber-600 font-bold px-1.5 py-0.5 bg-amber-50 rounded'}>
                                                        {task.status}
                                                    </span>
                                                    {task.lab && <span className="text-[9px] text-slate-400">Lab: {task.lab}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                             {tasksList.length > 5 && (
                                <p className="text-[9px] text-center text-slate-400 italic">Showing all tasks performed in this session</p>
                             )}
                        </div>
                    )}
                  </div>
                  );
                })
             )}
          </div>
       </CardContent>
    </Card>
  );
  };

  const renderPmView = () => (
    <Card>
       <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-700 flex items-center">
             <Calendar className="mr-2 h-4 w-4" /> Preventive Maintenance Checklist
          </CardTitle>
       </CardHeader>
        <CardContent className="space-y-4 max-w-2xl mx-auto">
          {/* Form Header */}
          <div className="grid grid-cols-2 gap-3 text-xs w-full">
            <select 
              required
              className="p-2 border rounded bg-slate-50 col-span-2 w-full" 
              value={formLab}
              onChange={(e) => setFormLab(e.target.value)}
            >
              <option value="">Select Facility Location</option>
              {state.facilities.map(facility => (
                <option key={facility.id} value={facility.name}>
                  {facility.name} ({facility.location})
                </option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Month" 
              className="p-2 border rounded bg-slate-50 w-full" 
              value={formMonth}
              onChange={(e) => setFormMonth(e.target.value)}
            />
            <input 
              type="date" 
              className="p-2 border rounded bg-slate-50 w-full" 
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
            <div className="col-span-2 space-y-1 w-full">
               <label className="text-[10px] font-bold text-slate-500 uppercase">Week</label>
               <div className="grid grid-cols-4 gap-2 w-full">
                 {['1st', '2nd', '3rd', '4th'].map(w => (
                   <label key={w} className="flex items-center text-xs font-bold text-slate-700">
                     <input 
                        type="checkbox" 
                        className="mr-1" 
                        checked={formWeeks.includes(w)}
                        onChange={(e) => {
                          if (e.target.checked) setFormWeeks([...formWeeks, w]);
                          else setFormWeeks(formWeeks.filter(item => item !== w));
                        }}
                     /> {w}
                   </label>
                 ))}
               </div>
            </div>
          </div>

          {/* Tasks */}
          {Object.entries(PREVENTIVE_MAINTENANCE).map(([catKey, cat]) => (
            <div key={catKey} className="space-y-2 border-t pt-4 w-full">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{cat.title}</h4>
                  {cat.tasks.map((task, index) => {
                    const key = `${catKey}-${index}`;
                    const taskDetail = pmTasks[key] || { status: 'Pending', remarks: '', lab: '', date: new Date().toISOString().split('T')[0], week: '1st' };
                    return (
                           <div key={index} className="p-2 border rounded bg-white text-xs shadow-sm flex items-center justify-between w-full">
                             <span className="font-medium text-slate-700 w-1/2">{task}</span>
                             <div className="flex gap-2 items-center w-1/2">
                                 <select className="text-[10px] p-1 border rounded bg-slate-50" value={taskDetail.status} onChange={e => handleUpdateTask(catKey, index, 'status', e.target.value)}>
                                   <option value="Pending">Pending</option>
                                   <option value="Done">Done</option>
                                 </select>
                                 <input type="text" placeholder="Remarks" className="text-[10px] p-1 border rounded bg-slate-50 w-full" value={taskDetail.remarks} onChange={e => handleUpdateTask(catKey, index, 'remarks', e.target.value)} />
                             </div>
                           </div>
                  )})}
            </div>
          ))}
          
          {/* Footers */}
          <div className="pt-6 mt-6 border-t space-y-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">List any additional concerns or issues found</label>
                  <textarea 
                    className="w-full p-2 border rounded bg-slate-50 text-xs h-24" 
                    placeholder="Enter additional concerns..."
                    value={additionalConcerns}
                    onChange={(e) => setAdditionalConcerns(e.target.value)}
                  ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Prepared by</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded bg-slate-50 text-xs"
                        value={formPreparedBy}
                        onChange={(e) => setFormPreparedBy(e.target.value)}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Evaluated by</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded bg-slate-50 text-xs"
                        value={formEvaluatedBy}
                        onChange={(e) => setFormEvaluatedBy(e.target.value)}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Designation</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded bg-slate-50 text-xs"
                        value={formPreparedDesignation}
                        onChange={(e) => setFormPreparedDesignation(e.target.value)}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Designation</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded bg-slate-50 text-xs"
                        value={formEvaluatedDesignation}
                        onChange={(e) => setFormEvaluatedDesignation(e.target.value)}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                      <input 
                        type="date" 
                        className="w-full p-2 border rounded bg-slate-50 text-xs"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                      <input 
                        type="date" 
                        className="w-full p-2 border rounded bg-slate-50 text-xs"
                        value={formEvaluatedDate}
                        onChange={(e) => setFormEvaluatedDate(e.target.value)}
                      />
                  </div>
              </div>
          </div>
          
          <div className="flex justify-end pt-4">
             <button
               onClick={handleSavePmChecklist}
               className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-amber-700 transition"
             >
               {editingLogId ? 'Update Checklist' : 'Save Checklist'}
             </button>
          </div>
        </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Maintenance & Support</h2>
        <p className="text-slate-500 text-sm">Manage equipment repairs and preventive maintenance ticketing.</p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-300 mb-6">
        <button
          onClick={() => setViewTab('tickets')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${viewTab === 'tickets' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Equipment Maintenance
        </button>
        <button
          onClick={() => setViewTab('pm')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${viewTab === 'pm' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Preventive Maintenance Checklist
        </button>
        <button
          onClick={() => setViewTab('logs')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${viewTab === 'logs' ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Checklist Logs
        </button>
      </div>

      {viewTab === 'tickets' ? renderTicketsView() : viewTab === 'pm' ? renderPmView() : renderPmLogs()}
      {isOpeningTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Create Support Ticket</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Equipment</label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand"
                >
                  <option value="">Select Equipment...</option>
                  {state.equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.qrCode})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Issue Title</label>
                <input
                  type="text"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand"
                  placeholder="e.g. Broken Laptop Screen"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand h-24"
                  placeholder="Detail the issue or maintenance required..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <div className="flex space-x-2">
                  {(['Low', 'Medium', 'High', 'Critical'] as TicketPriority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-bold ${
                        priority === p ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => { setIsOpeningTicket(false); onTicketCreated?.(); }}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
      {isShowingValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-red-600 mb-2">Incomplete Checklist</h3>
                <p className="text-sm text-slate-600 mb-6">Please fill out at least one task (mark as Done or add remarks) before saving.</p>
                <div className="flex justify-end">
                    <button onClick={() => setIsShowingValidation(false)} className="px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700">OK</button>
                </div>
            </div>
        </div>
      )}
      {isShowingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Action</h3>
                <p className="text-sm text-slate-600 mb-6">Are you sure you want to save the Preventive Maintenance Checklist?</p>
                <div className="flex space-x-4">
                    <button onClick={() => setIsShowingConfirm(false)} className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800">Cancel</button>
                    <button onClick={handleConfirmedSave} className="flex-1 px-4 py-2 text-sm font-bold text-amber-600 hover:text-amber-700">Save</button>
                </div>
            </div>
        </div>
      )}
      {isShowingDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-red-600 mb-2">Confirm Delete</h3>
                <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this log? This action cannot be undone.</p>
                <div className="flex space-x-4">
                    <button onClick={() => setIsShowingDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800">Cancel</button>
                    <button onClick={handleConfirmedDelete} className="flex-1 px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700">Delete</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

interface TicketCardProps {
  ticket: MaintenanceTicket;
  equipment?: any;
  onStatusUpdate: (id: string, status: TicketStatus) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ 
  ticket, 
  equipment, 
  onStatusUpdate
}) => {
  return (
    <Card className={`border-l-4 ${
      ticket.priority === 'Critical' ? 'border-l-red-600' :
      ticket.priority === 'High' ? 'border-l-amber-600' :
      'border-l-blue-600'
    }`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                 ticket.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                 ticket.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                 'bg-blue-100 text-blue-700'
               }`}>
                 {ticket.priority} Priority
               </span>
               <span className="text-[10px] text-slate-400 font-mono">{ticket.id}</span>
            </div>
            <h4 className="font-bold text-slate-900">{ticket.title}</h4>
            <p className="text-xs text-slate-500">{equipment?.name} • {equipment?.qrCode}</p>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
             <select
               value={ticket.status}
               onChange={(e) => onStatusUpdate(ticket.id, e.target.value as TicketStatus)}
               className={`text-xs font-bold rounded px-2 py-1 outline-none border-none focus:ring-1 focus:ring-brand ${
                 ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                 ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                 'bg-amber-100 text-amber-700'
               }`}
             >
               <option value="Open">Open</option>
               <option value="In Progress">In Progress</option>
               <option value="Resolved">Resolved</option>
               <option value="Closed">Closed</option>
             </select>
             <span className="text-[10px] text-slate-400">Upd: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
           {ticket.description}
        </p>
      </CardContent>
    </Card>
  );
};

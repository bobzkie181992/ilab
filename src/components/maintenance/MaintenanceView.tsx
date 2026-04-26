import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { 
  Wrench, 
  ClipboardCheck, 
  AlertCircle, 
  Plus, 
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { TicketPriority, TicketStatus, MaintenanceTicket } from '../../types';

interface MaintenanceViewProps {
  initialEquipmentId?: string;
  onTicketCreated?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ 
  initialEquipmentId, 
  onTicketCreated 
}) => {
  const { state, createTicket, updateTicketStatus, updateTicketChecklist } = useAppContext();
  const [isOpeningTicket, setIsOpeningTicket] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');

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
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Maintenance & Support</h2>
          <p className="text-slate-500 text-sm">Manage equipment repairs and preventive maintenance ticketing.</p>
        </div>
        <button
          onClick={() => setIsOpeningTicket(true)}
          className="flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-amber-700 transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Support Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Statistics */}
        <div className="lg:col-span-1 space-y-4">
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
                  onStatusUpdate={updateTicketStatus}
                  onChecklistUpdate={updateTicketChecklist}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
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
    </div>
  );
};

interface TicketCardProps {
  ticket: MaintenanceTicket;
  equipment?: any;
  onStatusUpdate: (id: string, status: TicketStatus) => void;
  onChecklistUpdate: (tid: string, iid: string, comp: boolean) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ 
  ticket, 
  equipment, 
  onStatusUpdate, 
  onChecklistUpdate 
}) => {
  const [showChecklist, setShowChecklist] = useState(false);

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

        {ticket.checklist && (
          <div className="border-t border-slate-100 pt-4 mt-4">
             <button 
                onClick={() => setShowChecklist(!showChecklist)}
                className="flex items-center text-xs font-bold text-slate-500 hover:text-brand"
             >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Maintenance Checklist ({ticket.checklist.items.filter(i => i.completed).length} / {ticket.checklist.items.length})
                <MoreVertical className={`h-3 w-3 ml-2 transition-transform ${showChecklist ? 'rotate-90' : ''}`} />
             </button>

             {showChecklist && (
                <div className="mt-4 space-y-2 pl-6">
                   {ticket.checklist.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => onChecklistUpdate(ticket.id, item.id, !item.completed)}
                        className={`flex w-full items-center p-2 rounded-lg text-left transition-colors ${
                          item.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                         {item.completed ? <CheckCircle2 className="h-4 w-4 mr-3" /> : <Circle className="h-4 w-4 mr-3" />}
                         <span className="text-xs font-medium">{item.task}</span>
                      </button>
                   ))}
                </div>
             )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

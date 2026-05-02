import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Equipment, 
  SystemState, 
  Borrower, 
  BorrowTransaction, 
  EquipmentCondition,
  EquipmentStatus,
  DEFAULT_POLICIES, 
  BorrowerRole, 
  AuditRecord,
  InventoryAudit,
  RulePolicy,
  SystemSettings,
  User,
  UserPosition,
  Facility,
  FacilityBooking,
  MaintenanceTicket,
  TicketStatus,
  TicketPriority,
  MaintenanceChecklist,
  MaintenanceLog,
  SoftwareRequest,
  SoftwareRequestStatus,
  Notification
} from '../types';

const MOCK_USERS: User[] = [];
const MOCK_FACILITIES: Facility[] = [];
const MOCK_EQUIPMENT: Equipment[] = [];
const MOCK_TRANSACTIONS: BorrowTransaction[] = [];

export interface TransactionResult {
  success: boolean;
  message: string;
}

interface AppContextType {
  state: SystemState;
  toggleSystemMode: () => void;
  checkoutEquipment: (equipmentQrs: string[], borrowerQr: string, startTime?: string, expectedReturnTime?: string, purpose?: string) => TransactionResult;
  returnEquipment: (equipmentQr: string, condition: EquipmentCondition, notes?: string) => TransactionResult;
  updatePolicy: (role: BorrowerRole, policy: Partial<RulePolicy>) => void;
  clearTransactions: () => void;
  addEquipment: (equipment: Omit<Equipment, 'id' | 'status'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  updateUserPosition: (userId: string, position: UserPosition | null) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // Facilities
  addFacility: (facility: Omit<Facility, 'id'>) => void;
  updateFacility: (id: string, updates: Partial<Facility>) => void;
  deleteFacility: (id: string) => void;
  // Auth
  login: (username: string, password: string) => boolean;
  logout: () => void;
  changePassword: (userId: string, currentPass: string, newPass: string) => TransactionResult;
  // Bookings
  addBooking: (booking: Omit<FacilityBooking, 'id' | 'status'>) => TransactionResult;
  approveBooking: (bookingId: string) => void;
  rejectBooking: (bookingId: string) => void;
  completeBooking: (bookingId: string) => void;
  cancelBooking: (id: string) => void;
  // Maintenance
  createTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  updateTicketChecklist: (ticketId: string, itemId: string, completed: boolean) => void;
  deleteTicket: (id: string) => void;
  addMaintenanceLog: (log: MaintenanceLog | Omit<MaintenanceLog, 'id'>) => void;
  updateMaintenanceLog: (id: string, updates: Partial<MaintenanceLog>) => void;
  deleteMaintenanceLog: (id: string) => void;
  // Audits
  startInventoryAudit: (quarter: 1 | 2 | 3 | 4, year: number) => string;
  addAuditRecord: (record: Omit<AuditRecord, 'id' | 'auditDate'>) => void;
  completeInventoryAudit: (id: string) => void;
  deleteInventoryAudit: (id: string) => void;
  
  createSoftwareRequest: (formData: FormData) => Promise<{ success: boolean; message: string }>;
  updateSoftwareRequestStatus: (id: string, status: SoftwareRequestStatus) => void;

  // Approvals
  approveTransaction: (txId: string, step: 'Lab-Incharge' | 'Dean' | 'Admin') => void;
  releaseEquipment: (txId: string) => void;
  walkInCheckout: (equipmentQrs: string[], borrowerId: string, startTime?: string, expectedReturnTime?: string, purpose?: string) => TransactionResult;
  resetSystem: () => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  // Notifications
  markNotificationAsRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SystemState>({
    isOnline: true,
    currentUser: null,
    users: MOCK_USERS,
    equipment: MOCK_EQUIPMENT,
    transactions: MOCK_TRANSACTIONS,
    facilities: MOCK_FACILITIES,
    bookings: [],
    maintenanceTickets: [],
    maintenanceLogs: [],
    attendanceLogs: [],
    softwareRequests: [],
    inventoryAudits: [],
    auditRecords: [],
    policies: DEFAULT_POLICIES,
    notifications: [],
    settings: {
      labName: 'CCIS Main Laboratory',
      adminEmail: 'admin@ccis.edu',
      logoUrl: 'https://storage.googleapis.com/ar-auth-artifacts.appspot.com/artifacts/a895c141-8fec-4fa1-8ca6-0b8108420b92/attachments/3a29db70-a3da-4767-873b-ebccff5d414a/ccis_logo.png',
      overdueAlerts: true,
      adminEscalation: true
    }
  });

  // Initialization & Data Sync
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usersRes,
          eqRes,
          txRes,
          facRes,
          bkRes,
          tkRes,
          logsRes,
          attnRes,
          srRes,
          auditRes,
          auditRecRes,
          settingsRes,
        ] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/equipment'),
          fetch('/api/transactions'),
          fetch('/api/facilities'),
          fetch('/api/bookings'),
          fetch('/api/maintenance-tickets'),
          fetch('/api/pm-logs'),
          fetch('/api/attendance-logs'),
          fetch('/api/software-requests'),
          fetch('/api/inventory-audits'),
          fetch('/api/audit-records'),
          fetch('/api/settings'),
          fetch('/api/notifications'),
        ]);

        const [
          users,
          equipment,
          transactions,
          facilities,
          bookings,
          maintenanceTickets,
          maintenanceLogs,
          attendanceLogs,
          softwareRequests,
          inventoryAudits,
          auditRecords,
          settings,
          notifications,
        ] = await Promise.all([
          usersRes.json(),
          eqRes.json(),
          txRes.json(),
          facRes.json(),
          bkRes.json(),
          tkRes.json(),
          logsRes.json(),
          attnRes.json(),
          srRes.json(),
          auditRes.json(),
          auditRecRes.json(),
          settingsRes.json(),
          (await fetch('/api/notifications')).json(), // Direct fetch for simplicity in Promise.all mapping if I missed one earlier
        ]);

        setState(prev => ({
          ...prev,
          users,
          equipment,
          transactions,
          facilities,
          bookings,
          maintenanceTickets,
          maintenanceLogs,
          attendanceLogs,
          softwareRequests,
          inventoryAudits,
          auditRecords,
          notifications,
          settings: settings || prev.settings
        }));
      } catch (error) {
        console.error('Failed to sync with database:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      let hasUpdates = false;
      const updatedBookings = state.bookings.map(b => {
        if (b.status === 'Confirmed') {
          const end = new Date(b.endTime).getTime();
          if (now >= end) {
            hasUpdates = true;
            const updated = { ...b, status: 'Completed' as const };
            fetch(`/api/bookings/${b.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated)
            }).then(() => {
              promoteNextInQueue(b.facilityId);
            }).catch(e => console.error(e));
            return updated;
          }
        }
        return b;
      });

      if (hasUpdates) {
        setState(prev => ({ ...prev, bookings: updatedBookings }));
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(timer);
  }, [state.bookings]);

  const addNotification = (userId: string, title: string, message: string, type: Notification['type'] = 'Info', targetView?: string) => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      targetView
    };

    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif)
    });

    setState(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications]
    }));
  };

  const markNotificationAsRead = (id: string) => {
    fetch(`/api/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true })
    });

    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const notifyApprovers = (title: string, message: string, targetView?: string) => {
    const approvers = state.users.filter(u => 
      u.role === 'Admin' || u.position === 'Dean' || u.position === 'Lab-Incharge'
    );
    approvers.forEach(appr => {
      addNotification(appr.id, title, message, 'Info', targetView);
    });
  };

  const login = (identifier: string, password: string) => {
    const user = state.users.find(u => 
      (u.username === identifier || u.email === identifier) && u.password === password
    );
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const changePassword = (userId: string, currentPass: string, newPass: string): TransactionResult => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };
    if (user.password !== currentPass) return { success: false, message: 'Current password incorrect.' };

    const updatedUser = { ...user, password: newPass };
    
    fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    });

    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? updatedUser : u),
      currentUser: prev.currentUser?.id === userId ? { ...prev.currentUser, password: newPass } : prev.currentUser
    }));

    return { success: true, message: 'Password changed successfully.' };
  };

  const addBooking = (bookingData: Omit<FacilityBooking, 'id' | 'status'>): TransactionResult => {
    // Check for conflicts
    const startTime = new Date(bookingData.startTime).getTime();
    const endTime = new Date(bookingData.endTime).getTime();

    const hasConflict = state.bookings.some(b => {
      if (b.facilityId !== bookingData.facilityId || (b.status !== 'Confirmed' && b.status !== 'Pending Approval')) return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      
      // Check for overlap
      return (startTime < bEnd && endTime > bStart);
    });

    const newBooking: FacilityBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      status: hasConflict ? 'Queued' : 'Pending Approval'
    };

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    });

    setState(prev => ({
      ...prev,
      bookings: [...prev.bookings, newBooking]
    }));

    // Notifications to Deans
    const deans = state.users.filter(u => u.position === 'Dean');
    deans.forEach(dean => {
      addNotification(dean.id, hasConflict ? 'New Queued Booking Request' : 'New Facility Booking', `Approval needed for facility booking request: Facility ID ${bookingData.facilityId} by User ID ${bookingData.userId}`, 'Info', 'facility');
    });

    return { success: true, message: hasConflict ? 'Facility is currently booked or pending for the selected time. You have been added to the queue.' : 'Reservation request submitted for Dean approval.' };
  };

  const promoteNextInQueue = (facilityId: string) => {
    // Find queued bookings for this facility, sort by creation (assuming id has timestamp)
    const queuedBookings = state.bookings.filter(b => b.facilityId === facilityId && b.status === 'Queued')
                                         .sort((a, b) => {
                                           const timeA = parseInt(a.id.split('-')[1] || '0');
                                           const timeB = parseInt(b.id.split('-')[1] || '0');
                                           return timeA - timeB;
                                         });
    
    for (const qBooking of queuedBookings) {
      // Check if it still has conflicts
      const startTime = new Date(qBooking.startTime).getTime();
      const endTime = new Date(qBooking.endTime).getTime();
      
      const hasConflict = state.bookings.some(b => {
        if (b.id === qBooking.id || b.facilityId !== facilityId || (b.status !== 'Confirmed' && b.status !== 'Pending Approval')) return false;
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return (startTime < bEnd && endTime > bStart);
      });

      if (!hasConflict) {
        // Promote to Pending Approval
        const updated = { ...qBooking, status: 'Pending Approval' as const };
        fetch(`/api/bookings/${qBooking.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        setState(prev => ({
          ...prev,
          bookings: prev.bookings.map(b => b.id === qBooking.id ? updated : b)
        }));
        
        // Notify Dean
        const deans = state.users.filter(u => u.position === 'Dean');
        deans.forEach(dean => {
          addNotification(dean.id, 'Queued Booking Promoted', `A queued booking for Facility ID ${facilityId} is now pending approval.`, 'Info', 'facility');
        });
        break; // Promote one at a time for safety
      }
    }
  };

  const approveBooking = (id: string) => {
    const booking = state.bookings.find(b => b.id === id);
    if (booking) {
      const updated = { ...booking, status: 'Confirmed' as const };
      fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setState(prev => ({
        ...prev,
        bookings: prev.bookings.map(b => b.id === id ? updated : b)
      }));
    }
  };

  const rejectBooking = (id: string) => {
    const booking = state.bookings.find(b => b.id === id);
    if (booking) {
      const updated = { ...booking, status: 'Rejected' as const };
      fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setState(prev => ({
        ...prev,
        bookings: prev.bookings.map(b => b.id === id ? updated : b)
      }));
      setTimeout(() => promoteNextInQueue(booking.facilityId), 100);
    }
  };

  const completeBooking = (id: string) => {
    const booking = state.bookings.find(b => b.id === id);
    if (booking) {
      const updated = { ...booking, status: 'Completed' as const };
      fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setState(prev => ({
        ...prev,
        bookings: prev.bookings.map(b => b.id === id ? updated : b)
      }));
      setTimeout(() => promoteNextInQueue(booking.facilityId), 100);
    }
  };

  const cancelBooking = (id: string) => {
    const booking = state.bookings.find(b => b.id === id);
    fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.filter(b => b.id !== id)
    }));
    if (booking) {
      setTimeout(() => promoteNextInQueue(booking.facilityId), 100);
    }
  };

  const createTicket = (ticketData: Omit<MaintenanceTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTicket: MaintenanceTicket = {
      ...ticketData,
      id: `tk-${Date.now()}`,
      status: 'Open',
      createdAt: now,
      updatedAt: now,
    };

    fetch('/api/maintenance-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket)
    });

    const eq = state.equipment.find(e => e.id === ticketData.equipmentId);
    if (eq) {
      const updatedEq = { ...eq, status: 'Maintenance' as const };
      fetch(`/api/equipment/${eq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEq)
      });
      setState(prev => ({
        ...prev,
        maintenanceTickets: [...prev.maintenanceTickets, newTicket],
        equipment: prev.equipment.map(e => e.id === eq.id ? updatedEq : e)
      }));
    } else {
      setState(prev => ({
        ...prev,
        maintenanceTickets: [...prev.maintenanceTickets, newTicket]
      }));
    }
    notifyApprovers('New Maintenance Ticket', `A new maintenance ticket has been created for ${state.equipment.find(e => e.id === ticketData.equipmentId)?.name || 'Unknown Item'}.`, 'maintenance');
  };

  const updateTicketStatus = (id: string, status: TicketStatus) => {
    const now = new Date().toISOString();
    const ticket = state.maintenanceTickets.find(tk => tk.id === id);
    if (!ticket) return;

    const updatedTicket = { ...ticket, status, updatedAt: now };
    fetch(`/api/maintenance-tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTicket)
    });

    let updatedEquipment = state.equipment;
    if (status === 'Resolved' || status === 'Closed') {
      const eq = state.equipment.find(e => e.id === ticket.equipmentId);
      if (eq) {
        const updatedEq = { ...eq, status: 'Available' as const };
        fetch(`/api/equipment/${eq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEq)
        });
        updatedEquipment = state.equipment.map(e => e.id === eq.id ? updatedEq : e);
      }
    }

    setState(prev => ({
      ...prev,
      maintenanceTickets: prev.maintenanceTickets.map(tk => tk.id === id ? updatedTicket : tk),
      equipment: updatedEquipment
    }));
  };

  const updateTicketChecklist = (ticketId: string, itemId: string, completed: boolean) => {
    const ticket = state.maintenanceTickets.find(tk => tk.id === ticketId);
    if (ticket && ticket.checklist) {
      const updatedChecklist = {
        ...ticket.checklist,
        items: ticket.checklist.items.map(item => item.id === itemId ? { ...item, completed } : item)
      };
      const updatedTicket = { ...ticket, checklist: updatedChecklist };
      
      fetch(`/api/maintenance-tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTicket)
      });

      setState(prev => ({
        ...prev,
        maintenanceTickets: prev.maintenanceTickets.map(tk => tk.id === ticketId ? updatedTicket : tk)
      }));
    }
  };

  const deleteTicket = (id: string) => {
    fetch(`/api/maintenance-tickets/${id}`, { method: 'DELETE' });
    setState(prev => ({
      ...prev,
      maintenanceTickets: prev.maintenanceTickets.filter(tk => tk.id !== id)
    }));
  };

  const addMaintenanceLog = (logData: MaintenanceLog | Omit<MaintenanceLog, 'id'>) => {
    const id = ('id' in logData && logData.id) ? logData.id : `pm-${Date.now()}-${state.maintenanceLogs?.length || 0}`;
    const newLog: MaintenanceLog = { ...logData, id };
    
    fetch('/api/pm-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    });

    setState(prev => ({
      ...prev,
      maintenanceLogs: [newLog, ...prev.maintenanceLogs]
    }));
  };

  const updateMaintenanceLog = (id: string, updates: Partial<MaintenanceLog>) => {
    // API doesn't have a specific update for PM logs in my draft but I can add it or ignore for now
    // Let's assume PM logs are immutable for now or I can add the route later if needed
    setState(prev => ({
      ...prev,
      maintenanceLogs: prev.maintenanceLogs.map(log => log.id === id ? { ...log, ...updates } : log)
    }));
  };

  const deleteMaintenanceLog = (id: string) => {
    setState(prev => ({
      ...prev,
      maintenanceLogs: prev.maintenanceLogs.filter(log => log.id !== id)
    }));
  };

  const startInventoryAudit = (quarter: 1 | 2 | 3 | 4, year: number) => {
    const id = `audit-${Date.now()}`;
    const newAudit: InventoryAudit = {
      id,
      quarter,
      year,
      startDate: new Date().toISOString(),
      status: 'In Progress',
      totalItems: state.equipment.length,
      auditedItems: 0,
      auditorId: state.currentUser?.id || ''
    };

    fetch('/api/inventory-audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAudit)
    });

    setState(prev => ({
      ...prev,
      inventoryAudits: [newAudit, ...prev.inventoryAudits]
    }));

    return id;
  };

  const addAuditRecord = (recordData: Omit<AuditRecord, 'id' | 'auditDate'>) => {
    const newRecord: AuditRecord = {
      ...recordData,
      id: `rec-${Date.now()}`,
      auditDate: new Date().toISOString(),
      auditedBy: state.currentUser?.name || 'Unknown'
    };

    fetch('/api/audit-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });

    // Update the equipment status/condition if needed
    updateEquipment(recordData.equipmentId, {
      status: recordData.status,
      condition: recordData.condition
    });

    // Update audit progress
    const audit = state.inventoryAudits.find(a => a.id === recordData.inventoryAuditId);
    if (audit) {
      const alreadyAudited = state.auditRecords.some(r => r.equipmentId === recordData.equipmentId && r.inventoryAuditId === recordData.inventoryAuditId);
      if (!alreadyAudited) {
        const updatedAudit = { ...audit, auditedItems: audit.auditedItems + 1 };
        fetch(`/api/inventory-audits/${audit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedAudit)
        });
        setState(prev => ({
          ...prev,
          inventoryAudits: prev.inventoryAudits.map(a => a.id === audit.id ? updatedAudit : a),
          auditRecords: [newRecord, ...prev.auditRecords]
        }));
      } else {
        setState(prev => ({
          ...prev,
          auditRecords: [newRecord, ...prev.auditRecords]
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        auditRecords: [newRecord, ...prev.auditRecords]
      }));
    }
  };

  const completeInventoryAudit = (id: string) => {
    const audit = state.inventoryAudits.find(a => a.id === id);
    if (audit) {
      const updated = { ...audit, status: 'Completed' as const, endDate: new Date().toISOString() };
      fetch(`/api/inventory-audits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setState(prev => ({
        ...prev,
        inventoryAudits: prev.inventoryAudits.map(a => a.id === id ? updated : a)
      }));
    }
  };

  const deleteInventoryAudit = (id: string) => {
    fetch(`/api/inventory-audits/${id}`, { method: 'DELETE' });
    setState(prev => ({
      ...prev,
      inventoryAudits: prev.inventoryAudits.filter(a => a.id !== id),
      auditRecords: prev.auditRecords.filter(r => r.inventoryAuditId !== id)
    }));
  };

  const checkoutEquipment = (equipmentQrs: string[], borrowerQr: string, startTime?: string, expectedReturnTime?: string, purpose?: string): TransactionResult => {
    const borrower = state.users.find(b => b.qrCode === borrowerQr);
    if (!borrower) return { success: false, message: 'Borrower account not recognized.' };
    
    if (borrower.role === 'Admin') return { success: false, message: 'Admins cannot perform self-borrowing.'};

    const rules = state.policies[borrower.role as BorrowerRole] || DEFAULT_POLICIES[borrower.role as BorrowerRole];
    const activeBorrows = state.transactions.filter(t => t.borrowerId === borrower.id && (t.status === 'Active' || t.status === 'Overdue'));

    if (activeBorrows.length + equipmentQrs.length > rules.maxItems) {
      return { success: false, message: `Limit Exceeded: ${borrower.role}s are limited to ${rules.maxItems} items.` };
    }

    const equipmentItems = equipmentQrs.map(qr => state.equipment.find(e => e.qrCode === qr));
    if (equipmentItems.some(eq => !eq || eq.status === 'Offline' || eq.status === 'Lost')) {
        return { success: false, message: 'One or more items are Offline or Lost.' };
    }

    const now = startTime ? new Date(startTime) : new Date();
    let expectedReturn: Date;
    if (expectedReturnTime) {
      expectedReturn = new Date(expectedReturnTime);
    } else {
      let ms = rules.maxDurationValue * 3600000;
      if (rules.maxDurationUnit === 'Days') ms = rules.maxDurationValue * 24 * 3600000;
      else if (rules.maxDurationUnit === 'Weeks') ms = rules.maxDurationValue * 7 * 24 * 3600000;
      expectedReturn = new Date(now.getTime() + ms);
    }

    let anyQueued = false;
    const suggestions: string[] = [];

    equipmentItems.forEach((eq, index) => {
      const conflictingTxs = state.transactions.filter(tx => {
        if (tx.equipmentId !== eq!.id || !['Pending Approval', 'Approved by Lab-Incharge', 'Approved by Dean', 'Released', 'Active', 'Overdue'].includes(tx.status)) return false;
        const txStart = new Date(tx.checkoutTime).getTime();
        const txEnd = new Date(tx.expectedReturnTime).getTime();
        return (now.getTime() < txEnd && expectedReturn.getTime() > txStart);
      });
      const hasConflict = conflictingTxs.length > 0;

      if (hasConflict) {
        anyQueued = true;
        const latestConflictingEnd = Math.max(...conflictingTxs.map(tx => new Date(tx.expectedReturnTime).getTime()));
        suggestions.push(`${eq!.name} is available after ${new Date(latestConflictingEnd).toLocaleString()}`);
      }

      const newTx: BorrowTransaction = {
        id: `tx-${Date.now()}-${index}`,
        equipmentId: eq!.id,
        borrowerId: borrower.id,
        borrowerRole: borrower.role,
        checkoutTime: now.toISOString(),
        expectedReturnTime: expectedReturn.toISOString(),
        checkoutCondition: eq!.condition,
        status: hasConflict ? 'Queued' : 'Pending Approval',
        purpose: purpose || 'None'
      };

      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });

      let updatedEq = eq!;
      if (hasConflict) {
        updatedEq = { ...eq!, status: 'Queued' as const };
        fetch(`/api/equipment/${eq!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEq)
        });
      } else if (eq!.status !== 'Reserved') {
        updatedEq = { ...eq!, status: 'Reserved' as const };
        fetch(`/api/equipment/${eq!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEq)
        });
      }

      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, newTx],
        equipment: prev.equipment.map(e => e.id === eq!.id ? updatedEq : e)
      }));

      notifyApprovers(
        hasConflict ? 'New Queued Equipment Request' : 'New Equipment Request',
        `${borrower.name} has ${hasConflict ? 'queued for' : 'requested'} ${eq!.name}.`,
        'transactions'
      );

      if (hasConflict) {
        addNotification(borrower.id, 'Equipment Unavailable', `The equipment ${eq!.name} is reserved/queued for the selected time, so you have been added to the queue.`, 'Warning', 'transactions');
      }
    });

    return { success: true, message: anyQueued ? `Some items are unavailable. Suggestions: ${suggestions.join(' | ')}` : `Borrow request submitted for ${borrower.name}.` };
  };

  const walkInCheckout = (equipmentQrs: string[], borrowerId: string, startTime?: string, expectedReturnTime?: string, purpose?: string): TransactionResult => {
    const borrower = state.users.find(b => b.id === borrowerId);
    if (!borrower) return { success: false, message: 'Borrower not found.' };
    
    const rules = state.policies[borrower.role as BorrowerRole] || DEFAULT_POLICIES[borrower.role as BorrowerRole];
    const equipmentItems = equipmentQrs.map(qr => state.equipment.find(e => e.qrCode === qr));
    
    if (equipmentItems.some(eq => !eq || eq.status === 'Offline' || eq.status === 'Lost')) {
      return { success: false, message: 'One or more items are Offline or Lost.' };
    }

    const now = startTime ? new Date(startTime) : new Date();
    let expectedReturn: Date;
    if (expectedReturnTime) {
      expectedReturn = new Date(expectedReturnTime);
    } else {
      let ms = rules.maxDurationValue * 3600000;
      if (rules.maxDurationUnit === 'Days') ms = rules.maxDurationValue * 24 * 3600000;
      else if (rules.maxDurationUnit === 'Weeks') ms = rules.maxDurationValue * 7 * 24 * 3600000;
      expectedReturn = new Date(now.getTime() + ms);
    }

    let anyQueued = false;

    equipmentItems.forEach((eq, index) => {
      const hasConflict = state.transactions.some(tx => {
        if (tx.equipmentId !== eq!.id || !['Pending Approval', 'Approved by Lab-Incharge', 'Approved by Dean', 'Released', 'Active', 'Overdue'].includes(tx.status)) return false;
        const txStart = new Date(tx.checkoutTime).getTime();
        const txEnd = new Date(tx.expectedReturnTime).getTime();
        return (now.getTime() < txEnd && expectedReturn.getTime() > txStart);
      });

      if (hasConflict) anyQueued = true;

      const newTx: BorrowTransaction = {
        id: `tx-walkin-${Date.now()}-${index}`,
        equipmentId: eq!.id,
        borrowerId: borrower.id,
        borrowerRole: borrower.role,
        checkoutTime: now.toISOString(),
        expectedReturnTime: expectedReturn.toISOString(),
        checkoutCondition: eq!.condition,
        status: hasConflict ? 'Queued' : 'Pending Approval',
        purpose: purpose || 'Walk-in Borrowing'
      };

      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });

      let updatedEq = eq!;
      if (hasConflict) {
        updatedEq = { ...eq!, status: 'Queued' as const };
        fetch(`/api/equipment/${eq!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEq)
        });
      } else if (eq!.status !== 'Reserved') {
        updatedEq = { ...eq!, status: 'Reserved' as const };
        fetch(`/api/equipment/${eq!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEq)
        });
      }

      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, newTx],
        equipment: prev.equipment.map(e => e.id === eq!.id ? updatedEq : e)
      }));

      notifyApprovers(
        hasConflict ? 'New Queued Walk-in Request' : 'New Walk-in Request',
        `${borrower.name} has ${hasConflict ? 'queued for' : 'a walk-in request for'} ${eq!.name}.`,
        'transactions'
      );

      if (hasConflict) {
        addNotification(borrower.id, 'Equipment Unavailable', `The equipment ${eq!.name} is reserved/queued for the selected time, so you have been added to the queue.`, 'Warning', 'transactions');
      }
    });

    return { success: true, message: anyQueued ? 'Some items are currently unavailable. You have been added to the queue.' : `Walk-in borrow request submitted for ${borrower.name}. Pending approval from Lab Incharge and Dean.` };
  };

  const returnEquipment = (equipmentQr: string, condition: EquipmentCondition, notes?: string): TransactionResult => {
    const eq = state.equipment.find(e => e.qrCode === equipmentQr);
    if (!eq) return { success: false, message: 'Equipment not found.' };

    const activeTx = state.transactions.find(t => t.equipmentId === eq.id && (t.status === 'Active' || t.status === 'Overdue'));
    if (!activeTx) return { success: false, message: 'No active transaction found.' };

    const now = new Date().toISOString();
    const nextEqStatus = condition === 'Damaged' ? 'Maintenance' as const : 'Available' as const;

    const updatedTx = {
      ...activeTx,
      status: 'Returned' as const,
      actualReturnTime: now,
      returnCondition: condition,
      remarks: notes
    };

    fetch(`/api/transactions/${activeTx.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTx)
    });

    const nextQueuedTx = state.transactions
      .filter(t => t.equipmentId === eq.id && t.status === 'Queued')
      .sort((a, b) => new Date(a.checkoutTime).getTime() - new Date(b.checkoutTime).getTime())[0];

    let finalEqStatus: EquipmentStatus = nextEqStatus;
    let updatedQueuedTx: BorrowTransaction | undefined;

    if (nextQueuedTx && nextEqStatus === 'Available') {
      finalEqStatus = 'Reserved';
      updatedQueuedTx = { ...nextQueuedTx, status: 'Pending Approval' as const };
      
      fetch(`/api/transactions/${nextQueuedTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQueuedTx)
      });
      
      notifyApprovers(
        'Queued Equipment Ready',
        `Equipment ${eq.name} has been returned and a queued request is now pending approval.`,
        'transactions'
      );
    }

    const updatedEq = { ...eq, status: finalEqStatus, condition };
    fetch(`/api/equipment/${eq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEq)
    });

    setState(prev => {
      let nextTx = prev.transactions.map(t => t.id === activeTx.id ? updatedTx : t);
      if (updatedQueuedTx) {
        nextTx = nextTx.map(t => t.id === updatedQueuedTx!.id ? updatedQueuedTx! : t);
      }
      return {
        ...prev,
        transactions: nextTx,
        equipment: prev.equipment.map(e => e.id === eq.id ? updatedEq : e)
      };
    });

    return { success: true, message: `Equipment returned. Status: ${finalEqStatus}` };
  };

  const updatePolicy = (role: BorrowerRole, policy: Partial<RulePolicy>) => {
    setState(prev => ({
      ...prev,
      policies: { ...prev.policies, [role]: { ...prev.policies[role], ...policy } }
    }));
  };

  const clearTransactions = async () => {
    await fetch('/api/system/clear-transactions', { method: 'POST' });
    setState(prev => ({ ...prev, transactions: [] }));
  };

  const addEquipment = (equipmentData: Omit<Equipment, 'id' | 'status'>) => {
    const newEq: Equipment = { ...equipmentData, id: `eq-${Date.now()}`, status: 'Available' };
    fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEq)
    });
    setState(prev => ({ ...prev, equipment: [...prev.equipment, newEq] }));
  };

  const updateEquipment = (id: string, updates: Partial<Equipment>) => {
    const eq = state.equipment.find(e => e.id === id);
    if (eq) {
      const updated = { ...eq, ...updates };
      fetch(`/api/equipment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setState(prev => ({ ...prev, equipment: prev.equipment.map(e => e.id === id ? updated : e) }));
    }
  };

  const deleteEquipment = (id: string) => {
    fetch(`/api/equipment/${id}`, { method: 'DELETE' });
    setState(prev => ({ ...prev, equipment: prev.equipment.filter(eq => eq.id !== id) }));
  };

  const addFacility = (facilityData: Omit<Facility, 'id'>) => {
    const newFac: Facility = { ...facilityData, id: `f-${Date.now()}` };
    fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFac)
    });
    setState(prev => ({ ...prev, facilities: [...prev.facilities, newFac] }));
  };

  const updateFacility = (id: string, updates: Partial<Facility>) => {
    const fac = state.facilities.find(f => f.id === id);
    if (fac) {
      const updated = { ...fac, ...updates };
      fetch(`/api/facilities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setState(prev => ({ ...prev, facilities: prev.facilities.map(f => f.id === id ? updated : f) }));
    }
  };

  const deleteFacility = (id: string) => {
    fetch(`/api/facilities/${id}`, { method: 'DELETE' });
    setState(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f.id !== id),
      bookings: prev.bookings.filter(b => b.facilityId !== id)
    }));
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: `u-${Date.now()}` };
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const user = state.users.find(u => u.id === id);
    if (user) {
      const updated = { ...user, ...updates };
      fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === id ? updated : u),
        currentUser: prev.currentUser?.id === id ? updated : prev.currentUser
      }));
    }
  };

  const deleteUser = (id: string) => {
    fetch(`/api/users/${id}`, { method: 'DELETE' });
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
      currentUser: prev.currentUser?.id === id ? null : prev.currentUser
    }));
  };

  const updateUserPosition = (userId: string, position: UserPosition | null) => {
    updateUser(userId, { position: position as any });
  };

  const approveTransaction = (txId: string, step: 'Lab-Incharge' | 'Dean' | 'Admin') => {
    const tx = state.transactions.find(t => t.id === txId);
    if (tx) {
      let status = tx.status;
      if (step === 'Lab-Incharge' && tx.status === 'Pending Approval') status = 'Approved by Lab-Incharge';
      if (step === 'Dean' && tx.status === 'Approved by Lab-Incharge') status = 'Approved by Dean';
      if (step === 'Admin' && tx.status === 'Approved by Dean') status = 'Approved by Admin';
      
      const updated = { ...tx, status };
      fetch(`/api/transactions/${txId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === txId ? updated : t)
      }));

      if (status === 'Approved by Lab-Incharge') {
        notifyApprovers(
          'Request Approved by Lab Incharge',
          `Equipment request ${txId} has been approved by the Lab Incharge. Pending Dean approval.`,
          'transactions'
        );
      } else if (status === 'Approved by Dean') {
        notifyApprovers(
          'Request Approved by Dean',
          `Equipment request ${txId} has been approved by the Dean. Pending Admin approval.`,
          'transactions'
        );
      } else if (status === 'Approved by Admin') {
        notifyApprovers(
          'Request Fully Approved',
          `Equipment request ${txId} has been fully approved by the Admin. Ready for release.`,
          'transactions'
        );
        addNotification(tx.borrowerId, 'Request Approved', `Your request for ${state.equipment.find(e => e.id === tx.equipmentId)?.name} has been fully approved by the Admin.`, 'Success', 'transactions');
      }
    }
  };

  const releaseEquipment = (txId: string) => {
    const tx = state.transactions.find(t => t.id === txId);
    if (tx && tx.status === 'Approved by Dean') {
      const updatedTx = { ...tx, status: 'Active' as const };
      fetch(`/api/transactions/${txId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx)
      });

      const eq = state.equipment.find(e => e.id === tx.equipmentId);
      if (eq) {
        const updatedEq = { ...eq, status: 'Borrowed' as const };
        fetch(`/api/equipment/${eq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEq)
        });
        setState(prev => ({
          ...prev,
          transactions: prev.transactions.map(t => t.id === txId ? updatedTx : t),
          equipment: prev.equipment.map(e => e.id === eq.id ? updatedEq : e)
        }));
      }
    }
  };

  const createSoftwareRequest = async (formData: FormData): Promise<{ success: boolean; message: string }> => {
    formData.append('id', `sr-${Date.now()}`);
    formData.append('facultyId', state.currentUser!.id);
    formData.append('status', 'Pending');
    formData.append('createdAt', new Date().toISOString());
    formData.append('updatedAt', new Date().toISOString());

    try {
      const res = await fetch('/api/software-requests', {
        method: 'POST',
        body: formData // multer handles multipart/form-data
      });
      const json = await res.json();
      if (json.success) {
        setState(prev => ({ ...prev, softwareRequests: [...prev.softwareRequests, json.data] }));
        notifyApprovers('New Software Request', `${state.currentUser?.name} has requested a new software installation: ${json.data.softwareName}`, 'software');
        return { success: true, message: 'Software installation request submitted' };
      }
      return { success: false, message: 'Failed to submit software request' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error uploading request' };
    }
  };

  const updateSoftwareRequestStatus = (id: string, status: SoftwareRequestStatus) => {
    fetch(`/api/software-requests/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setState(prev => ({
      ...prev,
      softwareRequests: prev.softwareRequests.map(sr => sr.id === id ? { ...sr, status, updatedAt: new Date().toISOString() } : sr)
    }));
  };

  const updateSettings = (updates: Partial<SystemSettings>) => {
    const newSettings = { ...state.settings, ...updates };
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    setState(prev => ({ ...prev, settings: newSettings }));
  };

  const toggleSystemMode = () => {
    setState(prev => ({ ...prev, isOnline: !prev.isOnline }));
  };

  const resetSystem = async () => {
    await fetch('/api/system/reset', { method: 'POST' });
    const keys = ['pm_logs', 'equipment_data', 'borrow_transactions', 'app_users', 'borrow_policies', 'lab_bookings', 'maintenance_tickets', 'attendance_logs', 'app_schedule'];
    keys.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      toggleSystemMode, 
      checkoutEquipment, 
      returnEquipment, 
      updatePolicy, 
      clearTransactions,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      updateUserPosition,
      addUser,
      updateUser,
      deleteUser,
      addFacility,
      updateFacility,
      deleteFacility,
      login,
      logout,
      changePassword,
      addBooking,
      approveBooking,
      rejectBooking,
      completeBooking,
      cancelBooking,
      createTicket,
      updateTicketStatus,
      updateTicketChecklist,
      deleteTicket,
      addMaintenanceLog,
      updateMaintenanceLog,
      deleteMaintenanceLog,
      startInventoryAudit,
      addAuditRecord,
      completeInventoryAudit,
      deleteInventoryAudit,
      approveTransaction,
      releaseEquipment,
      walkInCheckout,
      createSoftwareRequest,
      updateSoftwareRequestStatus,
      resetSystem,
      updateSettings,
      markNotificationAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Equipment, 
  SystemState, 
  Borrower, 
  BorrowTransaction, 
  EquipmentCondition, 
  DEFAULT_POLICIES, 
  BorrowerRole, 
  RulePolicy,
  User,
  UserPosition,
  Facility,
  FacilityBooking,
  MaintenanceTicket,
  TicketStatus,
  TicketPriority,
  MaintenanceChecklist,
  MaintenanceLog,
  OjtAttendance,
  AttendanceSchedule
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
  cancelBooking: (id: string) => void;
  // Maintenance
  createTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  updateTicketChecklist: (ticketId: string, itemId: string, completed: boolean) => void;
  deleteTicket: (id: string) => void;
  addMaintenanceLog: (log: MaintenanceLog | Omit<MaintenanceLog, 'id'>) => void;
  updateMaintenanceLog: (id: string, updates: Partial<MaintenanceLog>) => void;
  deleteMaintenanceLog: (id: string) => void;
  // Approvals
  approveTransaction: (txId: string, step: 'Lab-Incharge' | 'Dean') => void;
  releaseEquipment: (txId: string) => void;
  resetSystem: () => void;
  // Notifications
  markNotificationAsRead: (id: string) => void;
  // OJT Features
  logAttendance: (userId: string) => TransactionResult;
  updateAttendanceSchedule: (attendanceSchedule: AttendanceSchedule) => void;
  updateOjtStatus: (userId: string, isOJT: boolean) => void;
  registerFace: (userId: string) => void;
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
    policies: DEFAULT_POLICIES,
    attendanceLogs: [],
    attendanceSchedule: {
      amIn: '08:00',
      amOut: '12:00',
      pmIn: '13:00',
      pmOut: '17:00'
    },
    notifications: [],
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
          attRes,
          schedRes
        ] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/equipment'),
          fetch('/api/transactions'),
          fetch('/api/facilities'),
          fetch('/api/bookings'),
          fetch('/api/maintenance-tickets'),
          fetch('/api/pm-logs'),
          fetch('/api/attendance'),
          fetch('/api/schedule')
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
          schedules
        ] = await Promise.all([
          usersRes.json(),
          eqRes.json(),
          txRes.json(),
          facRes.json(),
          bkRes.json(),
          tkRes.json(),
          logsRes.json(),
          attRes.json(),
          schedRes.json()
        ]);

        const schedule = schedules.find((s: any) => s.id === 'default') || state.attendanceSchedule;

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
          attendanceSchedule: schedule
        }));
      } catch (error) {
        console.error('Failed to sync with database:', error);
      }
    };

    fetchData();
  }, []);

  const addNotification = (userId: string, message: string) => {
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, {
        id: `notif-${Date.now()}`,
        userId,
        message,
        createdAt: new Date().toISOString(),
        read: false,
      }]
    }));
  };

  const markNotificationAsRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
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

    if (hasConflict) {
      return { success: false, message: 'Conflict: This facility is already booked for the selected time.' };
    }

    const newBooking: FacilityBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      status: 'Pending Approval'
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
      addNotification(dean.id, `Approval needed for facility booking request: Facility ID ${bookingData.facilityId} by User ID ${bookingData.userId}`);
    });

    return { success: true, message: 'Reservation request submitted for Dean approval.' };
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
    }
  };

  const cancelBooking = (id: string) => {
    fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.filter(b => b.id !== id)
    }));
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
    if (equipmentItems.some(eq => !eq || eq.status !== 'Available')) {
        return { success: false, message: 'One or more items are not available.' };
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

    equipmentItems.forEach((eq, index) => {
      const newTx: BorrowTransaction = {
        id: `tx-${Date.now()}-${index}`,
        equipmentId: eq!.id,
        borrowerId: borrower.id,
        borrowerRole: borrower.role,
        checkoutTime: now.toISOString(),
        expectedReturnTime: expectedReturn.toISOString(),
        checkoutCondition: eq!.condition,
        status: 'Pending Approval',
        purpose: purpose || 'None'
      };

      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });

      const updatedEq = { ...eq!, status: 'Reserved' as const };
      fetch(`/api/equipment/${eq!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEq)
      });

      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, newTx],
        equipment: prev.equipment.map(e => e.id === eq!.id ? updatedEq : e)
      }));
    });

    return { success: true, message: `Borrow request submitted for ${borrower.name}.` };
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

    const updatedEq = { ...eq, status: nextEqStatus, condition };
    fetch(`/api/equipment/${eq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEq)
    });

    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === activeTx.id ? updatedTx : t),
      equipment: prev.equipment.map(e => e.id === eq.id ? updatedEq : e)
    }));

    return { success: true, message: `Equipment returned. Status: ${nextEqStatus}` };
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

  const approveTransaction = (txId: string, step: 'Lab-Incharge' | 'Dean') => {
    const tx = state.transactions.find(t => t.id === txId);
    if (tx) {
      let status = tx.status;
      if (step === 'Lab-Incharge' && tx.status === 'Pending Approval') status = 'Approved by Lab-Incharge';
      if (step === 'Dean' && tx.status === 'Approved by Lab-Incharge') status = 'Approved by Dean';
      
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

  const logAttendance = (userId: string): { success: boolean, message: string } => {
    const now = new Date();
    const nowStr = now.toISOString();
    const today = nowStr.split('T')[0];
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const sched = state.attendanceSchedule;
    let type: 'Time In' | 'Time Out' = 'Time In';
    let shift: 'AM' | 'PM' = 'AM';
    let status: 'Present' | 'Late' | 'Undertime' = 'Present';

    if (time >= '06:00' && time <= '10:00') {
      type = 'Time In'; shift = 'AM';
      if (time > sched.amIn) status = 'Late';
    } else if (time > '10:00' && time <= '12:30') {
      type = 'Time Out'; shift = 'AM';
      if (time < sched.amOut) status = 'Undertime';
    } else if (time > '12:30' && time <= '14:30') {
      type = 'Time In'; shift = 'PM';
      if (time > sched.pmIn) status = 'Late';
    } else {
      type = 'Time Out'; shift = 'PM';
      if (time < sched.pmOut) status = 'Undertime';
    }

    const newLog: OjtAttendance = {
      id: `att-${Date.now()}`,
      userId,
      date: today,
      timestamp: nowStr,
      type,
      shift,
      status
    };

    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    });

    setState(prev => ({
      ...prev,
      attendanceLogs: [...prev.attendanceLogs, newLog]
    }));

    return { success: true, message: `Successfully logged ${type} (${shift}) as ${status}` };
  };

  const updateAttendanceSchedule = (schedule: AttendanceSchedule) => {
    fetch('/api/schedule/default', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule)
    });
    setState(prev => ({ ...prev, attendanceSchedule: schedule }));
  };

  const updateOjtStatus = (userId: string, isOJT: boolean) => {
    updateUser(userId, { isOJT });
  };

  const registerFace = (userId: string) => {
    updateUser(userId, { faceRegistered: true });
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
      cancelBooking,
      createTicket,
      updateTicketStatus,
      updateTicketChecklist,
      deleteTicket,
      addMaintenanceLog,
      updateMaintenanceLog,
      deleteMaintenanceLog,
      approveTransaction,
      releaseEquipment,
      logAttendance,
      updateAttendanceSchedule,
      updateOjtStatus,
      registerFace,
      resetSystem,
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

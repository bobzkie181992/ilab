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
  Facility,
  FacilityBooking,
  MaintenanceTicket,
  TicketStatus,
  TicketPriority,
  MaintenanceChecklist
} from '../types';

const MOCK_USERS: User[] = [
  { id: 'u-admin', qrCode: 'ADM-001', name: 'Master Admin', role: 'Admin', idNumber: 'ADM-2024-01', departmentOrCourse: 'Administration', contactInfo: '+1-234-567-8900', email: 'admin@university.edu' },
  { id: 'u-01', qrCode: 'STU-001', name: 'Alice Smith', role: 'Student', idNumber: '2023-0001', departmentOrCourse: 'BSCS 3', contactInfo: 'alice.s@university.edu', email: 'alice.s@university.edu' },
  { id: 'u-02', qrCode: 'STU-002', name: 'Bob Jones', role: 'Student', idNumber: '2023-0002', departmentOrCourse: 'BSIT 2', contactInfo: 'bob.j@university.edu', email: 'bob.j@university.edu' },
  { id: 'u-03', qrCode: 'FAC-001', name: 'Dr. Emily Chen', role: 'Faculty', idNumber: 'EMP-1042', departmentOrCourse: 'Computer Science', contactInfo: 'echen@university.edu', email: 'echen@university.edu' },
  { id: 'u-04', qrCode: 'STF-001', name: 'Mark Davis', role: 'Staff', idNumber: 'EMP-2055', departmentOrCourse: 'IT Support', contactInfo: 'mdavis@university.edu', email: 'mdavis@university.edu' },
];

const MOCK_FACILITIES: Facility[] = [
  { id: 'f-01', name: 'IoT Development Zone', type: 'Zone', capacity: 10, available: true, lab: 'Innovation Lab' },
  { id: 'f-02', name: 'VR Simulation Room', type: 'Room', capacity: 4, available: true, lab: 'Media Lab' },
  { id: 'f-03', name: 'PC Station 01', type: 'Station', capacity: 1, available: true, lab: 'PC Lab 101' },
  { id: 'f-04', name: 'Meeting Area A', type: 'Room', capacity: 6, available: true, lab: 'Main Hall' },
];

const MOCK_EQUIPMENT: Equipment[] = [
  { id: 'eq-01', qrCode: 'EQ-MAC-01', name: 'MacBook Pro M2', type: 'Laptop', status: 'Available', condition: 'Good', lab: 'CCIS-Storage' },
  { id: 'eq-02', qrCode: 'EQ-MAC-02', name: 'MacBook Pro M2', type: 'Laptop', status: 'Borrowed', condition: 'Good', lab: 'CCIS-Storage' },
  { id: 'eq-03', qrCode: 'EQ-CAM-01', name: 'Canon EOS R5', type: 'Camera', status: 'Borrowed', condition: 'Fair', lab: 'Media-Lab' },
  { id: 'eq-04', qrCode: 'EQ-TAB-01', name: 'iPad Pro', type: 'Tablet', status: 'Maintenance', condition: 'Damaged', lab: 'CCIS-Storage' },
  { id: 'eq-05', qrCode: 'EQ-PRJ-01', name: 'Portable Projector', type: 'Projector', status: 'Available', condition: 'Good', lab: 'CCIS-Storage' },
  { id: 'eq-06', qrCode: 'EQ-SENS-01', name: 'Raspberry Pi 4 Kit', type: 'IoT Kit', status: 'Available', condition: 'Good', lab: 'IoT-Lab' },
];

const MOCK_TRANSACTIONS: BorrowTransaction[] = [
  {
    id: 'tx-01',
    equipmentId: 'eq-02',
    borrowerId: 'u-01',
    borrowerRole: 'Student',
    checkoutTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    expectedReturnTime: new Date(Date.now() + 22 * 3600000).toISOString(),
    checkoutCondition: 'Good',
    status: 'Active'
  },
];

export interface TransactionResult {
  success: boolean;
  message: string;
}

interface AppContextType {
  state: SystemState;
  toggleSystemMode: () => void;
  checkoutEquipment: (equipmentQr: string, borrowerQr: string) => TransactionResult;
  returnEquipment: (equipmentQr: string, condition: EquipmentCondition, notes?: string) => TransactionResult;
  updatePolicy: (role: BorrowerRole, policy: Partial<RulePolicy>) => void;
  clearTransactions: () => void;
  addEquipment: (equipment: Omit<Equipment, 'id' | 'status'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  // Auth
  login: (email: string) => boolean;
  logout: () => void;
  // Bookings
  addBooking: (booking: Omit<FacilityBooking, 'id' | 'status'>) => void;
  cancelBooking: (id: string) => void;
  // Maintenance
  createTicket: (ticket: Omit<MaintenanceTicket, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  updateTicketChecklist: (ticketId: string, itemId: string, completed: boolean) => void;
  deleteTicket: (id: string) => void;
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
    policies: DEFAULT_POLICIES,
  });

  const login = (email: string) => {
    const user = state.users.find(u => u.email === email);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const addBooking = (bookingData: Omit<FacilityBooking, 'id' | 'status'>) => {
    const newBooking: FacilityBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      status: 'Confirmed'
    };
    setState(prev => ({
      ...prev,
      bookings: [...prev.bookings, newBooking]
    }));
  };

  const cancelBooking = (id: string) => {
    setState(prev => ({
      ...prev,
      bookings: prev.bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' as const } : b)
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
    setState(prev => ({
      ...prev,
      maintenanceTickets: [...prev.maintenanceTickets, newTicket],
      equipment: prev.equipment.map(eq => eq.id === ticketData.equipmentId ? { ...eq, status: 'Maintenance' } : eq)
    }));
  };

  const updateTicketStatus = (id: string, status: TicketStatus) => {
    const now = new Date().toISOString();
    setState(prev => {
      const ticket = prev.maintenanceTickets.find(tk => tk.id === id);
      if (!ticket) return prev;
      
      const updatedTickets = prev.maintenanceTickets.map(tk => 
        tk.id === id ? { ...tk, status, updatedAt: now } : tk
      );

      // If resolving/closing and it was an equipment ticket, maybe move back to available?
      // Logic: If resolved, set equipment to Available
      let updatedEquipment = prev.equipment;
      if (status === 'Resolved' || status === 'Closed') {
        updatedEquipment = prev.equipment.map(eq => 
          eq.id === ticket.equipmentId ? { ...eq, status: 'Available' as const } : eq
        );
      } else if (status === 'In Progress') {
        updatedEquipment = prev.equipment.map(eq => 
          eq.id === ticket.equipmentId ? { ...eq, status: 'Maintenance' as const } : eq
        );
      }

      return {
        ...prev,
        maintenanceTickets: updatedTickets,
        equipment: updatedEquipment
      };
    });
  };

  const updateTicketChecklist = (ticketId: string, itemId: string, completed: boolean) => {
    setState(prev => ({
      ...prev,
      maintenanceTickets: prev.maintenanceTickets.map(tk => {
        if (tk.id === ticketId && tk.checklist) {
          return {
            ...tk,
            checklist: {
              ...tk.checklist,
              items: tk.checklist.items.map(item => 
                item.id === itemId ? { ...item, completed } : item
              )
            }
          };
        }
        return tk;
      })
    }));
  };

  const deleteTicket = (id: string) => {
    setState(prev => ({
      ...prev,
      maintenanceTickets: prev.maintenanceTickets.filter(tk => tk.id !== id)
    }));
  };

  // Background task to mark overdue transactions
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        let changed = false;
        const nowMs = Date.now();
        const updatedTransactions = prev.transactions.map(tx => {
          if (tx.status === 'Active' && new Date(tx.expectedReturnTime).getTime() < nowMs) {
            changed = true;
            return { ...tx, status: 'Overdue' as const };
          }
          return tx;
        });
        return changed ? { ...prev, transactions: updatedTransactions } : prev;
      });
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleSystemMode = () => {
    setState(prev => ({ ...prev, isOnline: !prev.isOnline }));
  };

  const checkoutEquipment = (equipmentQr: string, borrowerQr: string): TransactionResult => {
    const eq = state.equipment.find(e => e.qrCode === equipmentQr);
    if (!eq) return { success: false, message: 'Equipment not found.' };
    if (eq.status !== 'Available') return { success: false, message: `Equipment is currently ${eq.status}.` };

    const borrower = state.users.find(b => b.qrCode === borrowerQr) as Borrower | undefined;
    if (!borrower) return { success: false, message: 'Borrower not found.' };

    const activeBorrows = state.transactions.filter(t => t.borrowerId === borrower.id && (t.status === 'Active' || t.status === 'Overdue'));
    const rules = state.policies[borrower.role];

    if (activeBorrows.length >= rules.maxItems) {
      return { success: false, message: `Limit Exceeded: ${borrower.role}s are limited to ${rules.maxItems} items.` };
    }

    const hasOverdue = activeBorrows.some(t => t.status === 'Overdue');
    if (hasOverdue) {
      return { success: false, message: 'Transaction Blocked: Borrower has overdue equipment.' };
    }

    const now = new Date();
    const expectedReturn = new Date(now.getTime() + rules.maxDurationHours * 3600000);

    const newTx: BorrowTransaction = {
      id: `tx-${Date.now()}`,
      equipmentId: eq.id,
      borrowerId: borrower.id,
      borrowerRole: borrower.role,
      checkoutTime: now.toISOString(),
      expectedReturnTime: expectedReturn.toISOString(),
      checkoutCondition: eq.condition,
      status: 'Active'
    };

    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTx],
      equipment: prev.equipment.map(e => e.id === eq.id ? { ...e, status: 'Borrowed' } : e)
    }));

    return { success: true, message: `Successfully checked out to ${borrower.name}. Due on ${expectedReturn.toLocaleString()}.` };
  };

  const returnEquipment = (equipmentQr: string, condition: EquipmentCondition, notes?: string): TransactionResult => {
    const eq = state.equipment.find(e => e.qrCode === equipmentQr);
    if (!eq) return { success: false, message: 'Equipment not found.' };

    const activeTx = state.transactions.find(t => t.equipmentId === eq.id && (t.status === 'Active' || t.status === 'Overdue'));
    if (!activeTx) return { success: false, message: 'No active transaction found for this equipment.' };

    const now = new Date();
    
    // Determine if condition worsened to 'Damaged' and equipment needs maintenance
    const nextEqStatus = condition === 'Damaged' ? 'Maintenance' : 'Available';

    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === activeTx.id ? {
        ...t,
        status: 'Returned',
        actualReturnTime: now.toISOString(),
        returnCondition: condition,
        notes
      } : t),
      equipment: prev.equipment.map(e => e.id === eq.id ? {
        ...e,
        status: nextEqStatus,
        condition: condition
      } : e)
    }));

    const overdueStr = activeTx.status === 'Overdue' ? ' (Returned Late)' : '';
    return { success: true, message: `Equipment successfully returned${overdueStr}. Status updated to ${nextEqStatus}.` };
  };

  const updatePolicy = (role: BorrowerRole, policy: Partial<RulePolicy>) => {
    setState(prev => ({
      ...prev,
      policies: {
        ...prev.policies,
        [role]: { ...prev.policies[role], ...policy }
      }
    }));
  };

  const clearTransactions = () => {
    setState(prev => ({ ...prev, transactions: [] }));
  };

  const addEquipment = (equipmentData: Omit<Equipment, 'id' | 'status'>) => {
    const newEq: Equipment = {
      ...equipmentData,
      id: `eq-${Date.now()}`,
      status: 'Available',
    };
    setState(prev => ({
      ...prev,
      equipment: [...prev.equipment, newEq]
    }));
  };

  const updateEquipment = (id: string, updates: Partial<Equipment>) => {
    setState(prev => ({
      ...prev,
      equipment: prev.equipment.map(eq => eq.id === id ? { ...eq, ...updates } : eq)
    }));
  };

  const deleteEquipment = (id: string) => {
    setState(prev => ({
      ...prev,
      equipment: prev.equipment.filter(eq => eq.id !== id)
    }));
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
      login,
      logout,
      addBooking,
      cancelBooking,
      createTicket,
      updateTicketStatus,
      updateTicketChecklist,
      deleteTicket
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

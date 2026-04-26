export type BorrowerRole = 'Student' | 'Faculty' | 'Staff';
export type UserRole = 'Admin' | BorrowerRole;
export type EquipmentStatus = 'Available' | 'Borrowed' | 'Maintenance' | 'Offline' | 'Lost';
export type EquipmentCondition = 'Good' | 'Fair' | 'Damaged';
export type BookingStatus = 'Confirmed' | 'Completed' | 'Cancelled' | 'Expired';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface User {
  id: string;
  qrCode: string;
  name: string;
  role: UserRole;
  idNumber: string;
  departmentOrCourse: string;
  contactInfo: string;
  email: string;
}

export interface Borrower extends User {
  role: BorrowerRole;
}

export interface Facility {
  id: string;
  name: string;
  type: 'Station' | 'Room' | 'Zone';
  capacity: number;
  available: boolean;
  lab: string;
}

export interface FacilityBooking {
  id: string;
  facilityId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose: string;
}

export interface Equipment {
  id: string;
  qrCode: string;
  name: string;
  type: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  lab: string;
  ipAddress?: string; // Optional for non-smart devices
  lastSeen?: string;
  temperature?: number;
  cpuUsage?: number;
}

export interface BorrowTransaction {
  id: string;
  equipmentId: string;
  borrowerId: string;
  borrowerRole: BorrowerRole;
  checkoutTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  checkoutCondition: EquipmentCondition;
  returnCondition?: EquipmentCondition;
  status: 'Active' | 'Returned' | 'Overdue';
  notes?: string;
}

export interface MaintenanceChecklist {
  id: string;
  title: string;
  items: { id: string; task: string; completed: boolean }[];
}

export interface MaintenanceTicket {
  id: string;
  equipmentId: string;
  reportedBy: string;
  assignedTo?: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  checklist?: MaintenanceChecklist;
}

export interface SystemState {
  isOnline: boolean;
  currentUser: User | null;
  users: User[];
  equipment: Equipment[];
  transactions: BorrowTransaction[];
  facilities: Facility[];
  bookings: FacilityBooking[];
  maintenanceTickets: MaintenanceTicket[];
  policies: Record<BorrowerRole, RulePolicy>;
}

export interface RulePolicy {
  maxItems: number;
  maxDurationHours: number;
}

export const DEFAULT_POLICIES: Record<BorrowerRole, RulePolicy> = {
  Student: { maxItems: 1, maxDurationHours: 24 },
  Staff: { maxItems: 3, maxDurationHours: 72 },
  Faculty: { maxItems: 5, maxDurationHours: 168 },
};

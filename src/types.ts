export type BorrowerRole = 'Student' | 'Faculty' | 'Staff';
export type UserRole = 'Admin' | BorrowerRole;
export type EquipmentStatus = 'Available' | 'Borrowed' | 'Maintenance' | 'Offline' | 'Lost' | 'Reserved';
export type EquipmentCondition = 'Good' | 'Fair' | 'Damaged';
export type BookingStatus = 'Pending Approval' | 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled' | 'Expired';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserPosition = 'Dean' | 'Lab-Incharge' | 'OJT';
export type TransactionStatus = 'Pending Approval' | 'Approved by Lab-Incharge' | 'Approved by Dean' | 'Released' | 'Active' | 'Returned' | 'Overdue';

export interface User {
  id: string;
  qrCode: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  position?: UserPosition | null;
  idNumber: string;
  departmentOrCourse: string;
  contactInfo: string;
  email: string;
  imageUrl?: string;
  isOJT?: boolean;
  faceRegistered?: boolean;
}

export interface AttendanceSchedule {
  amIn: string; // "08:00"
  amOut: string; // "12:00"
  pmIn: string; // "13:00"
  pmOut: string; // "17:00"
}

export interface OjtAttendance {
  id: string;
  userId: string;
  date: string;
  timestamp: string; // ISO string
  type: 'Time In' | 'Time Out';
  shift: 'AM' | 'PM';
  status: 'Present' | 'Late' | 'Undertime';
}

export interface MaintenanceLog {
  id: string;
  date: string;
  lab: string;
  month: string;
  formDate: string;
  weeks: string[];
  tasks: Record<string, {
    status: 'Pending' | 'Done';
    remarks: string;
    lab: string;
    date: string;
    week: string;
  }>;
  additionalConcerns: string;
  preparedBy: string;
  preparedDesignation: string;
  evaluatedBy: string;
  evaluatedDesignation: string;
  evaluatedDate: string;
}

export interface Borrower extends User {
  role: BorrowerRole;
}

export interface Facility {
  id: string;
  qrCode: string;
  name: string;
  type: 'Station' | 'Room' | 'Zone';
  capacity: number;
  available: boolean;
  location: string;
  description?: string;
  amenities?: string[];
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
  serialNumber?: string;
  poNumber?: string;
  brand?: string;
  model?: string;
  cpu?: string;
  ram?: string;
  storage?: string;
  keyboardSerial?: string;
  mouseSerial?: string;
  monitorBrandModel?: string;
  monitorSerial?: string;
  pcType?: 'Branded' | 'Clone' | 'All-in-One';
  systemUnitSerial?: string;
  peripherals?: { name: string; serial: string }[];
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
  status: TransactionStatus;
  notes?: string;
  purpose: string;
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

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
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
  maintenanceLogs: MaintenanceLog[];
  policies: Record<BorrowerRole, RulePolicy>;
  attendanceLogs: OjtAttendance[];
  attendanceSchedule: AttendanceSchedule;
  notifications: Notification[];
}

export type DurationUnit = 'Hours' | 'Days' | 'Weeks' | 'Months' | 'Years';

export interface RulePolicy {
  maxItems: number;
  maxDurationValue: number;
  maxDurationUnit: DurationUnit;
}

export const DEFAULT_POLICIES: Record<BorrowerRole, RulePolicy> = {
  Student: { maxItems: 1, maxDurationValue: 24, maxDurationUnit: 'Hours' },
  Staff: { maxItems: 3, maxDurationValue: 72, maxDurationUnit: 'Hours' },
  Faculty: { maxItems: 5, maxDurationValue: 168, maxDurationUnit: 'Hours' },
};

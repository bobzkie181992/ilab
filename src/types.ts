export type BorrowerRole = 'Student' | 'Faculty' | 'Staff';
export type UserRole = 'Admin' | BorrowerRole;
export type EquipmentStatus = 'Available' | 'Borrowed' | 'Maintenance' | 'Offline' | 'Lost' | 'Reserved' | 'Queued';
export type EquipmentCondition = 'Good' | 'Fair' | 'Damaged';
export type BookingStatus = 'Pending Approval' | 'Confirmed' | 'Rejected' | 'Completed' | 'Cancelled' | 'Expired' | 'Queued';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type SoftwareRequestStatus = 'Pending' | 'Approved' | 'Installed' | 'Rejected';

export interface SoftwareRequest {
  id: string;
  facultyId: string;
  softwareName: string;
  version?: string;
  purpose: string;
  targetComputers: string;
  status: SoftwareRequestStatus;
  installerUrl?: string;
  installerName?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserPosition = 'Dean' | 'Lab-Incharge';
export type TransactionStatus = 'Pending Approval' | 'Approved by Lab-Incharge' | 'Approved by Dean' | 'Approved by Admin' | 'Released' | 'Active' | 'Returned' | 'Overdue' | 'Queued';

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
  preparedByDesignation: string;
  evaluatedBy: string;
  evaluatedByDesignation: string;
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

export interface AttendanceLog {
  id: string;
  userId: string;
  timestamp: string;
  date: string; // Typically extracted from timestamp or stored separately
  type: 'In' | 'Out';
  status: 'Present' | 'Late' | 'Absent';
  method: 'Face' | 'QR' | 'Manual';
}

export interface SystemSettings {
  labName: string;
  adminEmail: string;
  logoUrl: string;
  overdueAlerts: boolean;
  adminEscalation: boolean;
}

export interface AuditRecord {
  id: string;
  equipmentId: string;
  inventoryAuditId: string;
  auditDate: string;
  auditedBy: string;
  condition: EquipmentCondition;
  status: EquipmentStatus;
  remarks?: string;
}

export interface InventoryAudit {
  id: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  startDate: string;
  endDate?: string;
  status: 'Draft' | 'In Progress' | 'Completed';
  totalItems: number;
  auditedItems: number;
  auditorId: string;
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
  attendanceLogs: AttendanceLog[];
  softwareRequests: SoftwareRequest[];
  inventoryAudits: InventoryAudit[];
  auditRecords: AuditRecord[];
  policies: Record<BorrowerRole, RulePolicy>;
  notifications: Notification[];
  settings: SystemSettings;
}

export interface Notification {
  id: string;
  userId: string; // Recipient
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Error' | 'Success';
  read: boolean;
  createdAt: string;
  targetView?: string;
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

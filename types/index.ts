export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING' | 'INACTIVE';

export type StatusType = 
  | 'Active' 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'Draft' 
  | 'Submitted' 
  | 'Published' 
  | 'Blocked' 
  | 'Completed' 
  | 'Cancelled';

export interface User {
  id: string;
  appId?: number | string; // 10-digit application ID
  studentNumber?: number | string; // 10-digit student ID
  facultyNumber?: number | string; // 10-digit faculty ID
  registerNumber: string; // or username
  email: string;
  name: string;
  role: UserRole;
  accountStatus: AccountStatus;
  avatarUrl?: string;
  profileImagePath?: string;
  phone?: string;
  department?: string;
  program?: string;
  semester?: number;
  batch?: string;
  createdAt: string;
  mustChangePassword?: boolean;
}

export interface Department {
  id: string;
  appId?: number | string; // 10-digit application ID
  departmentNumber?: number | string;
  code: string;
  name: string;
  description: string;
  hodName: string;
  facultyCount: number;
  studentCount: number;
  establishedYear: number;
  image?: string;
}

export interface Program {
  id: string;
  appId?: number | string; // 10-digit application ID
  programNumber?: number | string;
  code: string;
  name: string;
  degree: 'B.Tech' | 'M.Tech' | 'MBA' | 'MCA' | 'Ph.D';
  departmentId: string;
  departmentName: string;
  durationYears: number;
  totalSemesters: number;
  creditsRequired: number;
  eligibility: string;
  annualFee: number;
  description: string;
}

export interface Course {
  id: string;
  appId?: number | string; // 10-digit application ID
  courseNumber?: number | string;
  code: string;
  name: string;
  departmentId: string;
  departmentName: string;
  semester: number;
  credits: number;
  type: 'CORE' | 'ELECTIVE' | 'LAB';
  description: string;
  facultyId?: string;
  facultyName?: string;
  maxStudents: number;
  enrolledStudents: number;
  isRegistrationOpen: boolean;
  createdBy?: string;
  isCatalog?: boolean;
}

export type CourseEnrollmentStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'Submitted'
  | 'Approved';

export interface CourseRegistration {
  id: string;
  appId?: number | string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  studentProgram?: string;
  studentDepartment?: string;
  studentSemester?: number;
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  academicYear: string;
  status: CourseEnrollmentStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  appId?: number | string;
  courseId: string;
  courseCode: string;
  courseName: string;
  date: string;
  period: number;
  studentId: string;
  registerNumber: string;
  studentName: string;
  status: 'PRESENT' | 'ABSENT' | 'OD';
  isStudentBlocked?: boolean;
  markedBy: string;
  markedAt: string;
}

export interface StudentAttendanceSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  totalClasses: number;
  present: number;
  absent: number;
  od: number;
  percentage: number;
}

export interface ODRequest {
  id: string;
  appId?: number | string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  department: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  eventName: string;
  documentName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  facultyRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface InternalMark {
  id: string;
  appId?: number | string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  cia1: number; // max 20
  cia2: number; // max 20
  assignment: number; // max 10
  total: number; // max 50
  status: 'Draft' | 'Submitted';
  submittedBy?: string;
  submittedAt?: string;
}

export interface Assignment {
  id: string;
  appId?: number | string;
  courseId: string;
  courseCode: string;
  courseName: string;
  facultyId: string;
  facultyName: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  attachments?: string[];
  totalSubmissions: number;
  gradedSubmissions: number;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  appId?: number | string;
  assignmentId: string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  submittedAt: string;
  fileName: string;
  fileSize: string;
  comments?: string;
  marksObtained?: number;
  facultyFeedback?: string;
  status: 'Submitted' | 'Graded' | 'Late';
}

export interface SemesterResult {
  id: string;
  appId?: number | string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'F' | 'C' | 'RA' | string;
  gradePoints: number;
  passStatus?: 'PASS' | 'FAIL';
  semester: number;
  academicYear: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Published';
  submittedBy: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;
}

export interface FeeAssignment {
  id: string;
  appId?: number | string;
  feeName: string;
  feeType: 'Tuition Fee' | 'Exam Fee' | string;
  amount: number;
  academicYear: string;
  batch: string; // e.g. '2023-2027'
  programId?: string;
  programName?: string;
  departmentId?: string;
  departmentName?: string;
  semester?: number;
  dueDate: string;
  description: string;
  status: 'Active' | 'Closed' | 'Inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFeeAssignment {
  id: string;
  appId?: number | string;
  feeAssignmentId: string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  feeName: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  status: 'Unpaid' | 'Paid' | 'Pending';
  dueDate: string;
  assignedAt: string;
  paidAt?: string;
  academicYear: string;
}

export interface FeeStructure {
  id: string;
  programId: string;
  programName: string;
  academicYear: string;
  category: 'Tuition' | 'Hostel' | 'Exam' | 'Special Lab' | 'Library';
  amount: number;
  dueDate: string;
}

export interface StudentFee {
  id: string;
  appId?: number | string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  title: string;
  category: 'Tuition' | 'Hostel' | 'Exam' | 'Special Lab' | 'Library' | string;
  feeType?: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Unpaid' | 'Paid';
  academicYear: string;
  lastPaymentDate?: string;
  feeAssignmentId?: string;
}

export interface PaymentTransaction {
  id: string;
  appId?: number | string;
  transactionId: string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  feeId: string;
  feeTitle: string;
  feeType?: string;
  amount: number;
  paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | string;
  status: 'Success' | 'Failure' | 'Pending' | 'Paid';
  timestamp: string;
  receiptNumber: string;
}

export interface Receipt {
  id: string;
  appId?: number | string;
  receiptNumber: string;
  transactionId: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  program: string;
  department: string;
  semester: number;
  amount: number;
  paymentMethod: string;
  date: string;
  feeTitle: string;
  feeType?: string;
  academicYear: string;
  paymentStatus?: string;
}

export interface BlockRecord {
  id: string;
  appId?: number | string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  department: string;
  semester: number;
  status: 'BLOCKED';
  reason: string;
  blockedBy: string; // Faculty / Admin name
  blockedById: string;
  blockedAt: string;
  unblockedBy?: string;
  unblockedAt?: string;
  unblockRemarks?: string;
}

export interface AuditLog {
  id: string;
  appId?: number | string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
}

export interface NotificationItem {
  id: string;
  appId?: number | string;
  recipientId?: string; // or null for broadcast
  recipientRole?: UserRole | 'ALL';
  title: string;
  message: string;
  category: 'Academic' | 'Registration' | 'Result' | 'Fee' | 'OD' | 'System';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface RegistrationPeriod {
  id: string;
  appId?: number | string;
  academicYear: string;
  semester: number;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  eligiblePrograms: string[];
}

export type CourseResultStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Published'
  | 'Rejected';

export interface CourseResultSubmission {
  id: string;
  appId?: number | string;
  courseId: string;
  courseCode: string;
  courseName: string;
  department: string;
  program: string;
  semester: number;
  facultyId: string;
  facultyName: string;
  academicYear: string;
  totalStudents: number;
  submittedStudentsCount: number;
  missingResultsCount: number;
  averageMarks?: number;
  status: CourseResultStatus;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  publishedAt?: string;
  publishedBy?: string;
  remarks?: string;
}


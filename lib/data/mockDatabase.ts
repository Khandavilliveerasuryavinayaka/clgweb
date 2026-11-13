import {
  User,
  Department,
  Program,
  Course,
  CourseRegistration,
  AttendanceRecord,
  StudentAttendanceSummary,
  ODRequest,
  InternalMark,
  Assignment,
  AssignmentSubmission,
  SemesterResult,
  FeeAssignment,
  StudentFeeAssignment,
  FeeStructure,
  StudentFee,
  PaymentTransaction,
  Receipt,
  BlockRecord,
  AuditLog,
  NotificationItem,
  RegistrationPeriod,
  CourseResultSubmission,
  CourseResultStatus,
} from '@/types';
import { calculateResult, validateExternalMarks } from '@/lib/grading';

// ==========================================
// 1. SEED USERS
// ==========================================
export const initialUsers: User[] = [
  {
    id: 'usr-admin-1',
    registerNumber: 'admin',
    email: 'admin@svcollege.edu',
    name: 'Dr. K. S. Ramanathan',
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    phone: '+91 98765 43210',
    department: 'Central Administration',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'usr-fac-1',
    registerNumber: 'FAC101',
    email: 'anand.kumar@svcollege.edu',
    name: 'Prof. Anand Kumar',
    role: 'FACULTY',
    accountStatus: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    phone: '+91 98765 11223',
    department: 'Computer Science and Engineering',
    createdAt: '2023-06-15T00:00:00Z',
  },
  {
    id: 'usr-fac-2',
    registerNumber: 'FAC102',
    email: 'priya.sharma@svcollege.edu',
    name: 'Dr. Priya Sharma',
    role: 'FACULTY',
    accountStatus: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    phone: '+91 98765 33445',
    department: 'Electronics and Communication',
    createdAt: '2023-06-15T00:00:00Z',
  },
  {
    id: 'usr-stu-1',
    registerNumber: 'REG2024001',
    email: 'rahul.verma@svcollege.edu',
    name: 'Rahul Verma',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',

    phone: '+91 91234 56789',
    department: 'Computer Science and Engineering',
    program: 'B.Tech Computer Science',
    semester: 6,
    batch: '2022-2026',
    createdAt: '2022-08-01T00:00:00Z',
  },
  {
    id: 'usr-stu-2',
    registerNumber: 'REG2024002',
    email: 'kavita.patel@svcollege.edu',
    name: 'Kavita Patel',
    role: 'STUDENT',
    accountStatus: 'BLOCKED',

    phone: '+91 91234 98765',
    department: 'Computer Science and Engineering',
    program: 'B.Tech Computer Science',
    semester: 6,
    batch: '2022-2026',
    createdAt: '2022-08-01T00:00:00Z',
  },
  {
    id: 'usr-stu-3',
    registerNumber: 'REG2024003',
    email: 'vikram.aditya@svcollege.edu',
    name: 'Vikram Aditya',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',

    phone: '+91 91234 11122',
    department: 'Computer Science and Engineering',
    program: 'B.Tech Computer Science',
    semester: 6,
    batch: '2022-2026',
    createdAt: '2022-08-01T00:00:00Z',
  },
  {
    id: 'usr-stu-4',
    registerNumber: 'REG2024004',
    email: 'ananya.iyer@svcollege.edu',
    name: 'Ananya Iyer',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',

    phone: '+91 91234 33344',
    department: 'Electronics and Communication',
    program: 'B.Tech Electronics & Comm',
    semester: 4,
    batch: '2023-2027',
    createdAt: '2023-08-01T00:00:00Z',
  },
];

// ==========================================
// 2. DEPARTMENTS & PROGRAMS
// ==========================================
export const initialDepartments: Department[] = [
  {
    id: 'dept-cse',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    description: 'Fostering cutting-edge research in algorithms, distributed systems, and AI engineering.',
    hodName: 'Dr. Arvind Swaminathan',
    facultyCount: 32,
    studentCount: 480,
    establishedYear: 2004,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dept-ece',
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    description: 'Pioneering VLSI microelectronics, embedded IoT, optical networking, and satellite signals.',
    hodName: 'Dr. Malini Subramanian',
    facultyCount: 26,
    studentCount: 360,
    establishedYear: 2005,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dept-me',
    code: 'MECH',
    name: 'Mechanical Engineering',
    description: 'Advanced thermofluids, robotics, autonomous dynamics, and additive manufacturing.',
    hodName: 'Dr. Rajeshwari Menon',
    facultyCount: 22,
    studentCount: 300,
    establishedYear: 2006,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dept-ce',
    code: 'CIVIL',
    name: 'Civil and Environmental Engineering',
    description: 'Sustainable structural design, smart city infrastructures, and geotechnical resilience.',
    hodName: 'Dr. Suresh Babu',
    facultyCount: 18,
    studentCount: 240,
    establishedYear: 2008,
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'dept-mba',
    code: 'DOMS',
    name: 'Department of Management Studies',
    description: 'Developing ethical leaders in digital fintech, operations analytics, and strategic governance.',
    hodName: 'Dr. Meenakshi Sundaram',
    facultyCount: 20,
    studentCount: 200,
    establishedYear: 2010,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600',
  },
];

export const initialPrograms: Program[] = [
  {
    id: 'prog-btech-cse',
    code: 'BTECH-CSE',
    name: 'B.Tech in Computer Science and Engineering',
    degree: 'B.Tech',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    durationYears: 4,
    totalSemesters: 8,
    creditsRequired: 160,
    eligibility: 'Higher Secondary (10+2) with Physics, Chemistry & Mathematics with min 60% aggregate.',
    annualFee: 125000,
    description: 'Comprehensive 4-year undergraduate curriculum focusing on modern software systems, cloud computing, and AI architectures.',
  },
  {
    id: 'prog-btech-ece',
    code: 'BTECH-ECE',
    name: 'B.Tech in Electronics and Communication',
    degree: 'B.Tech',
    departmentId: 'dept-ece',
    departmentName: 'Electronics and Communication Engineering',
    durationYears: 4,
    totalSemesters: 8,
    creditsRequired: 160,
    eligibility: 'Higher Secondary (10+2) with Physics, Chemistry & Mathematics with min 60% aggregate.',
    annualFee: 115000,
    description: 'Hardware systems, VLSI circuitry, digital signal processors, and high-frequency wireless communications.',
  },
  {
    id: 'prog-mtech-cse',
    code: 'MTECH-CSE',
    name: 'M.Tech in Data Science & Cloud Computing',
    degree: 'M.Tech',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    durationYears: 2,
    totalSemesters: 4,
    creditsRequired: 80,
    eligibility: 'B.E. / B.Tech in CSE/IT or equivalent with valid score.',
    annualFee: 95000,
    description: 'Advanced graduate specialization in large-scale data engineering, machine learning pipelines, and microservice infrastructure.',
  },
  {
    id: 'prog-mba',
    code: 'MBA-GEN',
    name: 'Master of Business Administration (MBA)',
    degree: 'MBA',
    departmentId: 'dept-mba',
    departmentName: 'Department of Management Studies',
    durationYears: 2,
    totalSemesters: 4,
    creditsRequired: 90,
    eligibility: 'Recognized Bachelor Degree with minimum 50% marks in any discipline.',
    annualFee: 140000,
    description: 'Leadership, corporate finance, digital marketing, supply chain optimization, and technological entrepreneurship.',
  },
];

// ==========================================
// 3. COURSES & REGISTRATIONS
// ==========================================
export const initialCourses: Course[] = [
  {
    id: 'crs-cs601',
    code: 'CS601',
    name: 'Distributed Systems & Cloud Architecture',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    semester: 6,
    credits: 4,
    type: 'CORE',
    description: 'Consensus protocols, Paxos, Raft, microservices, containerization, and fault-tolerant cloud patterns.',
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    maxStudents: 60,
    enrolledStudents: 52,
    isRegistrationOpen: true,
    isCatalog: true,
  },
  {
    id: 'crs-cs602',
    code: 'CS602',
    name: 'Machine Learning & Deep Learning',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    semester: 6,
    credits: 4,
    type: 'CORE',
    description: 'Supervised/unsupervised algorithms, neural networks, backpropagation, CNNs, and Transformer models.',
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    maxStudents: 60,
    enrolledStudents: 55,
    isRegistrationOpen: true,
    isCatalog: true,
  },
  {
    id: 'crs-cs603',
    code: 'CS603',
    name: 'Information & Network Security',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    semester: 6,
    credits: 3,
    type: 'CORE',
    description: 'Cryptography, symmetric/asymmetric ciphers, public key infrastructure, zero-trust network protocols.',
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    maxStudents: 60,
    enrolledStudents: 50,
    isRegistrationOpen: true,
    isCatalog: true,
  },
  {
    id: 'crs-cs604',
    code: 'CS604',
    name: 'Full-Stack Web Development Lab',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    semester: 6,
    credits: 2,
    type: 'LAB',
    description: 'Practical engineering in Next.js, TypeScript, PostgreSQL, and enterprise REST API design.',
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    maxStudents: 60,
    enrolledStudents: 52,
    isRegistrationOpen: true,
    isCatalog: true,
  },
  {
    id: 'crs-cs605',
    code: 'CS605',
    name: 'DevOps & Site Reliability Engineering',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science and Engineering',
    semester: 6,
    credits: 3,
    type: 'ELECTIVE',
    description: 'CI/CD automation, Kubernetes clusters, Prometheus observability, and Infrastructure as Code.',
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    maxStudents: 45,
    enrolledStudents: 38,
    isRegistrationOpen: true,
    isCatalog: true,
  },
  {
    id: 'crs-ec401',
    code: 'EC401',
    name: 'Digital Signal Processing',
    departmentId: 'dept-ece',
    departmentName: 'Electronics and Communication Engineering',
    semester: 4,
    credits: 4,
    type: 'CORE',
    description: 'Discrete Fourier Transform, FFT algorithms, digital filter design, and spectral estimation.',
    facultyId: 'usr-fac-2',
    facultyName: 'Dr. Priya Sharma',
    maxStudents: 60,
    enrolledStudents: 48,
    isRegistrationOpen: true,
    isCatalog: true,
  },
];

export const initialRegistrationPeriods: RegistrationPeriod[] = [
  {
    id: 'reg-p-2024-odd',
    academicYear: '2024-2025',
    semester: 6,
    title: 'Spring 2025 Semester Registration Window',
    startDate: '2025-01-05',
    endDate: '2025-02-15',
    isActive: true,
    eligiblePrograms: ['BTECH-CSE', 'BTECH-ECE', 'BTECH-ME'],
  },
];

export const initialCourseRegistrations: CourseRegistration[] = [
  {
    id: 'creg-1',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    studentProgram: 'B.Tech Computer Science',
    studentDepartment: 'Computer Science and Engineering',
    studentSemester: 6,
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    credits: 4,
    semester: 6,
    academicYear: '2024-2025',
    status: 'ACCEPTED',
    requestedAt: '2025-01-08T10:30:00Z',
    reviewedBy: 'Prof. Anand Kumar',
    reviewedAt: '2025-01-10T14:20:00Z',
  },
  {
    id: 'creg-2',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    studentProgram: 'B.Tech Computer Science',
    studentDepartment: 'Computer Science and Engineering',
    studentSemester: 6,
    courseId: 'crs-cs602',
    courseCode: 'CS602',
    courseName: 'Machine Learning & Deep Learning',
    credits: 4,
    semester: 6,
    academicYear: '2024-2025',
    status: 'ACCEPTED',
    requestedAt: '2025-01-08T10:30:00Z',
    reviewedBy: 'Prof. Anand Kumar',
    reviewedAt: '2025-01-10T14:20:00Z',
  },
  {
    id: 'creg-3',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    studentProgram: 'B.Tech Computer Science',
    studentDepartment: 'Computer Science and Engineering',
    studentSemester: 6,
    courseId: 'crs-cs603',
    courseCode: 'CS603',
    courseName: 'Information & Network Security',
    credits: 3,
    semester: 6,
    academicYear: '2024-2025',
    status: 'ACCEPTED',
    requestedAt: '2025-01-08T10:30:00Z',
    reviewedBy: 'Prof. Anand Kumar',
    reviewedAt: '2025-01-10T14:20:00Z',
  },
  {
    id: 'creg-4',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    studentProgram: 'B.Tech Computer Science',
    studentDepartment: 'Computer Science and Engineering',
    studentSemester: 6,
    courseId: 'crs-cs604',
    courseCode: 'CS604',
    courseName: 'Full-Stack Web Development Lab',
    credits: 2,
    semester: 6,
    academicYear: '2024-2025',
    status: 'ACCEPTED',
    requestedAt: '2025-01-08T10:30:00Z',
    reviewedBy: 'Prof. Anand Kumar',
    reviewedAt: '2025-01-10T14:20:00Z',
  },
  {
    id: 'creg-5',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    studentProgram: 'B.Tech Computer Science',
    studentDepartment: 'Computer Science and Engineering',
    studentSemester: 6,
    courseId: 'crs-cs605',
    courseCode: 'CS605',
    courseName: 'DevOps & Site Reliability Engineering',
    credits: 3,
    semester: 6,
    academicYear: '2024-2025',
    status: 'PENDING',
    requestedAt: '2025-01-12T11:00:00Z',
  },
  {
    id: 'creg-6',
    studentId: 'usr-stu-3',
    registerNumber: 'REG2024003',
    studentName: 'Vikram Aditya',
    studentProgram: 'B.Tech Computer Science',
    studentDepartment: 'Computer Science and Engineering',
    studentSemester: 6,
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    credits: 4,
    semester: 6,
    academicYear: '2024-2025',
    status: 'ACCEPTED',
    requestedAt: '2025-01-08T10:30:00Z',
    reviewedBy: 'Prof. Anand Kumar',
    reviewedAt: '2025-01-10T14:20:00Z',
  },
];

// ==========================================
// 4. ATTENDANCE & OD REQUESTS
// ==========================================
export const initialAttendanceSummaries: StudentAttendanceSummary[] = [
  {
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    facultyName: 'Prof. Anand Kumar',
    totalClasses: 36,
    present: 32,
    absent: 2,
    od: 2,
    percentage: 94.4,
  },
  {
    courseId: 'crs-cs602',
    courseCode: 'CS602',
    courseName: 'Machine Learning & Deep Learning',
    facultyName: 'Prof. Anand Kumar',
    totalClasses: 34,
    present: 29,
    absent: 4,
    od: 1,
    percentage: 88.2,
  },
  {
    courseId: 'crs-cs603',
    courseCode: 'CS603',
    courseName: 'Information & Network Security',
    facultyName: 'Prof. Anand Kumar',
    totalClasses: 30,
    present: 27,
    absent: 3,
    od: 0,
    percentage: 90.0,
  },
  {
    courseId: 'crs-cs604',
    courseCode: 'CS604',
    courseName: 'Full-Stack Web Development Lab',
    facultyName: 'Prof. Anand Kumar',
    totalClasses: 18,
    present: 18,
    absent: 0,
    od: 0,
    percentage: 100.0,
  },
];

export const initialAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-1',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems',
    date: '2025-02-18',
    period: 1,
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    status: 'PRESENT',
    markedBy: 'Prof. Anand Kumar',
    markedAt: '2025-02-18T09:15:00Z',
  },
  {
    id: 'att-2',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems',
    date: '2025-02-18',
    period: 1,
    studentId: 'usr-stu-2',
    registerNumber: 'REG2024002',
    studentName: 'Kavita Patel',
    status: 'ABSENT',
    isStudentBlocked: true,
    markedBy: 'Prof. Anand Kumar',
    markedAt: '2025-02-18T09:15:00Z',
  },
  {
    id: 'att-3',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems',
    date: '2025-02-18',
    period: 1,
    studentId: 'usr-stu-3',
    registerNumber: 'REG2024003',
    studentName: 'Vikram Aditya',
    status: 'PRESENT',
    markedBy: 'Prof. Anand Kumar',
    markedAt: '2025-02-18T09:15:00Z',
  },
];

export const initialODRequests: ODRequest[] = [
  {
    id: 'od-101',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    department: 'Computer Science and Engineering',
    startDate: '2025-02-24',
    endDate: '2025-02-25',
    totalDays: 2,
    reason: 'Representing SV College at the National Smart India Hackathon Grand Finale.',
    eventName: 'Smart India Hackathon 2025',
    documentName: 'sih_selection_letter.pdf',
    status: 'Approved',
    facultyRemarks: 'Verified official invitation letter. Recommended and approved.',
    reviewedBy: 'Prof. Anand Kumar',
    reviewedAt: '2025-02-20T11:30:00Z',
    createdAt: '2025-02-19T14:10:00Z',
  },
  {
    id: 'od-102',
    studentId: 'usr-stu-3',
    registerNumber: 'REG2024003',
    studentName: 'Vikram Aditya',
    department: 'Computer Science and Engineering',
    startDate: '2025-03-01',
    endDate: '2025-03-01',
    totalDays: 1,
    reason: 'Presenting research paper on Microservice Resiliency at IEEE International Symposium.',
    eventName: 'IEEE TechnoCon 2025',
    documentName: 'ieee_acceptance_notice.pdf',
    status: 'Pending',
    createdAt: '2025-02-21T09:40:00Z',
  },
];

// ==========================================
// 5. INTERNAL MARKS & ASSIGNMENTS
// ==========================================
export const initialInternalMarks: InternalMark[] = [
  {
    id: 'im-1',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    cia1: 18,
    cia2: 19,
    assignment: 10,
    total: 47,
    status: 'Submitted',
    submittedBy: 'Prof. Anand Kumar',
    submittedAt: '2025-02-15T15:00:00Z',
  },
  {
    id: 'im-2',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    courseId: 'crs-cs602',
    courseCode: 'CS602',
    courseName: 'Machine Learning & Deep Learning',
    cia1: 17,
    cia2: 18,
    assignment: 9,
    total: 44,
    status: 'Submitted',
    submittedBy: 'Prof. Anand Kumar',
    submittedAt: '2025-02-15T15:00:00Z',
  },
  {
    id: 'im-3',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    courseId: 'crs-cs603',
    courseCode: 'CS603',
    courseName: 'Information & Network Security',
    cia1: 16,
    cia2: 18,
    assignment: 9,
    total: 43,
    status: 'Draft',
  },
  {
    id: 'im-4',
    studentId: 'usr-stu-3',
    registerNumber: 'REG2024003',
    studentName: 'Vikram Aditya',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    cia1: 15,
    cia2: 16,
    assignment: 8,
    total: 39,
    status: 'Draft',
  },
];

export const initialAssignments: Assignment[] = [
  {
    id: 'asg-1',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    title: 'Implementation of Raft Consensus State Machine',
    description: 'Implement leader election, log replication, and heartbeat timeouts in Node.js or Go. Include architecture benchmarks.',
    dueDate: '2025-03-10T23:59:00Z',
    maxMarks: 20,
    attachments: ['raft_specification_guidelines.pdf'],
    totalSubmissions: 48,
    gradedSubmissions: 35,
    createdAt: '2025-02-10T09:00:00Z',
  },
  {
    id: 'asg-2',
    courseId: 'crs-cs602',
    courseCode: 'CS602',
    courseName: 'Machine Learning & Deep Learning',
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    title: 'Residual Neural Network for Medical Image Classification',
    description: 'Train a ResNet architecture on MRI brain scans. Achieve >92% validation accuracy with dropout regularizers.',
    dueDate: '2025-03-15T23:59:00Z',
    maxMarks: 20,
    attachments: ['dataset_link_and_guidelines.pdf'],
    totalSubmissions: 42,
    gradedSubmissions: 20,
    createdAt: '2025-02-12T10:00:00Z',
  },
];

export const initialSubmissions: AssignmentSubmission[] = [
  {
    id: 'sub-1',
    assignmentId: 'asg-1',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    submittedAt: '2025-03-08T16:20:00Z',
    fileName: 'raft_consensus_rahul_verma.zip',
    fileSize: '4.2 MB',
    comments: 'Leader election and log replication implemented with tests.',
    marksObtained: 19,
    facultyFeedback: 'Excellent implementation of heartbeat randomized timers and split-brain safeguards.',
    status: 'Graded',
  },
];

// ==========================================
// 6. RESULTS WORKFLOW (CRITICAL)
// Faculty Enters -> Save Draft -> Submit
// -> Admin Review -> Admin Approves -> Admin Publishes
// -> Student Can View
// ==========================================
export const initialResults: SemesterResult[] = [
  // Semester 5 (PUBLISHED: Visible to Student!)
  {
    id: 'res-s5-1',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    courseId: 'crs-cs501',
    courseCode: 'CS501',
    courseName: 'Database Management Systems & NoSQL',
    credits: 4,
    internalMarks: 46,
    externalMarks: 48,
    totalMarks: 94,
    grade: 'O',
    gradePoints: 10,
    semester: 5,
    academicYear: '2024-2025',
    status: 'Published',
    submittedBy: 'Prof. Anand Kumar',
    submittedAt: '2024-12-10T14:00:00Z',
    approvedBy: 'Dr. K. S. Ramanathan',
    approvedAt: '2024-12-15T10:00:00Z',
    publishedAt: '2024-12-18T16:00:00Z',
  },
  {
    id: 'res-s5-2',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    courseId: 'crs-cs502',
    courseCode: 'CS502',
    courseName: 'Computer Networks & Protocols',
    credits: 4,
    internalMarks: 44,
    externalMarks: 45,
    totalMarks: 89,
    grade: 'A+',
    gradePoints: 9,
    semester: 5,
    academicYear: '2024-2025',
    status: 'Published',
    submittedBy: 'Prof. Anand Kumar',
    submittedAt: '2024-12-10T14:00:00Z',
    approvedBy: 'Dr. K. S. Ramanathan',
    approvedAt: '2024-12-15T10:00:00Z',
    publishedAt: '2024-12-18T16:00:00Z',
  },
  {
    id: 'res-s5-3',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    courseId: 'crs-cs503',
    courseCode: 'CS503',
    courseName: 'Theory of Computation & Automata',
    credits: 3,
    internalMarks: 41,
    externalMarks: 42,
    totalMarks: 83,
    grade: 'A',
    gradePoints: 8,
    semester: 5,
    academicYear: '2024-2025',
    status: 'Published',
    submittedBy: 'Prof. Anand Kumar',
    submittedAt: '2024-12-10T14:00:00Z',
    approvedBy: 'Dr. K. S. Ramanathan',
    approvedAt: '2024-12-15T10:00:00Z',
    publishedAt: '2024-12-18T16:00:00Z',
  },
  // Semester 6: Pending Admin Approval / Review
  {
    id: 'res-s6-1',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    credits: 4,
    internalMarks: 47,
    externalMarks: 46,
    totalMarks: 93,
    grade: 'O',
    gradePoints: 10,
    passStatus: 'PASS',
    semester: 6,
    academicYear: '2024-2025',
    status: 'Submitted', // Submitted by Faculty, waiting for Admin review!
    submittedBy: 'Prof. Anand Kumar',
    submittedAt: '2025-02-18T16:30:00Z',
  },
  {
    id: 'res-s6-2',
    studentId: 'usr-stu-3',
    registerNumber: 'REG2024003',
    studentName: 'Vikram Aditya',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    credits: 4,
    internalMarks: 39,
    externalMarks: 41,
    totalMarks: 80,
    grade: 'A',
    gradePoints: 8,
    passStatus: 'PASS',
    semester: 6,
    academicYear: '2024-2025',
    status: 'Submitted',
    submittedBy: 'Prof. Anand Kumar',
    submittedAt: '2025-02-18T16:30:00Z',
  },
  {
    id: 'res-s6-3',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    courseId: 'crs-cs602',
    courseCode: 'CS602',
    courseName: 'Machine Learning & Deep Learning',
    credits: 4,
    internalMarks: 44,
    externalMarks: 42,
    totalMarks: 86,
    grade: 'A+',
    gradePoints: 9,
    passStatus: 'PASS',
    semester: 6,
    academicYear: '2024-2025',
    status: 'Approved', // Approved by Admin, waiting for Publishing!
    submittedBy: 'Prof. Anand Kumar',
    submittedAt: '2025-02-16T14:00:00Z',
    approvedBy: 'Dr. K. S. Ramanathan',
    approvedAt: '2025-02-19T11:00:00Z',
  },
];

// ==========================================
// 7. FEES, PAYMENTS & RECEIPTS
// ==========================================
export const initialFeeStructures: FeeStructure[] = [
  {
    id: 'fs-1',
    programId: 'prog-btech-cse',
    programName: 'B.Tech in Computer Science and Engineering',
    academicYear: '2024-2025',
    category: 'Tuition',
    amount: 105000,
    dueDate: '2025-03-31',
  },
  {
    id: 'fs-2',
    programId: 'prog-btech-cse',
    programName: 'B.Tech in Computer Science and Engineering',
    academicYear: '2024-2025',
    category: 'Exam',
    amount: 5000,
    dueDate: '2025-03-15',
  },
  {
    id: 'fs-3',
    programId: 'prog-btech-cse',
    programName: 'B.Tech in Computer Science and Engineering',
    academicYear: '2024-2025',
    category: 'Special Lab',
    amount: 15000,
    dueDate: '2025-03-31',
  },
];

export const initialStudentFees: StudentFee[] = [
  {
    id: 'sf-1',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    title: 'Semester 6 Tuition & Academic Facilities Fee',
    category: 'Tuition',
    totalAmount: 105000,
    paidAmount: 65000,
    outstandingAmount: 40000,
    dueDate: '2025-03-31',
    status: 'Pending',
    academicYear: '2024-2025',
    lastPaymentDate: '2025-01-15T11:25:00Z',
  },
  {
    id: 'sf-2',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    title: 'End-Semester Examination Fee',
    category: 'Exam',
    totalAmount: 5000,
    paidAmount: 5000,
    outstandingAmount: 0,
    dueDate: '2025-03-15',
    status: 'Completed',
    academicYear: '2024-2025',
    lastPaymentDate: '2025-02-01T14:10:00Z',
  },
  {
    id: 'sf-3',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    title: 'Cloud Computing & High-Perf Lab Access Fee',
    category: 'Special Lab',
    totalAmount: 15000,
    paidAmount: 15000,
    outstandingAmount: 0,
    dueDate: '2025-03-31',
    status: 'Completed',
    academicYear: '2024-2025',
    lastPaymentDate: '2025-01-15T11:25:00Z',
  },
];

export const initialPayments: PaymentTransaction[] = [
  {
    id: 'txn-1001',
    transactionId: 'TXN-SVC-20250115-8891',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    feeId: 'sf-1',
    feeTitle: 'Semester 6 Tuition & Academic Facilities Fee (Installment 1)',
    amount: 65000,
    paymentMethod: 'Net Banking',
    status: 'Success',
    timestamp: '2025-01-15T11:25:00Z',
    receiptNumber: 'RCPT-2025-00412',
  },
  {
    id: 'txn-1002',
    transactionId: 'TXN-SVC-20250201-4432',
    studentId: 'usr-stu-1',
    registerNumber: 'REG2024001',
    studentName: 'Rahul Verma',
    feeId: 'sf-2',
    feeTitle: 'End-Semester Examination Fee',
    amount: 5000,
    paymentMethod: 'UPI',
    status: 'Success',
    timestamp: '2025-02-01T14:10:00Z',
    receiptNumber: 'RCPT-2025-00623',
  },
];

export const initialReceipts: Receipt[] = [
  {
    id: 'rcpt-1',
    receiptNumber: 'RCPT-2025-00412',
    transactionId: 'TXN-SVC-20250115-8891',
    studentId: 'usr-stu-1',
    studentName: 'Rahul Verma',
    registerNumber: 'REG2024001',
    program: 'B.Tech in Computer Science and Engineering',
    department: 'Computer Science and Engineering',
    semester: 6,
    amount: 65000,
    paymentMethod: 'Net Banking (HDFC Bank)',
    date: '2025-01-15T11:25:00Z',
    feeTitle: 'Semester 6 Tuition Fee (Part 1)',
    academicYear: '2024-2025',
  },
  {
    id: 'rcpt-2',
    receiptNumber: 'RCPT-2025-00623',
    transactionId: 'TXN-SVC-20250201-4432',
    studentId: 'usr-stu-1',
    studentName: 'Rahul Verma',
    registerNumber: 'REG2024001',
    program: 'B.Tech in Computer Science and Engineering',
    department: 'Computer Science and Engineering',
    semester: 6,
    amount: 5000,
    paymentMethod: 'UPI (GPay)',
    date: '2025-02-01T14:10:00Z',
    feeTitle: 'End-Semester Examination Fee',
    academicYear: '2024-2025',
  },
];

// ==========================================
// 8. STUDENT BLOCKING SYSTEM (CRITICAL)
// Faculty blocks by Register Number with mandatory reason
// Admin ONLY can unblock
// Blocked students are locked from portal & academic APIs
// ==========================================
export const initialBlockRecords: BlockRecord[] = [
  {
    id: 'blk-1',
    studentId: 'usr-stu-2',
    registerNumber: 'REG2024002',
    studentName: 'Kavita Patel',
    department: 'Computer Science and Engineering',
    semester: 6,
    status: 'BLOCKED',
    reason: 'Repeated unauthorized absenteeism and disciplinary violation during lab practical assessments.',
    blockedBy: 'Prof. Anand Kumar',
    blockedById: 'usr-fac-1',
    blockedAt: '2025-02-14T11:45:00Z',
  },
];

// ==========================================
// 9. AUDIT LOGGING (IMMUTABLE)
// ==========================================
export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-001',
    userId: 'usr-admin-1',
    userName: 'Dr. K. S. Ramanathan',
    role: 'ADMIN',
    action: 'REGISTRATION_WINDOW_LAUNCHED',
    entity: 'RegistrationPeriod',
    entityId: 'reg-p-2024-odd',
    details: 'Launched Spring 2025 Course Registration Window for 6th Semester programs.',
    ipAddress: '192.168.1.10',
    timestamp: '2025-01-05T09:00:00Z',
  },
  {
    id: 'aud-002',
    userId: 'usr-fac-1',
    userName: 'Prof. Anand Kumar',
    role: 'FACULTY',
    action: 'STUDENT_BLOCKED',
    entity: 'StudentAccount',
    entityId: 'usr-stu-2',
    details: 'Blocked student REG2024002 (Kavita Patel). Reason: Repeated unauthorized absenteeism and disciplinary violation.',
    ipAddress: '192.168.2.45',
    timestamp: '2025-02-14T11:45:00Z',
    previousState: 'ACTIVE',
    newState: 'BLOCKED',
  },
  {
    id: 'aud-003',
    userId: 'usr-fac-1',
    userName: 'Prof. Anand Kumar',
    role: 'FACULTY',
    action: 'INTERNAL_MARKS_SUBMITTED',
    entity: 'InternalMarks',
    entityId: 'crs-cs601',
    details: 'Submitted CIA-1, CIA-2 and Assignment marks for CS601 (52 students).',
    ipAddress: '192.168.2.45',
    timestamp: '2025-02-15T15:00:00Z',
    previousState: 'Draft',
    newState: 'Submitted',
  },
  {
    id: 'aud-004',
    userId: 'usr-fac-1',
    userName: 'Prof. Anand Kumar',
    role: 'FACULTY',
    action: 'RESULTS_SUBMITTED_FOR_APPROVAL',
    entity: 'SemesterResult',
    entityId: 'crs-cs601',
    details: 'Submitted end-semester results for CS601 Distributed Systems to Admin for approval.',
    ipAddress: '192.168.2.45',
    timestamp: '2025-02-18T16:30:00Z',
    previousState: 'Draft',
    newState: 'Submitted',
  },
  {
    id: 'aud-005',
    userId: 'usr-admin-1',
    userName: 'Dr. K. S. Ramanathan',
    role: 'ADMIN',
    action: 'RESULTS_APPROVED',
    entity: 'SemesterResult',
    entityId: 'crs-cs602',
    details: 'Approved CS602 Machine Learning semester marks following faculty moderation.',
    ipAddress: '192.168.1.10',
    timestamp: '2025-02-19T11:00:00Z',
    previousState: 'Submitted',
    newState: 'Approved',
  },
];

// ==========================================
// 10. NOTIFICATIONS
// ==========================================
export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    recipientRole: 'ALL',
    title: 'Spring 2025 Course Registration is Live',
    message: 'Students are advised to complete their elective course selections prior to the deadline.',
    category: 'Registration',
    isRead: false,
    createdAt: '2025-01-05T09:30:00Z',
    link: '/student/course-registration',
  },
  {
    id: 'notif-2',
    recipientId: 'usr-stu-1',
    recipientRole: 'STUDENT',
    title: 'On-Duty Request Approved',
    message: 'Your OD request for the Smart India Hackathon has been approved by Prof. Anand Kumar.',
    category: 'OD',
    isRead: true,
    createdAt: '2025-02-20T11:30:00Z',
    link: '/student/od',
  },
  {
    id: 'notif-3',
    recipientId: 'usr-stu-1',
    recipientRole: 'STUDENT',
    title: 'Semester 5 Results Published',
    message: 'Official results for Semester 5 are now published and available on your student portal.',
    category: 'Result',
    isRead: true,
    createdAt: '2024-12-18T16:05:00Z',
    link: '/student/results',
  },
  {
    id: 'notif-4',
    recipientId: 'usr-stu-1',
    recipientRole: 'STUDENT',
    title: 'Tuition Fee Due Reminder',
    message: 'Semester 6 installment due date is March 31, 2025. Please clear outstanding balance.',
    category: 'Fee',
    isRead: false,
    createdAt: '2025-02-10T08:00:00Z',
    link: '/student/fees',
  },
];



// ==========================================
// 9. COURSE RESULT SUBMISSIONS (CLASS WORKFLOW)
// ==========================================
export const initialCourseSubmissions: CourseResultSubmission[] = [
  {
    id: 'sub-crs-cs601',
    courseId: 'crs-cs601',
    courseCode: 'CS601',
    courseName: 'Distributed Systems & Cloud Architecture',
    department: 'Computer Science and Engineering',
    program: 'B.Tech Computer Science',
    semester: 6,
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    academicYear: '2024-2025',
    totalStudents: 3,
    submittedStudentsCount: 3,
    missingResultsCount: 0,
    averageMarks: 86.3,
    status: 'Pending Approval',
    submittedAt: '2025-02-25T14:30:00Z',
    remarks: 'Compiled end-semester theory and lab results submitted for academic moderation.',
  },
  {
    id: 'sub-crs-cs602',
    courseId: 'crs-cs602',
    courseCode: 'CS602',
    courseName: 'Machine Learning & Deep Learning',
    department: 'Computer Science and Engineering',
    program: 'B.Tech Computer Science',
    semester: 6,
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    academicYear: '2024-2025',
    totalStudents: 3,
    submittedStudentsCount: 3,
    missingResultsCount: 0,
    averageMarks: 88.0,
    status: 'Approved',
    submittedAt: '2025-02-24T11:00:00Z',
    reviewedBy: 'Dr. K. S. Ramanathan',
    reviewedAt: '2025-02-26T09:15:00Z',
    remarks: 'Approved by Deanery. Ready for formal publishing.',
  },
  {
    id: 'sub-crs-cs501',
    courseId: 'crs-cs501',
    courseCode: 'CS501',
    courseName: 'Advanced Database Management Systems',
    department: 'Computer Science and Engineering',
    program: 'B.Tech Computer Science',
    semester: 5,
    facultyId: 'usr-fac-1',
    facultyName: 'Prof. Anand Kumar',
    academicYear: '2024-2025',
    totalStudents: 3,
    submittedStudentsCount: 3,
    missingResultsCount: 0,
    averageMarks: 87.5,
    status: 'Published',
    submittedAt: '2024-12-15T10:00:00Z',
    reviewedBy: 'Dr. K. S. Ramanathan',
    reviewedAt: '2024-12-18T14:00:00Z',
    publishedAt: '2024-12-18T16:00:00Z',
    remarks: 'Officially published and gazetted.',
  },
];

// ==========================================
// STORE STATE WITH IN-MEMORY ENGINE & PERSISTENCE
// ==========================================
let sequenceCounter = 1;
export function generateSequentialId(): number {
  return sequenceCounter++;
}
export const generate10DigitId = generateSequentialId;

class DatabaseStore {
  private users: User[] = [...initialUsers];
  private departments: Department[] = [...initialDepartments];
  private programs: Program[] = [...initialPrograms];
  private courses: Course[] = [...initialCourses];
  private courseRegistrations: CourseRegistration[] = [...initialCourseRegistrations];
  private registrationPeriods: RegistrationPeriod[] = [...initialRegistrationPeriods];
  private attendanceSummaries: StudentAttendanceSummary[] = [...initialAttendanceSummaries];
  private attendanceRecords: AttendanceRecord[] = [...initialAttendanceRecords];
  private odRequests: ODRequest[] = [...initialODRequests];
  private internalMarks: InternalMark[] = [...initialInternalMarks];
  private assignments: Assignment[] = [...initialAssignments];
  private submissions: AssignmentSubmission[] = [...initialSubmissions];
  private results: SemesterResult[] = [...initialResults];
  private feeStructures: FeeStructure[] = [...initialFeeStructures];
  private studentFees: StudentFee[] = [...initialStudentFees];
  private feeAssignments: FeeAssignment[] = [];
  private studentFeeAssignments: StudentFeeAssignment[] = [];
  private payments: PaymentTransaction[] = [...initialPayments];
  private receipts: Receipt[] = [...initialReceipts];
  private blockRecords: BlockRecord[] = [...initialBlockRecords];
  private auditLogs: AuditLog[] = [...initialAuditLogs];
  private notifications: NotificationItem[] = [...initialNotifications];
  private courseSubmissions: CourseResultSubmission[] = [...initialCourseSubmissions];
  private credentials: Map<string, string> = new Map([
    ['admin', 'Admin@123'],
    ['fac101', 'staff'],
    ['fac102', 'staff'],
    ['reg2024001', 'welcome'],
    ['reg2024002', 'welcome'],
    ['reg2024003', 'welcome'],
    ['reg2024004', 'welcome'],
  ]);

  constructor() {
    // 1. Assign deterministic sequential IDs starting at 1 to initial courses
    const courseCodeMap: Record<string, number> = {
      'CS601': 1,
      'CS602': 2,
      'CS603': 3,
      'CS604': 4,
      'CS605': 5,
      'EC401': 6,
    };
    this.courses.forEach((c) => {
      const assignedId = courseCodeMap[c.code] || generateSequentialId();
      c.appId = assignedId;
      c.courseNumber = assignedId;
      if (typeof assignedId === 'number' && assignedId >= sequenceCounter) {
        sequenceCounter = assignedId + 1;
      }
    });

    // 2. Assign deterministic sequential IDs starting at 1 to initial students and faculty
    const userRegMap: Record<string, number> = {
      'admin': 1,
      'FAC101': 1,
      'FAC102': 2,
      'REG2024001': 1,
      'REG2024002': 2,
      'REG2024003': 3,
      'REG2024004': 4,
    };
    this.users.forEach((u) => {
      const assignedId = userRegMap[u.registerNumber] || generateSequentialId();
      u.appId = assignedId;
      if (u.role === 'STUDENT') u.studentNumber = assignedId;
      if (u.role === 'FACULTY') u.facultyNumber = assignedId;
      if (typeof assignedId === 'number' && assignedId >= sequenceCounter) {
        sequenceCounter = assignedId + 1;
      }
    });

    // 3. Departments & Programs
    const deptCodeMap: Record<string, number> = {
      'CSE': 1,
      'ECE': 2,
      'MECH': 3,
      'CIVIL': 4,
      'MBA': 5,
    };
    this.departments.forEach((d) => {
      const assignedId = deptCodeMap[d.code] || generateSequentialId();
      d.appId = assignedId;
      d.departmentNumber = assignedId;
    });

    const progCodeMap: Record<string, number> = {
      'BTECH-CSE': 1,
      'BTECH-ECE': 2,
      'MBA': 3,
    };
    this.programs.forEach((p) => {
      const assignedId = progCodeMap[p.code] || generateSequentialId();
      p.appId = assignedId;
      p.programNumber = assignedId;
    });

    // 4. Other collections
    this.courseRegistrations.forEach((r, idx) => {
      r.appId = idx + 1;
    });
    this.registrationPeriods.forEach((rp, idx) => {
      rp.appId = idx + 1;
    });
    this.attendanceRecords.forEach((a, idx) => {
      a.appId = idx + 1;
    });
    this.odRequests.forEach((o, idx) => {
      o.appId = idx + 1;
    });
    this.internalMarks.forEach((m, idx) => {
      m.appId = idx + 1;
    });
    this.assignments.forEach((asg, idx) => {
      asg.appId = idx + 1;
    });
    this.submissions.forEach((s, idx) => {
      s.appId = idx + 1;
    });
    this.results.forEach((res, idx) => {
      res.appId = idx + 1;
    });
    this.studentFees.forEach((f, idx) => {
      f.appId = idx + 1;
    });
    this.payments.forEach((p, idx) => {
      p.appId = idx + 1;
    });
    this.receipts.forEach((rc, idx) => {
      rc.appId = idx + 1;
    });
    this.blockRecords.forEach((b, idx) => {
      b.appId = idx + 1;
    });
    this.auditLogs.forEach((l, idx) => {
      l.appId = idx + 1;
    });
    this.notifications.forEach((n, idx) => {
      n.appId = idx + 1;
    });

    // Ensure the global sequence continues from the next available integer
    if (sequenceCounter <= 10) {
      sequenceCounter = 10;
    }
  }

  // --- Users & Security Credentials ---
  getUsers() { return this.users; }
  getUserById(id: string | number) {
    const sId = String(id).trim();
    const sLower = sId.toLowerCase();
    return this.users.find(
      u =>
        u.id === sId ||
        (u.registerNumber && u.registerNumber.toLowerCase() === sLower) ||
        String(u.appId) === sId ||
        String(u.studentNumber) === sId ||
        String(u.facultyNumber) === sId ||
        (u.email && u.email.toLowerCase() === sLower)
    );
  }
  getUserByRegisterNumber(reg: string) {
    const clean = reg.trim().toLowerCase();
    return this.users.find(u => 
      u.registerNumber.toLowerCase() === clean || 
      (u.appId && String(u.appId) === clean) ||
      (u.studentNumber && String(u.studentNumber) === clean) ||
      (u.facultyNumber && String(u.facultyNumber) === clean)
    );
  }

  upsertUser(user: User) {
    const cleanReg = (user.registerNumber || '').trim().toLowerCase();
    const idx = this.users.findIndex(u => 
      (u.id && user.id && u.id === user.id) || 
      (cleanReg && u.registerNumber.toLowerCase() === cleanReg) ||
      (user.appId && u.appId === user.appId) ||
      (user.studentNumber && u.studentNumber === user.studentNumber)
    );
    if (idx >= 0) {
      this.users[idx] = { ...this.users[idx], ...user };
    } else {
      this.users.push(user);
    }
  }

  verifyCredentials(registerNumber: string, password?: string): boolean {
    if (!password) return false;
    const clean = registerNumber.trim().toLowerCase();
    const stored = this.credentials.get(clean);
    if (stored) {
      if (stored.toLowerCase() === password.toLowerCase()) return true;
    }
    const user = this.getUserByRegisterNumber(clean);
    if (user) {
      // Allow 'welcome' for students and 'staff' for faculty as universal temporary initial passwords
      if (user.role === 'STUDENT' && (password === 'welcome' || password === 'Student@123')) return true;
      if (user.role === 'FACULTY' && (password === 'staff' || password === 'Faculty@123')) return true;
      if (user.role === 'ADMIN' && (password === 'admin' || password === 'Admin@123')) return true;
    }
    return false;
  }

  setUserPassword(registerNumber: string, password: string): void {
    this.credentials.set(registerNumber.toLowerCase(), password);
    const user = this.getUserByRegisterNumber(registerNumber);
    if (user) {
      user.mustChangePassword = false;
    }
  }

  createStudent(data: {
    registerNumber: string;
    email: string;
    name: string;
    phone?: string;
    department?: string;
    program?: string;
    semester?: number;
    batch?: string;
  }): User {
    const existing = this.getUserByRegisterNumber(data.registerNumber);
    if (existing) {
      throw new Error(`Student with Register Number ${data.registerNumber} already exists.`);
    }

    const appId = generate10DigitId();
    const newUser: User = {
      id: `usr-stu-${Date.now()}`,
      appId,
      studentNumber: appId,
      registerNumber: data.registerNumber.trim().toUpperCase(),
      email: data.email.trim(),
      name: data.name.trim(),
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      phone: data.phone?.trim(),
      department: data.department || 'Computer Science and Engineering',
      program: data.program || 'B.Tech Computer Science',
      semester: Number(data.semester) || 1,
      batch: data.batch || '2024-2028',
      createdAt: new Date().toISOString(),
      mustChangePassword: true,
    };

    this.users.push(newUser);
    // Initial password MUST be welcome
    this.credentials.set(newUser.registerNumber.toLowerCase(), 'welcome');
    return newUser;
  }

  createFaculty(data: {
    registerNumber: string;
    email: string;
    name: string;
    phone?: string;
    department?: string;
  }): User {
    const existing = this.getUserByRegisterNumber(data.registerNumber);
    if (existing) {
      throw new Error(`Faculty with ID ${data.registerNumber} already exists.`);
    }

    const appId = generate10DigitId();
    const newFaculty: User = {
      id: `usr-fac-${Date.now()}`,
      appId,
      facultyNumber: appId,
      registerNumber: data.registerNumber.trim().toUpperCase(),
      email: data.email.trim(),
      name: data.name.trim(),
      role: 'FACULTY',
      accountStatus: 'ACTIVE',
      phone: data.phone?.trim(),
      department: data.department || 'Computer Science and Engineering',
      createdAt: new Date().toISOString(),
      mustChangePassword: true,
    };

    this.users.push(newFaculty);
    // Initial password MUST be staff
    this.credentials.set(newFaculty.registerNumber.toLowerCase(), 'staff');
    return newFaculty;
  }

  deleteUser(idOrReg: string): boolean {
    const initialLen = this.users.length;
    this.users = this.users.filter(
      (u) => u.id !== idOrReg && u.registerNumber.toLowerCase() !== idOrReg.toLowerCase()
    );
    return this.users.length < initialLen;
  }

  updateStudentProfilePicture(studentId: string, avatarUrl: string | null, profileImagePath?: string | null): User {
    const user = this.getUserById(studentId);
    if (!user) throw new Error('Student not found');
    if (user.role !== 'STUDENT') throw new Error('User is not a student');

    const previousAvatar = user.avatarUrl;
    user.avatarUrl = avatarUrl || undefined;
    user.profileImagePath = profileImagePath || undefined;

    this.addAuditLog(
      user.id,
      user.name,
      'STUDENT',
      avatarUrl ? 'STUDENT_PROFILE_PICTURE_UPDATED' : 'STUDENT_PROFILE_PICTURE_REMOVED',
      'StudentProfile',
      user.id,
      avatarUrl
        ? `Student ${user.registerNumber} updated profile picture (${profileImagePath || 'uploaded'}).`
        : `Student ${user.registerNumber} removed profile picture and returned to default avatar.`,
      previousAvatar,
      user.avatarUrl
    );

    return user;
  }

  // --- Departments & Programs ---
  getDepartments() { return this.departments; }
  getPrograms() { return this.programs; }
  createDepartment(dept: Omit<Department, 'id'>) {
    const appId = generate10DigitId();
    const newDept: Department = { ...dept, id: `dept-${Date.now()}`, appId, departmentNumber: appId };
    this.departments.push(newDept);
    return newDept;
  }
  createProgram(prog: Omit<Program, 'id'>) {
    const appId = generate10DigitId();
    const newProg: Program = { ...prog, id: `prog-${Date.now()}`, appId, programNumber: appId };
    this.programs.push(newProg);
    return newProg;
  }

  // --- Courses ---
  getCourses() { return this.courses; }
  getCourseById(id: string | number) {
    const sId = String(id).trim();
    const upperId = sId.toUpperCase();
    return this.courses.find(
      c =>
        c.id === sId ||
        String(c.appId) === sId ||
        String(c.courseNumber) === sId ||
        c.code.toUpperCase() === upperId
    );
  }
  createCourse(course: {
    code: string;
    name: string;
    departmentId?: string;
    departmentName: string;
    semester: number;
    credits: number;
    type?: 'CORE' | 'ELECTIVE' | 'LAB';
    description: string;
    facultyId?: string;
    facultyName?: string;
    maxStudents?: number;
    academicYear?: string;
    isRegistrationOpen?: boolean;
  }) {
    const appId = generate10DigitId();
    const newCourse: Course = {
      id: `crs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId,
      courseNumber: appId,
      code: course.code.trim().toUpperCase(),
      name: course.name.trim(),
      departmentId: course.departmentId || 'dept-cse',
      departmentName: course.departmentName,
      semester: Number(course.semester),
      credits: Number(course.credits),
      type: course.type || 'CORE',
      description: course.description,
      facultyId: course.facultyId,
      facultyName: course.facultyName,
      maxStudents: course.maxStudents || 60,
      enrolledStudents: 0,
      isRegistrationOpen: course.isRegistrationOpen !== false,
      createdBy: course.facultyId,
      isCatalog: false,
    };
    this.courses.push(newCourse);
    this.addAuditLog(
      course.facultyId || 'usr-admin-1',
      course.facultyName || 'Administrator',
      course.facultyId ? 'FACULTY' : 'ADMIN',
      'COURSE_CREATED',
      'Course',
      newCourse.id,
      `Created new course/teaching module: ${newCourse.code} - ${newCourse.name}`
    );
    return newCourse;
  }

  // --- Registrations & Course Enrollment Workflow ---
  getCourseRegistrations(studentId?: string) {
    if (studentId) return this.courseRegistrations.filter(r => r.studentId === studentId);
    return this.courseRegistrations;
  }
  getRegistrationPeriods() { return this.registrationPeriods; }

  // Check if a student has official ACCEPTED status in a course
  isStudentEnrolledInCourse(courseId: string, studentId: string): boolean {
    const course = this.getCourseById(courseId);
    return this.courseRegistrations.some(
      r =>
        (r.courseId === courseId ||
          (course && (r.courseId === course.code || r.courseCode === course.code || String(course.appId) === r.courseId))) &&
        r.studentId === studentId &&
        (r.status === 'ACCEPTED' || r.status === 'Approved')
    );
  }

  // Get list of scholars officially ACCEPTED in a course
  getEnrolledStudentsForCourse(courseId: string): User[] {
    const course = this.getCourseById(courseId);
    const acceptedRegs = this.courseRegistrations.filter(
      r =>
        (r.courseId === courseId ||
          (course && r.courseId === course.code) ||
          (course && r.courseCode === course.code) ||
          (course && String(course.appId) === r.courseId)) &&
        (r.status === 'ACCEPTED' || r.status === 'Approved')
    );
    const studentIds = new Set(acceptedRegs.map(r => r.studentId));
    return this.users.filter(u => studentIds.has(u.id));
  }

  // Student applies for enrollment -> status becomes PENDING
  requestCourseEnrollment(studentId: string, courseId: string, studentObj?: User, courseObj?: Course) {
    let student = this.getUserById(studentId) || this.getUserByRegisterNumber(studentId);
    if (!student && studentObj) {
      this.upsertUser(studentObj);
      student = studentObj;
    }

    let course = this.getCourseById(courseId);
    if (!course && courseObj) {
      const existingIdx = this.courses.findIndex(
        (c) => c.id === courseObj.id || c.code.toUpperCase() === courseObj.code.toUpperCase()
      );
      if (existingIdx >= 0) {
        this.courses[existingIdx] = courseObj;
        course = this.courses[existingIdx];
      } else {
        this.courses.push(courseObj);
        course = courseObj;
      }
    }

    if (!student && studentObj) student = studentObj;
    if (!course && courseObj) course = courseObj;

    if (!student) {
      throw new Error(`Student record (${studentId}) not found. Please log in again.`);
    }
    if (!course) {
      throw new Error(`Course record (${courseId}) not found in the course database.`);
    }

    if (student.accountStatus === 'BLOCKED') {
      throw new Error('Account is blocked. Course enrollment is strictly forbidden.');
    }

    // Duplicate enrollment check: unique(studentId, courseId) for active/pending requests
    const existing = this.courseRegistrations.find(
      (r) =>
        (r.studentId === studentId ||
          (student && r.registerNumber.toLowerCase() === student.registerNumber.toLowerCase())) &&
        (r.courseId === courseId ||
          (course && (r.courseId === course.id || r.courseCode.toUpperCase() === course.code.toUpperCase()))) &&
        (r.status === 'PENDING' ||
          r.status === 'ACCEPTED' ||
          r.status === 'Approved' ||
          r.status === 'Submitted')
    );
    if (existing) {
      if (existing.status === 'PENDING' || existing.status === 'Submitted') {
        throw new Error('You already have a pending enrollment request for this course.');
      }
      throw new Error('You are already an accepted student in this course.');
    }

    const regPeriod = this.registrationPeriods.find((p) => p.isActive);

    const newReg: CourseRegistration = {
      id: `creg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      appId: generate10DigitId(),
      studentId: student.id,
      registerNumber: student.registerNumber,
      studentName: student.name,
      studentProgram: student.program || 'B.Tech Computer Science',
      studentDepartment: student.department || 'Computer Science and Engineering',
      studentSemester: student.semester || course.semester,
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      semester: course.semester,
      academicYear: regPeriod?.academicYear || '2024-2025',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };

    this.courseRegistrations.push(newReg);

    // Notify the assigned faculty member
    if (course.facultyId) {
      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        appId: generate10DigitId(),
        recipientId: course.facultyId,
        recipientRole: 'FACULTY',
        title: 'New Course Enrollment Request',
        message: `${student.name} (${student.registerNumber}) requested enrollment for ${course.code} - ${course.name}.`,
        category: 'Registration',
        isRead: false,
        createdAt: new Date().toISOString(),
        link: '/faculty/enrollment-requests',
      });
    }

    this.addAuditLog(student.id, student.name, 'STUDENT', 'COURSE_ENROLLMENT_REQUESTED', 'CourseRegistration', newReg.id, `Requested enrollment in ${course.code}`);
    return newReg;
  }

  // Faculty approves or rejects enrollment request (Strict Course Ownership Security!)
  reviewCourseEnrollment(regId: string, action: 'ACCEPTED' | 'REJECTED', reviewerId: string, reviewerName: string, remarks?: string) {
    const reg = this.courseRegistrations.find(r => r.id === regId);
    if (!reg) throw new Error('Registration record not found');

    const course = this.getCourseById(reg.courseId);
    if (!course) throw new Error('Associated course not found');

    const reviewer = this.getUserById(reviewerId);
    const isOwner =
      course.facultyId === reviewerId ||
      course.createdBy === reviewerId ||
      (reviewer && (course.facultyId === reviewer.registerNumber || course.createdBy === reviewer.registerNumber || course.facultyId === reviewer.id || course.createdBy === reviewer.id));
    const isAdmin = reviewer?.role === 'ADMIN' || reviewerId === 'usr-admin-1';

    // Requirement 4 & 12: Only course owner/instructor or Admin can approve/reject
    if (!isOwner && !isAdmin) {
      throw new Error(`SECURITY VIOLATION: You are not authorized to review enrollments for ${course.code}. Only the course instructor/owner (${course.facultyName || 'Course Faculty'}) can approve or reject.`);
    }

    reg.status = action;
    reg.reviewedBy = reviewerName;
    reg.reviewedAt = new Date().toISOString();
    reg.remarks = remarks;

    // Recalculate enrolled count (ACCEPTED only!)
    course.enrolledStudents = this.courseRegistrations.filter(
      r => r.courseId === course.id && (r.status === 'ACCEPTED' || r.status === 'Approved')
    ).length;

    // Send notification to student
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      appId: generate10DigitId(),
      recipientId: reg.studentId,
      recipientRole: 'STUDENT',
      title: `Course Enrollment ${action === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
      message: `Your enrollment request for ${reg.courseCode} (${reg.courseName}) has been ${action === 'ACCEPTED' ? 'accepted' : 'rejected'} by ${reviewerName}.`,
      category: 'Registration',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/student/courses',
    });

    this.addAuditLog(reviewerId, reviewerName, isAdmin ? 'ADMIN' : 'FACULTY', `COURSE_ENROLLMENT_${action}`, 'CourseRegistration', reg.id, `${action} enrollment for ${reg.registerNumber} in ${reg.courseCode}`);
    return reg;
  }

  // Backwards compatibility aliases
  registerCourse(studentId: string, courseId: string) {
    return this.requestCourseEnrollment(studentId, courseId);
  }

  reviewRegistration(regId: string, status: 'Approved' | 'Rejected' | 'ACCEPTED' | 'REJECTED', reviewerName: string, remarks?: string) {
    const action: 'ACCEPTED' | 'REJECTED' = (status === 'Approved' || status === 'ACCEPTED') ? 'ACCEPTED' : 'REJECTED';
    const reg = this.courseRegistrations.find(r => r.id === regId);
    const course = reg ? this.getCourseById(reg.courseId) : null;
    const reviewerId = course?.facultyId || 'usr-fac-1';
    return this.reviewCourseEnrollment(regId, action, reviewerId, reviewerName, remarks);
  }

  // --- Attendance ---
  getAttendanceSummaries(studentId: string) {
    if (studentId === 'usr-stu-1' || studentId === 'REG2024001') {
      return this.attendanceSummaries;
    }
    const studentUser = this.getUserById(studentId) || this.getUserByRegisterNumber(studentId);
    if (studentUser && (studentUser.id === 'usr-stu-1' || studentUser.registerNumber === 'REG2024001')) {
      return this.attendanceSummaries;
    }
    const records = this.attendanceRecords.filter(
      a => a.studentId === studentId || (studentUser && a.registerNumber === studentUser.registerNumber)
    );
    if (records.length === 0) {
      return [];
    }
    const byCourse = new Map<string, {
      courseId: string;
      courseCode: string;
      courseName: string;
      facultyName: string;
      totalClasses: number;
      present: number;
      absent: number;
      od: number;
    }>();

    for (const r of records) {
      if (!byCourse.has(r.courseId)) {
        byCourse.set(r.courseId, {
          courseId: r.courseId,
          courseCode: r.courseCode,
          courseName: r.courseName,
          facultyName: r.markedBy,
          totalClasses: 0,
          present: 0,
          absent: 0,
          od: 0,
        });
      }
      const entry = byCourse.get(r.courseId)!;
      entry.totalClasses += 1;
      if (r.status === 'PRESENT') entry.present += 1;
      else if (r.status === 'ABSENT') entry.absent += 1;
      else if (r.status === 'OD') entry.od += 1;
    }

    return Array.from(byCourse.values()).map(e => ({
      ...e,
      percentage: e.totalClasses > 0 ? Math.round(((e.present + e.od) / e.totalClasses) * 1000) / 10 : 0,
    }));
  }

  getAttendanceRecords(courseId?: string, date?: string) {
    return this.attendanceRecords.filter(a => {
      if (courseId && a.courseId !== courseId) return false;
      if (date && a.date !== date) return false;
      return true;
    });
  }

  markAttendance(records: Omit<AttendanceRecord, 'id' | 'markedAt'>[]) {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const created: AttendanceRecord[] = [];

    for (const r of records) {
      // Strict backend enforcement: Attendance is permitted ONLY for today's institutional date
      if (r.date !== todayStr) {
        throw new Error(
          `ATTENDANCE DATE REJECTED: Faculty can mark attendance ONLY for today's date (${todayStr}). Attempted date: '${r.date}'. Entry for yesterday, tomorrow, or any other date is strictly rejected.`
        );
      }

      // Check if student is blocked
      const student = this.getUserById(r.studentId);
      if (student?.accountStatus === 'BLOCKED') {
        throw new Error(`Cannot record attendance for blocked student ${r.registerNumber}`);
      }

      // Requirement 5 & 6: Attendance is permitted ONLY for ACCEPTED students
      if (!this.isStudentEnrolledInCourse(r.courseId, r.studentId)) {
        throw new Error(`UNAUTHORIZED: Student ${r.registerNumber} (${r.studentName || 'Student'}) is not an ACCEPTED student in course ${r.courseCode}. Attendance can only be recorded for officially accepted students.`);
      }

      const newRec: AttendanceRecord = {
        ...r,
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        appId: generate10DigitId(),
        markedAt: now,
      };
      this.attendanceRecords.push(newRec);
      created.push(newRec);
    }
    return created;
  }

  // --- OD Requests ---
  getODRequests(studentId?: string) {
    if (studentId) return this.odRequests.filter(o => o.studentId === studentId);
    return this.odRequests;
  }
  createODRequest(data: Omit<ODRequest, 'id' | 'status' | 'createdAt'>) {
    const student = this.getUserById(data.studentId);
    if (student?.accountStatus === 'BLOCKED') {
      throw new Error('Blocked students cannot submit OD requests.');
    }

    const newOD: ODRequest = {
      ...data,
      id: `od-${Date.now()}`,
      appId: generate10DigitId(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    this.odRequests.unshift(newOD);

    this.addAuditLog(data.studentId, data.studentName, 'STUDENT', 'OD_REQUEST_SUBMITTED', 'ODRequest', newOD.id, `Submitted OD for ${data.eventName}`);
    return newOD;
  }
  reviewODRequest(id: string, status: 'Approved' | 'Rejected', reviewerName: string, remarks?: string) {
    const od = this.odRequests.find(o => o.id === id);
    if (!od) throw new Error('OD Request not found');
    od.status = status;
    od.reviewedBy = reviewerName;
    od.reviewedAt = new Date().toISOString();
    od.facultyRemarks = remarks;

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      appId: generate10DigitId(),
      recipientId: od.studentId,
      recipientRole: 'STUDENT',
      title: `On-Duty Request ${status}`,
      message: `Your OD request for ${od.eventName} (${od.startDate}) has been ${status.toLowerCase()}.`,
      category: 'OD',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/student/od',
    });

    return od;
  }

  // --- Internal Marks ---
  getInternalMarks(courseId?: string, studentId?: string) {
    const course = courseId ? this.getCourseById(courseId) : null;
    const studentUser = studentId ? this.users.find(u => u.id === studentId || u.registerNumber === studentId) : null;
    const validStudentIds = new Set<string>();
    if (studentId) validStudentIds.add(studentId);
    if (studentUser) {
      if (studentUser.id) validStudentIds.add(studentUser.id);
      if (studentUser.registerNumber) validStudentIds.add(studentUser.registerNumber);
    }

    return this.internalMarks.filter(m => {
      if (courseId && m.courseId !== courseId && (!course || (m.courseId !== course.code && m.courseCode !== course.code))) return false;
      if (studentId && !validStudentIds.has(m.studentId) && !(m.registerNumber && validStudentIds.has(m.registerNumber))) return false;
      return true;
    });
  }
  saveInternalMarks(marks: InternalMark[], submit = false) {
    for (const m of marks) {
      const student = this.getUserById(m.studentId);
      if (student?.accountStatus === 'BLOCKED') {
        throw new Error(`Cannot enter marks for blocked student ${m.registerNumber}`);
      }

      // Requirement 5 & 8: Internal marks can be entered ONLY for ACCEPTED students
      if (!this.isStudentEnrolledInCourse(m.courseId, m.studentId)) {
        throw new Error(`UNAUTHORIZED: Student ${m.registerNumber} (${m.studentName || 'Student'}) is not an ACCEPTED student in course ${m.courseCode}. Internal marks can only be entered for officially accepted students.`);
      }

      const idx = this.internalMarks.findIndex(im => im.id === m.id);
      if (idx !== -1) {
        this.internalMarks[idx] = {
          ...m,
          appId: this.internalMarks[idx].appId || generate10DigitId(),
          status: submit ? 'Submitted' : 'Draft',
          submittedAt: submit ? new Date().toISOString() : this.internalMarks[idx].submittedAt,
        };
      } else {
        this.internalMarks.push({
          ...m,
          id: `im-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          appId: generate10DigitId(),
          status: submit ? 'Submitted' : 'Draft',
          submittedAt: submit ? new Date().toISOString() : undefined,
        });
      }
    }
    return true;
  }

  // --- Assignments ---
  getAssignments(courseId?: string, studentId?: string) {
    return this.assignments.filter(a => {
      if (courseId && a.courseId !== courseId) return false;
      if (studentId && !this.isStudentEnrolledInCourse(a.courseId, studentId)) return false;
      return true;
    });
  }
  getSubmissions(assignmentId?: string, studentId?: string) {
    return this.submissions.filter(s => {
      if (assignmentId && s.assignmentId !== assignmentId) return false;
      if (studentId && s.studentId !== studentId) return false;
      return true;
    });
  }
  createAssignment(asg: Omit<Assignment, 'id' | 'totalSubmissions' | 'gradedSubmissions' | 'createdAt'>) {
    const course = this.getCourseById(asg.courseId);
    if (!course) throw new Error('Course not found');
    if (asg.facultyId && course.facultyId && course.facultyId !== asg.facultyId && asg.facultyId !== 'usr-admin-1') {
      throw new Error(`SECURITY VIOLATION: You are not authorized to create assignments for course ${course.code}. Only authorized faculty can create assignments.`);
    }

    const newAsg: Assignment = {
      ...asg,
      id: `asg-${Date.now()}`,
      appId: generate10DigitId(),
      totalSubmissions: 0,
      gradedSubmissions: 0,
      createdAt: new Date().toISOString(),
    };
    this.assignments.unshift(newAsg);
    return newAsg;
  }
  submitAssignment(sub: Omit<AssignmentSubmission, 'id' | 'submittedAt' | 'status'>) {
    const student = this.getUserById(sub.studentId);
    if (student?.accountStatus === 'BLOCKED') {
      throw new Error('Blocked students cannot submit assignments.');
    }

    const asg = this.assignments.find(a => a.id === sub.assignmentId);
    if (!asg) throw new Error('Assignment not found');

    if (!this.isStudentEnrolledInCourse(asg.courseId, sub.studentId)) {
      throw new Error('Only ACCEPTED students in this course can submit assignments.');
    }

    const newSub: AssignmentSubmission = {
      ...sub,
      id: `sub-${Date.now()}`,
      appId: generate10DigitId(),
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
    };
    this.submissions.unshift(newSub);

    asg.totalSubmissions += 1;

    return newSub;
  }
  gradeSubmission(id: string, marks: number, feedback: string) {
    const sub = this.submissions.find(s => s.id === id);
    if (!sub) throw new Error('Submission not found');
    sub.marksObtained = marks;
    sub.facultyFeedback = feedback;
    sub.status = 'Graded';

    const asg = this.assignments.find(a => a.id === sub.assignmentId);
    if (asg) asg.gradedSubmissions += 1;

    return sub;
  }

  // ==========================================
  // RESULTS LIFECYCLE (CRITICAL BUSINESS RULE)
  // Faculty Draft -> Submit -> Admin Approve -> Admin Publish -> Student View
  // ==========================================
  getResults(filter?: { semester?: number; studentId?: string; status?: string }) {
    return this.results.filter(r => {
      if (filter?.semester && r.semester !== filter.semester) return false;
      if (filter?.studentId && r.studentId !== filter.studentId) return false;
      if (filter?.status && r.status !== filter.status) return false;
      return true;
    });
  }

  getStudentVisibleResults(studentId: string) {
    if (!studentId) return [];

    // Resolve student by id or registerNumber
    const studentUser = this.users.find(
      u => u.id === studentId || u.registerNumber === studentId
    );
    const validIds = new Set<string>([studentId]);
    if (studentUser) {
      if (studentUser.id) validIds.add(studentUser.id);
      if (studentUser.registerNumber) validIds.add(studentUser.registerNumber);
    }

    return this.results.filter(r => {
      const isForStudent =
        validIds.has(r.studentId) || (r.registerNumber && validIds.has(r.registerNumber));
      if (!isForStudent) return false;

      // Direct approved or published status
      if (r.status === 'Published' || r.status === 'Approved') return true;

      // Check if parent course submission has been approved by admin
      const sub = this.courseSubmissions.find(
        s => s.courseId === r.courseId || s.courseCode === r.courseCode
      );
      if (sub && (sub.status === 'Approved' || sub.status === 'Published')) {
        r.status = sub.status === 'Published' ? 'Published' : 'Approved';
        if (sub.reviewedBy && !r.approvedBy) r.approvedBy = sub.reviewedBy;
        return true;
      }

      return false;
    });
  }

  saveResultDraft(res: SemesterResult) {
    const idx = this.results.findIndex(r => r.id === res.id);
    if (idx !== -1) {
      this.results[idx] = { ...res, status: 'Draft' };
    } else {
      this.results.push({ ...res, id: `res-${Date.now()}`, status: 'Draft' });
    }
  }

  // --- Course / Class Results Workflow ---
  getCourseSubmissions(filter?: { status?: string; courseId?: string }) {
    return this.courseSubmissions.filter(s => {
      if (filter?.status && s.status !== filter.status) return false;
      if (filter?.courseId && s.courseId !== filter.courseId) return false;
      return true;
    });
  }

  getCourseSubmissionById(id: string) {
    return this.courseSubmissions.find(s => s.id === id || s.courseId === id);
  }

  // Get full roster for faculty results entry with auto-fetched internal marks and server calculations
  getCourseResultsForEntry(courseId: string) {
    const course = this.getCourseById(courseId);
    const enrolledStudents = this.getEnrolledStudentsForCourse(courseId);

    return enrolledStudents.map((student) => {
      // 1. Fetch internal marks from student's record
      const intRecord = this.internalMarks.find(
        (im) =>
          (im.courseId === courseId ||
            (course && (im.courseId === course.code || im.courseCode === course.code))) &&
          im.studentId === student.id
      );
      const internalMarks =
        intRecord && typeof intRecord.total === 'number' ? intRecord.total : null;

      // 2. Fetch existing results if already saved/drafted
      const resRecord = this.results.find(
        (r) =>
          (r.courseId === courseId ||
            (course && (r.courseId === course.code || r.courseCode === course.code))) &&
          r.studentId === student.id
      );
      const externalMarks =
        resRecord && resRecord.externalMarks !== undefined && resRecord.externalMarks !== null
          ? resRecord.externalMarks
          : null;

      // Calculate on server using official grading rules
      const calc = calculateResult(internalMarks, externalMarks);

      return {
        id: resRecord?.id || `res-entry-${student.id}`,
        studentId: student.id,
        registerNumber: student.registerNumber,
        studentName: student.name,
        courseId,
        courseCode: course?.code || '',
        courseName: course?.name || '',
        internalMarks,
        externalMarks,
        totalMarks: calc.total,
        grade: calc.grade,
        gradePoints: calc.gradePoints,
        passStatus: calc.passStatus,
        isInternalPass: calc.isInternalPass,
        isExternalPass: calc.isExternalPass,
        isTotalPass: calc.isTotalPass,
        hasInternalRecord: internalMarks !== null,
        errorMessage: calc.errorMessage,
        status: resRecord?.status || 'Draft',
      };
    });
  }

  // Server-side marks saving with strict validation and auto-calculation
  saveCourseExternalMarks(
    courseId: string,
    facultyId: string,
    facultyName: string,
    entries: { studentId: string; externalMarks: number | string | null }[],
    isSubmit = false
  ) {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Course not found');
    const reviewer = this.getUserById(facultyId);
    const isOwner =
      course.facultyId === facultyId ||
      course.createdBy === facultyId ||
      (reviewer && (course.facultyId === reviewer.registerNumber || course.createdBy === reviewer.registerNumber || course.facultyId === reviewer.id || course.createdBy === reviewer.id));
    const isAdmin = reviewer?.role === 'ADMIN' || facultyId === 'usr-admin-1';
    if (facultyId && !isOwner && !isAdmin) {
      throw new Error(`SECURITY VIOLATION: You are not authorized to enter results for course ${course.code}. Only the assigned faculty instructor can enter or submit results.`);
    }

    const enrolledStudents = this.getEnrolledStudentsForCourse(courseId);
    const enrolledMap = new Map(enrolledStudents.map((s) => [s.id, s]));
    const now = new Date().toISOString();

    const missingInternalStudents: string[] = [];
    const missingExternalStudents: string[] = [];

    // Process each student entry
    for (const entry of entries) {
      const student = enrolledMap.get(entry.studentId);
      if (!student) {
        throw new Error(`Student ${entry.studentId} is not officially accepted in course ${course.code}.`);
      }

      // 1. Fetch official internal marks
      const intRecord = this.internalMarks.find(
        (im) => im.courseId === courseId && im.studentId === student.id
      );
      const internal =
        intRecord && typeof intRecord.total === 'number' ? intRecord.total : null;
      if (internal === null) {
        missingInternalStudents.push(`${student.name} (${student.registerNumber})`);
      }

      // 2. Validate external marks
      const val = validateExternalMarks(entry.externalMarks);
      if (!val.isValid) {
        throw new Error(`${val.error} For student: ${student.name} (${student.registerNumber})`);
      }
      const external = val.value;
      if (external === null) {
        missingExternalStudents.push(`${student.name} (${student.registerNumber})`);
      }

      // 3. Independent backend calculation
      const calc = calculateResult(internal, external);

      // 4. Update or insert into results store
      const idx = this.results.findIndex(
        (r) =>
          (r.courseId === courseId ||
            (course && (r.courseId === course.code || r.courseCode === course.code))) &&
          r.studentId === student.id
      );
      const resItem: SemesterResult = {
        id: idx !== -1 ? this.results[idx].id : `res-${Date.now()}-${student.id}`,
        studentId: student.id,
        registerNumber: student.registerNumber,
        studentName: student.name,
        courseId,
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        internalMarks: internal ?? 0,
        externalMarks: external ?? 0,
        totalMarks: calc.total ?? 0,
        grade: calc.grade,
        gradePoints: calc.gradePoints,
        passStatus: calc.passStatus === 'PENDING' ? (calc.isInternalPass ? 'PASS' : 'FAIL') : calc.passStatus,
        semester: course.semester,
        academicYear: '2024-2025',
        status: isSubmit ? 'Submitted' : 'Draft',
        submittedBy: facultyName,
        submittedAt: now,
      };

      if (idx !== -1) {
        this.results[idx] = resItem;
      } else {
        this.results.push(resItem);
      }
    }

    if (isSubmit) {
      // Validate that all enrolled students have marks
      for (const s of enrolledStudents) {
        if (!entries.some((e) => e.studentId === s.id)) {
          missingExternalStudents.push(`${s.name} (${s.registerNumber})`);
        }
      }

      if (missingInternalStudents.length > 0) {
        throw new Error(
          `Cannot submit class result: Internal marks not available for ${missingInternalStudents.join(', ')}. Please ensure internal marks are finalized first.`
        );
      }
      if (missingExternalStudents.length > 0) {
        throw new Error(
          `Cannot submit class result: External exam marks are missing for ${missingExternalStudents.join(', ')}. All candidates must have external marks entered.`
        );
      }
    }

    const courseResults = this.results.filter(
      (r) => r.courseId === courseId && enrolledMap.has(r.studentId)
    );
    const avg =
      courseResults.length > 0
        ? Math.round(
            (courseResults.reduce((sum, r) => sum + (r.totalMarks || 0), 0) /
              courseResults.length) *
              10
          ) / 10
        : undefined;

    let sub = this.courseSubmissions.find((s) => s.courseId === courseId);
    const subStatus: CourseResultStatus = isSubmit ? 'Pending Approval' : 'Draft';

    if (!sub) {
      sub = {
        id: `sub-${courseId}`,
        courseId,
        courseCode: course.code,
        courseName: course.name,
        department: course.departmentName,
        program: 'B.Tech Computer Science',
        semester: course.semester,
        facultyId: facultyId || 'usr-fac-1',
        facultyName,
        academicYear: '2024-2025',
        totalStudents: enrolledStudents.length,
        submittedStudentsCount: courseResults.length,
        missingResultsCount: enrolledStudents.length - courseResults.length,
        averageMarks: avg,
        status: subStatus,
        submittedAt: isSubmit ? now : undefined,
      };
      this.courseSubmissions.unshift(sub);
    } else {
      sub.status = subStatus;
      sub.submittedStudentsCount = courseResults.length;
      sub.totalStudents = enrolledStudents.length;
      sub.missingResultsCount = enrolledStudents.length - courseResults.length;
      sub.averageMarks = avg;
      if (isSubmit) {
        sub.submittedAt = now;
      }
    }

    this.addAuditLog(
      facultyId || 'usr-fac-1',
      facultyName,
      'FACULTY',
      isSubmit ? 'COURSE_RESULT_SUBMITTED' : 'COURSE_RESULT_DRAFT_SAVED',
      'CourseResultSubmission',
      courseId,
      `${isSubmit ? 'Submitted complete class result for' : 'Saved draft results for'} ${course.code} (${enrolledStudents.length} students).`
    );

    return { success: true, count: enrolledStudents.length, status: subStatus };
  }

  saveCourseResultDraft(
    courseId: string,
    facultyId: string,
    facultyName: string,
    studentResults: any[]
  ) {
    // If passed simple entries or full objects, map to externalMarks
    const entries = studentResults.map((r) => ({
      studentId: r.studentId,
      externalMarks: r.externalMarks !== undefined ? r.externalMarks : null,
    }));
    return this.saveCourseExternalMarks(courseId, facultyId, facultyName, entries, false);
  }

  submitCourseResultForApproval(
    courseId: string,
    facultyName: string,
    facultyId?: string,
    studentEntries?: { studentId: string; externalMarks: number | string | null }[]
  ) {
    if (studentEntries && studentEntries.length > 0) {
      return this.saveCourseExternalMarks(courseId, facultyId || 'usr-fac-1', facultyName, studentEntries, true);
    }
    const enrolled = this.getEnrolledStudentsForCourse(courseId);
    const entries = enrolled.map((s) => {
      const res = this.results.find((r) => r.courseId === courseId && r.studentId === s.id);
      return {
        studentId: s.id,
        externalMarks: res ? res.externalMarks : null,
      };
    });
    return this.saveCourseExternalMarks(courseId, facultyId || 'usr-fac-1', facultyName, entries, true);
  }

  submitResultsForApproval(courseId: string, facultyName: string) {
    return this.submitCourseResultForApproval(courseId, facultyName);
  }

  approveCourseResult(courseId: string, adminName: string) {
    const now = new Date().toISOString();
    const sub = this.courseSubmissions.find(s => s.courseId === courseId || s.id === courseId || s.courseCode === courseId);
    if (sub) {
      sub.status = 'Approved';
      sub.reviewedBy = adminName;
      sub.reviewedAt = now;
    }

    const course = this.courses.find(c => c.id === courseId || c.code === courseId);
    const courseCode = course?.code || sub?.courseCode;

    const courseResults = this.results.filter(
      r => r.courseId === courseId || (courseCode && (r.courseCode === courseCode || r.courseId === courseCode))
    );
    for (const r of courseResults) {
      r.status = 'Approved';
      r.approvedBy = adminName;
      r.approvedAt = now;
      r.publishedAt = now;

      // Add notification for the student
      const notifExists = this.notifications.some(
        n => n.recipientId === r.studentId && n.title.includes(r.courseCode)
      );
      if (!notifExists) {
        this.notifications.unshift({
          id: `notif-${Date.now()}-${r.id}`,
          recipientId: r.studentId,
          recipientRole: 'STUDENT',
          title: `Semester ${r.semester} Result Approved`,
          message: `Official examination results for ${r.courseCode} (${r.courseName}) have been approved by Admin (${adminName}). Total: ${r.totalMarks}/100, Grade: ${r.grade}.`,
          category: 'Result',
          isRead: false,
          createdAt: now,
          link: '/student/results',
        });
      }
    }

    this.addAuditLog('usr-admin-1', adminName, 'ADMIN', 'COURSE_RESULT_APPROVED', 'CourseResultSubmission', courseId, `Approved complete class result for ${courseCode || courseId}.`);

    if (course) {
      (course as any).isPublished = true;
      (course as any).isArchived = true;
      (course as any).status = 'COMPLETED';
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = JSON.parse(window.localStorage.getItem('published_courses') || '[]');
        const set = new Set(Array.isArray(stored) ? stored : []);
        set.add(String(courseId).trim());
        if (courseCode) {
          set.add(String(courseCode).trim());
          set.add(String(courseCode).trim().toUpperCase());
        }
        window.localStorage.setItem('published_courses', JSON.stringify(Array.from(set)));
      } catch (_) {}
    }

    return true;
  }

  rejectCourseResult(courseId: string, adminName: string, remarks?: string) {
    const now = new Date().toISOString();
    const sub = this.courseSubmissions.find(s => s.courseId === courseId || s.id === courseId || s.courseCode === courseId);
    if (sub) {
      sub.status = 'Rejected';
      sub.reviewedBy = adminName;
      sub.reviewedAt = now;
      sub.remarks = remarks || 'Requires correction from faculty.';
    }

    const course = this.courses.find(c => c.id === courseId || c.code === courseId);
    const courseCode = course?.code || sub?.courseCode;

    const courseResults = this.results.filter(
      r => r.courseId === courseId || (courseCode && (r.courseCode === courseCode || r.courseId === courseCode))
    );
    for (const r of courseResults) {
      r.status = 'Rejected';
    }

    this.addAuditLog('usr-admin-1', adminName, 'ADMIN', 'COURSE_RESULT_REJECTED', 'CourseResultSubmission', courseId, `Rejected class result for ${courseCode || courseId}. Remarks: ${remarks}`);
    return true;
  }

  isCourseResultsPublished(courseIdOrCode: string, altCodeOrId?: string): boolean {
    if (!courseIdOrCode && !altCodeOrId) return false;
    const clean1 = courseIdOrCode ? String(courseIdOrCode).trim() : '';
    const clean2 = altCodeOrId ? String(altCodeOrId).trim() : '';

    const identifiers = [clean1, clean2, clean1.toUpperCase(), clean2.toUpperCase()].filter(Boolean);

    // Check localStorage in browser for published, archived, or deleted courses
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedPub = JSON.parse(window.localStorage.getItem('published_courses') || '[]');
        const storedDel = JSON.parse(window.localStorage.getItem('deleted_courses') || '[]');
        const storedArch = JSON.parse(window.localStorage.getItem('archived_courses') || '[]');
        const allStored = [
          ...(Array.isArray(storedPub) ? storedPub : []),
          ...(Array.isArray(storedDel) ? storedDel : []),
          ...(Array.isArray(storedArch) ? storedArch : []),
        ];
        if (
          allStored.some((item: string) =>
            identifiers.includes(String(item).trim()) ||
            identifiers.includes(String(item).trim().toUpperCase())
          )
        ) {
          return true;
        }
      } catch (_) {}
    }

    // Find course in mockDb if any
    const course = this.courses.find(
      c => identifiers.includes(c.id) || (c.code && identifiers.includes(c.code.toUpperCase()))
    );
    if (course) {
      if (course.code) {
        identifiers.push(course.code);
        identifiers.push(course.code.toUpperCase());
      }
      if (course.id) identifiers.push(course.id);
      if (
        (course as any).isPublished ||
        (course as any).isArchived ||
        (course as any).status === 'COMPLETED'
      ) {
        return true;
      }
    }

    // 1. Check course submission status: Approved OR Published
    const sub = this.courseSubmissions.find(
      s =>
        identifiers.includes(s.courseId) ||
        identifiers.includes(s.id) ||
        (s.courseCode && identifiers.includes(s.courseCode.toUpperCase()))
    );
    if (
      sub &&
      (sub.status === 'Published' ||
        sub.status === 'Approved' ||
        (sub as any).isPublished ||
        (sub as any).isArchived)
    ) {
      return true;
    }

    // 2. Check individual results records: if approved or published
    const courseResults = this.results.filter(
      r => identifiers.includes(r.courseId) || (r.courseCode && identifiers.includes(r.courseCode.toUpperCase()))
    );
    if (
      courseResults.length > 0 &&
      courseResults.some(r => r.status === 'Published' || r.status === 'Approved')
    ) {
      return true;
    }

    return false;
  }

  deleteCourse(courseIdOrCode: string, altCode?: string) {
    if (!courseIdOrCode && !altCode) return false;
    const clean1 = courseIdOrCode ? String(courseIdOrCode).trim() : '';
    const clean2 = altCode ? String(altCode).trim() : '';
    const identifiers = [clean1, clean2, clean1.toUpperCase(), clean2.toUpperCase()].filter(Boolean);

    // 1. Remove or mark completed in this.courses
    this.courses = this.courses.filter(
      c => !identifiers.includes(c.id) && !(c.code && identifiers.includes(c.code.toUpperCase()))
    );

    // 2. Remove from courseSubmissions
    this.courseSubmissions = this.courseSubmissions.filter(
      s =>
        !identifiers.includes(s.courseId) &&
        !identifiers.includes(s.id) &&
        !(s.courseCode && identifiers.includes(s.courseCode.toUpperCase()))
    );

    // 3. Remove registrations
    this.courseRegistrations = this.courseRegistrations.filter(
      r =>
        !identifiers.includes(r.courseId) &&
        !(r.courseCode && identifiers.includes(r.courseCode.toUpperCase()))
    );

    // 4. Save to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedDel = JSON.parse(window.localStorage.getItem('deleted_courses') || '[]');
        const setDel = new Set(Array.isArray(storedDel) ? storedDel : []);
        identifiers.forEach(id => setDel.add(id));
        window.localStorage.setItem('deleted_courses', JSON.stringify(Array.from(setDel)));

        const storedPub = JSON.parse(window.localStorage.getItem('published_courses') || '[]');
        const setPub = new Set(Array.isArray(storedPub) ? storedPub : []);
        identifiers.forEach(id => setPub.add(id));
        window.localStorage.setItem('published_courses', JSON.stringify(Array.from(setPub)));
      } catch (_) {}
    }
    return true;
  }

  archiveCourse(courseIdOrCode: string, altCode?: string) {
    if (!courseIdOrCode && !altCode) return false;
    const clean1 = courseIdOrCode ? String(courseIdOrCode).trim() : '';
    const clean2 = altCode ? String(altCode).trim() : '';
    const identifiers = [clean1, clean2, clean1.toUpperCase(), clean2.toUpperCase()].filter(Boolean);

    const course = this.courses.find(
      c => identifiers.includes(c.id) || (c.code && identifiers.includes(c.code.toUpperCase()))
    );
    if (course) {
      (course as any).isArchived = true;
      (course as any).isPublished = true;
      (course as any).status = 'COMPLETED';
      if (course.code) {
        identifiers.push(course.code);
        identifiers.push(course.code.toUpperCase());
      }
    }

    const sub = this.courseSubmissions.find(
      s =>
        identifiers.includes(s.courseId) ||
        identifiers.includes(s.id) ||
        (s.courseCode && identifiers.includes(s.courseCode.toUpperCase()))
    );
    if (sub) {
      sub.status = 'Published';
      (sub as any).isPublished = true;
      (sub as any).isArchived = true;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = JSON.parse(window.localStorage.getItem('published_courses') || '[]');
        const set = new Set(Array.isArray(stored) ? stored : []);
        identifiers.forEach(id => set.add(id));
        window.localStorage.setItem('published_courses', JSON.stringify(Array.from(set)));
      } catch (_) {}
    }
    return true;
  }

  publishCourseResult(courseId: string, adminName: string) {
    const now = new Date().toISOString();
    const sub = this.courseSubmissions.find(
      s => s.courseId === courseId || s.id === courseId || s.courseCode === courseId
    );
    if (sub) {
      sub.status = 'Published';
      sub.publishedAt = now;
      (sub as any).isPublished = true;
    }

    const course = this.courses.find(c => c.id === courseId || c.code === courseId);
    if (course) {
      (course as any).isPublished = true;
      (course as any).isArchived = true;
      (course as any).status = 'COMPLETED';
    }
    const courseCode = course?.code || sub?.courseCode;

    const courseResults = this.results.filter(
      r => r.courseId === courseId || (courseCode && (r.courseCode === courseCode || r.courseId === courseCode))
    );
    for (const r of courseResults) {
      r.status = 'Published';
      r.publishedAt = now;
      r.approvedBy = r.approvedBy || adminName;

      this.notifications.unshift({
        id: `notif-${Date.now()}-${r.id}`,
        recipientId: r.studentId,
        recipientRole: 'STUDENT',
        title: `Semester ${r.semester} Result Published`,
        message: `Official result for ${r.courseCode} (${r.courseName}) has been published. Grade: ${r.grade}`,
        category: 'Result',
        isRead: false,
        createdAt: now,
        link: '/student/results',
      });
    }

    // Also mark registrations for this course as concluded
    const regList = this.courseRegistrations.filter(
      cr => cr.courseId === courseId || (courseCode && (cr.courseCode === courseCode || cr.courseId === courseCode))
    );
    for (const reg of regList) {
      (reg as any).isCompleted = true;
      (reg as any).resultsPublished = true;
    }

    // Persist to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = JSON.parse(window.localStorage.getItem('published_courses') || '[]');
        const set = new Set(Array.isArray(stored) ? stored : []);
        set.add(String(courseId).trim());
        if (courseCode) {
          set.add(String(courseCode).trim());
          set.add(String(courseCode).trim().toUpperCase());
        }
        window.localStorage.setItem('published_courses', JSON.stringify(Array.from(set)));
      } catch (_) {}
    }

    this.addAuditLog('usr-admin-1', adminName, 'ADMIN', 'COURSE_RESULT_PUBLISHED', 'CourseResultSubmission', courseId, `Published approved class result for ${courseCode || courseId}.`);
    return true;
  }

  approveResults(resultIds: string[], adminName: string) {
    const now = new Date().toISOString();
    for (const id of resultIds) {
      const res = this.results.find(r => r.id === id);
      if (res) {
        res.status = 'Approved';
        res.approvedBy = adminName;
        res.approvedAt = now;
      }
    }
    this.addAuditLog('usr-admin-1', adminName, 'ADMIN', 'RESULTS_APPROVED', 'SemesterResult', resultIds.join(','), `Approved ${resultIds.length} course results.`);
    return true;
  }

  publishResults(resultIds: string[], adminName: string) {
    const now = new Date().toISOString();
    for (const id of resultIds) {
      const res = this.results.find(r => r.id === id);
      if (res && res.status === 'Approved') {
        res.status = 'Published';
        res.publishedAt = now;

        // Notify student
        this.notifications.unshift({
          id: `notif-${Date.now()}-${res.id}`,
          recipientId: res.studentId,
          recipientRole: 'STUDENT',
          title: `Semester ${res.semester} Result Published`,
          message: `Official result for ${res.courseCode} (${res.courseName}) has been published. Grade: ${res.grade}`,
          category: 'Result',
          isRead: false,
          createdAt: now,
          link: '/student/results',
        });
      }
    }
    this.addAuditLog('usr-admin-1', adminName, 'ADMIN', 'RESULTS_PUBLISHED', 'SemesterResult', resultIds.join(','), `Published ${resultIds.length} approved results.`);
    return true;
  }




  // ==========================================
  // STUDENT BLOCKING (CRITICAL BUSINESS RULE)
  // Faculty blocks with mandatory reason.
  // Faculty CANNOT unblock.
  // ONLY Admin can unblock.
  // ==========================================
  getBlockRecords() {
    return this.blockRecords;
  }

  blockStudent(studentRegisterNumber: string, reason: string, blockerName: string, blockerId: string, blockerRole: 'FACULTY' | 'ADMIN') {
    if (!reason || !reason.trim()) {
      throw new Error('A mandatory reason is required to block a student.');
    }

    const student = this.getUserByRegisterNumber(studentRegisterNumber);
    if (!student) {
      throw new Error(`Student with Register Number ${studentRegisterNumber} not found.`);
    }

    if (student.accountStatus === 'BLOCKED') {
      throw new Error(`Student ${studentRegisterNumber} is already blocked.`);
    }

    const prevStatus = student.accountStatus;
    student.accountStatus = 'BLOCKED';

    const blockRecord: BlockRecord = {
      id: `blk-${Date.now()}`,
      appId: generate10DigitId(),
      studentId: student.id,
      registerNumber: student.registerNumber,
      studentName: student.name,
      department: student.department || 'Unknown',
      semester: student.semester || 1,
      status: 'BLOCKED',
      reason: reason.trim(),
      blockedBy: blockerName,
      blockedById: blockerId,
      blockedAt: new Date().toISOString(),
    };

    this.blockRecords.unshift(blockRecord);

    // Audit log
    this.addAuditLog(
      blockerId,
      blockerName,
      blockerRole,
      'STUDENT_BLOCKED',
      'StudentAccount',
      student.id,
      `Blocked student ${student.registerNumber} (${student.name}). Reason: ${reason}`,
      prevStatus,
      'BLOCKED'
    );

    // Notification to student
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: student.id,
      recipientRole: 'STUDENT',
      title: 'Account Blocked Notice',
      message: `Your student portal access and academic services have been restricted. Reason: ${reason}. Please contact the Academic Administration Office.`,
      category: 'System',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return blockRecord;
  }

  unblockStudent(studentRegisterNumber: string, remarks: string, adminName: string, adminId: string, role: string) {
    if (role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Only an Administrator can unblock students.');
    }

    const student = this.getUserByRegisterNumber(studentRegisterNumber);
    if (!student) {
      throw new Error(`Student with Register Number ${studentRegisterNumber} not found.`);
    }

    if (student.accountStatus !== 'BLOCKED') {
      throw new Error(`Student ${studentRegisterNumber} is not currently blocked.`);
    }

    student.accountStatus = 'ACTIVE';

    const record = this.blockRecords.find(b => b.registerNumber.toLowerCase() === studentRegisterNumber.toLowerCase() && !b.unblockedAt);
    if (record) {
      record.unblockedBy = adminName;
      record.unblockedAt = new Date().toISOString();
      record.unblockRemarks = remarks || 'Unblocked by administrator.';
    }

    // Audit log
    this.addAuditLog(
      adminId,
      adminName,
      'ADMIN',
      'STUDENT_UNBLOCKED',
      'StudentAccount',
      student.id,
      `Unblocked student ${student.registerNumber} (${student.name}). Remarks: ${remarks}`,
      'BLOCKED',
      'ACTIVE'
    );

    // Notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientId: student.id,
      recipientRole: 'STUDENT',
      title: 'Account Access Restored',
      message: `Your student account and academic services have been restored by the administration.`,
      category: 'System',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return true;
  }

  // --- Fees, Fee Assignments & Payments ---
  getFeeAssignments() {
    return this.feeAssignments;
  }

  getFeeAssignmentById(id: string | number) {
    const sId = String(id);
    return this.feeAssignments.find(f => f.id === sId || String(f.appId) === sId);
  }

  getStudentFeeAssignments(studentId?: string, feeAssignmentId?: string) {
    return this.studentFeeAssignments.filter(sfa => {
      if (studentId && sfa.studentId !== studentId) return false;
      if (feeAssignmentId && sfa.feeAssignmentId !== feeAssignmentId) return false;
      return true;
    });
  }

  createFeeAssignment(data: {
    feeName: string;
    feeType: string;
    amount: number;
    academicYear: string;
    batch: string;
    programId?: string;
    programName?: string;
    departmentId?: string;
    departmentName?: string;
    semester?: number;
    dueDate: string;
    description: string;
    status?: 'Active' | 'Closed' | 'Inactive';
    createdBy: string;
  }) {
    if (!data.feeName?.trim()) throw new Error('Fee Name is required.');
    if (!data.feeType?.trim()) throw new Error('Fee Type is required.');
    if (!data.amount || Number(data.amount) <= 0) throw new Error('Valid Fee Amount is required.');
    if (!data.academicYear?.trim()) throw new Error('Academic Year is required.');
    if (!data.batch?.trim()) throw new Error('Batch selection is required.');
    if (!data.dueDate?.trim()) throw new Error('Due Date is required.');

    // Duplicate Fee Protection:
    // Warn/prevent if same Fee Type + Batch + Academic Year already exists
    const duplicate = this.feeAssignments.find(
      f =>
        f.status !== 'Inactive' &&
        f.feeType.trim().toLowerCase() === data.feeType.trim().toLowerCase() &&
        f.batch.trim() === data.batch.trim() &&
        f.academicYear.trim() === data.academicYear.trim()
    );

    if (duplicate) {
      throw new Error(
        `DUPLICATE ASSIGNMENT DETECTED: A "${data.feeType}" has already been assigned to Batch "${data.batch}" for Academic Year "${data.academicYear}" (Existing Fee: "${duplicate.feeName}"). Accidental duplicate fee assignments are prevented.`
      );
    }

    const now = new Date().toISOString();
    const feeAssignmentId = `fa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newAssignment: FeeAssignment = {
      id: feeAssignmentId,
      appId: generate10DigitId(),
      feeName: data.feeName.trim(),
      feeType: data.feeType.trim(),
      amount: Number(data.amount),
      academicYear: data.academicYear.trim(),
      batch: data.batch.trim(),
      programId: data.programId || undefined,
      programName: data.programName || undefined,
      departmentId: data.departmentId || undefined,
      departmentName: data.departmentName || undefined,
      semester: data.semester ? Number(data.semester) : undefined,
      dueDate: data.dueDate,
      description: data.description?.trim() || '',
      status: data.status || 'Active',
      createdBy: data.createdBy || 'Admin',
      createdAt: now,
      updatedAt: now,
    };

    this.feeAssignments.unshift(newAssignment);

    // Query strictly eligible students belonging to the target batch
    const eligibleStudents = this.users.filter(u => {
      if (u.role !== 'STUDENT') return false;
      // Strict Batch Matching
      if (!u.batch || u.batch.trim() !== newAssignment.batch.trim()) return false;
      // Optional program filter
      if (data.programName && data.programName !== 'All Programs' && u.program && !u.program.includes(data.programName)) {
        return false;
      }
      // Optional department filter
      if (data.departmentName && data.departmentName !== 'All Departments' && u.department && !u.department.includes(data.departmentName)) {
        return false;
      }
      return true;
    });

    // Auto-associate fee to eligible students in the batch
    for (const student of eligibleStudents) {
      const sfaId = `sfa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sfa: StudentFeeAssignment = {
        id: sfaId,
        appId: generate10DigitId(),
        feeAssignmentId: newAssignment.id,
        studentId: student.id,
        registerNumber: student.registerNumber,
        studentName: student.name,
        feeName: newAssignment.feeName,
        feeType: newAssignment.feeType,
        amount: newAssignment.amount,
        paidAmount: 0,
        status: 'Unpaid',
        dueDate: newAssignment.dueDate,
        assignedAt: now,
        academicYear: newAssignment.academicYear,
      };
      this.studentFeeAssignments.push(sfa);

      // Also create corresponding StudentFee entry so portal views sync seamlessly
      const sf: StudentFee = {
        id: `sf-${sfaId}`,
        appId: generate10DigitId(),
        studentId: student.id,
        registerNumber: student.registerNumber,
        studentName: student.name,
        title: newAssignment.feeName,
        category: newAssignment.feeType,
        feeType: newAssignment.feeType,
        totalAmount: newAssignment.amount,
        paidAmount: 0,
        outstandingAmount: newAssignment.amount,
        dueDate: newAssignment.dueDate,
        status: 'Unpaid',
        academicYear: newAssignment.academicYear,
        feeAssignmentId: newAssignment.id,
      };
      this.studentFees.push(sf);

      // Notification for student
      this.notifications.unshift({
        id: `notif-${Date.now()}-${student.id}`,
        appId: generate10DigitId(),
        recipientId: student.id,
        recipientRole: 'STUDENT',
        title: `Fee Assigned: ${newAssignment.feeName}`,
        message: `${newAssignment.feeType} of INR ${newAssignment.amount.toLocaleString()} has been assigned to your batch (${newAssignment.batch}). Due date: ${newAssignment.dueDate}.`,
        category: 'Fee',
        isRead: false,
        createdAt: now,
        link: '/student/fees',
      });
    }

    this.addAuditLog(
      'usr-admin-1',
      data.createdBy || 'Dr. K. S. Ramanathan',
      'ADMIN',
      'FEE_ASSIGNMENT_CREATED',
      'FeeAssignment',
      newAssignment.id,
      `Created fee "${newAssignment.feeName}" (${newAssignment.feeType}, ₹${newAssignment.amount}) for Batch ${newAssignment.batch}. Assigned to ${eligibleStudents.length} eligible students.`
    );

    return {
      assignment: newAssignment,
      assignedStudentsCount: eligibleStudents.length,
    };
  }

  updateFeeAssignmentStatus(id: string, status: 'Active' | 'Closed' | 'Inactive', adminName: string) {
    const fee = this.feeAssignments.find(f => f.id === id);
    if (!fee) throw new Error('Fee assignment not found.');
    const prev = fee.status;
    fee.status = status;
    fee.updatedAt = new Date().toISOString();

    this.addAuditLog(
      'usr-admin-1',
      adminName,
      'ADMIN',
      'FEE_ASSIGNMENT_STATUS_UPDATED',
      'FeeAssignment',
      fee.id,
      `Updated status for fee assignment "${fee.feeName}" from ${prev} to ${status}.`
    );
    return fee;
  }

  getStudentFees(studentId?: string) {
    if (studentId) return this.studentFees.filter(f => f.studentId === studentId);
    return this.studentFees;
  }
  getPayments(studentId?: string) {
    if (studentId) return this.payments.filter(p => p.studentId === studentId);
    return this.payments;
  }
  getReceipts(studentId?: string) {
    if (studentId) return this.receipts.filter(r => r.studentId === studentId);
    return this.receipts;
  }

  processFeePayment(
    feeId: string,
    amount: number,
    paymentMethod: 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | string
  ) {
    // Search both studentFees and studentFeeAssignments (by id, feeAssignmentId, or 10-digit appId)
    let fee = this.studentFees.find(f => f.id === feeId || f.feeAssignmentId === feeId || (f.appId && String(f.appId) === String(feeId)));
    let sfa = this.studentFeeAssignments.find(a => a.id === feeId || a.feeAssignmentId === feeId || `sf-${a.id}` === feeId || (a.appId && String(a.appId) === String(feeId)));

    if (!fee && sfa) {
      fee = this.studentFees.find(f => f.id === `sf-${sfa!.id}` || f.feeAssignmentId === sfa!.feeAssignmentId);
    }

    if (!fee && !sfa) throw new Error('Fee record not found.');

    const targetStudentId = fee?.studentId || sfa?.studentId || '';
    const student = this.getUserById(targetStudentId);
    if (!student) throw new Error('Student account not found.');

    // Security: Blocked student cannot initiate payment
    if (student.accountStatus === 'BLOCKED') {
      throw new Error('SECURITY VIOLATION: Your student account is BLOCKED. Payment initiation is forbidden.');
    }

    const outstanding = fee ? fee.outstandingAmount : (sfa ? (sfa.amount - sfa.paidAmount) : 0);
    if (amount <= 0 || amount > outstanding) {
      throw new Error('Invalid payment amount. Amount cannot exceed outstanding balance.');
    }

    const now = new Date().toISOString();
    const txnId = `TXN-SVC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rcptNum = `RCPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const feeTitle = fee?.title || sfa?.feeName || 'Academic Fee';
    const feeType = fee?.feeType || sfa?.feeType || fee?.category || 'Tuition Fee';
    const academicYear = fee?.academicYear || sfa?.academicYear || '2024-2025';

    // Update StudentFee
    if (fee) {
      fee.paidAmount += amount;
      fee.outstandingAmount -= amount;
      fee.lastPaymentDate = now;
      if (fee.outstandingAmount === 0) {
        fee.status = 'Paid';
      }
    }

    // Update StudentFeeAssignment
    if (sfa) {
      sfa.paidAmount += amount;
      sfa.paidAt = now;
      if (sfa.paidAmount >= sfa.amount) {
        sfa.status = 'Paid';
      }
    } else if (fee?.feeAssignmentId) {
      const match = this.studentFeeAssignments.find(
        a => a.feeAssignmentId === fee!.feeAssignmentId && a.studentId === student.id
      );
      if (match) {
        match.paidAmount += amount;
        match.paidAt = now;
        if (match.paidAmount >= match.amount) {
          match.status = 'Paid';
        }
      }
    }

    const txn: PaymentTransaction = {
      id: `txn-${Date.now()}`,
      appId: generate10DigitId(),
      transactionId: txnId,
      studentId: student.id,
      registerNumber: student.registerNumber,
      studentName: student.name,
      feeId: fee?.id || sfa?.id || feeId,
      feeTitle,
      feeType,
      amount,
      paymentMethod,
      status: 'Success',
      timestamp: now,
      receiptNumber: rcptNum,
    };
    this.payments.unshift(txn);

    const rcpt: Receipt = {
      id: `rcpt-${Date.now()}`,
      appId: generate10DigitId(),
      receiptNumber: rcptNum,
      transactionId: txnId,
      studentId: student.id,
      studentName: student.name,
      registerNumber: student.registerNumber,
      program: student.program || 'B.Tech CSE',
      department: student.department || 'Computer Science and Engineering',
      semester: student.semester || 1,
      amount,
      paymentMethod,
      date: now,
      feeTitle,
      feeType,
      academicYear,
      paymentStatus: 'Paid',
    };
    this.receipts.unshift(rcpt);

    this.addAuditLog(
      student.id,
      student.name,
      'STUDENT',
      'FEE_PAYMENT_PROCESSED',
      'PaymentTransaction',
      txnId,
      `Paid ${amount} for ${feeTitle} via ${paymentMethod}. Transaction ID: ${txnId}`
    );

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      appId: generate10DigitId(),
      recipientId: student.id,
      recipientRole: 'STUDENT',
      title: 'Fee Payment Successful',
      message: `Your payment of INR ${amount.toLocaleString()} for ${feeTitle} was successfully processed. Receipt ${rcptNum} is generated.`,
      category: 'Fee',
      isRead: false,
      createdAt: now,
      link: '/student/receipts',
    });

    return { transaction: txn, receipt: rcpt };
  }

  // --- Audit Logs ---
  getAuditLogs(filter?: { role?: string; action?: string; entity?: string }) {
    return this.auditLogs.filter(log => {
      if (filter?.role && log.role !== filter.role) return false;
      if (filter?.action && !log.action.toLowerCase().includes(filter.action.toLowerCase())) return false;
      if (filter?.entity && log.entity !== filter.entity) return false;
      return true;
    });
  }

  addAuditLog(
    userId: string,
    userName: string,
    role: any,
    action: string,
    entity: string,
    entityId: string,
    details: string,
    previousState?: string,
    newState?: string
  ) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      appId: generate10DigitId(),
      userId,
      userName,
      role,
      action,
      entity,
      entityId,
      details,
      ipAddress: '192.168.1.' + Math.floor(10 + Math.random() * 80),
      timestamp: new Date().toISOString(),
      previousState,
      newState,
    };
    this.auditLogs.unshift(log);
    return log;
  }

  // --- Notifications ---
  getNotifications(recipientId?: string, role?: string) {
    if (role === 'ADMIN' || (!recipientId && !role)) {
      return this.notifications;
    }
    return this.notifications.filter(n => {
      if (n.recipientRole === 'ALL') return true;
      if (recipientId && n.recipientId === recipientId) return true;
      if (role && n.recipientRole === role) return true;
      return false;
    });
  }
  addNotification(notif: Partial<NotificationItem>) {
    const existing = notif.id ? this.notifications.find(item => item.id === notif.id) : null;
    if (existing) return existing;

    const newNotif: NotificationItem = {
      title: notif.title || '',
      message: notif.message || '',
      category: notif.category || 'System',
      recipientRole: notif.recipientRole || 'ALL',
      recipientId: notif.recipientId,
      link: notif.link,
      ...notif,
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      appId: notif.appId || generate10DigitId(),
      isRead: notif.isRead ?? false,
      createdAt: notif.createdAt || new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }
  markNotificationRead(id: string) {
    const n = this.notifications.find(item => item.id === id);
    if (n) n.isRead = true;
  }
}

// Global Singleton for in-memory database simulation across routes
const globalForDb = globalThis as unknown as { mockDb: DatabaseStore };
if (!globalForDb.mockDb || typeof (globalForDb.mockDb as any).deleteCourse !== 'function') {
  globalForDb.mockDb = new DatabaseStore();
} else {
  Object.setPrototypeOf(globalForDb.mockDb, DatabaseStore.prototype);
}
export const mockDb = globalForDb.mockDb;
if (process.env.NODE_ENV !== 'production') globalForDb.mockDb = mockDb;

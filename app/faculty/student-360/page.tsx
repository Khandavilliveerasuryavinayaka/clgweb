'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ProgressBar } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  GraduationCap, 
  BookOpen, 
  CalendarCheck, 
  Clock, 
  Award, 
  FileText, 
  CheckSquare, 
  CreditCard, 
  ShieldAlert, 
  History, 
  Search,
  Ban,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

function Student360Content() {
  const searchParams = useSearchParams();
  const initialReg = searchParams?.get('reg') || 'REG2024001';

  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [searchReg, setSearchReg] = useState(initialReg);
  const [activeTab, setActiveTab] = useState('overview');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Find student in DB or API
  const [currentStudent, setCurrentStudent] = useState<User | undefined>(() => mockDb.getUserByRegisterNumber(initialReg));

  const fetchStudentData = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // 1. Check local in-memory DB first
    const local = mockDb.getUserByRegisterNumber(trimmed) || mockDb.getUserById(trimmed);
    if (local && local.role === 'STUDENT') {
      setCurrentStudent(local);
      setActiveTab('overview');
      return;
    }

    // 2. Fetch from Supabase backend API
    setIsSearching(true);
    try {
      let res = await fetch(`/api/students?reg=${encodeURIComponent(trimmed)}`);
      let json = await res.json();
      if (!json.success || !json.data) {
        // Try searching by ID
        res = await fetch(`/api/students?id=${encodeURIComponent(trimmed)}`);
        json = await res.json();
      }

      if (json.success && json.data && json.data.role === 'STUDENT') {
        const student: User = json.data;
        mockDb.upsertUser(student);
        setCurrentStudent(student);
        setActiveTab('overview');
      } else {
        toastError(`No student found with Register Number or 10-digit ID "${trimmed}".`);
      }
    } catch (err: any) {
      toastError(err.message || `Error searching for student "${trimmed}".`);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialReg) {
      setSearchReg(initialReg);
      const local = mockDb.getUserByRegisterNumber(initialReg);
      if (local && local.role === 'STUDENT') {
        setCurrentStudent(local);
      } else {
        fetchStudentData(initialReg);
      }
    }
  }, [initialReg]);

  const handleSearchStudent = () => {
    fetchStudentData(searchReg);
  };

  const handleBlockStudent = async (reason?: string) => {
    if (!currentStudent) return;
    if (!reason || !reason.trim()) {
      toastError('A mandatory reason is strictly required to block a student.');
      return;
    }

    setIsBlocking(true);
    try {
      // Sync block state to Supabase database
      try {
        await fetch('/api/student-blocking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registerNumber: currentStudent.registerNumber,
            reason: reason.trim(),
            blockerName: user?.name || 'Prof. Anand Kumar',
            blockerId: user?.id || 'usr-fac-1',
          }),
        });
      } catch (backendErr) {
        console.warn('Backend block sync skipped', backendErr);
      }

      mockDb.blockStudent(
        currentStudent.registerNumber,
        reason,
        user?.name || 'Prof. Anand Kumar',
        user?.id || 'usr-fac-1',
        'FACULTY'
      );
      setIsBlocking(false);
      setBlockDialogOpen(false);
      // Refresh current student
      const refreshed = mockDb.getUserById(currentStudent.id) || { ...currentStudent, accountStatus: 'BLOCKED' as const };
      setCurrentStudent(refreshed);
      success(
        `Student ${currentStudent.registerNumber} has been blocked. Account status updated and audit logged. Note: Faculty cannot unblock.`,
        'Student Account Blocked'
      );
    } catch (err: any) {
      setIsBlocking(false);
      toastError(err.message || 'Failed to block student.');
    }
  };

  const studentId = currentStudent?.id || '';
  const registerNumber = currentStudent?.registerNumber || '';
  const isBlocked = currentStudent?.accountStatus === 'BLOCKED';

  // Sub-data with dual identifier lookup (id and registerNumber)
  const courses = mockDb.getCourseRegistrations().filter(
    r => (studentId && r.studentId === studentId) || (registerNumber && r.registerNumber === registerNumber)
  );
  const attendance = mockDb.getAttendanceSummaries(studentId);
  const ods = mockDb.getODRequests().filter(
    o => (studentId && o.studentId === studentId) || (registerNumber && o.registerNumber === registerNumber)
  );
  const marks = mockDb.getInternalMarks().filter(
    m => (studentId && m.studentId === studentId) || (registerNumber && m.registerNumber === registerNumber)
  );
  const allAssignments = mockDb.getAssignments();
  const assignments = mockDb.getSubmissions().filter(
    s => (studentId && s.studentId === studentId) || (registerNumber && s.registerNumber === registerNumber)
  );
  const results = mockDb.getResults().filter(
    r => (studentId && r.studentId === studentId) || (registerNumber && r.registerNumber === registerNumber)
  );
  const fees = mockDb.getStudentFees().filter(
    f => (studentId && f.studentId === studentId) || (registerNumber && f.registerNumber === registerNumber)
  );
  const blockHistory = mockDb.getBlockRecords().filter(
    b => (studentId && b.studentId === studentId) || (registerNumber && b.studentId === registerNumber)
  );
  const auditLogs = mockDb.getAuditLogs({ entity: 'StudentAccount' }).filter(
    a => (studentId && a.entityId === studentId) || (registerNumber && a.entityId === registerNumber)
  );

  // Derived metrics
  const totalEnrolledCredits = courses
    .filter(c => c.status === 'ACCEPTED' || c.status === 'Approved')
    .reduce((sum, c) => sum + (c.credits || 0), 0);

  const totalEarnedCredits = results
    .filter(r => r.passStatus === 'PASS')
    .reduce((sum, r) => sum + (r.credits || 0), 0);
  const totalPassedCourses = results.filter(r => r.passStatus === 'PASS').length;
  const totalPoints = results.reduce(
    (sum, r) => sum + (r.credits || 0) * (r.gradePoints || 0),
    0
  );
  const totalGradedCredits = results.reduce((sum, r) => sum + (r.credits || 0), 0);
  const calculatedGpa = totalGradedCredits > 0 ? (totalPoints / totalGradedCredits).toFixed(2) : null;

  const totalFeeAmount = fees.reduce((sum, f) => sum + (f.totalAmount || 0), 0);
  const totalFeePaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const totalFeeOutstanding = fees.reduce((sum, f) => sum + (f.outstandingAmount || 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Profile' },
    { id: 'courses', label: 'Courses', count: courses.length },
    { id: 'attendance', label: 'Attendance' },
    { id: 'od', label: 'OD Requests', count: ods.length },
    { id: 'marks', label: 'Internal Marks', count: marks.length },
    { id: 'assignments', label: 'Assignments', count: assignments.length },
    { id: 'results', label: 'Results', count: results.length },
    { id: 'fees', label: 'Fees', count: fees.length },
    { id: 'status', label: 'Account Status' },
    { id: 'audit', label: 'Audit Trail', count: auditLogs.length },
  ];

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        {/* Search Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Student 360° Comprehensive Profile
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Search scholar records by Register Number for end-to-end academic, attendance, and disciplinary oversight.
            </p>
          </div>

          <div className="flex items-center gap-2 max-w-sm w-full">
            <SearchInput
              placeholder="Register Number or Student ID (e.g. 192110028)..."
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchStudent();
              }}
              onClear={() => setSearchReg('')}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={handleSearchStudent}
              isLoading={isSearching}
            >
              Search
            </Button>
          </div>
        </div>

        {!currentStudent ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700">No Student Selected</h4>
            <p className="text-xs text-slate-500">Search with Register Number (REG2024001) or Student ID (1, 2, 3...).</p>
          </div>
        ) : (
          <>
            {/* Student Header Card with Block Status */}
            <Card className="border-slate-200 shadow-card overflow-hidden">
              <div className={`p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 ${
                isBlocked ? 'bg-rose-50/60 border-b border-rose-200' : 'bg-white'
              }`}>
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  <Avatar
                    src={currentStudent.avatarUrl}
                    name={currentStudent.name}
                    registerNumber={currentStudent.registerNumber}
                    size="xl"
                    className="border-2 border-white shadow-md shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-xl font-bold text-navy-900">{currentStudent.name}</h3>
                      <Badge status={currentStudent.accountStatus}>
                        {currentStudent.accountStatus}
                      </Badge>
                    </div>
                    <div className="text-xs font-mono font-bold text-brand-700 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span>{currentStudent.registerNumber}</span>
                      {(currentStudent.studentNumber || currentStudent.appId) && (
                        <span className="text-slate-500 font-normal">
                          • Student ID: <strong className="font-mono text-slate-800">#{currentStudent.studentNumber || currentStudent.appId}</strong>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {currentStudent.program} • {currentStudent.department} (Semester {currentStudent.semester || 6})
                    </div>
                  </div>
                </div>

                {/* Block Action Button */}
                <div className="flex flex-col items-center sm:items-end gap-2">
                  {isBlocked ? (
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs border border-rose-300">
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        <span>ACCOUNT CURRENTLY BLOCKED</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Faculty cannot unblock. Only Administrator can unblock.
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBlockDialogOpen(true)}
                      leftIcon={<Ban className="w-4 h-4" />}
                    >
                      Block Student
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* 11 Tabs */}
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Tab Contents */}
            <div className="pt-2">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="text-xs text-slate-500 font-semibold uppercase">Enrolled Courses</div>
                      <div className="text-2xl font-extrabold text-slate-900 mt-1">{courses.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="text-xs text-slate-500 font-semibold uppercase">OD Requests</div>
                      <div className="text-2xl font-extrabold text-brand-600 mt-1">{ods.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="text-xs text-slate-500 font-semibold uppercase">Account Status</div>
                      <div className="mt-1">
                        <Badge status={currentStudent.accountStatus}>{currentStudent.accountStatus}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="text-xs text-slate-500 font-semibold uppercase">Disciplinary Entries</div>
                      <div className="text-2xl font-extrabold text-rose-600 mt-1">{blockHistory.length}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'profile' && (
                <Card className="border-slate-200">
                  <CardContent className="p-6 space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Full Name:</span>
                      <span className="font-bold text-slate-900">{currentStudent.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Register Number:</span>
                      <span className="font-mono font-bold text-slate-900">{currentStudent.registerNumber}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Institutional Email:</span>
                      <span className="text-slate-900">{currentStudent.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-900">{currentStudent.department}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">Program:</span>
                      <span className="text-slate-900">{currentStudent.program}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'attendance' && (
                <Card className="border-slate-200">
                  <CardContent className="p-0">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500">
                        <tr>
                          <th className="p-4">Course</th>
                          <th className="p-4 text-center">Conducted</th>
                          <th className="p-4 text-center">Present</th>
                          <th className="p-4 text-center">Absent</th>
                          <th className="p-4 text-center">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendance.map((a) => (
                          <tr key={a.courseId}>
                            <td className="p-4 font-bold">{a.courseCode}</td>
                            <td className="p-4 text-center">{a.totalClasses}</td>
                            <td className="p-4 text-center text-emerald-600 font-bold">{a.present}</td>
                            <td className="p-4 text-center text-rose-600 font-bold">{a.absent}</td>
                            <td className="p-4 text-center font-extrabold text-brand-700">{a.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'od' && (
                <Card className="border-slate-200">
                  <CardContent className="p-4 space-y-3">
                    {ods.map((o) => (
                      <div key={o.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{o.eventName}</div>
                          <div className="text-slate-500">{o.reason} ({o.totalDays} Days)</div>
                        </div>
                        <Badge status={o.status}>{o.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'status' && (
                <Card className="border-slate-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge status={currentStudent.accountStatus}>{currentStudent.accountStatus}</Badge>
                      <span className="text-xs text-slate-500">Current Portal Access Status</span>
                    </div>

                    {isBlocked ? (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2 text-rose-900">
                        <div className="font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>Student Account Restriction Details:</span>
                        </div>
                        {blockHistory.length > 0 && (
                          <div className="space-y-1">
                            <div><strong>Reason:</strong> {blockHistory[0].reason}</div>
                            <div><strong>Blocked By:</strong> {blockHistory[0].blockedBy}</div>
                            <div><strong>Date:</strong> {formatDate(blockHistory[0].blockedAt)}</div>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-600 pt-2 border-t border-rose-200">
                          <strong>Note:</strong> Faculty cannot unblock students. Only the Administrator can unblock accounts.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600">
                        This student account is active with full academic portal privileges.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'audit' && (
                <Card className="border-slate-200">
                  <CardContent className="p-4 space-y-3">
                    {auditLogs.length === 0 ? (
                      <div className="text-xs text-slate-400 p-6 text-center">No specific audit records found.</div>
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 font-mono">{log.action}</span>
                            <span className="text-[10px] text-slate-400">{formatDate(log.timestamp)}</span>
                          </div>
                          <p className="text-slate-600">{log.details}</p>
                          <div className="text-[10px] text-slate-400 font-mono">By: {log.userName} ({log.role})</div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Total Courses</div>
                          <div className="text-xl font-extrabold text-slate-900">{courses.length}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Accepted / Enrolled</div>
                          <div className="text-xl font-extrabold text-emerald-700">
                            {courses.filter(c => c.status === 'ACCEPTED' || c.status === 'Approved').length}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Enrolled Credits</div>
                          <div className="text-xl font-extrabold text-purple-700">{totalEnrolledCredits}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {courses.length === 0 ? (
                    <Card className="border-slate-200">
                      <CardContent className="p-12 text-center">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-bold text-slate-700">No Course Registrations</h4>
                        <p className="text-xs text-slate-500 mt-1">This student has not enrolled in any courses for the academic term.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-slate-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                              <tr>
                                <th className="p-3.5 pl-5">Course Code</th>
                                <th className="p-3.5">Course Name</th>
                                <th className="p-3.5 text-center">Semester</th>
                                <th className="p-3.5 text-center">Credits</th>
                                <th className="p-3.5 text-center">Academic Year</th>
                                <th className="p-3.5 text-center">Status</th>
                                <th className="p-3.5 pr-5 text-right">Requested At</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {courses.map((c) => (
                                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">{c.courseCode}</td>
                                  <td className="p-3.5 font-medium text-slate-900">{c.courseName}</td>
                                  <td className="p-3.5 text-center text-slate-600 font-medium">Sem {c.semester}</td>
                                  <td className="p-3.5 text-center font-bold text-slate-700">{c.credits}</td>
                                  <td className="p-3.5 text-center text-slate-600">{c.academicYear}</td>
                                  <td className="p-3.5 text-center">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                        c.status === 'ACCEPTED' || c.status === 'Approved'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : c.status === 'PENDING' || c.status === 'Submitted'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {c.status}
                                    </span>
                                  </td>
                                  <td className="p-3.5 pr-5 text-right text-slate-500">{formatDate(c.requestedAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Total Submissions</div>
                          <div className="text-xl font-extrabold text-slate-900">{assignments.length}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Graded Submissions</div>
                          <div className="text-xl font-extrabold text-emerald-700">
                            {assignments.filter(a => a.status === 'Graded').length}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Pending Evaluation</div>
                          <div className="text-xl font-extrabold text-amber-700">
                            {assignments.filter(a => a.status !== 'Graded').length}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {assignments.length === 0 ? (
                    <Card className="border-slate-200">
                      <CardContent className="p-12 text-center">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-bold text-slate-700">No Assignment Submissions</h4>
                        <p className="text-xs text-slate-500 mt-1">No course assignments have been submitted by this candidate yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-slate-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                              <tr>
                                <th className="p-3.5 pl-5">Assignment / Course</th>
                                <th className="p-3.5">Submission File</th>
                                <th className="p-3.5 text-center">Submission Date</th>
                                <th className="p-3.5 text-center">Score / Marks</th>
                                <th className="p-3.5 text-center">Status</th>
                                <th className="p-3.5 pr-5">Feedback / Comments</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {assignments.map((sub) => {
                                const asg = allAssignments.find(a => a.id === sub.assignmentId);
                                return (
                                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="p-3.5 pl-5">
                                      <div className="font-bold text-slate-900">{asg?.title || 'Course Assignment'}</div>
                                      <div className="text-[11px] text-slate-500 font-mono">
                                        {asg?.courseCode ? `${asg.courseCode} • ${asg.courseName}` : 'Academic Coursework'}
                                      </div>
                                    </td>
                                    <td className="p-3.5">
                                      <div className="font-mono text-slate-800 font-medium flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>{sub.fileName}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400">{sub.fileSize || '3.2 MB'}</div>
                                    </td>
                                    <td className="p-3.5 text-center text-slate-600 font-medium">{formatDate(sub.submittedAt)}</td>
                                    <td className="p-3.5 text-center font-extrabold text-slate-900">
                                      {sub.marksObtained !== undefined ? (
                                        <span className="text-emerald-700 font-bold">
                                          {sub.marksObtained} / {asg?.maxMarks || 20}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic font-normal">Pending Grade</span>
                                      )}
                                    </td>
                                    <td className="p-3.5 text-center">
                                      <span
                                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                          sub.status === 'Graded'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : sub.status === 'Late'
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}
                                      >
                                        {sub.status}
                                      </span>
                                    </td>
                                    <td className="p-3.5 pr-5 text-slate-600 max-w-xs">
                                      {sub.facultyFeedback ? (
                                        <p className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200">
                                          {sub.facultyFeedback}
                                        </p>
                                      ) : sub.comments ? (
                                        <p className="text-[11px] text-slate-500 italic">&ldquo;{sub.comments}&rdquo;</p>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === 'results' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Total Courses</div>
                          <div className="text-xl font-extrabold text-slate-900">{results.length}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Passed Courses</div>
                          <div className="text-xl font-extrabold text-emerald-700">{totalPassedCourses}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Earned Credits</div>
                          <div className="text-xl font-extrabold text-purple-700">{totalEarnedCredits}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">SGPA / GPA</div>
                          <div className="text-xl font-extrabold text-amber-700">{calculatedGpa || 'N/A'}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {results.length === 0 ? (
                    <Card className="border-slate-200">
                      <CardContent className="p-12 text-center">
                        <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-bold text-slate-700">No Semester Results</h4>
                        <p className="text-xs text-slate-500 mt-1">No semester examination records or grades have been logged for this candidate.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-slate-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                              <tr>
                                <th className="p-3.5 pl-5">Course Code</th>
                                <th className="p-3.5">Course Name</th>
                                <th className="p-3.5 text-center">Semester</th>
                                <th className="p-3.5 text-center">Credits</th>
                                <th className="p-3.5 text-center">Internal (50)</th>
                                <th className="p-3.5 text-center">External (50)</th>
                                <th className="p-3.5 text-center">Total (100)</th>
                                <th className="p-3.5 text-center">Grade</th>
                                <th className="p-3.5 text-center">Status</th>
                                <th className="p-3.5 pr-5 text-right">Approval Info</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {results.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">{r.courseCode}</td>
                                  <td className="p-3.5 font-medium text-slate-900">{r.courseName}</td>
                                  <td className="p-3.5 text-center text-slate-600 font-medium">Sem {r.semester}</td>
                                  <td className="p-3.5 text-center font-bold text-slate-700">{r.credits}</td>
                                  <td className="p-3.5 text-center font-semibold text-slate-800">{r.internalMarks}</td>
                                  <td className="p-3.5 text-center font-semibold text-slate-800">{r.externalMarks}</td>
                                  <td className="p-3.5 text-center font-extrabold text-slate-900">{r.totalMarks}</td>
                                  <td className="p-3.5 text-center">
                                    <span className="font-extrabold text-xs text-brand-600 px-2 py-0.5 rounded bg-brand-50 border border-brand-200">
                                      {r.grade}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                        r.passStatus === 'PASS'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {r.passStatus || (r.status === 'Approved' || r.status === 'Published' ? 'PASS' : r.status)}
                                    </span>
                                  </td>
                                  <td className="p-3.5 pr-5 text-right">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                        r.status === 'Published'
                                          ? 'text-purple-700 bg-purple-50 border-purple-200'
                                          : r.status === 'Approved'
                                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                          : 'text-amber-700 bg-amber-50 border-amber-200'
                                      }`}
                                    >
                                      {r.status === 'Published' ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                          Published
                                        </>
                                      ) : r.status === 'Approved' ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          Admin Approved
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3 text-amber-600" />
                                          {r.status}
                                        </>
                                      )}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Internal Marks Tab */}
              {activeTab === 'marks' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Evaluated Courses</div>
                          <div className="text-xl font-extrabold text-slate-900">{marks.length}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Average Internal Score</div>
                          <div className="text-xl font-extrabold text-emerald-700">
                            {marks.length > 0
                              ? `${(marks.reduce((s, m) => s + (m.total || 0), 0) / marks.length).toFixed(1)} / 50`
                              : 'N/A'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {marks.length === 0 ? (
                    <Card className="border-slate-200">
                      <CardContent className="p-12 text-center">
                        <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-bold text-slate-700">No Internal Marks Found</h4>
                        <p className="text-xs text-slate-500 mt-1">Continuous Internal Assessment (CIA) marks have not been uploaded for this candidate.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-slate-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                              <tr>
                                <th className="p-3.5 pl-5">Course Code</th>
                                <th className="p-3.5">Course Name</th>
                                <th className="p-3.5 text-center">CIA 1 (20)</th>
                                <th className="p-3.5 text-center">CIA 2 (20)</th>
                                <th className="p-3.5 text-center">Assignment (10)</th>
                                <th className="p-3.5 text-center">Total (50)</th>
                                <th className="p-3.5 pr-5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {marks.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">{m.courseCode}</td>
                                  <td className="p-3.5 font-medium text-slate-900">{m.courseName}</td>
                                  <td className="p-3.5 text-center font-semibold text-slate-800">{m.cia1}</td>
                                  <td className="p-3.5 text-center font-semibold text-slate-800">{m.cia2}</td>
                                  <td className="p-3.5 text-center font-semibold text-slate-800">{m.assignment}</td>
                                  <td className="p-3.5 text-center font-extrabold text-brand-700 text-sm">{m.total}</td>
                                  <td className="p-3.5 pr-5 text-right">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                        m.status === 'Submitted'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}
                                    >
                                      {m.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Fees Tab */}
              {activeTab === 'fees' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Total Invoiced</div>
                          <div className="text-xl font-extrabold text-slate-900">{formatCurrency(totalFeeAmount)}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Total Paid</div>
                          <div className="text-xl font-extrabold text-emerald-700">{formatCurrency(totalFeePaid)}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 font-semibold uppercase">Outstanding Balance</div>
                          <div className="text-xl font-extrabold text-rose-700">{formatCurrency(totalFeeOutstanding)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {fees.length === 0 ? (
                    <Card className="border-slate-200">
                      <CardContent className="p-12 text-center">
                        <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="font-bold text-slate-700">No Fee Invoices Found</h4>
                        <p className="text-xs text-slate-500 mt-1">No fee bills or outstanding balances have been assigned to this student.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-slate-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                              <tr>
                                <th className="p-3.5 pl-5">Fee Description</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5 text-center">Academic Year</th>
                                <th className="p-3.5 text-center">Total Amount</th>
                                <th className="p-3.5 text-center">Paid Amount</th>
                                <th className="p-3.5 text-center">Outstanding</th>
                                <th className="p-3.5 text-center">Due Date</th>
                                <th className="p-3.5 pr-5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {fees.map((f) => (
                                <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="p-3.5 pl-5 font-bold text-slate-900">{f.title}</td>
                                  <td className="p-3.5 text-slate-600">{f.category || f.feeType || 'Tuition'}</td>
                                  <td className="p-3.5 text-center text-slate-600">{f.academicYear}</td>
                                  <td className="p-3.5 text-center font-bold text-slate-800">{formatCurrency(f.totalAmount)}</td>
                                  <td className="p-3.5 text-center font-semibold text-emerald-700">{formatCurrency(f.paidAmount)}</td>
                                  <td className="p-3.5 text-center font-bold text-rose-700">{formatCurrency(f.outstandingAmount)}</td>
                                  <td className="p-3.5 text-center text-slate-500">{formatDate(f.dueDate)}</td>
                                  <td className="p-3.5 pr-5 text-right">
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                        f.status === 'Paid' || f.status === 'Completed' || f.outstandingAmount === 0
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}
                                    >
                                      {f.outstandingAmount === 0 ? 'Paid' : f.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Block Student Confirm Dialog with Mandatory Reason */}
        <ConfirmDialog
          isOpen={blockDialogOpen}
          onClose={() => setBlockDialogOpen(false)}
          onConfirm={handleBlockStudent}
          title={`Block Student Account: ${currentStudent?.registerNumber}`}
          message={`Are you sure you want to block ${currentStudent?.name} (${currentStudent?.registerNumber})? This will immediately suspend their student portal login and restrict academic operations. A mandatory reason is required and will be logged in the immutable audit registry.`}
          confirmText="Confirm & Block Student"
          variant="destructive"
          isLoading={isBlocking}
          requireReason={true}
          reasonPlaceholder="Enter mandatory disciplinary or academic violation reason..."
        />
      </div>
    </PortalLayout>
  );
}

export default function Student360Page() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Student 360...</div>}>
      <Student360Content />
    </React.Suspense>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  CalendarCheck, 
  Award, 
  CreditCard,
  ShieldAlert,
  Users,
  BookOpen
} from 'lucide-react';

export default function AdminReportsPage() {
  const { success } = useToast();

  const [reportType, setReportType] = useState('attendance');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [students, setStudents] = useState<any[]>(() => mockDb.getUsers().filter(u => u.role === 'STUDENT'));

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStudents(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const blocked = mockDb.getBlockRecords();
  const fees = mockDb.getStudentFees();
  const results = mockDb.getResults();
  const courses = mockDb.getCourses();
  const registrations = mockDb.getCourseRegistrations();

  // Department name resolver
  const matchesDept = (deptName?: string) => {
    if (departmentFilter === 'ALL') return true;
    if (!deptName) return false;
    const lower = deptName.toLowerCase();
    if (departmentFilter === 'CSE' && (lower.includes('computer') || lower.includes('cse'))) return true;
    if (departmentFilter === 'ECE' && (lower.includes('electronics') || lower.includes('ece'))) return true;
    if (departmentFilter === 'MECH' && (lower.includes('mech') || lower.includes('mechanical'))) return true;
    return false;
  };

  const filteredStudents = useMemo(() => students.filter(s => matchesDept(s.department)), [students, departmentFilter]);
  const filteredBlocked = useMemo(() => blocked.filter(b => matchesDept(b.department)), [blocked, departmentFilter]);
  const filteredCourses = useMemo(() => courses.filter(c => matchesDept(c.departmentName)), [courses, departmentFilter]);

  // Attendance metrics
  const attendanceDepts = useMemo(() => {
    const depts = [
      { code: 'CSE', name: 'Computer Science and Engineering', conducted: 450, avg: 89.4, below75: 4 },
      { code: 'ECE', name: 'Electronics and Communication', conducted: 420, avg: 88.1, below75: 6 },
      { code: 'MECH', name: 'Mechanical Engineering', conducted: 400, avg: 86.5, below75: 5 },
    ];
    return depts.filter(d => departmentFilter === 'ALL' || d.code === departmentFilter);
  }, [departmentFilter]);

  // Fee metrics
  const feeMetrics = useMemo(() => {
    const multiplier = departmentFilter === 'ALL' ? 1 : departmentFilter === 'CSE' ? 0.45 : departmentFilter === 'ECE' ? 0.35 : 0.20;
    const invoiced = Math.round(24500000 * multiplier);
    const realized = Math.round(20500000 * multiplier);
    const dues = invoiced - realized;
    return { invoiced, realized, dues };
  }, [departmentFilter]);

  // CSV Export
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `${reportType}_report.csv`;

    if (reportType === 'attendance') {
      rows.push(['Department', 'Conducted Hours', 'Avg Attendance %', 'Below 75% Cutoff Count']);
      attendanceDepts.forEach(d => {
        rows.push([d.name, String(d.conducted), `${d.avg}%`, String(d.below75)]);
      });
    } else if (reportType === 'results') {
      rows.push(['Student Name', 'Register Number', 'Course Code', 'Total Marks', 'Grade', 'Status']);
      results.forEach(r => {
        rows.push([r.studentName || '', r.registerNumber || '', r.courseCode, String(r.totalMarks), r.grade, r.status]);
      });
    } else if (reportType === 'fees') {
      rows.push(['Metric', 'Amount (INR)']);
      rows.push(['Total Invoiced Demand', String(feeMetrics.invoiced)]);
      rows.push(['Realized Revenue', String(feeMetrics.realized)]);
      rows.push(['Outstanding Collectibles', String(feeMetrics.dues)]);
    } else if (reportType === 'blocked') {
      rows.push(['Student Name', 'Register Number', 'Department', 'Reason', 'Blocked By', 'Date']);
      filteredBlocked.forEach(b => {
        rows.push([b.studentName, b.registerNumber, b.department || '', b.reason, b.blockedBy, b.blockedAt]);
      });
    } else if (reportType === 'enrollment') {
      rows.push(['Course Code', 'Course Name', 'Department', 'Enrolled Students', 'Capacity', 'Fill Ratio']);
      filteredCourses.forEach(c => {
        const fillRatio = Math.round((c.enrolledStudents / (c.maxStudents || 60)) * 100);
        rows.push([c.code, c.name, c.departmentName, String(c.enrolledStudents), String(c.maxStudents || 60), `${fillRatio}%`]);
      });
    }

    const csvContent = rows.map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success(`Generated and exported ${reportType.toUpperCase()} report as CSV file.`, 'Report Exported');
  };

  const handleExportPDF = () => {
    window.print();
    success(`Printing / PDF export dialog initiated for ${reportType.toUpperCase()} report.`, 'Report Export');
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Institutional Reports & Analytics Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Multi-dimensional academic reporting across enrollment, attendance compliance, pass percentages, and collections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportPDF}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Generate PDF Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-slate-200 shadow-card">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Report Domain"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                options={[
                  { label: 'Attendance & Compliance Report', value: 'attendance' },
                  { label: 'Academic Results & Grade Distribution', value: 'results' },
                  { label: 'Fee Revenue & Dues Reconciliation', value: 'fees' },
                  { label: 'Student Disciplinary & Blocked Registry', value: 'blocked' },
                  { label: 'Course Enrollment Demographics', value: 'enrollment' },
                ]}
              />

              <Select
                label="Department Scope"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                options={[
                  { label: 'All Departments (Institutional)', value: 'ALL' },
                  { label: 'Computer Science and Engineering', value: 'CSE' },
                  { label: 'Electronics and Communication', value: 'ECE' },
                  { label: 'Mechanical Engineering', value: 'MECH' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Report Preview Canvas */}
        {reportType === 'attendance' && (
          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Attendance Compliance Overview</CardTitle>
              <Badge status="Active">88.6% Campus Average</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-center">Conducted Hours</th>
                    <th className="p-4 text-center">Avg Attendance %</th>
                    <th className="p-4 text-right">Below 75% Cutoff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceDepts.map((d) => (
                    <tr key={d.code}>
                      <td className="p-4 font-bold">{d.name}</td>
                      <td className="p-4 text-center">{d.conducted} Hours</td>
                      <td className="p-4 text-center font-bold text-emerald-600">{d.avg}%</td>
                      <td className="p-4 text-right font-bold text-rose-600">{d.below75} Students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {reportType === 'results' && (
          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Examinations & Grade Distribution</CardTitle>
              <Badge status="Published">96.8% Pass Rate</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-2xl font-extrabold text-brand-700">O Grade</div>
                  <div className="text-xs text-slate-500 mt-1">18% of cohort (90–100)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-2xl font-extrabold text-brand-600">A+ Grade</div>
                  <div className="text-xs text-slate-500 mt-1">42% of cohort (80–89)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-2xl font-extrabold text-slate-800">A Grade</div>
                  <div className="text-xs text-slate-500 mt-1">32% of cohort (70–79)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-2xl font-extrabold text-rose-600">RA (Arrear)</div>
                  <div className="text-xs text-slate-500 mt-1">3.2% of cohort (&lt;50)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === 'fees' && (
          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Fee Revenue Summary</CardTitle>
              <Badge status="Active">Current Fiscal Year</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Total Invoiced Demand</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{formatCurrency(feeMetrics.invoiced)}</div>
                </div>
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-emerald-800 font-semibold uppercase">Realized Revenue</div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">{formatCurrency(feeMetrics.realized)}</div>
                </div>
                <div className="p-5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-xs text-rose-800 font-semibold uppercase">Outstanding Collectibles</div>
                  <div className="text-2xl font-extrabold text-rose-700 mt-1">{formatCurrency(feeMetrics.dues)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === 'blocked' && (
          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Disciplinary Block Registry Report</CardTitle>
              <Badge status="Blocked">{filteredBlocked.length} Cases Logged</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Violation Details</th>
                    <th className="p-4">Blocked By</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBlocked.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No blocked student records found for the selected department.
                      </td>
                    </tr>
                  ) : (
                    filteredBlocked.map((b) => (
                      <tr key={b.id}>
                        <td className="p-4 font-bold">{b.studentName}</td>
                        <td className="p-4 font-mono font-bold text-rose-700">{b.registerNumber}</td>
                        <td className="p-4 text-slate-600">{b.department || 'Computer Science'}</td>
                        <td className="p-4">{b.reason}</td>
                        <td className="p-4 font-medium">{b.blockedBy}</td>
                        <td className="p-4 text-slate-500">{b.blockedAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {reportType === 'enrollment' && (
          <Card className="border-slate-200 shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Course Enrollment Demographics</CardTitle>
              <Badge status="Active">{filteredCourses.length} Active Modules</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="p-4">Course Code & Name</th>
                      <th className="p-4">Department</th>
                      <th className="p-4 text-center">Credits</th>
                      <th className="p-4 text-center">Enrolled</th>
                      <th className="p-4 text-center">Capacity</th>
                      <th className="p-4 text-right">Fill Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No courses found for the selected department.
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((c) => {
                        const maxCap = c.maxStudents || 60;
                        const fillPercent = Math.min(100, Math.round((c.enrolledStudents / maxCap) * 100));
                        return (
                          <tr key={c.id}>
                            <td className="p-4">
                              <span className="font-mono font-bold text-brand-700">{c.code}</span>
                              <div className="font-semibold text-slate-900">{c.name}</div>
                            </td>
                            <td className="p-4 text-slate-600">{c.departmentName}</td>
                            <td className="p-4 text-center font-semibold">{c.credits} Cr</td>
                            <td className="p-4 text-center font-bold text-navy-900">{c.enrolledStudents}</td>
                            <td className="p-4 text-center text-slate-500">{maxCap}</td>
                            <td className="p-4 text-right">
                              <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                                fillPercent >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {fillPercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}

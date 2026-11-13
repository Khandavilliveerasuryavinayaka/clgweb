'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Users, 
  FileCheck, 
  CreditCard,
  Lock,
  Sparkles,
  BookOpen,
  Send,
  Eye,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface WorkflowItem {
  id: string;
  title: string;
  category: 'Academics' | 'Governance' | 'Lifecycle';
  description: string;
  actors: string[];
  steps: {
    number: number;
    title: string;
    actor: string;
    description: string;
    status: string;
  }[];
  criticalRule: string;
}

const workflows: WorkflowItem[] = [
  {
    id: 'wf-results',
    title: 'Results Approval & Publishing Lifecycle',
    category: 'Governance',
    description: 'Faculty members submit end-semester marks. Results MUST be vetted and approved by Admin, then published before students can view them.',
    actors: ['Faculty', 'Admin', 'Student'],
    criticalRule: 'Students must NEVER see unapproved or draft results. Faculty cannot directly publish results.',
    steps: [
      { number: 1, title: 'Faculty Enters Grades', actor: 'Faculty', description: 'Faculty compiles internal + external scores and saves as Draft.', status: 'Draft' },
      { number: 2, title: 'Submit to Admin', actor: 'Faculty', description: 'Faculty submits finalized marks batch to Academic Administration.', status: 'Submitted' },
      { number: 3, title: 'Admin Review & Moderation', actor: 'Admin', description: 'Admin reviews grade distributions, anomalies, and moderation standards.', status: 'Pending Review' },
      { number: 4, title: 'Admin Approves Marks', actor: 'Admin', description: 'Admin formally approves the results batch for institutional records.', status: 'Approved' },
      { number: 5, title: 'Admin Publishes Results', actor: 'Admin', description: 'Admin clicks Publish. Results become visible on the Student Portal with audit logging.', status: 'Published' },
      { number: 6, title: 'Student Views Grade Card', actor: 'Student', description: 'Student logs in and accesses the published semester mark sheet with GPA calculation.', status: 'Completed' },
    ],
  },
  {
    id: 'wf-blocking',
    title: 'Student Blocking & Unblocking Safeguard',
    category: 'Governance',
    description: 'Disciplined account safeguard allowing authorized faculty to block students with mandatory reason. Only Admin can unblock.',
    actors: ['Faculty', 'Admin', 'Blocked Student'],
    criticalRule: 'Faculty CANNOT unblock. Every block and unblock action generates an immutable audit record and locks protected academic APIs.',
    steps: [
      { number: 1, title: 'Faculty Searches Register Number', actor: 'Faculty', description: 'Faculty navigates to Student 360 and searches student by Register Number.', status: 'Active' },
      { number: 2, title: 'Faculty Enters Mandatory Reason', actor: 'Faculty', description: 'Faculty clicks Block Student and enters mandatory disciplinary reason.', status: 'Submitted' },
      { number: 3, title: 'Immediate Portal Lockout', actor: 'System', description: 'Student account status becomes BLOCKED. Protected APIs reject student calls.', status: 'Blocked' },
      { number: 4, title: 'Dedicated Blocked Screen', actor: 'Student', description: 'Student login attempts route to /blocked with institutional instructions.', status: 'Blocked' },
      { number: 5, title: 'Admin Audit & Appeal Review', actor: 'Admin', description: 'Admin inspects Blocked Students registry, reviewing blocking faculty and reason.', status: 'Pending Review' },
      { number: 6, title: 'Admin Unblocks Student', actor: 'Admin', description: 'Admin provides resolution remarks and unblocks student. Full audit trail recorded.', status: 'Approved' },
    ],
  },
  {
    id: 'wf-registration',
    title: 'Course Registration & Enrollment Period',
    category: 'Academics',
    description: 'Students choose semester electives and core courses strictly within an active administrative registration period.',
    actors: ['Admin', 'Student', 'Faculty'],
    criticalRule: 'Course registration is only allowable while the administration window is active.',
    steps: [
      { number: 1, title: 'Admin Launches Registration Window', actor: 'Admin', description: 'Sets academic term, eligible programs, start and closing dates.', status: 'Active' },
      { number: 2, title: 'Student Explores Courses', actor: 'Student', description: 'Student browses available courses, credits, and syllabus details.', status: 'Available' },
      { number: 3, title: 'Student Submits Course Selection', actor: 'Student', description: 'Selects electives, verifies credit cap, and confirms registration submission.', status: 'Submitted' },
      { number: 4, title: 'Faculty / Advisor Review', actor: 'Faculty', description: 'Faculty academic advisor checks prerequisite eligibility and approves registration.', status: 'Approved' },
      { number: 5, title: 'Enrolled in Class Roster', actor: 'System', description: 'Student is added to course attendance sheet and grading roster.', status: 'Completed' },
    ],
  },
  {
    id: 'wf-attendance',
    title: 'Daily Attendance Marking & Blocked Safeguard',
    category: 'Academics',
    description: 'Faculty marks course attendance period-wise. Blocked students are disabled with BLOCKED badges.',
    actors: ['Faculty', 'System', 'Student'],
    criticalRule: 'Attendance input is completely disabled for blocked students to prevent unauthorized record creation.',
    steps: [
      { number: 1, title: 'Faculty Selects Course & Period', actor: 'Faculty', description: 'Picks course code, class date, and period from teaching schedule.', status: 'Draft' },
      { number: 2, title: 'Roster Loaded with Block Check', actor: 'System', description: 'Student roster is loaded. Active students are selectable; blocked students are flagged.', status: 'Active' },
      { number: 3, title: 'Bulk or Individual Marking', actor: 'Faculty', description: 'Faculty marks Present / Absent with 1-click bulk toggles.', status: 'Submitted' },
      { number: 4, title: 'Reconciles with OD Approvals', actor: 'System', description: 'Approved On-Duty records automatically adjust official percentage.', status: 'Completed' },
    ],
  },
  {
    id: 'wf-od',
    title: 'On-Duty (OD) Request & Verification',
    category: 'Lifecycle',
    description: 'Students submit OD requests with supporting documentation for technical hackathons or paper presentations.',
    actors: ['Student', 'Faculty'],
    criticalRule: 'Supporting invitation proof is mandatory; faculty approval is required to count toward attendance.',
    steps: [
      { number: 1, title: 'Student Creates OD Application', actor: 'Student', description: 'Enters date range, event name, justification, and uploads document.', status: 'Submitted' },
      { number: 2, title: 'Faculty Notification', actor: 'System', description: 'Assigned course faculty receives pending OD notification on dashboard.', status: 'Pending Review' },
      { number: 3, title: 'Faculty Review & Confirmation', actor: 'Faculty', description: 'Faculty verifies event authenticity and approves or rejects with remarks.', status: 'Approved' },
      { number: 4, title: 'Attendance Adjusted', actor: 'System', description: 'Classes on approved OD dates are marked OD in student attendance records.', status: 'Completed' },
    ],
  },
  {
    id: 'wf-fees',
    title: 'Fee Invoicing, Payment & Official Receipts',
    category: 'Governance',
    description: 'Fee structures configured by Admin, paid by student via payment abstraction, with instant official receipt generation.',
    actors: ['Admin', 'Student', 'System'],
    criticalRule: 'Never store raw payment card data; generate immutable receipt numbers and transaction logs.',
    steps: [
      { number: 1, title: 'Admin Configures Fee Structures', actor: 'Admin', description: 'Assigns tuition, hostel, and exam fees to programs and batches.', status: 'Active' },
      { number: 2, title: 'Student Reviews Fee Breakdown', actor: 'Student', description: 'Views total fees, paid amount, outstanding dues, and due dates.', status: 'Pending' },
      { number: 3, title: 'Payment Gateway Integration', actor: 'Student', description: 'Student initiates payment via UPI, Credit Card, or Net Banking simulator.', status: 'Submitted' },
      { number: 4, title: 'Transaction Recorded & Receipt Generated', actor: 'System', description: 'Creates unique TXN ID, updates outstanding balance, and generates printable PDF receipt.', status: 'Completed' },
    ],
  },
];

export default function WorkflowsPage() {
  const [selectedWf, setSelectedWf] = useState<WorkflowItem>(workflows[0]);

  return (
    <PublicLayout>
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Architectural Demonstration</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Enterprise Academic Workflows</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Detailed interactive breakdown of the strict multi-role governance rules, lifecycle states, and security checks powering SV College Portal.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar Workflow List */}
            <div className="lg:col-span-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
                Select Lifecycle Workflow
              </h3>
              {workflows.map((wf) => {
                const isSelected = wf.id === selectedWf.id;
                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWf(wf)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-brand-50/80 border-brand-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{wf.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {wf.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                      Actors: {wf.actors.join(' → ')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Interactive Workflow Card */}
            <div className="lg:col-span-8">
              <Card className="border-slate-200 shadow-card">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge status="Active">{selectedWf.category}</Badge>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <span>Participating Actors:</span>
                        {selectedWf.actors.map((actor, idx) => (
                          <span key={idx} className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {actor}
                          </span>
                        ))}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-navy-900">{selectedWf.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {selectedWf.description}
                    </p>
                  </div>

                  {/* Critical Business Rule Callout */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Enforced Business Rule
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed font-medium">
                        {selectedWf.criticalRule}
                      </p>
                    </div>
                  </div>

                  {/* Visual Step-by-Step Flow */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Sequential Flow Stages
                    </h4>

                    <div className="relative border-l-2 border-brand-200 ml-4 pl-6 space-y-6">
                      {selectedWf.steps.map((step) => (
                        <div key={step.number} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white">
                            {step.number}
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-900">{step.title}</span>
                              <Badge status={step.status}>{step.status}</Badge>
                            </div>
                            <div className="text-[11px] font-semibold text-brand-600">
                              Actor: {step.actor}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Action Test Link */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Test this workflow using the Persona Switcher at the bottom-left.
                    </div>
                    <Link href="/login">
                      <Button size="sm" variant="primary">
                        Go to Login & Test
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

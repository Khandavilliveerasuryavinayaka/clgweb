'use client';

import React from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  Users, 
  Award, 
  Calendar, 
  Bell, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  Building2,
  Cpu,
  Compass
} from 'lucide-react';
import { initialDepartments, initialPrograms } from '@/lib/data/mockDatabase';

export default function HomePage() {
  return (
    <PublicLayout>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-slate-900 text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Subtle geometric background accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-400/30 text-brand-300 text-xs font-semibold backdrop-blur">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Admissions Open for Academic Year 2025–26</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance leading-tight">
                Shaping the Next Generation of <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-indigo-300">Engineers & Innovators</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                SV College provides premier engineering and technology education, combining rigorous academic theory with cutting-edge industry research, interdisciplinary laboratories, and integrated digital campus governance.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link href="/admissions">
                  <Button size="lg" className="bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-lg shadow-brand-500/25">
                    Apply for Admission
                  </Button>
                </Link>

                <Link href="/login">
                  <Button size="lg" variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white">
                    <span>Portal Login</span>
                  </Button>
                </Link>
              </div>

              {/* Key Institutional Statistics */}
              <div className="pt-8 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">5+</div>
                  <div className="text-xs text-slate-400 mt-0.5">Specialized Depts</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">160+</div>
                  <div className="text-xs text-slate-400 mt-0.5">Faculty Scholars</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">18+</div>
                  <div className="text-xs text-slate-400 mt-0.5">Advanced Labs</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-400">100%</div>
                  <div className="text-xs text-slate-400 mt-0.5">Digital Campus System</div>
                </div>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-navy-900/60 p-2">
                <img
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800"
                  alt="SV College Modern Academic Campus"
                  className="rounded-xl object-cover w-full h-[380px] brightness-90 contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-navy-900/90 backdrop-blur border border-slate-700 text-white shadow-elevated">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-brand-600/30 text-brand-400 border border-brand-500/30">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Premier Academic Infrastructure</h4>
                      <p className="text-xs text-slate-300">Smart classrooms, high-throughput compute clusters, and central digital library.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Notices & Announcements Ticker */}
      <section className="bg-brand-50/60 border-y border-brand-100 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="p-1 rounded-md bg-brand-600 text-white">
              <Bell className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-900">Latest Circular:</span>
          </div>
          <div className="truncate text-xs sm:text-sm text-slate-700 font-medium">
            Spring 2025 Semester Course Registration is currently active until Feb 15. Students are advised to submit selections.
          </div>
          <Link href="/notices" className="shrink-0 text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 3. Academic Programs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge status="Active" className="mb-2">Degrees & Curricula</Badge>
              <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">
                Academic Programs & Specializations
              </h2>
              <p className="text-slate-600 text-sm mt-2 max-w-xl">
                Accredited undergraduate and postgraduate degree programs designed to develop industry-ready analytical and engineering problem solvers.
              </p>
            </div>
            <Link href="/programs" className="mt-4 md:mt-0">
              <Button variant="outline" size="sm">
                View All Programs
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {initialPrograms.map((prog) => (
              <Card key={prog.id} className="hover:shadow-elevated transition-shadow flex flex-col justify-between border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                      {prog.degree}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{prog.durationYears} Years</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {prog.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {prog.description}
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <div><strong>Department:</strong> {prog.departmentName}</div>
                    <div><strong>Total Credits:</strong> {prog.creditsRequired} Credits</div>
                  </div>
                </CardContent>
                <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between">
                  <Link href={`/programs`} className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                    <span>Curriculum Details</span>
                  </Link>
                  <Link href={`/admissions`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">Apply</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Departments Grid */}
      <section className="py-20 bg-surface-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge status="Approved" className="mb-2">Centres of Excellence</Badge>
            <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">Academic Departments</h2>
            <p className="text-slate-600 text-sm mt-2">
              Each department is equipped with state-of-the-art computational facilities, expert faculty scholars, and specialized research laboratories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {initialDepartments.slice(0, 3).map((dept) => (
              <div key={dept.id} className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col">
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={dept.image}
                    alt={dept.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-slate-800 shadow-sm">
                    {dept.code}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{dept.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{dept.description}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Head of Dept:</span>
                      <span className="font-medium text-slate-800">{dept.hodName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Faculty Mentors:</span>
                      <span className="font-medium text-slate-800">{dept.facultyCount} Professors</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/departments">
              <Button variant="secondary" size="md">
                View All Departments
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Institutional Features / Platform Pillars */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge status="Active">Digital Campus Infrastructure</Badge>
              <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight leading-snug">
                Transparent Governance Through Unified Campus Portal
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                SV College operates on an integrated role-based College Management System. From verified course registrations and continuous internal assessments to tamper-proof result approval cycles and automated fee reconciliation.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Protected Academic Results Pipeline</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Faculty submits drafts $\rightarrow$ Admin verifies $\rightarrow$ Admin approves $\rightarrow$ Admin publishes. Students only access published results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Disciplined Student Safeguards & Blocking</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Authorized faculty can block violating students with mandatory reason. Blocked accounts lose academic privileges. Only Admins can unblock with an immutable audit log.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-2 rounded-lg bg-brand-100 text-brand-700 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">On-Duty (OD) & Attendance Reconciliation</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Verified symposium & hackathon participation automatically adjusts official attendance percentages subject to faculty sign-off.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-navy-900 to-slate-900 text-white shadow-2xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-400 font-mono ml-2">portal.svcollege.edu</span>
                  </div>
                  <Badge status="Active">Role Guard Active</Badge>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-600/30 text-brand-400 flex items-center justify-center font-bold text-xs">
                        STU
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">Student Portal Experience</div>
                        <div className="text-[11px] text-slate-400">14 Academic Modules • Fee Payments • Published Results</div>
                      </div>
                    </div>
                    <Link href="/student">
                      <Button size="sm" variant="secondary" className="h-7 text-xs">Access</Button>
                    </Link>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                        FAC
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">Faculty Academic Suite</div>
                        <div className="text-[11px] text-slate-400">Attendance • OD Review • Mark Entry • Student 360</div>
                      </div>
                    </div>
                    <Link href="/faculty">
                      <Button size="sm" variant="secondary" className="h-7 text-xs">Access</Button>
                    </Link>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold text-xs">
                        ADM
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-white">Central Admin Controller</div>
                        <div className="text-[11px] text-slate-400">Result Approval • Unblocking • Audit Logs • Financials</div>
                      </div>
                    </div>
                    <Link href="/admin">
                      <Button size="sm" variant="secondary" className="h-7 text-xs">Access</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Admissions CTA Section */}
      <section className="bg-brand-900 text-white py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Begin Your Journey at SV College
            </h3>
            <p className="text-brand-100 text-sm leading-relaxed">
              Applications are reviewed on a rolling basis. Inquire today for program details, merit scholarships, campus tours, and hostel facilities.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admissions">
              <Button size="lg" className="bg-white text-brand-900 hover:bg-slate-100 font-bold shadow-lg">
                Apply for 2025 Admissions
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" className="bg-white text-brand-900 hover:bg-slate-100 font-bold shadow-lg">
                Contact Admissions Desk
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { initialPrograms, initialCourses } from '@/lib/data/mockDatabase';
import { formatCurrency } from '@/lib/utils';
import { 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  CreditCard,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function ProgramsPage() {
  const [filterDegree, setFilterDegree] = useState<string>('ALL');

  const filtered = initialPrograms.filter((p) => {
    if (filterDegree === 'ALL') return true;
    return p.degree === filterDegree;
  });

  return (
    <PublicLayout>
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Degree Offerings</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Academic Programs</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Rigorous degree tracks engineered to provide strong theoretical fundamentals, industrial project exposure, and interdisciplinary competence.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Degree Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              {['ALL', 'B.Tech', 'M.Tech', 'MBA'].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setFilterDegree(deg)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filterDegree === deg
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {deg === 'ALL' ? 'All Degrees' : deg}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filtered.length} of {initialPrograms.length} Accredited Programs
            </div>
          </div>

          {/* Programs Grid */}
          <div className="space-y-8">
            {filtered.map((prog, idx) => (
              <Card key={prog.id} className="border-slate-200 shadow-card hover:shadow-elevated transition-all overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-bold text-xs border border-brand-200">
                          {prog.degree} Degree
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Program Code: {prog.code} - {prog.programNumber ?? idx + 1}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-navy-900">
                        {prog.name}
                      </h2>
                      <div className="text-xs text-slate-500 mt-1">
                        Offered by: <strong>{prog.departmentName}</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 shrink-0">
                      <div className="text-sm font-bold text-brand-600">
                        {formatCurrency(prog.annualFee)} / Year
                      </div>
                      <div className="text-xs text-slate-400">Academic Tuition Rate</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Program Scope</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{prog.description}</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Eligibility Criteria</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{prog.eligibility}</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Structure & Timeline</h4>
                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-semibold">{prog.durationYears} Academic Years ({prog.totalSemesters} Semesters)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Graduation Credits:</span>
                          <span className="font-semibold">{prog.creditsRequired} Credits</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Instruction Mode:</span>
                          <span className="font-semibold text-emerald-600">Full-Time On Campus</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sample Courses in this program */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-brand-600" />
                      <span>Curriculum includes Distributed Systems, Cloud Architecture, ML, Network Security.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href="/admissions">
                        <Button size="sm" variant="primary">
                          Apply for Admission
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

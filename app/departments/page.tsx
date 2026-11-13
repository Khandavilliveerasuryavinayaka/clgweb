'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { initialDepartments } from '@/lib/data/mockDatabase';
import { Users, GraduationCap, Calendar, ArrowRight, Building2, FlaskConical, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function DepartmentsPage() {
  const [selectedDept, setSelectedDept] = useState(initialDepartments[0]);

  return (
    <PublicLayout>
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Centres of Engineering</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Academic Departments</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Our specialized departments provide rigorous foundational coursework, hands-on laboratory experience, and specialized research facilities across major engineering and management domains.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Dept List */}
            <div className="lg:col-span-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
                Select Department
              </h3>
              {initialDepartments.map((dept) => {
                const isSelected = dept.id === selectedDept.id;
                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDept(dept)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-brand-50/80 border-brand-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{dept.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {dept.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>{dept.facultyCount} Faculty</span>
                      <span>•</span>
                      <span>{dept.studentCount} Students</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Dept Details */}
            <div className="lg:col-span-8">
              <Card className="overflow-hidden border-slate-200 shadow-elevated">
                <div className="relative h-64 w-full">
                  <img
                    src={selectedDept.image}
                    alt={selectedDept.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="px-2.5 py-1 rounded bg-brand-600 font-bold text-xs">
                      Dept Code: {selectedDept.code}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white">
                      {selectedDept.name}
                    </h2>
                  </div>
                </div>

                <CardContent className="p-8 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Department Overview
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedDept.description}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div>
                      <div className="text-xl font-bold text-navy-900">{selectedDept.establishedYear}</div>
                      <div className="text-xs text-slate-500">Established</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-brand-600">{selectedDept.facultyCount}</div>
                      <div className="text-xs text-slate-500">Faculty Members</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-navy-900">{selectedDept.studentCount}</div>
                      <div className="text-xs text-slate-500">Enrolled Students</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-600">6 Labs</div>
                      <div className="text-xs text-slate-500">Research Facilities</div>
                    </div>
                  </div>

                  {/* HOD & Key Facilities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-brand-700">
                        <GraduationCap className="w-4 h-4" />
                        <span className="font-bold text-xs uppercase tracking-wider">Head of Department</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{selectedDept.hodName}</div>
                      <p className="text-xs text-slate-500">
                        Senior Professor with over 18 years of academic instruction and active research guidance.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-brand-700">
                        <FlaskConical className="w-4 h-4" />
                        <span className="font-bold text-xs uppercase tracking-wider">Key Laboratories</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-1">
                        <div>• Advanced Compute & Machine Learning Cluster</div>
                        <div>• Embedded Systems & Hardware Architecture Lab</div>
                        <div>• Network Security & Distributed Systems Sandbox</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                    <Link href="/programs">
                      <Button variant="outline" size="sm">
                        View Offered Programs
                      </Button>
                    </Link>
                    <Link href="/admissions">
                      <Button variant="primary" size="sm">
                        <span>Apply to {selectedDept.code}</span>
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

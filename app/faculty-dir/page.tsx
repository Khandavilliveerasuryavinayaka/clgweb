'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Input';
import { Mail, Phone, BookOpen, GraduationCap, Award } from 'lucide-react';
import { initialUsers } from '@/lib/data/mockDatabase';

const facultyMembers = [
  {
    id: 'fac-1',
    name: 'Prof. Anand Kumar',
    designation: 'Professor & Head of Department',
    department: 'Computer Science and Engineering',
    qualification: 'Ph.D. (Cloud Systems), M.Tech (CSE), B.E.',
    experience: '16+ Years Academic & Research Experience',
    researchAreas: ['Distributed Systems', 'Cloud Native Architectures', 'Fault Tolerant Protocols'],
    email: 'anand.kumar@svcollege.edu',
    phone: '+91 98765 11223',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'fac-2',
    name: 'Dr. Priya Sharma',
    designation: 'Associate Professor',
    department: 'Electronics and Communication',
    qualification: 'Ph.D. (Wireless Signal Processing), M.Tech',
    experience: '12+ Years Experience',
    researchAreas: ['DSP', 'VLSI Microelectronics', 'IoT Wireless Sensor Networks'],
    email: 'priya.sharma@svcollege.edu',
    phone: '+91 98765 33445',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'fac-3',
    name: 'Dr. Rajeshwari Menon',
    designation: 'Professor & Research Director',
    department: 'Mechanical Engineering',
    qualification: 'Ph.D. (Robotics & Dynamics), M.E.',
    experience: '18+ Years Experience',
    researchAreas: ['Autonomous Robotics', 'Additive Manufacturing', 'Finite Element Analysis'],
    email: 'rajeshwari.menon@svcollege.edu',
    phone: '+91 98765 77889',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'fac-4',
    name: 'Dr. Suresh Babu',
    designation: 'Professor & Structural Lead',
    department: 'Civil and Environmental Engineering',
    qualification: 'Ph.D. (Earthquake Resilient Structures), M.Tech',
    experience: '15+ Years Experience',
    researchAreas: ['Structural Health Monitoring', 'Green Concrete', 'Seismic Analysis'],
    email: 'suresh.babu@svcollege.edu',
    phone: '+91 98765 99001',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'fac-5',
    name: 'Dr. Meenakshi Sundaram',
    designation: 'Dean of Management Studies',
    department: 'Department of Management Studies',
    qualification: 'Ph.D. (Fintech & Strategic Governance), MBA',
    experience: '14+ Years Experience',
    researchAreas: ['Digital Financial Systems', 'Organizational Behaviour', 'Supply Chain Analytics'],
    email: 'meenakshi.sundaram@svcollege.edu',
    phone: '+91 98765 44332',
    avatar: 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&q=80&w=300',
  },
];

export default function FacultyDirectoryPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const filtered = facultyMembers.filter((fac) => {
    const matchesSearch =
      fac.name.toLowerCase().includes(search.toLowerCase()) ||
      fac.researchAreas.some((r) => r.toLowerCase().includes(search.toLowerCase())) ||
      fac.department.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || fac.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <PublicLayout>
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Scholarly Directory</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Faculty Directory</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Distinguished educators, researchers, and mentors committed to high-impact academic instruction and student discovery.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-10">
            <div className="w-full sm:w-80">
              <SearchInput
                placeholder="Search by professor name, research topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {['ALL', 'Computer Science and Engineering', 'Electronics and Communication', 'Mechanical Engineering'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDeptFilter(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    deptFilter === d
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {d === 'ALL' ? 'All Departments' : d.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((fac) => (
              <Card key={fac.id} className="border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={fac.avatar}
                      alt={fac.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-base text-navy-900 leading-snug">{fac.name}</h3>
                      <div className="text-xs font-semibold text-brand-600 mt-0.5">{fac.designation}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{fac.department}</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div><strong>Qualification:</strong> {fac.qualification}</div>
                    <div><strong>Experience:</strong> {fac.experience}</div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Research Interests
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {fac.researchAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{fac.email}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

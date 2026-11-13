'use client';

import React from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Target, 
  Eye, 
  GraduationCap, 
  Building2, 
  BookOpen,
  Users
} from 'lucide-react';

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Header Banner */}
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Institutional Profile</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">About SV College</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Established with a vision to deliver world-class technical education, SV College stands at the forefront of engineering rigor, scientific curiosity, and ethical campus governance.
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-brand-200 bg-gradient-to-br from-brand-50/50 to-white shadow-card">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-5 shadow-sm">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-navy-900 mb-3">Our Institutional Vision</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  To be an internationally recognized academic institution of excellence that nurtures technologically competent, socially responsible, and innovative engineering leaders capable of solving complex global challenges.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-card">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-navy-900 text-white flex items-center justify-center mb-5 shadow-sm">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-navy-900 mb-3">Our Academic Mission</h3>
                <ul className="space-y-2.5 text-slate-600 text-sm leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>Provide rigorous curricula integrating theoretical foundations with practical laboratory engineering.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>Cultivate state-of-the-art research centers bridging academia and industry technological advancements.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>Maintain digital transparency, student welfare, and strict academic integrity across all departments.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Leadership Messages */}
      <section className="py-16 bg-surface-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">Academic Leadership</h2>
            <p className="text-slate-600 text-sm mt-2">Guidance and strategic governance from experienced scholars.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-card flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
                alt="Principal Dr. K. S. Ramanathan"
                className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm border border-slate-200"
              />
              <div className="space-y-3 text-center sm:text-left">
                <div>
                  <h4 className="text-lg font-bold text-navy-900">Dr. K. S. Ramanathan</h4>
                  <div className="text-xs font-semibold text-brand-600">Principal & Academic Dean</div>
                  <div className="text-xs text-slate-400">Ph.D. in Distributed Systems, M.Tech, SMIEEE</div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "At SV College, education is fundamentally about intellectual curiosity and ethical stewardship. We maintain the highest standards of academic transparency and continuous assessment through our automated academic portal."
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-card flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300"
                alt="Vice Principal Prof. Anand Kumar"
                className="w-24 h-24 rounded-2xl object-cover shrink-0 shadow-sm border border-slate-200"
              />
              <div className="space-y-3 text-center sm:text-left">
                <div>
                  <h4 className="text-lg font-bold text-navy-900">Prof. Anand Kumar</h4>
                  <div className="text-xs font-semibold text-brand-600">Vice Principal & Head of Academics</div>
                  <div className="text-xs text-slate-400">Ph.D. in Cloud Computing & AI, FIE</div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "Our role is to prepare our students not just for immediate industry employment, but for lifetime research leadership. Our continuous internal evaluations ensure sustained student dedication."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governance & Core Values */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">Core Institutional Values</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Academic Integrity</h4>
              <p className="text-xs text-slate-600">Zero tolerance for plagiarism and rigorous examination moderation.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Empirical Research</h4>
              <p className="text-xs text-slate-600">Hands-on laboratory sessions and verified project deliverables.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Student Welfare</h4>
              <p className="text-xs text-slate-600">Mentorship, on-duty hackathon encouragement, and grievance resolution.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Disciplined Governance</h4>
              <p className="text-xs text-slate-600">Audit-logged operations, clear role separation, and transparent fee accounting.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

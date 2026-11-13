'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  HelpCircle, 
  Send, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function AdmissionsPage() {
  const { success } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    program: 'BTECH-CSE',
    qualifyingScore: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      success(
        'Your admission enquiry has been submitted. Our admissions counselor will contact you within 24 hours.',
        'Enquiry Received'
      );
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        program: 'BTECH-CSE',
        qualifyingScore: '',
        message: '',
      });
    }, 800);
  };

  return (
    <PublicLayout>
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Academic Session 2025–2026</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Admissions & Enrolment</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Join a vibrant community of passionate learners and engineering problem solvers. Admissions are conducted through merit rankings and standardized entrance verifications.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Step By Step Guide */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Four-Stage Admission Lifecycle
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Our transparent admissions pipeline ensures fair merit consideration and instant digital onboarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Online Application</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit basic candidate profile, academic transcripts, and program preferences online.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Document Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Admissions committee authenticates 10+2 marks, identity documents, and reservation eligibility.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Counselling & Allotment</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Merit ranks published; seat allotment confirmed based on choice preference and seat availability.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-4">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Official Enrolment & ID</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                First term fee payment triggers generation of official Register Number and Student Portal access.
              </p>
            </div>
          </div>

          {/* Form & Deadlines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Enquiry Form */}
            <div className="lg:col-span-7">
              <Card className="border-slate-200 shadow-card">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-2 text-brand-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Fast-Track Inquiry</span>
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-1">
                    Submit Admission Application Inquiry
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Fill out the preliminary form to receive syllabus brochures, fee structure waivers, and counseling call.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Candidate Full Name"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        required
                        placeholder="candidate@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Phone / Mobile Number"
                        required
                        placeholder="+91 98765 00000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      <Select
                        label="Program of Interest"
                        required
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        options={[
                          { label: 'B.Tech - Computer Science & Engg', value: 'BTECH-CSE' },
                          { label: 'B.Tech - Electronics & Communication', value: 'BTECH-ECE' },
                          { label: 'M.Tech - Data Science & Cloud', value: 'MTECH-CSE' },
                          { label: 'MBA - Master of Business Admin', value: 'MBA-GEN' },
                        ]}
                      />
                    </div>

                    <Input
                      label="10+2 / Qualifying Percentage / Score"
                      placeholder="e.g. 88.5%"
                      value={formData.qualifyingScore}
                      onChange={(e) => setFormData({ ...formData, qualifyingScore: e.target.value })}
                    />

                    <Textarea
                      label="Questions or Specific Inquiries (Optional)"
                      placeholder="Ask about hostel accommodation, merit scholarships, bus transport..."
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      variant="primary"
                      className="w-full"
                      isLoading={isSubmitting}
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Submit Admission Enquiry
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Key Dates & Guidelines */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-slate-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wider">
                    <Calendar className="w-4 h-4" />
                    <span>Important Application Milestones</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">Application Portal Opens</div>
                        <div className="text-slate-500">Undergraduate & Graduate</div>
                      </div>
                      <Badge status="Active">Jan 10, 2025</Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">Phase 1 Early Decision Deadline</div>
                        <div className="text-slate-500">Merit scholarship preference</div>
                      </div>
                      <Badge status="Pending">Apr 30, 2025</Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">Counseling & Seat Allotment</div>
                        <div className="text-slate-500">Document verification sessions</div>
                      </div>
                      <Badge status="Draft">May 15–25, 2025</Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">Orientation & Classes Begin</div>
                        <div className="text-slate-500">Semester 1 Inauguration</div>
                      </div>
                      <Badge status="Approved">Aug 01, 2025</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-brand-200 bg-brand-50/50">
                <CardContent className="p-6 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-brand-900 text-sm">
                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                    <span>Merit Scholarship Provisions</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    SV College offers up to 50% tuition waiver for high-ranking candidates in standardized exams and outstanding national sports/hackathon medalists.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

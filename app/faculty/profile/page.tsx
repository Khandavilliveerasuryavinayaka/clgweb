'use client';

import React, { useState, useRef } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { 
  GraduationCap, 
  Mail, 
  Phone, 
  BookOpen, 
  ShieldCheck, 
  MapPin, 
  Award, 
  Building,
  Sparkles,
  Pencil
} from 'lucide-react';

export default function FacultyProfilePage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const facultyName = user?.name || 'Dr. M. Karthikeyan';
  const facultyId = user?.registerNumber || 'FAC001';
  const department = user?.department || 'Computer Science and Engineering';
  const email = user?.email || 'karthikeyan@svcollege.edu';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastError('Please select a valid image file (JPG, PNG, or WebP).', 'Invalid Format');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError('File size exceeds 5MB limit.', 'File Too Large');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);

      // Save locally to user session
      try {
        const savedSession = localStorage.getItem('sv_college_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          parsed.avatarUrl = dataUrl;
          localStorage.setItem('sv_college_session', JSON.stringify(parsed));
        }
      } catch (err) {
        console.error(err);
      }

      success('Profile photo updated successfully!', 'Photo Updated');
    };
    reader.readAsDataURL(file);
  };

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        {/* Profile Header Card - Identical to Student Profile format */}
        <Card className="border-slate-200 overflow-hidden shadow-card bg-white">
          <div className="bg-gradient-to-r from-brand-950 via-navy-900 to-slate-900 relative px-6 py-6 sm:py-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.25),transparent_70%)]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-5">
              <div className="relative shrink-0 group">
                <Avatar
                  src={previewUrl || user?.avatarUrl}
                  name={facultyName}
                  registerNumber={facultyId}
                  size="2xl"
                  className="border-4 border-white/20 shadow-elevated bg-white transition-opacity duration-300"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change profile picture"
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center hover:bg-brand-50 hover:border-brand-300 transition-all duration-200 cursor-pointer group-hover:scale-110"
                >
                  <Pencil className="w-3.5 h-3.5 text-brand-600" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {facultyName}
                </h1>
                <div className="text-xs font-mono font-bold text-white/80">
                  Register Number: {facultyId}
                </div>
                <div className="text-xs text-white/60 font-medium">
                  Professor &amp; Head of Department • {department}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-white/70 text-xs shrink-0 self-start">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="font-medium">Official Institutional Faculty Record</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-white">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge status={user?.accountStatus || 'Active'}>
                Account {user?.accountStatus || 'ACTIVE'}
              </Badge>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Good Standing (Regular)
              </span>
            </div>

            <div className="text-center sm:text-right space-y-0.5 text-xs text-slate-500 shrink-0">
              <div className="font-semibold text-slate-700">Appointed Since: August 2018</div>
              <div className="font-semibold text-slate-700">
                Current Term: Academic Year 2024–2025 (Spring Semester)
              </div>
            </div>
          </div>
        </Card>

        {/* Academic Credentials & Departmental Profile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-card bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600" />
                <CardTitle className="text-base font-bold text-slate-900">Academic &amp; Departmental Credentials</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Designation:</span>
                <span className="font-bold text-slate-900">Professor &amp; Head of Department</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-900">{department}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Register / Faculty ID:</span>
                <span className="font-mono font-bold text-brand-700">{facultyId}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Academic Tenure:</span>
                <span className="font-semibold text-emerald-700">Tenured Senior Faculty</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Institutional Email:</span>
                <span className="font-medium text-slate-800">{email}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500 font-medium">Highest Qualification:</span>
                <span className="font-semibold text-brand-700 text-right">Ph.D. in Cloud Computing &amp; Distributed Systems</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-card bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <CardTitle className="text-base font-bold text-slate-900">Research &amp; Teaching Focus</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-2">Specializations &amp; Research Interests:</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200/80">
                    Distributed Systems
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200/80">
                    Cloud Architectures
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200/80">
                    Data Engineering
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200/80">
                    Scalable Computing
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Student Consultation Hours:</span>
                  <span className="font-semibold text-slate-800">Mon &amp; Wed, 3:00 PM – 5:00 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Department Office:</span>
                  <span className="font-semibold text-slate-800">Cabin 304, Academic Block A</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Institutional Status:</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Regular Full-Time Faculty
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}

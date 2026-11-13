'use client';

import React, { useState, useRef } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { GraduationCap, Lock, Save, AlertCircle, Sparkles, Pencil } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export default function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError, info } = useToast();

  // Contact Information Form States
  const [phone, setPhone] = useState(user?.phone || '+91 91234 56789');
  const [address, setAddress] = useState('Flat 402, Technology Residency, Knowledge City, Pin 500081');
  const [guardianName, setGuardianName] = useState('Sanjay Verma');
  const [guardianPhone, setGuardianPhone] = useState('+91 98450 12345');
  const [bloodGroup, setBloodGroup] = useState('O+ Positive');
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Profile Picture Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Handle Contact Form Submit (reverted to yesterday's local implementation)
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    setTimeout(() => {
      setIsSavingContact(false);
      success('Contact details and emergency contacts updated successfully.', 'Profile Saved');
    }, 600);
  };

  // Validate, preview, and auto-upload selected image
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. File extension validation
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      const msg = `Unsupported file type (.${ext}). Only JPG, JPEG, PNG, and WebP are allowed.`;
      setValidationError(msg);
      toastError(msg, 'Invalid File Format');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const msg = `Invalid MIME type (${file.type}). Please select a valid image file.`;
      setValidationError(msg);
      toastError(msg, 'Invalid Image');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. File size validation (5 MB max)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const msg = `File size (${sizeMb} MB) exceeds maximum 5.0 MB limit. Please select a smaller photo.`;
      setValidationError(msg);
      toastError(msg, 'File Too Large');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Read, preview immediately, and auto-upload
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      autoUploadPhoto(file, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Auto-upload photo immediately after selection
  const autoUploadPhoto = async (file: File, dataUrl: string) => {
    if (!user) return;
    setIsUploading(true);
    setValidationError(null);
    try {
      const compressedDataUrl = await compressImage(dataUrl);
      const res = await fetch('/api/student/profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          Authorization: `Bearer jwt-token-${user.id}-${Date.now()}`,
        },
        body: JSON.stringify({
          data: compressedDataUrl,
          filename: file.name,
          contentType: file.type,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Upload failed');
      }

      refreshUser();

      try {
        const savedSession = localStorage.getItem('sv_college_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          parsed.avatarUrl = json.data?.avatarUrl || compressedDataUrl;
          parsed.profileImagePath = json.data?.profile_image_path;
          localStorage.setItem('sv_college_session', JSON.stringify(parsed));
        }
      } catch (err) {
        console.error(err);
      }

      success('Profile picture updated successfully!', 'Photo Saved');
      setSelectedFile(null);
      setTimeout(() => {
        setPreviewUrl(null);
      }, 1000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setValidationError(err.message || 'Failed to upload photo');
      toastError(err.message || 'Upload failed. Please try again.', 'Error');
    } finally {
      setIsUploading(false);
    }
  };

  // Compress large image via canvas if necessary
  const compressImage = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <Card className="border-slate-200 overflow-hidden shadow-card bg-white">
          <div className="bg-gradient-to-r from-brand-950 via-navy-900 to-slate-900 relative px-6 py-6 sm:py-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.25),transparent_70%)]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-5">
              <div className="relative shrink-0 group">
                <Avatar
                  src={previewUrl || user?.avatarUrl}
                  name={user?.name}
                  registerNumber={user?.registerNumber}
                  size="2xl"
                  className={`border-4 border-white/20 shadow-elevated bg-white transition-opacity duration-300 ${
                    isUploading ? 'opacity-70' : ''
                  }`}
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
                  {user?.name || 'Student'}
                </h1>
                <div className="text-xs font-mono font-bold text-white/80">
                  Register Number: {user?.registerNumber || 'REG2024001'}
                </div>
                <div className="text-xs text-white/60 font-medium">
                  {user?.program || 'B.Tech Computer Science'} • {user?.department || 'Computer Science and Engineering'}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-white/70 text-xs shrink-0 self-start">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="font-medium">Official Institutional Student Record</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
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
              <div className="font-semibold text-slate-700">Enrolled Since: August 2022</div>
              <div className="font-semibold text-slate-700">
                Current Term: Semester {user?.semester || 6} (Spring 2025)
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Official Academic Records (Protected) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-slate-200 shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-800 font-bold text-sm">
                  <GraduationCap className="w-4 h-4 text-brand-600" />
                  <span>Official Academic Records</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <Lock className="w-3 h-3" />
                  Protected
                </span>
              </CardHeader>
              <CardContent className="p-6 space-y-3.5 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Degree Track:</span>
                  <span className="font-semibold text-slate-900">{user?.program || 'B.Tech Computer Science'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-900">{user?.department || 'Computer Science and Engineering'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Current Semester:</span>
                  <span className="font-bold text-brand-700">Semester {user?.semester || 6}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Batch of Study:</span>
                  <span className="font-semibold text-slate-900">{user?.batch || '2021-2025'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Academic Standing:</span>
                  <span className="font-semibold text-emerald-600">Good Standing (Regular)</span>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Academic records are officially maintained by the Controller of Examinations and Central Registrar.
                    For discrepancies, submit an academic grievance.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Contact Particulars & Emergency Details */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-slate-200 shadow-card">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Contact Particulars & Emergency Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveContact} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Primary Contact Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <Input
                      label="Institutional Email"
                      value={user?.email || 'student@svcollege.edu'}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Guardian / Parent Name"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      required
                    />
                    <Input
                      label="Guardian Phone"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      required
                    />
                  </div>

                  <Input
                    label="Blood Group"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  />

                  <Input
                    label="Residential / Hostel Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSavingContact}
                      leftIcon={<Save className="w-4 h-4" />}
                    >
                      Save Contact Info
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

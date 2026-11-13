'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Lock, Bell, Shield, KeyRound, Save } from 'lucide-react';

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preference Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [resultAlerts, setResultAlerts] = useState(true);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toastError('Please complete all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toastError('Password must be at least 6 characters in length.');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      success('Institutional credentials updated successfully.', 'Password Changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 800);
  };

  const handleSavePreferences = () => {
    success('Notification delivery settings updated.', 'Preferences Saved');
  };

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Account & Security Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your credentials, multi-channel notifications, and active session permissions.
          </p>
        </div>

        {/* Password Management */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <KeyRound className="w-4 h-4 text-brand-600" />
              <span>Change Portal Password</span>
            </div>
            <span className="text-[11px] text-slate-400">Requires institutional re-authentication</span>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <Input
                label="Current Password"
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              <Input
                label="New Password"
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="Must contain minimum 6 characters with mixed symbols."
              />

              <Input
                label="Confirm New Password"
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingPassword}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Update Credentials
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notifications Delivery Preferences */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Bell className="w-4 h-4 text-brand-600" />
              <span>Delivery Preferences</span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <div className="font-semibold text-xs text-slate-900">Official Email Dispatches</div>
                <div className="text-[11px] text-slate-500">
                  Receive academic circulars and course registration alerts via email.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <div className="font-semibold text-xs text-slate-900">SMS / Emergency Mobile Broadcasts</div>
                <div className="text-[11px] text-slate-500">
                  Important weather advisories, sudden exam postponement notices.
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-semibold text-xs text-slate-900">Results Publication Notification</div>
                <div className="text-[11px] text-slate-500">
                  Instant notification when end-semester examination results are gazetted.
                </div>
              </div>
              <input
                type="checkbox"
                checked={resultAlerts}
                onChange={(e) => setResultAlerts(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <Button variant="secondary" size="sm" onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

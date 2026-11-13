'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Building2, Save, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export default function AdminSettingsPage() {
  const { success } = useToast();

  const [collegeName, setCollegeName] = useState('SV College of Engineering');
  const [tagline, setTagline] = useState('Center for Higher Academic Excellence');
  const [address, setAddress] = useState('SV College Academic Campus, Technology Enclave, Knowledge City Road, Pin 500081');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('info@svcollege.edu');
  const [principalName, setPrincipalName] = useState('Dr. K. S. Ramanathan');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sv_college_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.collegeName) setCollegeName(parsed.collegeName);
        if (parsed.tagline) setTagline(parsed.tagline);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.principalName) setPrincipalName(parsed.principalName);
      }
    } catch (e) {}
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('sv_college_settings', JSON.stringify({
        collegeName,
        tagline,
        address,
        phone,
        email,
        principalName,
      }));
      mockDb.addAuditLog(
        'usr-admin-1',
        principalName,
        'ADMIN',
        'SETTINGS_UPDATED',
        'Institution',
        'inst-sv-1',
        `Admin updated institutional profile parameters and contact directories.`
      );
    } catch (e) {}
    setTimeout(() => {
      setIsSaving(false);
      success('Institutional profile and campus parameters updated and saved.', 'Settings Saved');
    }, 400);
  };

  return (
    <PortalLayout role="ADMIN">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Institutional Configuration & Campus Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain authorized institutional branding, contact directories, and administrative parameters.
          </p>
        </div>

        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold">Institutional Identity (Editable)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Institution Official Name"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                />
                <Input
                  label="Institutional Motto / Tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Central Helpdesk Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Official Telephone Switchboard"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Input
                label="Principal & Dean of Academic Governance"
                required
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
              />

              <Textarea
                label="Campus Physical Location / Postal Address"
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                  Save Institutional Parameters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}

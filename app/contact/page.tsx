'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, SearchInput } from '@/components/ui/Input';
import { Textarea, Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { MapPin, Phone, Mail, Clock, Send, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  const { success } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Academic Inquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      success('Your message has been sent to our administrative office.', 'Message Sent');
      setFormData({ name: '', email: '', subject: 'General Academic Inquiry', message: '' });
    }, 800);
  };

  return (
    <PublicLayout>
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Institutional Helpdesk</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Contact SV College</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Reach out to our academic deaneries, admissions cell, hostel warden, or student grievance committee.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Get in Touch</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Our administrative teams are available during standard academic working hours.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-2.5 rounded-lg bg-brand-100 text-brand-700 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Campus Address</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      SV College Academic Campus, Technology Enclave, Knowledge City Road, Pin 500081
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Phone Directory</h4>
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      <div>Principal Office: +91 98765 43210</div>
                      <div>Admissions Desk: +91 98765 43211</div>
                      <div>Examinations Cell: +91 98765 43212</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Official Electronic Mail</h4>
                    <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                      <div>admissions@svcollege.edu</div>
                      <div>academics@svcollege.edu</div>
                      <div>support@svcollege.edu</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Administrative Hours</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Monday to Friday: 08:30 AM – 05:00 PM<br />
                      Saturday: 09:00 AM – 01:00 PM (1st & 3rd Saturdays only)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inquiries Form */}
            <div className="lg:col-span-7">
              <Card className="border-slate-200 shadow-card">
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-navy-900 mb-1">Send an Electronic Inquiry</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Our administrative desk logs all inquiries and responds with priority.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Your Name"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <Select
                      label="Inquiry Department / Subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      options={[
                        { label: 'General Academic Inquiry', value: 'General Academic Inquiry' },
                        { label: 'Admissions & Eligibility', value: 'Admissions & Eligibility' },
                        { label: 'Examinations & Verification', value: 'Examinations & Verification' },
                        { label: 'Fee Re-conciliation', value: 'Fee Re-conciliation' },
                        { label: 'Hostel & Campus Facilities', value: 'Hostel & Campus Facilities' },
                      ]}
                    />

                    <Textarea
                      label="Message / Detailed Request"
                      required
                      rows={5}
                      placeholder="Please provide specifics of your inquiry..."
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
                      Submit Official Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

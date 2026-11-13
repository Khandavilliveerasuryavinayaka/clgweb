import React from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, Phone, MapPin, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800 text-sm mt-auto">
      {/* Top Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-xl text-white tracking-tight">SV COLLEGE</div>
                <div className="text-xs text-slate-400">Institutional Academic Management System</div>
              </div>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Empowering future leaders through rigorous engineering curricula, state-of-the-art research laboratories, and disciplined academic governance.
            </p>
            <div className="space-y-2 pt-2 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>SV College Academic Campus, Technology Enclave, Knowledge City</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                <span>+91 98765 43210 (General Inquiries)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>admissions@svcollege.edu | info@svcollege.edu</span>
              </div>
            </div>
          </div>

          {/* Col 2: Academics */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Academics</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/programs" className="hover:text-white transition-colors">Undergraduate Degrees</Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-white transition-colors">Postgraduate Programs</Link>
              </li>
              <li>
                <Link href="/departments" className="hover:text-white transition-colors">Academic Departments</Link>
              </li>
              <li>
                <Link href="/notices" className="hover:text-white transition-colors">Academic Calendar</Link>
              </li>
              <li>
                <Link href="/campus" className="hover:text-white transition-colors">Research Laboratories</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portals */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Portals</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/student" className="hover:text-white transition-colors">Student Portal</Link>
              </li>
              <li>
                <Link href="/faculty" className="hover:text-white transition-colors">Faculty Academic Portal</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">Administrative Dashboard</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">Unified Login</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Campus & Life</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/admissions" className="hover:text-white transition-colors">Admissions 2025</Link>
              </li>
              <li>
                <Link href="/campus" className="hover:text-white transition-colors">Campus Tour & Gallery</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Grievance & Support</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="border-t border-navy-900 bg-black/40 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} SV College Management System. All academic operations protected and audited.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role-Based Enterprise Security</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

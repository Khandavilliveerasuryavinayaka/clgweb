'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Building2, BookOpen, Cpu, Trophy, Coffee, BedDouble } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  category: 'Infrastructure' | 'Laboratories' | 'Library' | 'Sports' | 'Hostel';
  image: string;
  description: string;
}

const campusItems: GalleryItem[] = [
  {
    id: 'g-1',
    title: 'Central Academic Block & Administration',
    category: 'Infrastructure',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800',
    description: 'Eco-friendly smart administrative tower housing academic deaneries, admission suites, and digital server core.',
  },
  {
    id: 'g-2',
    title: 'Dr. APJ Abdul Kalam Central Digital Library',
    category: 'Library',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
    description: 'Over 80,000 reference volumes, IEEE Xplore & ACM digital access terminals, and 24/7 silent study cubicles.',
  },
  {
    id: 'g-3',
    title: 'High Performance Distributed Computing Lab',
    category: 'Laboratories',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
    description: 'Equipped with dedicated GPU clusters, gigabit fiber networking, and cloud emulation testbeds.',
  },
  {
    id: 'g-4',
    title: 'Robotics & Autonomous Dynamics Research Suite',
    category: 'Laboratories',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
    description: 'Advanced pneumatic actuators, ROS simulators, multi-axis 3D printing arms, and drone assembly benches.',
  },
  {
    id: 'g-5',
    title: 'Indoor Sports Complex & Gymnasium',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    description: 'Olympic-standard badminton courts, table tennis arena, basketball hardwood courts, and fitness gym.',
  },
  {
    id: 'g-6',
    title: 'Student Residence Halls & Dining Hall',
    category: 'Hostel',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800',
    description: 'Secure on-campus residential housing with high-speed Wi-Fi, hygienic multicuisine cafeteria, and study lounges.',
  },
];

export default function CampusPage() {
  const [filter, setFilter] = useState('ALL');
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);

  const filtered = campusItems.filter((item) => filter === 'ALL' || item.category === filter);

  return (
    <PublicLayout>
      <section className="bg-navy-950 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <Badge status="Active" className="mb-3">Infrastructure Tour</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Campus & Facilities</h1>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            Spanning lush acres of dedicated educational grounds with world-class computational laboratories, smart lecture halls, and holistic student amenities.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {['ALL', 'Infrastructure', 'Laboratories', 'Library', 'Sports', 'Hostel'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Facilities' : cat}
              </button>
            ))}
          </div>

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setActivePhoto(item)}
                className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-card hover:shadow-elevated transition-all cursor-pointer bg-slate-900"
              >
                <div className="h-64 w-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-600/90 text-white mb-1.5 inline-block">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1 opacity-90">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal Zoom Preview */}
      {activePhoto && (
        <Modal
          isOpen={!!activePhoto}
          onClose={() => setActivePhoto(null)}
          title={activePhoto.title}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <img
              src={activePhoto.image}
              alt={activePhoto.title}
              className="w-full h-80 object-cover rounded-xl shadow-md"
            />
            <p className="text-sm text-slate-700 leading-relaxed">
              {activePhoto.description}
            </p>
          </div>
        </Modal>
      )}
    </PublicLayout>
  );
}

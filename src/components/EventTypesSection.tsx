import React from 'react';
import { EventType } from '../types/plan';
import { HeartHandshake, Cake, Users2, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface EventTypesSectionProps {
  onSelectType: (type: EventType) => void;
}

export const EventTypesSection: React.FC<EventTypesSectionProps> = ({ onSelectType }) => {
  const archetypes = [
    {
      id: 'wedding' as EventType,
      title: 'Royal & Contemporary Wedding',
      subtitle: 'Multi-Day Celebrations',
      icon: HeartHandshake,
      description:
        'Sangeet, Haldi, Mandap rituals, and Grand Reception. Deeply integrated with Indian catering, candid photography, dhol, and bridal styling.',
      metrics: [
        { label: 'Typical Scale', val: '250 – 800 Guests' },
        { label: 'Budget Default', val: '₹15L – ₹40L' },
        { label: 'Key Vendors', val: '8 Core Specialists' },
        { label: 'Lead Timeline', val: '90 – 180 Days' },
      ],
      tags: ['Sangeet & Haldi', 'Mandap Floral', 'Mithai Buffets', 'Cinematic Drone'],
    },
    {
      id: 'birthday' as EventType,
      title: 'Milestone Birthday & Jubilee',
      subtitle: 'High-Energy Socials',
      icon: Cake,
      description:
        '18th, 30th, 50th or Silver Jubilee celebrations. Custom neon aesthetic, designer cake artists, 360 glambots, acoustic golden hour, and mixology.',
      metrics: [
        { label: 'Typical Scale', val: '30 – 120 Guests' },
        { label: 'Budget Default', val: '₹80k – ₹3.5L' },
        { label: 'Key Vendors', val: '6 Curated Partners' },
        { label: 'Lead Timeline', val: '14 – 35 Days' },
      ],
      tags: ['Theme Lighting', 'Designer Tier Cake', '360 Glambot', 'Custom Mocktails'],
    },
    {
      id: 'community' as EventType,
      title: 'Community Fest & Cultural Gala',
      subtitle: 'Civic & Guild Gatherings',
      icon: Users2,
      description:
        'Diwali utsavs, society sports galas, cultural showcases, and college reunions with municipal permits, sound stages, food stalls, and volunteer wings.',
      metrics: [
        { label: 'Typical Scale', val: '200 – 1,500 Guests' },
        { label: 'Budget Default', val: '₹3L – ₹12L' },
        { label: 'Key Vendors', val: '7 Field Crews' },
        { label: 'Lead Timeline', val: '45 – 90 Days' },
      ],
      tags: ['Civic Clearances', 'Line-Array AV', 'Food Stalls', 'Safety & First Aid'],
    },
  ];

  return (
    <section id="events" className="readable-content border-b border-white/10 px-4 py-20 sm:px-6 lg:px-8 bg-[#09090c]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#0066ff] font-mono-code">
              ARCHETYPES // FOUNDATIONAL SCHEMAS
            </span>
            <h2 className="mt-2 font-serif-display text-[2rem] sm:text-5xl uppercase tracking-tight text-white">
              ENGINEERED FOR <span className="italic font-normal lowercase text-[#0066ff]">any</span> SCALE.
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-zinc-400 font-light">
            Select a verified structural archetype to initialize budget percentages, chronological
            milestones, and vendor checklist matrices instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {archetypes.map((arch) => {
            const Icon = arch.icon;
            return (
              <div
                key={arch.id}
                className="group relative flex flex-col justify-between rounded-sm border border-white/10 bg-[#101014] p-6 hover:border-[#0066ff]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,102,255,0.15)]"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#0066ff]/10 border border-[#0066ff]/40 text-[#0066ff]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono-code">
                        {arch.subtitle}
                      </span>
                    </div>
                    <span className="text-xs font-mono-code text-zinc-400">ARCH.0{arch.id === 'wedding' ? '1' : arch.id === 'birthday' ? '2' : '3'}</span>
                  </div>

                  <h3 className="mt-5 text-xl font-medium text-white group-hover:text-[#3b82f6] transition-colors">
                    {arch.title}
                  </h3>
                  <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed font-light">
                    {arch.description}
                  </p>

                  {/* Metrics Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-2 rounded-sm border border-white/5 bg-black/40 p-3">
                    {arch.metrics.map((m, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-[10px] uppercase text-zinc-400 font-mono-code">
                          {m.label}
                        </span>
                        <span className="text-xs font-medium text-zinc-200 font-mono-code">
                          {m.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Feature tags */}
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {arch.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="rounded-xs border border-white/5 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300 font-mono-code flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-[#0066ff]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-white/10 pt-4">
                  <button
                    onClick={() => onSelectType(arch.id)}
                    className="flex w-full items-center justify-between rounded-sm bg-white/5 px-4 py-2.5 text-xs font-medium text-white hover:bg-[#0066ff] hover:shadow-[0_0_15px_rgba(0,102,255,0.4)] transition-all font-mono-code uppercase tracking-wider cursor-pointer"
                  >
                    <span>Load Archetype Plan</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

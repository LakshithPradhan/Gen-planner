import React, { useState } from 'react';
import { ChevronRight, Sliders, PieChart, CalendarCheck2, Users, Lightbulb, Bot } from 'lucide-react';

export const CapabilitiesSection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number | null>(0);

  const capabilities = [
    {
      num: '01',
      title: 'Autonomous Budget Normalisation',
      category: 'FINANCIAL ARCHITECTURE',
      icon: PieChart,
      summary:
        'All category percentages dynamically preserve a mathematically strict 100% sum. Includes real-time per-guest cost splits and animated SVG donut breakdowns.',
      bullets: [
        'Automatic remainder balancing prevents budget inflation or leakage.',
        'Planned vs Spent tracking with visual variance indicators.',
        'Per-guest head-count math tailored to Indian wedding & banquet tiers.',
      ],
    },
    {
      num: '02',
      title: 'Chronological Timeline Compression',
      category: 'TEMPORAL ENGINE',
      icon: CalendarCheck2,
      summary:
        'Timeline tasks scale proportionally whether your event is 180 days away or in 10 days. Near-term bottlenecks trigger real-time urgency alarms.',
      bullets: [
        'Days-until-event countdown synchronizes with task due dates.',
        'Interactive task checklists with live completion telemetry.',
        'Automated urgency flagging for overdue contracts and permits.',
      ],
    },
    {
      num: '03',
      title: 'Vendor Negotiation Directory',
      category: 'PROCUREMENT & CONTRACTS',
      icon: Users,
      summary:
        'Pre-populated with 7–10 specialized celebration vendors (Catering, Mandap Decor, Candid Photo, Sound/AV) each paired with a high-leverage "what to confirm" tip.',
      bullets: [
        'Tri-state lifecycle tracking: To contact ➔ Contacted ➔ Booked.',
        'Local vendor classifications suited for Indian and western formats.',
        'Estimated allocation tagging keeps vendor costs within budget.',
      ],
    },
    {
      num: '04',
      title: 'Personalised City & Vibe Ideas',
      category: 'CREATIVE CURATION',
      icon: Lightbulb,
      summary:
        'Hyper-personalized concepts tailored to your chosen host city and notes (e.g. live kesar jalebi swirls, QR code guest audio-logs, 360 glambots, eco seed favours).',
      bullets: [
        'Interactive bookmarks and tags across culinary, decor, and entertainment.',
        'Dynamic "More ideas" generation that filters out prior concepts.',
        'Real-world cultural touches for multi-day festivities.',
      ],
    },
    {
      num: '05',
      title: 'Conversational Plan Restructuring (Chat Engine)',
      category: 'STANDOUT CAPABILITY',
      icon: Bot,
      summary:
        'Type natural language instructions like "cut ₹50k but keep the live band" or "add 50 guests". The AI executes structured operations with visual diff and undo.',
      bullets: [
        'Generates atomic operations: setBudgetTotal, addTask, updateVendorStatus, etc.',
        'Before vs After visual diff modal shows exact delta values.',
        'Full Undo Stack allows instant rollback to previous plan state.',
      ],
    },
    {
      num: '06',
      title: 'Live What-If Sliders & Plan Health Diagnostic',
      category: 'SIMULATION & RISK CONTROL',
      icon: Sliders,
      summary:
        'Instantly drag Guest, Budget, or Days-Left sliders to simulate scenario impacts. An autonomous 0–100 health gauge flags uncontacted venues or low catering ratios.',
      bullets: [
        'Live recalculation of per-guest budgets and task urgency without page reloads.',
        'Flags critical issues: e.g. catering below 25% for 150+ guests.',
        'Identifies venue booking delays with < 45 days remaining.',
      ],
    },
  ];

  return (
    <section id="capabilities" className="readable-content border-b border-white/10 px-4 py-20 sm:px-6 lg:px-8 bg-[#08080a]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <span className="text-xs uppercase tracking-widest text-[#0066ff] font-mono-code">
            CAPABILITIES // SYSTEM CAPACITIES
          </span>
          <h2 className="mt-2 font-serif-display text-[2rem] sm:text-5xl uppercase tracking-tight text-white">
            WHAT WE <span className="italic font-normal lowercase text-[#0066ff]">orchestrate</span>.
          </h2>
        </div>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            const isOpen = activeIdx === idx;
            return (
              <div
                key={cap.num}
                onClick={() => setActiveIdx(isOpen ? null : idx)}
                className={`group cursor-pointer transition-all duration-300 ${
                  isOpen ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between p-6 sm:py-7">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className="text-xs font-mono-code text-zinc-400 group-hover:text-[#0066ff] transition-colors">
                      {cap.num}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-white/5 border border-white/10 text-[#0066ff] group-hover:border-[#0066ff]/50 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono-code block">
                        {cap.category}
                      </span>
                      <h3 className="text-lg sm:text-xl font-medium text-white group-hover:text-[#3b82f6] transition-colors">
                        {cap.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-[11px] font-mono-code text-zinc-400 group-hover:text-zinc-300">
                      {isOpen ? 'COLLAPSE' : 'EXPAND SPEC'}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-90 text-[#0066ff]' : 'group-hover:translate-x-1 group-hover:text-white'
                      }`}
                    />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-white/5 px-6 pb-6 pt-3 sm:pl-20 text-xs sm:text-sm text-zinc-400">
                    <p className="max-w-3xl leading-relaxed text-zinc-300 font-light">
                      {cap.summary}
                    </p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {cap.bullets.map((b, bIdx) => (
                        <div
                          key={bIdx}
                          className="flex items-start gap-2 rounded-xs border border-white/5 bg-black/40 p-2.5 text-xs text-zinc-300 font-mono-code"
                        >
                          <span className="text-[#0066ff] font-bold">›</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

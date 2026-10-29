import React from 'react';
import { ShieldCheck, Layers, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-[#060608] px-4 py-12 sm:px-6 lg:px-8 text-zinc-400 font-mono-code text-xs">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-white text-sm font-semibold uppercase tracking-wider mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-xs bg-[#0066ff] text-white text-[10px] font-bold">
              J
            </span>
            <span>Jashn Celebration Planner</span>
          </div>
          <p className="max-w-xl text-[11px] leading-relaxed text-zinc-400 font-light">
            Plan any celebration by just talking to it. Engineered for the hackathon challenge
            "Celebration &amp; Event Planner" with autonomous 100% budget rebalancing, time-scaled
            chronologies, and structured AI chat editing.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[11px]">
          <a
            href="/cast-and-render.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-zinc-300 hover:text-[#0066ff] transition-colors border border-white/10 px-2.5 py-1.5 rounded-xs"
          >
            <Layers className="h-3.5 w-3.5 text-[#0066ff]" />
            <span>Cast &amp; Render Reel</span>
          </a>

          <a
            href="/jashn-celebration-planner.zip"
            download="jashn-celebration-planner.zip"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 rounded-xs"
          >
            <span>Download Project ZIP</span>
          </a>

          <div className="flex items-center gap-1 text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0066ff]" />
            <span>MIT License &middot; Vercel Ready</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-zinc-400">
        <p>
          DISCLAIMER: All budget categories, currency estimations, and timeline milestones are
          AI-generated architectural suggestions. Always verify commercial terms, local municipal
          permits, and safety regulations directly with contracted vendors.
        </p>
        <span className="shrink-0 text-zinc-400">JASHN &middot; SYS.REV.2.4</span>
      </div>
    </footer>
  );
};

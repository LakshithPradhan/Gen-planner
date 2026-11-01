import React from 'react';
import { ParticleOrb } from './ParticleOrb';
import { ArrowDown, MessageSquareCode, ShieldCheck, Zap } from 'lucide-react';

interface HeroSectionProps {
  onOpenInitiate: () => void;
  onLoadSample: (type: 'wedding' | 'birthday' | 'community') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenInitiate, onLoadSample }) => {
  return (
    <section className="relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden border-b border-white/10 px-4 py-16 text-center sm:px-6 lg:px-8">
      {/* Background Particle Orb */}
      <ParticleOrb />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Monospace telemetry pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[11px] uppercase tracking-widest text-zinc-300 backdrop-blur-md font-mono-code">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0066ff] shadow-[0_0_6px_#0066ff]"></span>
          <span>CAPABILITIES / WHAT WE PLAN &middot; EVENT PLANNING</span>
        </div>

        {/* Huge condensed serif display heading with one italic blue word */}
        <h1 className="font-serif-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-[#f0f0f3] leading-[0.98] uppercase">
          WE PLAN <span className="text-[#0066ff] italic lowercase font-serif-display font-normal">unforgettable</span> CELEBRATIONS.
        </h1>

        {/* Tagline */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-300 font-light leading-relaxed">
          <span className="text-white font-medium">Plan any celebration by just talking to it.</span>{' '}
          Weddings, milestone birthdays, and community utsavs engineered with autonomous budget
          splits, time-scaled chronologies, and conversational real-time plan editing.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={onOpenInitiate}
            className="flex items-center gap-2 rounded-sm bg-[#0066ff] px-6 py-3 text-xs uppercase tracking-wider font-mono-code font-semibold text-white shadow-[0_0_25px_rgba(0,102,255,0.5)] hover:bg-[#0052cc] hover:shadow-[0_0_35px_rgba(0,102,255,0.7)] transition-all cursor-pointer"
          >
            <MessageSquareCode className="h-4 w-4" />
            <span>Initiate Plan Brief</span>
          </button>

          <button
            onClick={() => onLoadSample('wedding')}
            className="flex items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-5 py-3 text-xs uppercase tracking-wider font-mono-code text-zinc-200 hover:border-white/30 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <span>Load Royal Wedding Demo</span>
          </button>
        </div>

        {/* Live System Capabilities Bar */}
        <div className="mt-14 grid grid-cols-2 gap-3 border-t border-white/10 pt-8 sm:grid-cols-4 sm:gap-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono-code">
              Budget Engine
            </span>
            <span className="mt-1 text-sm font-medium text-white flex items-center gap-1 font-mono-code">
              <Zap className="h-3 w-3 text-[#0066ff]" /> 100% Normalised
            </span>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono-code">
              Timeline Scaling
            </span>
            <span className="mt-1 text-sm font-medium text-white flex items-center gap-1 font-mono-code">
              <Zap className="h-3 w-3 text-[#0066ff]" /> Urgency Flagged
            </span>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono-code">
              Chat Plan Edits
            </span>
            <span className="mt-1 text-sm font-medium text-white flex items-center gap-1 font-mono-code">
              <MessageSquareCode className="h-3 w-3 text-[#0066ff]" /> Diff &amp; Undo Stack
            </span>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-mono-code">
              Fault Tolerance
            </span>
            <span className="mt-1 text-sm font-medium text-white flex items-center gap-1 font-mono-code">
              <ShieldCheck className="h-3 w-3 text-[#0066ff]" /> Offline Fallbacks
            </span>
          </div>
        </div>

        <div className="mt-10 flex justify-center text-zinc-400">
          <a
            href="#events"
            aria-label="Scroll to Event Archetypes"
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-mono-code hover:text-white transition-colors"
          >
            <span>Explore Archetypes</span>
            <ArrowDown className="h-3 w-3 animate-bounce text-[#0066ff]" />
          </a>
        </div>
      </div>
    </section>
  );
};

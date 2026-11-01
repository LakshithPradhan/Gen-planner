import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';

interface NavbarProps {
  onOpenInitiate: () => void;
  onOpenChat: () => void;
  hasActivePlan: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenInitiate,
  onOpenChat,
  hasActivePlan,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#08080a]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Mark */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 text-white no-underline group">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#0066ff]/60 bg-[#0066ff]/10 text-xs font-bold text-[#0066ff] shadow-[0_0_10px_rgba(0,102,255,0.4)] group-hover:border-[#0066ff] transition-all">
              E
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wider uppercase text-white font-mono-code">
                Evora <span className="text-[#0066ff] font-serif-display italic lowercase text-base">studio</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono-code">
                Event Planner
              </span>
            </div>
          </a>

          <div className="hidden items-center gap-2 border-l border-white/10 pl-3 md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0066ff] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0066ff]"></span>
            </span>
            <span className="text-[10px] tracking-widest text-zinc-400 font-mono-code">
              SYS.STATUS — ONLINE
            </span>
          </div>
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center justify-center gap-2 sm:gap-4 md:flex-1 md:justify-evenly">
          <a
            href="#events"
            className="hidden text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition-colors font-mono-code md:block"
          >
            Archetypes
          </a>
          <a
            href="#capabilities"
            className="hidden text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition-colors font-mono-code md:block"
          >
            Capabilities
          </a>
          {hasActivePlan && (
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 rounded-sm border border-[#0066ff]/40 bg-[#0052cc] px-2.5 py-1.5 text-xs font-mono-code text-white hover:bg-[#0043a8] active:bg-[#003b94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a] transition-all shadow-[0_0_10px_rgba(0,102,255,0.2)]"
              title="Talk to AI to modify plan"
            >
              <Terminal className="h-3.5 w-3.5 text-[#0066ff]" />
              <span className="hidden sm:inline">AI Chat Editor</span>
              <span className="sm:hidden">Chat</span>
            </button>
          )}

          <button
            onClick={onOpenInitiate}
            className="flex items-center gap-1.5 rounded-sm bg-[#0052cc] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#0043a8] active:bg-[#003b94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a] transition-all shadow-[0_0_15px_rgba(0,102,255,0.4)] hover:shadow-[0_0_20px_rgba(0,102,255,0.6)] cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-mono-code uppercase tracking-wider text-[11px]">
              {hasActivePlan ? 'New Plan' : 'Initiate Plan'}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};

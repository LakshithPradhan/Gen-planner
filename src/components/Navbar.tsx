import React from 'react';
import { Sparkles, Terminal, FileText, Share2, Layers } from 'lucide-react';

interface NavbarProps {
  onOpenInitiate: () => void;
  onOpenChat: () => void;
  onShare: () => void;
  hasActivePlan: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenInitiate,
  onOpenChat,
  onShare,
  hasActivePlan,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#08080a]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Mark */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 text-white no-underline group">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#0066ff]/60 bg-[#0066ff]/10 text-xs font-bold text-[#0066ff] shadow-[0_0_10px_rgba(0,102,255,0.4)] group-hover:border-[#0066ff] transition-all">
              J
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wider uppercase text-white font-mono-code">
                Jashn <span className="text-[#0066ff] font-serif-display italic lowercase text-base">studio</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono-code">
                GenAI Event Architecture
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
        <nav className="flex items-center gap-2 sm:gap-4">
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
          <a
            href="/cast-and-render.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-[11px] uppercase tracking-wider text-zinc-400 hover:text-[#0066ff] transition-colors font-mono-code lg:inline-flex items-center gap-1 border border-white/10 px-2 py-1 rounded"
            title="Open the standalone Cast & Render scroll-scrubbed video page"
          >
            <Layers className="h-3 w-3 text-[#0066ff]" />
            Cast &amp; Render Reel
          </a>

          <a
            href="/jashn-celebration-planner.zip"
            download="jashn-celebration-planner.zip"
            className="hidden text-[11px] uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors font-mono-code sm:inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 rounded hover:bg-emerald-500/20"
            title="Download full project code as ZIP file"
          >
            <FileText className="h-3 w-3" />
            <span>Download ZIP</span>
          </a>

          {hasActivePlan && (
            <>
              <button
                onClick={onOpenChat}
                className="flex items-center gap-1.5 rounded-sm border border-[#0066ff]/40 bg-[#0066ff]/10 px-2.5 py-1.5 text-xs font-mono-code text-[#3b82f6] hover:bg-[#0066ff]/20 hover:text-white transition-all shadow-[0_0_10px_rgba(0,102,255,0.2)]"
                title="Talk to AI to modify plan"
              >
                <Terminal className="h-3.5 w-3.5 text-[#0066ff]" />
                <span className="hidden sm:inline">AI Chat Editor</span>
                <span className="sm:hidden">Chat</span>
              </button>

              <button
                onClick={onShare}
                className="flex items-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-mono-code text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                title="Get shareable read-only link"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenInitiate}
            className="flex items-center gap-1.5 rounded-sm bg-[#0066ff] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#0055d4] transition-all shadow-[0_0_15px_rgba(0,102,255,0.4)] hover:shadow-[0_0_20px_rgba(0,102,255,0.6)] cursor-pointer"
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

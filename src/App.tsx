import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CelebrationPlan, EventType, PlanRequestInput } from './types/plan';
import { getBuiltinTemplate } from './lib/templates';
import {
  savePlanToStorage,
  loadPlanFromStorage,
  generateShareUrl,
  parseSharedPlanFromUrl,
} from './lib/storage';
import { DiffDetail } from './lib/operations';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { EventTypesSection } from './components/EventTypesSection';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { PlanDashboard } from './components/PlanDashboard';
import { CommandCenterModal } from './components/CommandCenterModal';
import { PlanChatModal } from './components/PlanChatModal';
import { DiffModal } from './components/DiffModal';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { CheckCircle2, Copy, Sparkles, X } from 'lucide-react';

export default function App() {
  // Initialize plan from shared URL or localStorage or default wedding template
  const [plan, setPlan] = useState<CelebrationPlan>(() => {
    const shared = parseSharedPlanFromUrl();
    if (shared) return shared;
    const stored = loadPlanFromStorage();
    if (stored) return stored;
    return getBuiltinTemplate('wedding');
  });

  // Undo Stack: array of previous snapshots
  const [undoStack, setUndoStack] = useState<CelebrationPlan[]>([]);

  // Modals state
  const [isInitiateOpen, setIsInitiateOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [currentDiffs, setCurrentDiffs] = useState<DiffDetail[]>([]);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Transient Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Sync with localStorage
  useEffect(() => {
    savePlanToStorage(plan);
  }, [plan]);

  // Handle plan update from direct UI editing (sliders, checklist, etc.)
  const handleUpdatePlan = (updatedPlan: CelebrationPlan) => {
    setUndoStack((prev) => [...prev.slice(-15), plan]);
    setPlan(updatedPlan);
  };

  // Handle plan update from AI Chat with visual before/after diff
  const handlePlanMutatedByChat = (
    updatedPlan: CelebrationPlan,
    diffs: DiffDetail[],
    explanation: string
  ) => {
    setUndoStack((prev) => [...prev.slice(-15), plan]);
    setPlan(updatedPlan);
    setCurrentDiffs(diffs);
    setAiExplanation(explanation);
    setIsDiffOpen(true);
  };

  // Undo action
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setPlan(previous);
    showToast('Reverted plan to previous state (Undo successful)');
  };

  // Quick Archetype Loader
  const handleSelectArchetype = (type: EventType) => {
    const newTemplate = getBuiltinTemplate(type);
    setUndoStack((prev) => [...prev.slice(-15), plan]);
    setPlan(newTemplate);
    showToast(`Loaded ${type === 'wedding' ? 'Royal Wedding' : type === 'birthday' ? 'Milestone Birthday' : 'Community Fest'} Archetype`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });

    // Smooth scroll down to dashboard
    const dash = document.getElementById('dashboard');
    if (dash) {
      dash.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Submit Brief from CommandCenter
  const handleInitiatePlan = async (params: PlanRequestInput) => {
    setIsLoadingPlan(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const newPlan: CelebrationPlan = await res.json();
      setUndoStack((prev) => [...prev.slice(-15), plan]);
      setPlan(newPlan);
      setIsInitiateOpen(false);
      showToast(`Celebration plan created for "${newPlan.eventName}"!`);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

      setTimeout(() => {
        const dash = document.getElementById('dashboard');
        if (dash) dash.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.warn('API call fallback to built-in generator:', err);
      const fallbackPlan = getBuiltinTemplate(params.eventType, {
        eventName: params.eventName,
        date: params.date,
        guests: params.guests,
        currency: params.currency,
        totalBudget: params.totalBudget,
        city: params.city,
        vibeNotes: params.vibeNotes,
      });
      setUndoStack((prev) => [...prev.slice(-15), plan]);
      setPlan(fallbackPlan);
      setIsInitiateOpen(false);
      showToast(`Formulated plan for "${fallbackPlan.eventName}" (Offline Generator)`);

      setTimeout(() => {
        const dash = document.getElementById('dashboard');
        if (dash) dash.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  // Share link handler
  const handleShare = () => {
    const url = generateShareUrl(plan);
    setShareUrl(url);
    setIsShareModalOpen(true);
    try {
      navigator.clipboard.writeText(url);
      showToast('Share link copied to clipboard!');
    } catch {
      // Handled in modal
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f0f0f3] flex flex-col selection:bg-[#0066ff] selection:text-white">
      {/* Custom Electric-Blue Interactive Cursor */}
      <CustomCursor />

      {/* Global Navbar */}
      <Navbar
        onOpenInitiate={() => setIsInitiateOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        hasActivePlan={!!plan}
      />

      {/* Main Sections */}
      <main className="flex-1">
        <HeroSection
          onOpenInitiate={() => setIsInitiateOpen(true)}
          onLoadSample={handleSelectArchetype}
        />

        <EventTypesSection onSelectType={handleSelectArchetype} />

        <CapabilitiesSection />

        <PlanDashboard
          plan={plan}
          onUpdatePlan={handleUpdatePlan}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenInitiate={() => setIsInitiateOpen(true)}
          onShare={handleShare}
          canUndo={undoStack.length > 0}
          onUndo={handleUndo}
        />
      </main>

      {/* Minimal Footer with AI Disclaimer */}
      <Footer />

      {/* Command Center Modal */}
      <CommandCenterModal
        isOpen={isInitiateOpen}
        onClose={() => setIsInitiateOpen(false)}
        onSubmit={handleInitiatePlan}
        isLoading={isLoadingPlan}
      />

      {/* Standout Feature: Plan Chat Editor */}
      <PlanChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        plan={plan}
        onPlanUpdated={handlePlanMutatedByChat}
        canUndo={undoStack.length > 0}
        onUndo={handleUndo}
      />

      {/* Mutation Diff Review Modal */}
      <DiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        diffs={currentDiffs}
        aiExplanation={aiExplanation}
        onUndo={handleUndo}
      />

      {/* Share Modal */}
      {isShareModalOpen && (
        <div
          className="readable-content fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-sm border border-white/15 bg-[#101014] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="text-sm font-semibold uppercase font-mono-code text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0066ff]" />
                Shareable Celebration Blueprint
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-light mb-4">
              This URL encapsulates your entire celebration plan within a compressed hash. Anyone
              opening this link can view the exact budget splits, timelines, vendors, and ideas!
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-xs border border-white/10 bg-black/60 px-3 py-2 text-xs font-mono-code text-zinc-300 focus:outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  showToast('Copied to clipboard!');
                }}
                className="flex items-center gap-1 rounded-xs bg-[#0066ff] px-4 py-2 text-xs font-mono-code uppercase font-semibold text-white hover:bg-[#0052cc] transition-all cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          className="readable-content fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-sm border border-[#0066ff]/40 bg-[#0e0e14] px-4 py-3 text-xs font-mono-code text-white shadow-[0_0_25px_rgba(0,102,255,0.4)] animate-in fade-in slide-in-from-bottom-3"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 text-[#0066ff]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

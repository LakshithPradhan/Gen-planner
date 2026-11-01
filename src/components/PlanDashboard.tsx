import React, { useState } from 'react';
import { CelebrationPlan } from '../types/plan';
import { BudgetView } from './BudgetView';
import { TimelineView } from './TimelineView';
import { VendorChecklist } from './VendorChecklist';
import { IdeasView } from './IdeasView';
import { WhatIfSimulator } from './WhatIfSimulator';
import { formatDate, getDaysLeft } from '../lib/formatters';
import { exportPlanAsText } from '../lib/storage';
import { usePlanEditor } from '../hooks/usePlanEditor';
import {
  PieChart,
  CalendarCheck2,
  Users,
  Lightbulb,
  Sliders,
  Terminal,
  Download,
  Share2,
  MapPin,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface PlanDashboardProps {
  plan: CelebrationPlan;
  onUpdatePlan: (updatedPlan: CelebrationPlan) => void;
  onOpenChat: () => void;
  onShare: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

export const PlanDashboard: React.FC<PlanDashboardProps> = ({
  plan,
  onUpdatePlan,
  onOpenChat,
  onShare,
  canUndo,
  onUndo,
}) => {
  const [activeTab, setActiveTab] = useState<'budget' | 'timeline' | 'vendors' | 'ideas' | 'whatif'>('budget');
  const [copiedExport, setCopiedExport] = useState(false);
  const {
    handleUpdateCategoryPct,
    handleUpdateCategorySpent,
    handleNormalizeBudget,
    handleToggleTask,
    handleAddTask,
    handleUpdateVendorStatus,
    handleAddVendor,
    handleDeleteVendor,
    handleAddIdeas,
  } = usePlanEditor(plan, onUpdatePlan);

  const daysLeft = getDaysLeft(plan.targetDate);

  const handleExportBrief = () => {
    const briefText = exportPlanAsText(plan);
    const blob = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.eventName.replace(/\s+/g, '_')}_Plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <section id="dashboard" className="readable-content border-b border-white/10 px-4 py-12 sm:px-6 lg:px-8 bg-[#09090c]">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Plan Header Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-sm border border-white/10 bg-[#121217] p-6 shadow-xl">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-xs bg-[#0066ff]/20 border border-[#0066ff]/50 px-2.5 py-0.5 text-[10px] font-mono-code uppercase font-semibold text-[#3b82f6]">
                ARCHETYPE: {plan.eventType}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono-code text-zinc-400">
                <MapPin className="h-3 w-3 text-[#0066ff]" />
                {plan.city}
              </span>
              <span className="text-zinc-400">&middot;</span>
              <span className="flex items-center gap-1 text-[11px] font-mono-code text-zinc-400">
                <Clock className="h-3 w-3 text-[#0066ff]" />
                {formatDate(plan.targetDate)} ({daysLeft > 0 ? `${daysLeft} days left` : 'Event Day'})
              </span>
            </div>

            <h2 className="text-[2rem] sm:text-4xl font-serif-display uppercase text-white tracking-tight">
              {plan.eventName}
            </h2>

            <p className="mt-1 text-xs text-zinc-400 font-light max-w-2xl">
              {plan.vibeNotes || 'AI-curated celebration plan with custom budget, timeline, and vendor matrix.'}
            </p>
          </div>

          {/* Quick Dashboard Action Bar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canUndo && (
              <button
                onClick={onUndo}
                className="flex items-center gap-1.5 rounded-xs border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono-code uppercase text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Undo last modification"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#0066ff]" />
                <span>Undo</span>
              </button>
            )}

            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 rounded-xs bg-[#0066ff] px-4 py-2 text-xs font-mono-code uppercase font-semibold text-white hover:bg-[#0052cc] transition-all shadow-[0_0_20px_rgba(0,102,255,0.4)] cursor-pointer"
            >
              <Terminal className="h-4 w-4" />
              <span>Talk to Edit Plan</span>
            </button>

            <button
              onClick={onShare}
              className="flex items-center gap-1.5 rounded-xs border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono-code uppercase text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Copy share link"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={handleExportBrief}
              className="flex items-center gap-1.5 rounded-xs border border-white/15 bg-white/5 px-3 py-2 text-xs font-mono-code uppercase text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Download text brief"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{copiedExport ? 'Downloaded' : 'Export'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex overflow-x-auto border-b border-white/10 pb-px gap-2">
          {([
            { id: 'budget', label: 'Financials & Budget', icon: PieChart },
            { id: 'timeline', label: 'Temporal Timeline', icon: CalendarCheck2 },
            { id: 'vendors', label: 'Procurement & Vendors', icon: Users },
            { id: 'ideas', label: 'Personalised Ideas', icon: Lightbulb },
            { id: 'whatif', label: 'What-If Lab & Health', icon: Sliders },
          ] satisfies Array<{
            id: typeof activeTab;
            label: string;
            icon: typeof PieChart;
          }>).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-xs font-mono-code uppercase border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#0066ff] bg-[#0066ff]/10 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#0066ff]' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab View Content */}
        <div>
          {activeTab === 'budget' && (
            <BudgetView
              categories={plan.budgetCategories}
              totalBudget={plan.totalBudget}
              guestCount={plan.guestCount}
              currency={plan.currency}
              onUpdateCategoryPct={handleUpdateCategoryPct}
              onUpdateCategorySpent={handleUpdateCategorySpent}
              onNormalize={handleNormalizeBudget}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView
              tasks={plan.timeline}
              targetDate={plan.targetDate}
              onToggleTask={handleToggleTask}
              onAddTask={handleAddTask}
            />
          )}

          {activeTab === 'vendors' && (
            <VendorChecklist
              vendors={plan.vendors}
              currency={plan.currency}
              onUpdateStatus={handleUpdateVendorStatus}
              onAddVendor={handleAddVendor}
              onDeleteVendor={handleDeleteVendor}
            />
          )}

          {activeTab === 'ideas' && (
            <IdeasView ideas={plan.ideas} plan={plan} onAddIdeas={handleAddIdeas} />
          )}

          {activeTab === 'whatif' && (
            <WhatIfSimulator plan={plan} onApplyScenario={onUpdatePlan} />
          )}
        </div>
      </div>
    </section>
  );
};

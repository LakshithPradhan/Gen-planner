import React, { useState } from 'react';
import { CelebrationPlan, VendorStatus } from '../types/plan';
import { BudgetView } from './BudgetView';
import { TimelineView } from './TimelineView';
import { VendorChecklist } from './VendorChecklist';
import { IdeasView } from './IdeasView';
import { WhatIfSimulator } from './WhatIfSimulator';
import { formatCurrency, formatDate, getDaysLeft } from '../lib/formatters';
import { exportPlanAsText } from '../lib/storage';
import {
  PieChart,
  CalendarCheck2,
  Users,
  Lightbulb,
  Sliders,
  Terminal,
  Download,
  Share2,
  Sparkles,
  MapPin,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface PlanDashboardProps {
  plan: CelebrationPlan;
  onUpdatePlan: (updatedPlan: CelebrationPlan) => void;
  onOpenChat: () => void;
  onOpenInitiate: () => void;
  onShare: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

export const PlanDashboard: React.FC<PlanDashboardProps> = ({
  plan,
  onUpdatePlan,
  onOpenChat,
  onOpenInitiate,
  onShare,
  canUndo,
  onUndo,
}) => {
  const [activeTab, setActiveTab] = useState<'budget' | 'timeline' | 'vendors' | 'ideas' | 'whatif'>('budget');
  const [copiedExport, setCopiedExport] = useState(false);

  const daysLeft = getDaysLeft(plan.targetDate);

  // Budget category handlers
  const handleUpdateCategoryPct = (catId: string, pct: number) => {
    const nextCategories = plan.budgetCategories.map((c) =>
      c.id === catId ? { ...c, percentage: Math.max(0, Math.min(100, pct)) } : c
    );
    onUpdatePlan({ ...plan, budgetCategories: nextCategories });
  };

  const handleUpdateCategorySpent = (catId: string, spent: number) => {
    const nextCategories = plan.budgetCategories.map((c) =>
      c.id === catId ? { ...c, spent: Math.max(0, spent) } : c
    );
    onUpdatePlan({ ...plan, budgetCategories: nextCategories });
  };

  const handleNormalizeBudget = () => {
    // Normalization logic handled via re-calculating equal residue in parent or budget module
    const sum = plan.budgetCategories.reduce((acc, c) => acc + (c.percentage || 0), 0);
    if (sum === 0) return;
    let acc = 0;
    const normalized = plan.budgetCategories.map((c, i) => {
      if (i === plan.budgetCategories.length - 1) {
        return { ...c, percentage: Math.max(0, Math.round((100 - acc) * 10) / 10) };
      }
      const val = Math.round(((c.percentage / sum) * 100) * 10) / 10;
      acc += val;
      return { ...c, percentage: val };
    });
    onUpdatePlan({ ...plan, budgetCategories: normalized });
  };

  // Timeline handlers
  const handleToggleTask = (taskId: string, completed: boolean) => {
    const nextTimeline = plan.timeline.map((t) =>
      t.id === taskId ? { ...t, completed } : t
    );
    onUpdatePlan({ ...plan, timeline: nextTimeline });
  };

  const handleAddTask = (title: string, daysBeforeEvent: number, phase: string, isUrgent: boolean) => {
    const targetDate = new Date(plan.targetDate);
    targetDate.setDate(targetDate.getDate() - daysBeforeEvent);
    const newTask = {
      id: `task_${Date.now()}`,
      title,
      phase,
      daysBeforeEvent,
      dueDate: targetDate.toISOString().split('T')[0],
      completed: false,
      isUrgent,
    };
    onUpdatePlan({ ...plan, timeline: [newTask, ...plan.timeline] });
  };

  // Vendor handlers
  const handleUpdateVendorStatus = (vendorId: string, status: VendorStatus) => {
    const nextVendors = plan.vendors.map((v) =>
      v.id === vendorId ? { ...v, status } : v
    );
    onUpdatePlan({ ...plan, vendors: nextVendors });
  };

  const handleAddVendor = (newVendor: { name: string; category: string; estimatedCost: number; whatToConfirm: string }) => {
    const vendorObj = {
      id: `vendor_${Date.now()}`,
      name: newVendor.name,
      category: newVendor.category,
      estimatedCost: newVendor.estimatedCost,
      status: 'To contact' as VendorStatus,
      whatToConfirm: newVendor.whatToConfirm,
    };
    onUpdatePlan({ ...plan, vendors: [...plan.vendors, vendorObj] });
  };

  const handleDeleteVendor = (vendorId: string) => {
    const nextVendors = plan.vendors.filter((v) => v.id !== vendorId);
    onUpdatePlan({ ...plan, vendors: nextVendors });
  };

  // Ideas handler
  const handleAddIdeas = (newIdeas: any[]) => {
    onUpdatePlan({ ...plan, ideas: [...plan.ideas, ...newIdeas] });
  };

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
          {[
            { id: 'budget', label: 'Financials & Budget', icon: PieChart },
            { id: 'timeline', label: 'Temporal Timeline', icon: CalendarCheck2 },
            { id: 'vendors', label: 'Procurement & Vendors', icon: Users },
            { id: 'ideas', label: 'Personalised Ideas', icon: Lightbulb },
            { id: 'whatif', label: 'What-If Lab & Health', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

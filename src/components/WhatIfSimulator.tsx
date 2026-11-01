import React, { useState, useEffect } from 'react';
import { CelebrationPlan } from '../types/plan';
import { calculatePlanHealth } from '../lib/healthScore';
import { calculateBudgetSummary } from '../lib/budget';
import { scaleTimelineTasks } from '../lib/timeline';
import { formatCurrency, getDaysLeft } from '../lib/formatters';
import { addDaysToDateOnly, getLocalDateOnly } from '../lib/dateOnly';
import { Sliders, AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, RotateCcw } from 'lucide-react';

interface WhatIfSimulatorProps {
  plan: CelebrationPlan;
  onApplyScenario: (updatedPlan: CelebrationPlan) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ plan, onApplyScenario }) => {
  const originalDays = getDaysLeft(plan.targetDate);

  // Local simulation state
  const [simGuests, setSimGuests] = useState(plan.guestCount);
  const [simBudget, setSimBudget] = useState(plan.totalBudget);
  const [simDays, setSimDays] = useState(originalDays > 0 ? originalDays : 30);

  // Sync if plan changes externally
  useEffect(() => {
    setSimGuests(plan.guestCount);
    setSimBudget(plan.totalBudget);
    setSimDays(originalDays > 0 ? originalDays : 30);
  }, [plan.guestCount, plan.totalBudget, plan.targetDate]);

  // Derive target date string for simulated days left
  const simTargetDateStr = addDaysToDateOnly(getLocalDateOnly(), simDays);

  // Construct simulated plan
  const simulatedPlan: CelebrationPlan = {
    ...plan,
    guestCount: simGuests,
    totalBudget: simBudget,
    targetDate: simTargetDateStr,
  };

  const health = calculatePlanHealth(simulatedPlan);
  const budgetSummary = calculateBudgetSummary(simBudget, simGuests, plan.budgetCategories);
  const scaledTimeline = scaleTimelineTasks(plan.timeline, simDays, simTargetDateStr);

  const hasModifications =
    simGuests !== plan.guestCount ||
    simBudget !== plan.totalBudget ||
    simDays !== (originalDays > 0 ? originalDays : 30);

  const handleReset = () => {
    setSimGuests(plan.guestCount);
    setSimBudget(plan.totalBudget);
    setSimDays(originalDays > 0 ? originalDays : 30);
  };

  const handleApply = () => {
    onApplyScenario(simulatedPlan);
  };

  // Color selection based on health score
  let scoreColor = '#10b981'; // emerald
  if (health.score < 50) scoreColor = '#ef4444'; // red
  else if (health.score < 70) scoreColor = '#f59e0b'; // amber
  else if (health.score < 85) scoreColor = '#0066ff'; // blue

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="rounded-sm border border-white/10 bg-[#101014] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-[#0066ff]/20 text-[#0066ff]">
                <Sliders className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-base font-semibold uppercase tracking-wider text-white font-mono-code">
                Real-Time "What-If" Stress Test Engine
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-400 font-light">
              Simulate volatile conditions (crowd shifts, budget compression, date crunches) and
              view automatic health diagnostics instantly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasModifications && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-xs border border-white/10 px-3 py-1.5 text-xs font-mono-code uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}

            <button
              onClick={handleApply}
              disabled={!hasModifications}
              className="flex items-center gap-1.5 rounded-xs bg-[#0066ff] px-4 py-1.5 text-xs font-mono-code uppercase text-white hover:bg-[#0055d4] transition-all disabled:opacity-30 cursor-pointer shadow-[0_0_15px_rgba(0,102,255,0.4)]"
            >
              <span>Lock Scenario into Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 3 Live Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Guest Count Slider */}
          <div className="rounded-xs border border-white/5 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="sim-guests" className="text-xs font-mono-code uppercase text-zinc-400">
                Guest Count
              </label>
              <span className="text-sm font-semibold font-mono-code text-white">
                {simGuests} attendees
              </span>
            </div>
            <input
              id="sim-guests"
              type="range"
              min="10"
              max={plan.eventType === 'wedding' ? '1200' : '600'}
              step="5"
              value={simGuests}
              onChange={(e) => setSimGuests(parseInt(e.target.value, 10))}
              className="w-full accent-[#0066ff] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono-code text-zinc-400 mt-1">
              <span>10</span>
              <span>Per-Guest: {formatCurrency(budgetSummary.perGuestPlanned, plan.currency)}</span>
              <span>{plan.eventType === 'wedding' ? '1200' : '600'}</span>
            </div>
          </div>

          {/* Total Budget Slider */}
          <div className="rounded-xs border border-white/5 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="sim-budget" className="text-xs font-mono-code uppercase text-zinc-400">
                Total Budget
              </label>
              <span className="text-sm font-semibold font-mono-code text-[#0066ff]">
                {formatCurrency(simBudget, plan.currency, true)}
              </span>
            </div>
            <input
              id="sim-budget"
              type="range"
              min={plan.currency === 'INR' ? '50000' : '2000'}
              max={plan.currency === 'INR' ? '5000000' : '100000'}
              step={plan.currency === 'INR' ? '25000' : '1000'}
              value={simBudget}
              onChange={(e) => setSimBudget(parseInt(e.target.value, 10))}
              className="w-full accent-[#0066ff] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono-code text-zinc-400 mt-1">
              <span>Min</span>
              <span>{formatCurrency(simBudget, plan.currency)}</span>
              <span>Max</span>
            </div>
          </div>

          {/* Days Left Slider */}
          <div className="rounded-xs border border-white/5 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="sim-days" className="text-xs font-mono-code uppercase text-zinc-400">
                Days Until Event
              </label>
              <span className={`text-sm font-semibold font-mono-code ${
                simDays <= 14 ? 'text-amber-400' : 'text-white'
              }`}>
                {simDays} Days Left
              </span>
            </div>
            <input
              id="sim-days"
              type="range"
              min="2"
              max="180"
              step="1"
              value={simDays}
              onChange={(e) => setSimDays(parseInt(e.target.value, 10))}
              className="w-full accent-[#0066ff] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono-code text-zinc-400 mt-1">
              <span>2d (Rush)</span>
              <span>{scaledTimeline.urgentCount} Tasks Urgent</span>
              <span>180d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Health Diagnostics & Score Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Gauge */}
        <div className="flex flex-col items-center justify-center rounded-sm border border-white/10 bg-[#101014] p-6 text-center">
          <span className="text-xs uppercase font-mono-code tracking-widest text-zinc-400 mb-4">
            Autonomous Health Score
          </span>

          <div className="relative flex h-40 w-40 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={scoreColor}
                strokeWidth="10"
                strokeDasharray={`${(health.score / 100) * 251.2} 251.2`}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono-code text-white">
                {health.score}
              </span>
              <span
                className="text-[10px] uppercase font-mono-code font-bold tracking-widest px-2 py-0.5 rounded-xs mt-1"
                style={{ color: scoreColor, backgroundColor: `${scoreColor}20` }}
              >
                {health.rating}
              </span>
            </div>
          </div>

          {/* Sub-health metrics */}
          <div className="mt-6 grid grid-cols-3 gap-2 w-full border-t border-white/10 pt-4 text-center">
            <div>
              <span className="text-[9px] uppercase font-mono-code text-zinc-400 block">
                Budget
              </span>
              <span className="text-xs font-semibold font-mono-code text-white">
                {health.metrics.budgetHealth}%
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-mono-code text-zinc-400 block">
                Timeline
              </span>
              <span className="text-xs font-semibold font-mono-code text-white">
                {health.metrics.timelineHealth}%
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-mono-code text-zinc-400 block">
                Vendors
              </span>
              <span className="text-xs font-semibold font-mono-code text-white">
                {health.metrics.vendorHealth}%
              </span>
            </div>
          </div>
        </div>

        {/* Actionable Flags List */}
        <div className="lg:col-span-2 rounded-sm border border-white/10 bg-[#101014] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white font-mono-code">
              Diagnostic Flags &amp; Risk Mitigation
            </h4>
            <span className="text-[10px] font-mono-code text-zinc-400">
              {health.flags.length} Automated Checks Active
            </span>
          </div>

          <div className="space-y-3">
            {health.flags.length === 0 ? (
              <div className="flex items-center gap-2 p-4 text-xs font-mono-code text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 rounded-xs">
                <CheckCircle className="h-4 w-4" />
                All simulation parameters are within recommended bounds.
              </div>
            ) : (
              health.flags.map((flag) => {
                let badgeClass = 'border-white/10 bg-white/5 text-zinc-300';
                let Icon = ShieldAlert;
                if (flag.type === 'critical') {
                  badgeClass = 'border-red-500/40 bg-red-950/20 text-red-300';
                  Icon = AlertTriangle;
                } else if (flag.type === 'warning') {
                  badgeClass = 'border-amber-500/40 bg-amber-950/20 text-amber-300';
                  Icon = AlertTriangle;
                } else if (flag.type === 'good') {
                  badgeClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
                  Icon = CheckCircle;
                }

                return (
                  <div
                    key={flag.id}
                    className={`rounded-xs border p-3.5 transition-all ${badgeClass}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase font-mono-code">
                            {flag.title}
                          </span>
                          <span className="text-[9px] uppercase font-mono-code px-1.5 py-0.5 rounded-xs bg-black/40">
                            {flag.type}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-light leading-relaxed text-zinc-300">
                          {flag.message}
                        </p>
                        {flag.remedy && (
                          <div className="mt-2 text-[11px] font-mono-code text-[#3b82f6] border-t border-white/5 pt-1.5">
                            › Actionable Remedy: {flag.remedy}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

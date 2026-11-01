import React from 'react';
import { BudgetCategory, CurrencyCode } from '../types/plan';
import { calculateBudgetSummary } from '../lib/budget';
import { formatCurrency } from '../lib/formatters';
import { DonutChart } from './DonutChart';
import { AlertCircle, CheckCircle2, RotateCcw, Scale } from 'lucide-react';

interface BudgetViewProps {
  categories: BudgetCategory[];
  totalBudget: number;
  guestCount: number;
  currency: CurrencyCode;
  onUpdateCategoryPct: (id: string, pct: number) => void;
  onUpdateCategorySpent: (id: string, spent: number) => void;
  onNormalize: () => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  categories,
  totalBudget,
  guestCount,
  currency,
  onUpdateCategoryPct,
  onUpdateCategorySpent,
  onNormalize,
}) => {
  const summary = calculateBudgetSummary(totalBudget, guestCount, categories);
  const currentSum = Math.round(categories.reduce((acc, c) => acc + (Number(c.percentage) || 0), 0) * 10) / 10;
  const isBalanced = Math.abs(currentSum - 100) < 0.1;

  return (
    <div className="space-y-8">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-sm border border-white/10 bg-[#121216] p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono-code block">
            Total Budget
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-semibold text-white font-mono-code block">
            {formatCurrency(summary.totalBudget, currency)}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono-code">
            AI Baseline Target
          </span>
        </div>

        <div className="rounded-sm border border-white/10 bg-[#121216] p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono-code block">
            Total Spent
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-semibold text-white font-mono-code block">
            {formatCurrency(summary.totalSpent, currency)}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono-code">
            {Math.round((summary.totalSpent / Math.max(1, summary.totalBudget)) * 100)}% committed
          </span>
        </div>

        <div className={`rounded-sm border p-4 ${
          summary.isOverBudget
            ? 'border-red-500/40 bg-red-950/20 text-red-200'
            : 'border-white/10 bg-[#121216]'
        }`}>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono-code block">
            Remaining Funds
          </span>
          <span className={`mt-1 text-xl sm:text-2xl font-semibold font-mono-code block ${
            summary.isOverBudget ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {formatCurrency(summary.totalRemaining, currency)}
          </span>
          <span className="text-[10px] font-mono-code flex items-center gap-1">
            {summary.isOverBudget ? (
              <>
                <AlertCircle className="h-3 w-3 text-red-400" /> Over budget deficit
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Available runway
              </>
            )}
          </span>
        </div>

        <div className="rounded-sm border border-white/10 bg-[#121216] p-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono-code block">
            Per-Guest Cost
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-semibold text-[#0066ff] font-mono-code block">
            {formatCurrency(summary.perGuestPlanned, currency)}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono-code">
            Based on {guestCount} guests
          </span>
        </div>
      </div>

      {/* Main Budget Grid: Donut Chart + Balance Controls & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Donut Chart & Balance Status */}
        <div className="flex flex-col justify-between rounded-sm border border-white/10 bg-[#101014] p-6">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase font-mono-code tracking-wider text-zinc-300">
                Visual Allocation Split
              </span>
              <span className={`text-[10px] font-mono-code px-2 py-0.5 rounded-xs ${
                isBalanced
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                Sum: {currentSum}% {isBalanced ? '✓' : '⚠️'}
              </span>
            </div>

            <div className="py-6">
              <DonutChart categories={categories} totalBudget={totalBudget} currency={currency} />
            </div>

            <p className="text-[11px] text-zinc-400 text-center font-light leading-relaxed">
              Hover over donut slices to inspect precise financial commitments. All cost metrics
              are designated as AI estimates for planning guidance.
            </p>
          </div>

          {!isBalanced && (
            <div className="mt-4 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <div className="flex items-center justify-between gap-2">
                <span>Total is {currentSum}%. Click rebalance to restore exact 100%.</span>
                <button
                  onClick={onNormalize}
                  className="flex items-center gap-1 bg-amber-500 text-black px-2.5 py-1 text-[11px] font-bold font-mono-code uppercase rounded-xs hover:bg-amber-400 cursor-pointer"
                >
                  <Scale className="h-3 w-3" /> Rebalance
                </button>
              </div>
            </div>
          )}

          {isBalanced && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={onNormalize}
                className="flex items-center gap-1.5 text-[11px] font-mono-code text-zinc-400 hover:text-white transition-colors"
                title="Equally redistribute remaining rounding residue"
              >
                <RotateCcw className="h-3 w-3 text-[#0066ff]" /> Auto-rebalance percentages
              </button>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Editable Category Table */}
        <div className="lg:col-span-2 rounded-sm border border-white/10 bg-[#101014] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono-code">
                Category Allocations &amp; Realized Spend
              </h3>
              <p className="text-xs text-zinc-400">
                Adjust percentage shares or enter actual receipts below to update live calculations.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {summary.categories.map((cat) => {
              const isOverCat = cat.spent > cat.plannedAmount;
              return (
                <div
                  key={cat.id}
                  className="rounded-xs border border-white/5 bg-black/40 p-3.5 hover:border-white/15 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-3 w-3 shrink-0 rounded-xs"
                        style={{ backgroundColor: cat.color || '#0066ff' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{cat.name}</span>
                          {cat.description && (
                            <span className="hidden sm:inline text-[10px] text-zinc-400 font-light truncate max-w-xs">
                              &middot; {cat.description}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono-code text-zinc-300">
                          Target: {formatCurrency(cat.plannedAmount, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Inputs: % share and Spent amount */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <label htmlFor={`pct-${cat.id}`} className="text-[10px] uppercase font-mono-code text-zinc-400">
                          Share
                        </label>
                        <div className="relative">
                          <input
                            id={`pct-${cat.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={cat.percentage}
                            onChange={(e) => onUpdateCategoryPct(cat.id, parseFloat(e.target.value) || 0)}
                            className="w-16 rounded-xs border border-white/15 bg-white/5 px-2 py-1 text-right text-xs font-mono-code text-white focus:border-[#0066ff] focus:outline-none"
                          />
                          <span className="absolute right-6 top-1 text-xs text-zinc-400 pointer-events-none"></span>
                        </div>
                        <span className="text-xs font-mono-code text-zinc-400">%</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label htmlFor={`spent-${cat.id}`} className="text-[10px] uppercase font-mono-code text-zinc-400">
                          Spent
                        </label>
                        <input
                          id={`spent-${cat.id}`}
                          type="number"
                          min="0"
                          step="500"
                          value={cat.spent || 0}
                          onChange={(e) => onUpdateCategorySpent(cat.id, parseFloat(e.target.value) || 0)}
                          className="w-24 rounded-xs border border-white/15 bg-white/5 px-2 py-1 text-right text-xs font-mono-code text-white focus:border-[#0066ff] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Planned vs Spent Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-mono-code text-zinc-400 mb-1">
                      <span>Spent: {formatCurrency(cat.spent, currency)}</span>
                      <span className={isOverCat ? 'text-red-400 font-semibold' : 'text-zinc-400'}>
                        {isOverCat
                          ? `Over budget by ${formatCurrency(cat.spent - cat.plannedAmount, currency)}`
                          : `Remaining: ${formatCurrency(cat.remainingAmount, currency)}`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOverCat ? 'bg-red-500' : 'bg-[#0066ff]'
                        }`}
                        style={{ width: `${Math.min(100, cat.spentPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

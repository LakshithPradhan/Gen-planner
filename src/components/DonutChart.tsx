import React, { useState } from 'react';
import { BudgetCategory, CurrencyCode } from '../types/plan';
import { formatCurrency } from '../lib/formatters';

interface DonutChartProps {
  categories: BudgetCategory[];
  totalBudget: number;
  currency: CurrencyCode;
}

export const DonutChart: React.FC<DonutChartProps> = ({ categories, totalBudget, currency }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let cumulativePct = 0;
  const slices = categories.map((cat, idx) => {
    const pct = Math.max(0, cat.percentage || 0);
    const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePct / 100) * circumference);
    cumulativePct += pct;

    const sliceAmount = Math.round((totalBudget * pct) / 100);

    return {
      ...cat,
      idx,
      strokeDasharray,
      strokeDashoffset,
      sliceAmount,
    };
  });

  const activeCategory = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-52 w-52 items-center justify-center">
        <svg
          className="h-full w-full -rotate-90 transform"
          viewBox="0 0 200 200"
          role="img"
          aria-label={`Donut chart representing budget breakdown for total budget of ${formatCurrency(totalBudget, currency)}`}
        >
          {/* Subtle background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            return (
              <circle
                key={slice.id || slice.idx}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={slice.color || '#0066ff'}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 8px rgba(0, 102, 255, 0.7))' : 'none',
                }}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {activeCategory ? (
            <>
              <span className="text-[10px] uppercase font-mono-code text-zinc-400 line-clamp-1">
                {activeCategory.name}
              </span>
              <span className="text-base font-semibold text-white font-mono-code">
                {activeCategory.percentage}%
              </span>
              <span className="text-[10px] text-[#0066ff] font-mono-code">
                {formatCurrency(activeCategory.sliceAmount, currency, true)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider font-mono-code text-zinc-400">
                Total Budget
              </span>
              <span className="text-base font-bold text-white font-mono-code">
                {formatCurrency(totalBudget, currency, true)}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#0066ff] font-mono-code">
                100% Split
              </span>
            </>
          )}
        </div>
      </div>

      {/* Screen reader text alternative table */}
      <div className="sr-only">
        <table>
          <caption>Budget Category Distribution</caption>
          <thead>
            <tr>
              <th>Category</th>
              <th>Percentage</th>
              <th>Estimated Cost</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.percentage}%</td>
                <td>{formatCurrency(s.sliceAmount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import { BudgetCategory } from '../types/plan';

export interface BudgetSummary {
  totalBudget: number;
  totalPlanned: number;
  totalSpent: number;
  totalRemaining: number;
  perGuestPlanned: number;
  perGuestSpent: number;
  isOverBudget: boolean;
  categories: Array<
    BudgetCategory & {
      plannedAmount: number;
      remainingAmount: number;
      spentPercentage: number;
    }
  >;
}

/**
 * Normalizes an array of budget categories so their percentage sum equals exactly 100%.
 * Preserves proportions and distributes rounding differences cleanly.
 */
export function normalizeBudgetCategories(categories: BudgetCategory[]): BudgetCategory[] {
  if (!categories || categories.length === 0) return [];

  const rawSum = categories.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0);

  if (rawSum === 0) {
    const equalShare = Math.floor(100 / categories.length);
    const remainder = 100 - equalShare * categories.length;
    return categories.map((c, i) => ({
      ...c,
      percentage: equalShare + (i < remainder ? 1 : 0),
    }));
  }

  // Scale percentages to 100
  let accumulated = 0;
  const scaled = categories.map((c, i) => {
    if (i === categories.length - 1) {
      // Last category absorbs any decimal residue to guarantee exact 100
      const pct = Math.max(0, Math.round((100 - accumulated) * 10) / 10);
      return { ...c, percentage: pct };
    }
    const proportional = Math.round(((c.percentage / rawSum) * 100) * 10) / 10;
    accumulated += proportional;
    return { ...c, percentage: proportional };
  });

  return scaled;
}

/**
 * Calculates complete budget summary with per-guest metrics and category details.
 */
export function calculateBudgetSummary(
  totalBudget: number,
  guestCount: number,
  categories: BudgetCategory[]
): BudgetSummary {
  const safeBudget = Math.max(0, totalBudget || 0);
  const safeGuests = Math.max(1, guestCount || 1);

  let totalSpent = 0;
  let totalPlanned = 0;

  const categoryDetails = (categories || []).map((cat) => {
    const plannedAmount = Math.round((safeBudget * (Number(cat.percentage) || 0)) / 100);
    const spent = Math.max(0, Number(cat.spent) || 0);
    const remainingAmount = plannedAmount - spent;
    const spentPercentage = plannedAmount > 0 ? (spent / plannedAmount) * 100 : 0;

    totalPlanned += plannedAmount;
    totalSpent += spent;

    return {
      ...cat,
      plannedAmount,
      remainingAmount,
      spentPercentage,
    };
  });

  const totalRemaining = safeBudget - totalSpent;
  const perGuestPlanned = Math.round(safeBudget / safeGuests);
  const perGuestSpent = Math.round(totalSpent / safeGuests);
  const isOverBudget = totalSpent > safeBudget;

  return {
    totalBudget: safeBudget,
    totalPlanned,
    totalSpent,
    totalRemaining,
    perGuestPlanned,
    perGuestSpent,
    isOverBudget,
    categories: categoryDetails,
  };
}

export const CATEGORY_COLORS = [
  '#0066ff', // Electric blue (primary)
  '#3b82f6', // Light blue
  '#60a5fa', // Sky blue
  '#93c5fd', // Ice blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#a855f7', // Purple
];

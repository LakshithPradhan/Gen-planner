import { describe, it, expect } from 'vitest';
import { normalizeBudgetCategories, calculateBudgetSummary } from '../lib/budget';
import { BudgetCategory } from '../types/plan';

describe('Budget Module', () => {
  it('normalizes budget category percentages to sum exactly to 100%', () => {
    const rawCategories: BudgetCategory[] = [
      { id: '1', name: 'Venue', percentage: 33.3, spent: 0 },
      { id: '2', name: 'Food', percentage: 33.3, spent: 0 },
      { id: '3', name: 'Decor', percentage: 33.3, spent: 0 },
    ];

    const normalized = normalizeBudgetCategories(rawCategories);
    const sum = normalized.reduce((acc, c) => acc + c.percentage, 0);
    expect(Math.round(sum * 10) / 10).toBe(100);
  });

  it('handles arbitrary sums like 120% or 40% and scales them to 100%', () => {
    const unbalanced: BudgetCategory[] = [
      { id: '1', name: 'Cat A', percentage: 60, spent: 0 },
      { id: '2', name: 'Cat B', percentage: 60, spent: 0 },
    ];
    const normalized = normalizeBudgetCategories(unbalanced);
    const sum = normalized.reduce((acc, c) => acc + c.percentage, 0);
    expect(sum).toBe(100);
    expect(normalized[0].percentage).toBe(50);
    expect(normalized[1].percentage).toBe(50);
  });

  it('distributes equal shares when every category starts at zero', () => {
    const categories: BudgetCategory[] = [
      { id: '1', name: 'Venue', percentage: 0, spent: 0 },
      { id: '2', name: 'Food', percentage: 0, spent: 0 },
      { id: '3', name: 'Decor', percentage: 0, spent: 0 },
    ];

    const normalized = normalizeBudgetCategories(categories);
    expect(normalized.map((category) => category.percentage)).toEqual([34, 33, 33]);
    expect(normalized.reduce((sum, category) => sum + category.percentage, 0)).toBe(100);
  });

  it('correctly calculates per-guest planned and spent maths', () => {
    const categories: BudgetCategory[] = [
      { id: '1', name: 'Venue', percentage: 40, spent: 20000 },
      { id: '2', name: 'Food', percentage: 60, spent: 30000 },
    ];
    const totalBudget = 100000;
    const guests = 50;

    const summary = calculateBudgetSummary(totalBudget, guests, categories);

    expect(summary.totalBudget).toBe(100000);
    expect(summary.totalPlanned).toBe(100000);
    expect(summary.totalSpent).toBe(50000);
    expect(summary.totalRemaining).toBe(50000);
    expect(summary.perGuestPlanned).toBe(2000); // 100000 / 50
    expect(summary.perGuestSpent).toBe(1000); // 50000 / 50
    expect(summary.isOverBudget).toBe(false);
  });

  it('flags over-budget when spent exceeds total budget', () => {
    const categories: BudgetCategory[] = [
      { id: '1', name: 'Decor', percentage: 100, spent: 120000 },
    ];
    const summary = calculateBudgetSummary(100000, 10, categories);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.totalRemaining).toBe(-20000);
  });

  it('normalizes invalid category shares without producing non-finite percentages', () => {
    const invalidShares: BudgetCategory[] = [
      { id: '1', name: 'Venue', percentage: Number.NaN, spent: 0 },
      { id: '2', name: 'Food', percentage: 50, spent: 0 },
      { id: '3', name: 'Decor', percentage: -20, spent: 0 },
    ];

    const normalized = normalizeBudgetCategories(invalidShares);
    expect(normalized.every((category) => Number.isFinite(category.percentage))).toBe(true);
    expect(normalized.reduce((sum, category) => sum + category.percentage, 0)).toBe(100);
    expect(normalized.map((category) => category.percentage)).toEqual([0, 100, 0]);
  });

  it('uses safe zero-budget and minimum-guest defaults for invalid calculation inputs', () => {
    const categories: BudgetCategory[] = [
      { id: '1', name: 'Venue', percentage: Number.POSITIVE_INFINITY, spent: Number.NaN },
    ];
    const summary = calculateBudgetSummary(Number.POSITIVE_INFINITY, Number.NaN, categories);

    expect(summary.totalBudget).toBe(0);
    expect(summary.totalSpent).toBe(0);
    expect(summary.perGuestPlanned).toBe(0);
    expect(summary.perGuestSpent).toBe(0);
    expect(summary.categories[0].plannedAmount).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { calculatePlanHealth } from '../lib/healthScore';
import { getBuiltinTemplate } from '../lib/templates';
import { CelebrationPlan } from '../types/plan';

describe('Plan Health Score Module', () => {
  it('detects budget deficit and reduces health score', () => {
    const plan: CelebrationPlan = getBuiltinTemplate('birthday', { totalBudget: 50000 });
    // Simulate spent 70000 on 50000 budget
    plan.budgetCategories[0].spent = 70000;

    const result = calculatePlanHealth(plan);
    expect(result.score).toBeLessThan(85);
    const deficitFlag = result.flags.find((f) => f.id === 'budget-overrun');
    expect(deficitFlag).toBeDefined();
    expect(deficitFlag?.type).toBe('critical');
  });

  it('detects inadequate catering percentage for large guest list', () => {
    const plan: CelebrationPlan = getBuiltinTemplate('wedding', {
      guests: 300,
      totalBudget: 1500000,
    });
    // Set catering to only 10%
    const cat = plan.budgetCategories.find((c) => /cater|food/i.test(c.name));
    if (cat) cat.percentage = 10;

    const result = calculatePlanHealth(plan);
    const cateringFlag = result.flags.find((f) => f.id === 'catering-too-low');
    expect(cateringFlag).toBeDefined();
  });

  it('flags uncontacted venue when event date is close', () => {
    const plan: CelebrationPlan = getBuiltinTemplate('wedding');
    // Set target date to 20 days in future
    const nearDate = new Date();
    nearDate.setDate(nearDate.getDate() + 20);
    plan.targetDate = nearDate.toISOString().split('T')[0];

    // Mark venue as To contact
    const venue = plan.vendors.find((v) => /venue/i.test(v.category) || /venue/i.test(v.name));
    if (venue) venue.status = 'To contact';

    const result = calculatePlanHealth(plan);
    const venueFlag = result.flags.find((f) => f.id === 'overdue-venue');
    expect(venueFlag).toBeDefined();
  });
});

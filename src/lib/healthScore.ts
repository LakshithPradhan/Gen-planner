import { CelebrationPlan } from '../types/plan';
import { calculateBudgetSummary } from './budget';
import { getDaysLeft } from './formatters';

export interface HealthFlag {
  id: string;
  type: 'critical' | 'warning' | 'good';
  title: string;
  message: string;
  remedy?: string;
}

export interface PlanHealthResult {
  score: number; // 0 - 100
  rating: 'Optimal' | 'Stable' | 'At Risk' | 'Critical';
  flags: HealthFlag[];
  metrics: {
    budgetHealth: number;
    timelineHealth: number;
    vendorHealth: number;
  };
}

/**
 * Evaluates plan health score (0-100) and produces actionable flags.
 */
export function calculatePlanHealth(plan: CelebrationPlan): PlanHealthResult {
  const flags: HealthFlag[] = [];
  const daysLeft = getDaysLeft(plan.targetDate);
  const budgetSummary = calculateBudgetSummary(plan.totalBudget, plan.guestCount, plan.budgetCategories);

  let score = 100;

  // 1. Budget Overrun check
  if (budgetSummary.isOverBudget) {
    const overAmount = budgetSummary.totalSpent - plan.totalBudget;
    score -= 25;
    flags.push({
      id: 'budget-overrun',
      type: 'critical',
      title: 'Budget Deficit Detected',
      message: `Total spent (${plan.currency} ${budgetSummary.totalSpent.toLocaleString()}) exceeds total budget by ${plan.currency} ${overAmount.toLocaleString()}.`,
      remedy: 'Increase total budget or reallocate unused funds from other categories.',
    });
  } else if (budgetSummary.totalSpent > plan.totalBudget * 0.85 && daysLeft > 30) {
    score -= 10;
    flags.push({
      id: 'budget-near-cap',
      type: 'warning',
      title: 'High Early Spend Rate',
      message: `Over 85% of budget spent while ${daysLeft} days still remain before the event.`,
      remedy: 'Freeze non-essential category spends.',
    });
  }

  // 2. Catering Share vs Guest Count check
  const cateringCat = plan.budgetCategories.find((c) =>
    /cater|food|dinner|dining|meal|buffet/i.test(c.name)
  );
  if (cateringCat) {
    if (plan.guestCount >= 100 && cateringCat.percentage < 25) {
      score -= 15;
      flags.push({
        id: 'catering-too-low',
        type: 'critical',
        title: 'Catering Share Insufficient',
        message: `F&B allocation is only ${cateringCat.percentage}% for ${plan.guestCount} guests (average ${plan.currency} ${Math.round((plan.totalBudget * (cateringCat.percentage / 100)) / plan.guestCount)}/head).`,
        remedy: 'Recommended catering share for 100+ guests is 30% - 45% of total budget.',
      });
    } else if (plan.guestCount >= 200 && cateringCat.percentage < 32) {
      score -= 10;
      flags.push({
        id: 'catering-moderate-risk',
        type: 'warning',
        title: 'Tight Catering Margins',
        message: `Allocating ${cateringCat.percentage}% for a large crowd of ${plan.guestCount} leaves minimal buffet buffer.`,
        remedy: 'Review per-plate cost with caterer early.',
      });
    }
  }

  // 3. Venue Status check
  const venueVendor = plan.vendors.find((v) =>
    /venue|hall|resort|banquet|lawn|hotel/i.test(v.category) || /venue|hall/i.test(v.name)
  );
  if (venueVendor) {
    if (daysLeft < 45 && venueVendor.status === 'To contact') {
      score -= 20;
      flags.push({
        id: 'overdue-venue',
        type: 'critical',
        title: 'Overdue Venue Booking',
        message: `Venue is still uncontacted with only ${daysLeft} days left. Prime dates get booked months ahead.`,
        remedy: 'Contact and lock down venue immediately to avoid date loss.',
      });
    } else if (venueVendor.status === 'Booked') {
      flags.push({
        id: 'venue-secured',
        type: 'good',
        title: 'Venue Locked In',
        message: `${venueVendor.name} is successfully secured and contracted.`,
      });
    }
  }

  // 4. Timeline Crunch check
  const totalTasks = plan.timeline.length;
  const completedTasks = plan.timeline.filter((t) => t.completed).length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (daysLeft <= 14 && taskProgress < 50 && totalTasks > 0) {
    score -= 15;
    flags.push({
      id: 'timeline-crunch',
      type: 'critical',
      title: 'High Timeline Compression',
      message: `${totalTasks - completedTasks} tasks (${Math.round(100 - taskProgress)}%) remain pending with under 2 weeks to go.`,
      remedy: 'Delegate pending tasks or mark non-essential items completed.',
    });
  } else if (daysLeft <= 30 && taskProgress < 30 && totalTasks > 0) {
    score -= 10;
    flags.push({
      id: 'timeline-lagging',
      type: 'warning',
      title: 'Action Item Backlog',
      message: `Only ${Math.round(taskProgress)}% of checklist completed with a month left.`,
      remedy: 'Prioritize tasks marked with the urgent badge.',
    });
  }

  // 5. Per-guest realism check
  if (plan.eventType === 'wedding' && budgetSummary.perGuestPlanned < 500 && plan.currency === 'INR') {
    score -= 10;
    flags.push({
      id: 'low-per-guest',
      type: 'warning',
      title: 'Low Per-Guest Budget for Wedding',
      message: `Estimated ${plan.currency} ${budgetSummary.perGuestPlanned} per guest is well below average wedding costs in ${plan.city || 'India'}.`,
      remedy: 'Verify if guest count includes all ceremonies or adjust budget.',
    });
  }

  // 6. Vendor coverage check
  const bookedCount = plan.vendors.filter((v) => v.status === 'Booked').length;
  if (bookedCount >= 3) {
    flags.push({
      id: 'vendor-traction',
      type: 'good',
      title: 'Strong Vendor Traction',
      message: `${bookedCount} core vendors already contracted and confirmed.`,
    });
  }

  const normalizedScore = Math.max(10, Math.min(100, score));

  let rating: PlanHealthResult['rating'] = 'Optimal';
  if (normalizedScore < 50) rating = 'Critical';
  else if (normalizedScore < 70) rating = 'At Risk';
  else if (normalizedScore < 85) rating = 'Stable';

  return {
    score: normalizedScore,
    rating,
    flags,
    metrics: {
      budgetHealth: Math.max(20, Math.min(100, Math.round((1 - (budgetSummary.totalSpent > plan.totalBudget ? 0.4 : 0)) * 100))),
      timelineHealth: Math.max(20, Math.min(100, Math.round(taskProgress))),
      vendorHealth: Math.max(20, Math.min(100, Math.round((bookedCount / Math.max(1, plan.vendors.length)) * 100))),
    },
  };
}

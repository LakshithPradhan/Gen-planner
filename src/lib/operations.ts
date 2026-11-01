import { CelebrationPlan, PlanOperation } from '../types/plan';
import { normalizeBudgetCategories } from './budget';
import { addDaysToDateOnly } from './dateOnly';

export interface DiffDetail {
  field: string;
  before: string;
  after: string;
  description: string;
}

/**
 * Pure function: applies a single structured edit operation to a plan immutably.
 */
export function applyPlanOperation(plan: CelebrationPlan, op: PlanOperation): CelebrationPlan {
  const next: CelebrationPlan = {
    ...plan,
    budgetCategories: plan.budgetCategories.map((category) => ({ ...category })),
    timeline: plan.timeline.map((task) => ({ ...task })),
    vendors: plan.vendors.map((vendor) => ({ ...vendor })),
    ideas: plan.ideas.map((idea) => ({ ...idea })),
  };

  switch (op.type) {
    case 'setBudgetTotal': {
      next.totalBudget = Math.max(1, Math.round(op.amount));
      break;
    }

    case 'setEventName': {
      next.eventName = op.eventName.trim();
      break;
    }

    case 'setCategoryPct': {
      const idx = next.budgetCategories.findIndex((c) => c.id === op.categoryId || c.name.toLowerCase() === op.categoryId.toLowerCase());
      if (idx !== -1) {
        next.budgetCategories[idx].percentage = Math.max(0, Math.min(100, Math.round(op.percentage * 10) / 10));
        next.budgetCategories = normalizeBudgetCategories(next.budgetCategories);
      }
      break;
    }

    case 'addTask': {
      const newId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const days = op.task.daysBeforeEvent ?? 14;

      next.timeline.push({
        id: newId,
        title: op.task.title,
        phase: op.task.phase || 'General',
        daysBeforeEvent: days,
        dueDate: addDaysToDateOnly(next.targetDate, -days),
        completed: false,
        isUrgent: op.task.isUrgent ?? false,
      });
      break;
    }

    case 'updateTask': {
      const task = next.timeline.find(
        (t) => t.id === op.taskId || t.title.toLowerCase().includes(op.taskId.toLowerCase())
      );
      if (task) {
        if (op.title !== undefined) task.title = op.title;
        if (op.phase !== undefined) task.phase = op.phase;
        if (op.isUrgent !== undefined) task.isUrgent = op.isUrgent;
        if (op.daysBeforeEvent !== undefined) {
          task.daysBeforeEvent = op.daysBeforeEvent;
          task.dueDate = addDaysToDateOnly(next.targetDate, -op.daysBeforeEvent);
        }
      }
      break;
    }

    case 'completeTask': {
      const task = next.timeline.find((t) => t.id === op.taskId || t.title.toLowerCase().includes(op.taskId.toLowerCase()));
      if (task) {
        task.completed = op.completed;
      }
      break;
    }

    case 'removeTask': {
      next.timeline = next.timeline.filter(
        (t) => t.id !== op.taskId && !t.title.toLowerCase().includes(op.taskId.toLowerCase())
      );
      break;
    }

    case 'setGuests': {
      next.guestCount = Math.max(1, Math.round(op.count));
      break;
    }

    case 'setDate': {
      next.targetDate = op.date;
      // Re-anchor task due dates
      next.timeline = next.timeline.map((t) => {
        return { ...t, dueDate: addDaysToDateOnly(op.date, -t.daysBeforeEvent) };
      });
      break;
    }

    case 'addVendor': {
      const newId = `vendor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      next.vendors.push({
        id: newId,
        name: op.vendor.name,
        category: op.vendor.category,
        estimatedCost: op.vendor.estimatedCost ?? 0,
        status: 'To contact',
        whatToConfirm: op.vendor.whatToConfirm,
      });
      break;
    }

    case 'updateVendorStatus': {
      const vendor = next.vendors.find(
        (v) => v.id === op.vendorId || v.name.toLowerCase().includes(op.vendorId.toLowerCase())
      );
      if (vendor) {
        vendor.status = op.status;
      }
      break;
    }
  }

  return next;
}

/**
 * Applies a batch of operations and generates human-readable diff details.
 */
export function applyOperations(
  plan: CelebrationPlan,
  operations: PlanOperation[]
): { updatedPlan: CelebrationPlan; diffs: DiffDetail[] } {
  let current = plan;
  for (const op of operations) {
    current = applyPlanOperation(current, op);
  }

  const diffs = generatePlanDiff(plan, current);
  return { updatedPlan: current, diffs };
}

/**
 * Computes difference between before and after plans for the UI diff modal.
 */
export function generatePlanDiff(before: CelebrationPlan, after: CelebrationPlan): DiffDetail[] {
  const diffs: DiffDetail[] = [];

  if (before.eventName !== after.eventName) {
    diffs.push({
      field: 'Event Name',
      before: before.eventName,
      after: after.eventName,
      description: 'Updated celebration name',
    });
  }

  if (before.totalBudget !== after.totalBudget) {
    diffs.push({
      field: 'Total Budget',
      before: `${before.currency} ${before.totalBudget.toLocaleString()}`,
      after: `${after.currency} ${after.totalBudget.toLocaleString()}`,
      description: `Adjusted budget by ${after.totalBudget > before.totalBudget ? '+' : ''}${after.totalBudget - before.totalBudget}`,
    });
  }

  if (before.guestCount !== after.guestCount) {
    diffs.push({
      field: 'Guest Count',
      before: `${before.guestCount} guests`,
      after: `${after.guestCount} guests`,
      description: `Updated guest count (${after.guestCount > before.guestCount ? '+' : ''}${after.guestCount - before.guestCount})`,
    });
  }

  if (before.targetDate !== after.targetDate) {
    diffs.push({
      field: 'Event Date',
      before: before.targetDate,
      after: after.targetDate,
      description: `Rescheduled event date`,
    });
  }

  // Budget category percentage changes
  after.budgetCategories.forEach((afterCat) => {
    const beforeCat = before.budgetCategories.find((c) => c.id === afterCat.id || c.name === afterCat.name);
    if (beforeCat && beforeCat.percentage !== afterCat.percentage) {
      diffs.push({
        field: `${afterCat.name} Allocation`,
        before: `${beforeCat.percentage}%`,
        after: `${afterCat.percentage}%`,
        description: `Modified allocation share`,
      });
    }
  });

  // Timeline additions / completions / deletions
  if (after.timeline.length > before.timeline.length) {
    const added = after.timeline.filter((t) => !before.timeline.some((bt) => bt.id === t.id));
    added.forEach((t) => {
      diffs.push({
        field: 'New Task Added',
        before: '—',
        after: t.title,
        description: `Added to timeline (${t.daysBeforeEvent} days before)`,
      });
    });
  } else if (after.timeline.length < before.timeline.length) {
    const removed = before.timeline.filter((bt) => !after.timeline.some((t) => t.id === bt.id));
    removed.forEach((t) => {
      diffs.push({
        field: 'Task Removed',
        before: t.title,
        after: '—',
        description: `Deleted task from timeline`,
      });
    });
  }

  after.timeline.forEach((afterTask) => {
    const beforeTask = before.timeline.find((t) => t.id === afterTask.id);
    if (beforeTask && beforeTask.completed !== afterTask.completed) {
      diffs.push({
        field: `Task Status: ${afterTask.title}`,
        before: beforeTask.completed ? 'Completed' : 'Pending',
        after: afterTask.completed ? 'Completed' : 'Pending',
        description: afterTask.completed ? 'Marked task as done' : 'Reopened task',
      });
    }
    if (beforeTask && beforeTask.title !== afterTask.title) {
      diffs.push({
        field: 'Task Title',
        before: beforeTask.title,
        after: afterTask.title,
        description: 'Updated timeline task',
      });
    }
    if (beforeTask && beforeTask.daysBeforeEvent !== afterTask.daysBeforeEvent) {
      diffs.push({
        field: `Task Timing: ${afterTask.title}`,
        before: `${beforeTask.daysBeforeEvent} days before`,
        after: `${afterTask.daysBeforeEvent} days before`,
        description: 'Updated task due date',
      });
    }
    if (beforeTask && beforeTask.phase !== afterTask.phase) {
      diffs.push({
        field: `Task Phase: ${afterTask.title}`,
        before: beforeTask.phase,
        after: afterTask.phase,
        description: 'Updated task phase',
      });
    }
    if (beforeTask && beforeTask.isUrgent !== afterTask.isUrgent) {
      diffs.push({
        field: `Task Urgency: ${afterTask.title}`,
        before: beforeTask.isUrgent ? 'Urgent' : 'Standard',
        after: afterTask.isUrgent ? 'Urgent' : 'Standard',
        description: 'Updated task urgency',
      });
    }
  });

  // Vendors diff
  if (after.vendors.length > before.vendors.length) {
    const added = after.vendors.filter((v) => !before.vendors.some((bv) => bv.id === v.id));
    added.forEach((v) => {
      diffs.push({
        field: 'New Vendor Added',
        before: '—',
        after: `${v.name} (${v.category})`,
        description: `Tip: ${v.whatToConfirm}`,
      });
    });
  }

  after.vendors.forEach((afterVendor) => {
    const beforeVendor = before.vendors.find((v) => v.id === afterVendor.id);
    if (beforeVendor && beforeVendor.status !== afterVendor.status) {
      diffs.push({
        field: `Vendor Status: ${afterVendor.name}`,
        before: beforeVendor.status,
        after: afterVendor.status,
        description: `Updated status to ${afterVendor.status}`,
      });
    }
  });

  return diffs;
}

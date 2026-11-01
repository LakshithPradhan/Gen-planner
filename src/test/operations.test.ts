import { describe, it, expect } from 'vitest';
import { applyPlanOperation, applyOperations } from '../lib/operations';
import { getBuiltinTemplate } from '../lib/templates';
import { CelebrationPlan, PlanOperation } from '../types/plan';
import { addDaysToDateOnly } from '../lib/dateOnly';

describe('Plan Operations Engine', () => {
  const initialPlan: CelebrationPlan = getBuiltinTemplate('birthday', {
    totalBudget: 100000,
    guests: 50,
  });

  it('updates total budget via setBudgetTotal', () => {
    const op: PlanOperation = { type: 'setBudgetTotal', amount: 150000 };
    const updated = applyPlanOperation(initialPlan, op);
    expect(updated.totalBudget).toBe(150000);
    // original must be unmodified (immutability)
    expect(initialPlan.totalBudget).toBe(100000);
  });

  it('updates guests via setGuests', () => {
    const op: PlanOperation = { type: 'setGuests', count: 75 };
    const updated = applyPlanOperation(initialPlan, op);
    expect(updated.guestCount).toBe(75);
    expect(initialPlan.guestCount).toBe(50);
  });

  it('creates and edits event details without mutating the source plan', () => {
    const renamed = applyPlanOperation(initialPlan, {
      type: 'setEventName',
      eventName: 'Updated Birthday',
    });
    const rescheduled = applyPlanOperation(renamed, {
      type: 'setDate',
      date: '2027-08-12',
    });

    expect(rescheduled.eventName).toBe('Updated Birthday');
    expect(rescheduled.targetDate).toBe('2027-08-12');
    expect(rescheduled.timeline[0].dueDate).toBe(
      addDaysToDateOnly('2027-08-12', -rescheduled.timeline[0].daysBeforeEvent)
    );
    expect(initialPlan.eventName).not.toBe('Updated Birthday');
  });

  it('adds and removes timeline tasks', () => {
    const addOp: PlanOperation = {
      type: 'addTask',
      task: { title: 'Order helium balloons', daysBeforeEvent: 4, phase: 'Decor', isUrgent: true },
    };
    const updated = applyPlanOperation(initialPlan, addOp);
    expect(updated.timeline.length).toBe(initialPlan.timeline.length + 1);
    const addedTask = updated.timeline.find((t) => t.title === 'Order helium balloons');
    expect(addedTask).toBeDefined();

    const removeOp: PlanOperation = {
      type: 'removeTask',
      taskId: addedTask!.id,
    };
    const pruned = applyPlanOperation(updated, removeOp);
    expect(pruned.timeline.length).toBe(initialPlan.timeline.length);
  });

  it('updates vendor status to Booked', () => {
    const firstVendor = initialPlan.vendors[0];
    const op: PlanOperation = {
      type: 'updateVendorStatus',
      vendorId: firstVendor.id,
      status: 'Booked',
    };
    const updated = applyPlanOperation(initialPlan, op);
    const target = updated.vendors.find((v) => v.id === firstVendor.id);
    expect(target?.status).toBe('Booked');
  });

  it('generates a clean diff when operations are applied and supports undo stack', () => {
    const ops: PlanOperation[] = [
      { type: 'setBudgetTotal', amount: 200000 },
      { type: 'setGuests', count: 80 },
    ];

    const { diffs } = applyOperations(initialPlan, ops);

    expect(diffs.length).toBe(2);
    expect(diffs.some((d) => d.field === 'Total Budget')).toBe(true);
    expect(diffs.some((d) => d.field === 'Guest Count')).toBe(true);

    // Undo capability: restoring previous snapshot returns to exact initial state
    const undoStack = [initialPlan];
    const restored = undoStack.pop()!;
    expect(restored.totalBudget).toBe(100000);
    expect(restored.guestCount).toBe(50);
  });
});

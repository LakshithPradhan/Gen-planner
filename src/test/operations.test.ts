import { describe, it, expect } from 'vitest';
import { applyPlanOperation, applyOperations } from '../lib/operations';
import { getBuiltinTemplate } from '../lib/templates';
import { CelebrationPlan, MAX_TIMELINE_TASKS, PlanOperation } from '../types/plan';
import { addDaysToDateOnly } from '../lib/dateOnly';

describe('Plan Operations Engine', () => {
  const initialPlan: CelebrationPlan = getBuiltinTemplate('birthday', {
    totalBudget: 100000,
    guests: 50,
  });
  const planWithTaskCount = (count: number): CelebrationPlan => ({
    ...initialPlan,
    timeline: Array.from({ length: count }, (_, index) => ({
      ...initialPlan.timeline[0],
      id: `limit-task-${index}`,
    })),
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
    const { updatedPlan: updated, diffs: addDiffs } = applyOperations(initialPlan, [addOp]);
    expect(updated.timeline.length).toBe(initialPlan.timeline.length + 1);
    const addedTask = updated.timeline.find((t) => t.title === 'Order helium balloons');
    expect(addedTask).toBeDefined();
    expect(addDiffs).toContainEqual(expect.objectContaining({
      field: 'New Task Added',
      after: 'Order helium balloons',
    }));

    const removeOp: PlanOperation = {
      type: 'removeTask',
      taskId: addedTask!.id,
    };
    const { updatedPlan: pruned, diffs: removeDiffs } = applyOperations(updated, [removeOp]);
    expect(pruned.timeline.length).toBe(initialPlan.timeline.length);
    expect(removeDiffs).toContainEqual(expect.objectContaining({
      field: 'Task Removed',
      before: 'Order helium balloons',
    }));
  });

  it('allows task creation below the limit and creation of the 500th task', () => {
    const plan = planWithTaskCount(MAX_TIMELINE_TASKS - 1);
    const updated = applyPlanOperation(plan, {
      type: 'addTask',
      task: { title: 'Final permitted task' },
    });

    expect(plan.timeline).toHaveLength(MAX_TIMELINE_TASKS - 1);
    expect(updated.timeline).toHaveLength(MAX_TIMELINE_TASKS);
    expect(updated.timeline[updated.timeline.length - 1].title).toBe('Final permitted task');
  });

  it('rejects the 501st task without changing the existing plan', () => {
    const plan = planWithTaskCount(MAX_TIMELINE_TASKS);
    const originalTimeline = plan.timeline;
    const updated = applyPlanOperation(plan, {
      type: 'addTask',
      task: { title: 'Task beyond limit' },
    });

    expect(updated).toBe(plan);
    expect(updated.timeline).toBe(originalTimeline);
    expect(updated.timeline).toHaveLength(MAX_TIMELINE_TASKS);
    expect(updated.timeline.some((task) => task.title === 'Task beyond limit')).toBe(false);
  });

  it('still allows task edits and removal at the task limit', () => {
    const plan = planWithTaskCount(MAX_TIMELINE_TASKS);
    const target = plan.timeline[0];
    const edited = applyPlanOperation(plan, {
      type: 'updateTask',
      taskId: target.id,
      title: 'Edited while at limit',
    });
    const removed = applyPlanOperation(plan, {
      type: 'removeTask',
      taskId: target.id,
    });

    expect(edited.timeline).toHaveLength(MAX_TIMELINE_TASKS);
    expect(edited.timeline[0].title).toBe('Edited while at limit');
    expect(removed.timeline).toHaveLength(MAX_TIMELINE_TASKS - 1);
    expect(removed.timeline.some((task) => task.id === target.id)).toBe(false);
    expect(plan.timeline).toHaveLength(MAX_TIMELINE_TASKS);
  });

  it('detects task replacement when removal and addition keep the timeline length unchanged', () => {
    const removedTask = initialPlan.timeline[0];
    const { updatedPlan, diffs } = applyOperations(initialPlan, [
      { type: 'removeTask', taskId: removedTask.id },
      {
        type: 'addTask',
        task: { title: 'Confirm accessibility setup', daysBeforeEvent: 7 },
      },
    ]);

    expect(updatedPlan.timeline).toHaveLength(initialPlan.timeline.length);
    expect(updatedPlan.timeline.some((task) => task.id === removedTask.id)).toBe(false);
    expect(updatedPlan.timeline.some((task) => task.title === 'Confirm accessibility setup')).toBe(true);
    expect(diffs).toContainEqual(expect.objectContaining({
      field: 'New Task Added',
      after: 'Confirm accessibility setup',
    }));
    expect(diffs).toContainEqual(expect.objectContaining({
      field: 'Task Removed',
      before: removedTask.title,
    }));
  });

  it('returns an empty diff for operations that leave the plan unchanged', () => {
    const { updatedPlan, diffs } = applyOperations(initialPlan, [
      { type: 'setGuests', count: initialPlan.guestCount },
    ]);

    expect(updatedPlan.guestCount).toBe(initialPlan.guestCount);
    expect(diffs).toEqual([]);
  });

  it('resolves an exact task ID before considering title matches', () => {
    const plan = {
      ...initialPlan,
      timeline: [
        { ...initialPlan.timeline[0], id: 'target-id', title: 'Book venue' },
        { ...initialPlan.timeline[1], id: 'other-id', title: 'target-id' },
      ],
    };

    const updated = applyPlanOperation(plan, {
      type: 'completeTask',
      taskId: 'target-id',
      completed: true,
    });

    expect(updated.timeline[0].completed).toBe(true);
    expect(updated.timeline[1].completed).toBe(initialPlan.timeline[1].completed);
  });

  it('rejects task operations when malformed data contains duplicate IDs', () => {
    const plan = {
      ...initialPlan,
      timeline: [
        { ...initialPlan.timeline[0], id: 'duplicate-id', title: 'Book venue' },
        { ...initialPlan.timeline[1], id: 'duplicate-id', title: 'Book catering' },
      ],
    };

    const operations: PlanOperation[] = [
      { type: 'removeTask', taskId: 'duplicate-id' },
      { type: 'updateTask', taskId: 'duplicate-id', title: 'Changed task' },
      { type: 'completeTask', taskId: 'duplicate-id', completed: true },
    ];

    for (const operation of operations) {
      const updated = applyPlanOperation(plan, operation);
      expect(updated.timeline).toEqual(plan.timeline);
    }
    expect(plan.timeline.map((task) => task.title)).toEqual(['Book venue', 'Book catering']);
  });

  it('resolves one exact task-title match', () => {
    const plan = {
      ...initialPlan,
      timeline: [
        { ...initialPlan.timeline[0], id: 'task-book-venue', title: 'Book venue' },
        { ...initialPlan.timeline[1], id: 'task-caterer', title: 'Confirm caterer' },
      ],
    };

    const updated = applyPlanOperation(plan, {
      type: 'updateTask',
      taskId: 'book venue',
      phase: 'Confirmed',
    });

    expect(updated.timeline[0].phase).toBe('Confirmed');
    expect(updated.timeline[1].phase).toBe(plan.timeline[1].phase);
  });

  it('does not partially match the title when removing a task', () => {
    const plan = {
      ...initialPlan,
      timeline: [
        { ...initialPlan.timeline[0], id: 'task-book-venue', title: 'Book venue' },
        { ...initialPlan.timeline[1], id: 'task-book-catering', title: 'Book catering' },
      ],
    };

    const updated = applyPlanOperation(plan, { type: 'removeTask', taskId: 'Book' });

    expect(updated.timeline).toEqual(plan.timeline);
    expect(updated.timeline.map((task) => task.title)).toEqual(['Book venue', 'Book catering']);
    expect(plan.timeline).toEqual([
      expect.objectContaining({ id: 'task-book-venue', title: 'Book venue' }),
      expect.objectContaining({ id: 'task-book-catering', title: 'Book catering' }),
    ]);
  });

  it('does not partially match titles when updating or completing tasks', () => {
    const plan = {
      ...initialPlan,
      timeline: [
        { ...initialPlan.timeline[0], id: 'task-book-venue', title: 'Book venue' },
        { ...initialPlan.timeline[1], id: 'task-book-catering', title: 'Book catering' },
      ],
    };

    const updated = applyPlanOperation(plan, {
      type: 'updateTask',
      taskId: 'Book',
      title: 'Changed task',
    });
    const completed = applyPlanOperation(plan, {
      type: 'completeTask',
      taskId: 'Book',
      completed: true,
    });

    expect(updated.timeline).toEqual(plan.timeline);
    expect(completed.timeline).toEqual(plan.timeline);
  });

  it('leaves ambiguous exact-title targets unchanged for all task operations', () => {
    const plan = {
      ...initialPlan,
      timeline: [
        { ...initialPlan.timeline[0], id: 'task-one', title: 'Book' },
        { ...initialPlan.timeline[1], id: 'task-two', title: 'Book' },
      ],
    };
    const operations: PlanOperation[] = [
      { type: 'removeTask', taskId: 'Book' },
      { type: 'updateTask', taskId: 'Book', title: 'Changed task' },
      { type: 'completeTask', taskId: 'Book', completed: true },
    ];

    for (const operation of operations) {
      const updated = applyPlanOperation(plan, operation);
      expect(updated.timeline).toEqual(plan.timeline);
    }
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

  it('does not update vendors through partial or ambiguous identifiers', () => {
    const plan = {
      ...initialPlan,
      vendors: [
        { ...initialPlan.vendors[0], id: 'vendor-one', name: 'Bluebird Photography' },
        { ...initialPlan.vendors[1], id: 'vendor-two', name: 'Bluebird Catering' },
      ],
    };

    for (const vendorId of ['Bluebird', 'vendor']) {
      const updated = applyPlanOperation(plan, {
        type: 'updateVendorStatus',
        vendorId,
        status: 'Booked',
      });
      expect(updated.vendors).toEqual(plan.vendors);
    }

    const duplicateNamePlan = {
      ...plan,
      vendors: plan.vendors.map((vendor) => ({ ...vendor, name: 'Shared Vendor' })),
    };
    const ambiguous = applyPlanOperation(duplicateNamePlan, {
      type: 'updateVendorStatus',
      vendorId: 'Shared Vendor',
      status: 'Booked',
    });
    expect(ambiguous.vendors).toEqual(duplicateNamePlan.vendors);
  });

  it('generates a clean diff when operations are applied', () => {
    const ops: PlanOperation[] = [
      { type: 'setBudgetTotal', amount: 200000 },
      { type: 'setGuests', count: 80 },
    ];

    const { diffs } = applyOperations(initialPlan, ops);

    expect(diffs.length).toBe(2);
    expect(diffs.some((d) => d.field === 'Total Budget')).toBe(true);
    expect(diffs.some((d) => d.field === 'Guest Count')).toBe(true);

  });
});

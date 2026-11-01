import { describe, expect, it } from 'vitest';
import { parseLocalChatRequest } from '../lib/chatFallback';
import { applyOperations } from '../lib/operations';
import { getBuiltinTemplate } from '../lib/templates';

describe('Deterministic chat fallback', () => {
  const plan = getBuiltinTemplate('birthday', {
    eventName: 'Sample Birthday',
    date: '2027-05-20',
    guests: 50,
    totalBudget: 100_000,
  });

  function apply(message: string, currentPlan = plan) {
    const response = parseLocalChatRequest(message, currentPlan);
    const result = applyOperations(currentPlan, response.operations);
    return { ...response, ...result };
  }

  it('renames the event', () => {
    const result = apply('Rename event to "Summer Birthday"');
    expect(result.updatedPlan.eventName).toBe('Summer Birthday');
    expect(result.diffs.some((diff) => diff.field === 'Event Name')).toBe(true);
  });

  it('sets and adjusts the total budget', () => {
    expect(apply('Set budget to ₹250,000').updatedPlan.totalBudget).toBe(250_000);
    expect(apply('Increase budget to 250000').updatedPlan.totalBudget).toBe(250_000);
    expect(apply('Cut ₹50k but keep the band').updatedPlan.totalBudget).toBe(50_000);
    expect(apply('Increase budget by 1.5 lakh').updatedPlan.totalBudget).toBe(250_000);
  });

  it('sets and adjusts guest count', () => {
    expect(apply('Add 25 guests and recalculate split').updatedPlan.guestCount).toBe(75);
    expect(apply('Reduce 10 attendees').updatedPlan.guestCount).toBe(40);
    expect(apply('Set guest count to 120').updatedPlan.guestCount).toBe(120);
  });

  it('adds, renames, reschedules, completes, and reopens timeline tasks', () => {
    const added = apply('Add task: Schedule hair and makeup trial 10 days before event');
    const newTask = added.updatedPlan.timeline.find((task) => task.title === 'Schedule hair and makeup trial');
    expect(newTask?.daysBeforeEvent).toBe(10);

    const taskTitle = plan.timeline[0].title;
    expect(apply(`Rename task "${taskTitle}" to Confirm venue access`).updatedPlan.timeline[0].title)
      .toBe('Confirm venue access');
    expect(apply(`Move task "${taskTitle}" to 12 days before event`).updatedPlan.timeline[0].daysBeforeEvent)
      .toBe(12);
    expect(apply(`Complete task "${taskTitle}"`).updatedPlan.timeline[0].completed).toBe(true);
    expect(apply(`Reopen task "${taskTitle}"`).updatedPlan.timeline[0].completed).toBe(false);
  });

  it('matches tasks by exact ID or a unique case-insensitive full title', () => {
    const task = plan.timeline[0];
    const byId = apply(`Complete task "${task.id}"`);
    const byTitle = apply(`Complete task "${task.title.toUpperCase()}"`);

    expect(byId.updatedPlan.timeline.find((item) => item.id === task.id)?.completed).toBe(true);
    expect(byTitle.updatedPlan.timeline.find((item) => item.id === task.id)?.completed).toBe(true);
  });

  it('rejects partial or ambiguous task titles without changing any task', () => {
    const taskPlan = {
      ...plan,
      timeline: [
        { ...plan.timeline[0], id: 'venue-task', title: 'Book venue' },
        { ...plan.timeline[1], id: 'catering-task', title: 'Book catering' },
      ],
    };

    for (const target of ['Book', 'venue final']) {
      const result = apply(`Complete task "${target}"`, taskPlan);
      expect(result.operations).toEqual([]);
      expect(result.reply).toContain('clarify');
      expect(result.updatedPlan.timeline).toEqual(taskPlan.timeline);
    }

    const duplicateTitlePlan = {
      ...taskPlan,
      timeline: [
        { ...taskPlan.timeline[0], title: 'Book' },
        { ...taskPlan.timeline[1], title: 'Book' },
      ],
    };
    const ambiguous = apply('Complete task "Book"', duplicateTitlePlan);
    expect(ambiguous.operations).toEqual([]);
    expect(ambiguous.reply).toContain('exact ID or full name');
    expect(ambiguous.updatedPlan.timeline).toEqual(duplicateTitlePlan.timeline);

    const exactSimilarTitle = apply('Complete task "Book venue"', taskPlan);
    expect(exactSimilarTitle.updatedPlan.timeline[0].completed).toBe(true);
    expect(exactSimilarTitle.updatedPlan.timeline[1].completed).toBe(taskPlan.timeline[1].completed);
  });

  it('adds vendors and updates their status', () => {
    const added = apply('Add vendor: Bluebird Photo, category: Photography, cost: ₹25,000, confirm: Confirm delivery dates');
    const vendor = added.updatedPlan.vendors.find((item) => item.name === 'Bluebird Photo');
    expect(vendor).toMatchObject({
      category: 'Photography',
      estimatedCost: 25_000,
      whatToConfirm: 'Confirm delivery dates',
    });

    const currentVendor = plan.vendors.find((item) => item.category === 'Venue');
    expect(currentVendor).toBeDefined();
    const updated = apply(`Mark ${currentVendor!.name} as Booked`);
    expect(updated.updatedPlan.vendors.find((item) => item.id === currentVendor?.id)?.status).toBe('Booked');
  });

  it('matches vendors by exact ID or a unique case-insensitive full name', () => {
    const vendor = plan.vendors[0];
    const byId = apply(`Mark ${vendor.id} as Contacted`);
    const byName = apply(`Mark ${vendor.name.toUpperCase()} as Contacted`);

    expect(byId.updatedPlan.vendors.find((item) => item.id === vendor.id)?.status).toBe('Contacted');
    expect(byName.updatedPlan.vendors.find((item) => item.id === vendor.id)?.status).toBe('Contacted');
  });

  it('rejects partial and ambiguous vendor names without changing vendor data', () => {
    const vendorPlan = {
      ...plan,
      vendors: [
        { ...plan.vendors[0], id: 'vendor-one', name: 'Bluebird Photography' },
        { ...plan.vendors[1], id: 'vendor-two', name: 'Bluebird Catering' },
      ],
    };
    const partial = apply('Mark Bluebird as Booked', vendorPlan);
    expect(partial.operations).toEqual([]);
    expect(partial.reply).toContain('clarify');
    expect(partial.updatedPlan.vendors).toEqual(vendorPlan.vendors);

    const duplicateNamePlan = {
      ...vendorPlan,
      vendors: vendorPlan.vendors.map((vendor) => ({ ...vendor, name: 'Bluebird' })),
    };
    const ambiguous = apply('Mark Bluebird as Booked', duplicateNamePlan);
    expect(ambiguous.operations).toEqual([]);
    expect(ambiguous.reply).toContain('exact ID or full name');
    expect(ambiguous.updatedPlan.vendors).toEqual(duplicateNamePlan.vendors);
  });

  it('updates the event date and its timeline dates', () => {
    const result = apply('Change event date to 2027-06-01');
    expect(result.updatedPlan.targetDate).toBe('2027-06-01');
    expect(result.updatedPlan.timeline.every((task) => task.dueDate)).toBe(true);
  });

  it('clearly rejects unsupported requests and unknown targets', () => {
    const unsupported = parseLocalChatRequest('Book a flight for the photographer', plan);
    expect(unsupported.operations).toEqual([]);
    expect(unsupported.reply).toContain('could not identify a supported change');

    const missingTask = parseLocalChatRequest('Complete task nonexistent task', plan);
    expect(missingTask.operations).toEqual([]);
    expect(missingTask.reply).toContain('clarify');

    const missingVendor = parseLocalChatRequest('Mark the florist as Booked', plan);
    expect(missingVendor.operations).toEqual([]);
    expect(missingVendor.reply).toContain('clarify');
  });
});

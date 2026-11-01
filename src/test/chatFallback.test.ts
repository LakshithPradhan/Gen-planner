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

  function apply(message: string) {
    const response = parseLocalChatRequest(message, plan);
    const result = applyOperations(plan, response.operations);
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
    const updated = apply('Mark venue as Booked');
    expect(updated.updatedPlan.vendors.find((item) => item.id === currentVendor?.id)?.status).toBe('Booked');
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
    expect(missingTask.reply).toContain('could not find that task');

    const missingVendor = parseLocalChatRequest('Mark the florist as Booked', plan);
    expect(missingVendor.operations).toEqual([]);
    expect(missingVendor.reply).toContain('could not find that vendor');
  });
});

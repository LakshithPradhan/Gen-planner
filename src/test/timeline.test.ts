import { describe, it, expect } from 'vitest';
import { scaleTimelineTasks } from '../lib/timeline';
import { TimelineTask } from '../types/plan';

describe('Timeline Module', () => {
  const sampleTasks: TimelineTask[] = [
    { id: '1', title: 'Book Venue', phase: 'Prep', daysBeforeEvent: 90, dueDate: '', completed: true },
    { id: '2', title: 'Select Food Menu', phase: 'Prep', daysBeforeEvent: 45, dueDate: '', completed: false },
    { id: '3', title: 'Finalize DJ', phase: 'Execution', daysBeforeEvent: 15, dueDate: '', completed: false },
    { id: '4', title: 'Day-of Setup', phase: 'Final', daysBeforeEvent: 0, dueDate: '', completed: false },
  ];

  it('compresses task offsets proportionally when days left is small', () => {
    const targetDate = '2026-11-15';
    const daysLeft = 10; // compressed timeframe

    const result = scaleTimelineTasks(sampleTasks, daysLeft, targetDate);

    expect(result.isCompressed).toBe(true);
    // Max days before event in result should not exceed daysLeft (10)
    const maxDays = Math.max(...result.tasks.map((t) => t.daysBeforeEvent));
    expect(maxDays).toBeLessThanOrEqual(10);
  });

  it('marks tasks as urgent when they fall into immediate window', () => {
    const targetDate = '2026-11-15';
    const daysLeft = 5;

    const result = scaleTimelineTasks(sampleTasks, daysLeft, targetDate);

    expect(result.urgentCount).toBeGreaterThan(0);
    // Task 4 (daysBeforeEvent 0) is not completed, should be flagged urgent
    const lastTask = result.tasks.find((t) => t.id === '4');
    expect(lastTask?.isUrgent).toBe(true);
  });

  it('calculates completion percentage correctly', () => {
    const targetDate = '2026-11-15';
    const result = scaleTimelineTasks(sampleTasks, 60, targetDate);

    // 1 out of 4 completed = 25%
    expect(result.completedCount).toBe(1);
    expect(result.totalCount).toBe(4);
    expect(result.percentComplete).toBe(25);
  });
});

import { TimelineTask } from '../types/plan';
import { addDaysToDateOnly } from './dateOnly';

export interface ScaledTimelineResult {
  tasks: TimelineTask[];
  daysLeft: number;
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  urgentCount: number;
  isCompressed: boolean;
}

/**
 * Scales timeline tasks dynamically to fit the actual days left until the celebration.
 * If days left is small (e.g. <= 21 days), proportionally compresses all task offsets
 * and flags near-term tasks as urgent.
 */
export function scaleTimelineTasks(
  tasks: TimelineTask[],
  daysLeft: number,
  targetDateStr: string
): ScaledTimelineResult {
  const safeDays = Math.max(1, daysLeft);
  // Determine standard reference span from tasks (or default 120 days)
  const maxOriginalDays = Math.max(
    ...tasks.map((t) => t.daysBeforeEvent || 0),
    60
  );

  const shouldCompress = safeDays < maxOriginalDays;
  const compressionRatio = shouldCompress ? safeDays / maxOriginalDays : 1;

  const scaled = tasks.map((t) => {
    // Proportional days before event
    const originalDays = t.daysBeforeEvent ?? 30;
    const scaledDaysBefore = Math.max(0, Math.round(originalDays * compressionRatio));

    // Calculate concrete target due date
    const dueDateStr = addDaysToDateOnly(targetDateStr, -scaledDaysBefore);

    // Urgent if within 5 days of today or less than 15% of remaining window
    const isUrgent =
      !t.completed && (scaledDaysBefore <= 3 || scaledDaysBefore <= safeDays * 0.2);

    return {
      ...t,
      daysBeforeEvent: scaledDaysBefore,
      dueDate: dueDateStr,
      isUrgent: t.isUrgent || isUrgent,
    };
  });

  // Sort chronologically: furthest from event (soonest to do) first
  scaled.sort((a, b) => (b.daysBeforeEvent || 0) - (a.daysBeforeEvent || 0));

  const completedCount = scaled.filter((t) => t.completed).length;
  const urgentCount = scaled.filter((t) => !t.completed && t.isUrgent).length;
  const totalCount = scaled.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    tasks: scaled,
    daysLeft: safeDays,
    completedCount,
    totalCount,
    percentComplete,
    urgentCount,
    isCompressed: shouldCompress,
  };
}

import { CelebrationPlan, isValidDateOnly, PlanOperation } from '../types/plan';

export interface LocalChatResponse {
  reply: string;
  operations: PlanOperation[];
}

const HELP_TEXT =
  'I could not identify a supported change. Try renaming the event, changing the budget or guest count, adding or updating a task, adding a vendor, or changing a vendor status.';

function parseAmount(value: string): number | null {
  const match = value.match(/^\s*(?:₹|\$|€|£)?\s*(\d[\d,]*(?:\.\d+)?)\s*(crores?|cr|lakhs?|l|k|m)?\s*$/i);
  if (!match) return null;

  let amount = Number(match[1].replace(/,/g, ''));
  const unit = (match[2] || '').toLowerCase();
  if (unit === 'k') amount *= 1_000;
  else if (unit === 'l' || unit.startsWith('lakh')) amount *= 100_000;
  else if (unit === 'cr' || unit.startsWith('crore')) amount *= 10_000_000;
  else if (unit === 'm') amount *= 1_000_000;

  return Number.isFinite(amount) ? Math.round(amount) : null;
}

function cleanQuotedValue(value: string): string {
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

function matchTask(plan: CelebrationPlan, target: string) {
  const normalized = cleanQuotedValue(target).toLowerCase();
  if (!normalized) return undefined;
  return plan.timeline.find((task) => task.id.toLowerCase() === normalized) ??
    plan.timeline.find((task) => task.title.toLowerCase() === normalized) ??
    plan.timeline.find((task) => task.title.toLowerCase().includes(normalized));
}

function matchVendor(plan: CelebrationPlan, target: string) {
  const normalized = cleanQuotedValue(target).toLowerCase();
  if (!normalized) return undefined;
  return plan.vendors.find((vendor) => vendor.id.toLowerCase() === normalized) ??
    plan.vendors.find((vendor) => vendor.name.toLowerCase() === normalized) ??
    plan.vendors.find((vendor) =>
      vendor.name.toLowerCase().includes(normalized) || vendor.category.toLowerCase().includes(normalized)
    );
}

function unsupported(detail?: string): LocalChatResponse {
  return {
    reply: detail ? `${detail} ${HELP_TEXT}` : HELP_TEXT,
    operations: [],
  };
}

export function parseLocalChatRequest(message: string, plan: CelebrationPlan): LocalChatResponse {
  const text = message.trim();
  if (!text) return unsupported();

  const nameMatch = text.match(/^(?:rename|change|update|set)\s+(?:the\s+)?(?:event|plan)(?:\s+name)?\s+(?:to|as)\s+(.+)$/i);
  if (nameMatch) {
    const eventName = cleanQuotedValue(nameMatch[1]);
    if (eventName.length < 2 || eventName.length > 100) {
      return unsupported('The event name must be between 2 and 100 characters.');
    }
    return { reply: `Renamed the event to "${eventName}".`, operations: [{ type: 'setEventName', eventName }] };
  }

  const budgetSetMatch = text.match(/^(?:set|change|update|increase|raise|reduce|decrease|lower)\s+(?:the\s+)?(?:total\s+)?budget\s+(?:to|at)\s+(.+)$/i);
  const budgetDeltaMatch = text.match(/^(cut|reduce|decrease|lower|increase|raise)\s+(?:(?:the\s+)?budget\s+)?(?:by\s+)?(.+?)(?:\s+but\b.*)?$/i);
  const budgetDeltaAmount = budgetDeltaMatch ? parseAmount(budgetDeltaMatch[2]) : null;
  if (budgetSetMatch || budgetDeltaAmount !== null) {
    const amount = parseAmount((budgetSetMatch?.[1] ?? budgetDeltaMatch?.[2]) || '');
    if (amount === null || amount <= 0) return unsupported('Enter a positive budget amount.');

    const isRelative = !budgetSetMatch && budgetDeltaAmount !== null;
    const isIncrease = budgetDeltaMatch?.[1].toLowerCase() === 'increase' ||
      budgetDeltaMatch?.[1].toLowerCase() === 'raise';
    const newBudget = isRelative
      ? Math.max(1, plan.totalBudget + (isIncrease ? amount : -amount))
      : amount;
    if (newBudget > 10_000_000_000) return unsupported('The requested budget exceeds the supported limit.');

    return {
      reply: `Updated the total budget to ${plan.currency} ${newBudget.toLocaleString()}.`,
      operations: [{ type: 'setBudgetTotal', amount: newBudget }],
    };
  }

  const guestSetMatch = text.match(/^(?:set|change|update)\s+(?:the\s+)?(?:guest count|guests|attendees)\s+(?:to|at)\s+(\d+)$/i);
  const guestTargetMatch = text.match(/^(add|increase|reduce|decrease)\s+(?:the\s+)?(?:guest count|guests|attendees)\s+(to|by)\s+(\d+)$/i);
  const guestByMatch = text.match(/^(add|increase|reduce|decrease)\s+(\d+)\s+(?:guests|attendees)\b/i);
  if (guestSetMatch || guestTargetMatch || guestByMatch) {
    const count = Number(guestSetMatch?.[1] ?? guestTargetMatch?.[3] ?? guestByMatch?.[2]);
    const action = guestTargetMatch?.[1].toLowerCase() ?? guestByMatch?.[1].toLowerCase();
    const isRelative = guestTargetMatch?.[2].toLowerCase() === 'by' || Boolean(guestByMatch);
    const finalCount = !isRelative
      ? count
      : action === 'add' || action === 'increase'
        ? plan.guestCount + count
        : plan.guestCount - count;
    if (!Number.isInteger(finalCount) || finalCount < 1 || finalCount > 50_000) {
      return unsupported('Guest count must be between 1 and 50,000.');
    }
    return {
      reply: `Updated the guest count to ${finalCount}.`,
      operations: [{ type: 'setGuests', count: finalCount }],
    };
  }

  const taskRenameMatch = text.match(/^(?:rename|retitle)\s+(?:the\s+)?task\s+(.+?)\s+to\s+(.+)$/i);
  if (taskRenameMatch) {
    const task = matchTask(plan, taskRenameMatch[1]);
    const title = cleanQuotedValue(taskRenameMatch[2]);
    if (!task) return unsupported('I could not find that task.');
    if (title.length < 2 || title.length > 150) return unsupported('Task titles must be between 2 and 150 characters.');
    return {
      reply: `Updated the task title to "${title}".`,
      operations: [{ type: 'updateTask', taskId: task.id, title }],
    };
  }

  const taskMoveMatch = text.match(/^move\s+(?:the\s+)?task\s+(.+?)\s+to\s+(\d+)\s+days?\s+before(?:\s+the)?\s+event$/i);
  if (taskMoveMatch) {
    const task = matchTask(plan, taskMoveMatch[1]);
    const daysBeforeEvent = Number(taskMoveMatch[2]);
    if (!task) return unsupported('I could not find that task.');
    if (daysBeforeEvent > 365) return unsupported('Task timing must be between 0 and 365 days before the event.');
    return {
      reply: `Moved "${task.title}" to ${daysBeforeEvent} days before the event.`,
      operations: [{ type: 'updateTask', taskId: task.id, daysBeforeEvent }],
    };
  }

  const taskStatusMatch = text.match(/^(?:mark|set)\s+(?:the\s+)?task\s+(.+?)\s+(?:as\s+)?(completed|complete|done|incomplete|pending|open)$/i);
  const taskVerbMatch = text.match(/^(complete|finish|reopen)\s+(?:the\s+)?task\s+(.+)$/i);
  if (taskStatusMatch || taskVerbMatch) {
    const target = taskStatusMatch?.[1] ?? taskVerbMatch?.[2] ?? '';
    const status = taskStatusMatch?.[2].toLowerCase() ?? taskVerbMatch?.[1].toLowerCase() ?? '';
    const task = matchTask(plan, target);
    if (!task) return unsupported('I could not find that task.');
    const completed = !['incomplete', 'pending', 'open', 'reopen'].includes(status);
    return {
      reply: `${completed ? 'Completed' : 'Reopened'} "${task.title}".`,
      operations: [{ type: 'completeTask', taskId: task.id, completed }],
    };
  }

  const taskAddMatch = text.match(/^add\s+(?:a\s+)?task\s*:?\s*(.+?)(?:\s+(\d+)\s+days?\s+before(?:\s+the)?\s+event)?$/i);
  if (taskAddMatch) {
    const title = cleanQuotedValue(taskAddMatch[1]);
    const daysBeforeEvent = taskAddMatch[2] ? Number(taskAddMatch[2]) : 14;
    if (title.length < 2 || title.length > 150) return unsupported('Task titles must be between 2 and 150 characters.');
    if (daysBeforeEvent > 365) return unsupported('Task timing must be between 0 and 365 days before the event.');
    return {
      reply: `Added "${title}" to the timeline.`,
      operations: [{
        type: 'addTask',
        task: { title, daysBeforeEvent, phase: 'Custom Milestone', isUrgent: daysBeforeEvent <= 5 },
      }],
    };
  }

  const vendorAddMatch = text.match(/^add\s+(?:a\s+)?vendor\s*:?\s*(.+)$/i);
  if (vendorAddMatch) {
    const parts = vendorAddMatch[1]
      .split(/,\s*(?=(?:category|cost|estimated cost|confirm|what to confirm)\s*:)/i)
      .map((part) => part.trim());
    const name = cleanQuotedValue((parts.shift() || '').replace(/^(?:name\s*:\s*)/i, ''));
    let category = 'General';
    let estimatedCost = 0;
    let whatToConfirm = 'Confirm contract terms, payment schedule, and cancellation policy.';
    for (const part of parts) {
      const field = part.match(/^(category|cost|estimated cost|confirm|what to confirm)\s*:\s*(.+)$/i);
      if (!field) continue;
      const key = field[1].toLowerCase();
      if (key === 'category') category = field[2].trim();
      else if (key === 'cost' || key === 'estimated cost') {
        const parsed = parseAmount(field[2]);
        if (parsed === null || parsed > 10_000_000_000) return unsupported('Enter a valid vendor estimate.');
        estimatedCost = parsed;
      } else whatToConfirm = field[2].trim();
    }
    if (name.length < 2 || name.length > 100 || category.length < 2 || category.length > 80 ||
        whatToConfirm.length < 2 || whatToConfirm.length > 300) {
      return unsupported('Vendor name, category, or confirmation tip is invalid.');
    }
    return {
      reply: `Added "${name}" to the vendor directory.`,
      operations: [{
        type: 'addVendor',
        vendor: { name, category, estimatedCost, whatToConfirm },
      }],
    };
  }

  const vendorStatusMatch = text.match(/^(?:mark|set|update)\s+(?:the\s+)?(?:vendor\s+)?(.+?)\s+(?:as\s+)?(booked|contacted|to contact)$/i);
  if (vendorStatusMatch) {
    const vendor = matchVendor(plan, vendorStatusMatch[1]);
    if (!vendor) return unsupported('I could not find that vendor.');
    const status = vendorStatusMatch[2].toLowerCase() === 'to contact'
      ? 'To contact'
      : vendorStatusMatch[2].toLowerCase() === 'contacted' ? 'Contacted' : 'Booked';
    return {
      reply: `Marked "${vendor.name}" as ${status}.`,
      operations: [{ type: 'updateVendorStatus', vendorId: vendor.id, status }],
    };
  }

  const dateMatch = text.match(/^(?:set|change|update)\s+(?:the\s+)?(?:event\s+)?date\s+(?:to|as)\s+(\d{4}-\d{2}-\d{2})$/i);
  if (dateMatch) {
    const date = dateMatch[1];
    if (!isValidDateOnly(date)) {
      return unsupported('Enter a valid date in YYYY-MM-DD format.');
    }
    return { reply: `Updated the event date to ${date}.`, operations: [{ type: 'setDate', date }] };
  }

  return unsupported();
}

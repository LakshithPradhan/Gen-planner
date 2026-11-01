import { CelebrationPlan } from '../types/plan';
import { formatCurrency, formatDate } from './formatters';

const STORAGE_KEY = 'evora_active_plan_v2';
const UNDO_STACK_KEY = 'evora_undo_history_v2';
const LEGACY_PLAN_KEY_SUFFIX = '_active_plan_v2';
const LEGACY_UNDO_KEY_SUFFIX = '_undo_history_v2';

function findLegacyStorageKey(currentKey: string, suffix: string): string | null {
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key !== currentKey && key.endsWith(suffix)) return key;
  }
  return null;
}

export function savePlanToStorage(plan: CelebrationPlan): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    return true;
  } catch (err) {
    console.warn('Failed to save plan to localStorage:', err);
    return false;
  }
}

export function loadPlanFromStorage(): CelebrationPlan | null {
  try {
    const legacyKey = findLegacyStorageKey(STORAGE_KEY, LEGACY_PLAN_KEY_SUFFIX);
    const raw = localStorage.getItem(STORAGE_KEY) ?? (legacyKey ? localStorage.getItem(legacyKey) : null);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load plan from localStorage:', err);
    return null;
  }
}

export function clearPlanStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(UNDO_STACK_KEY);
    const legacyPlanKey = findLegacyStorageKey(STORAGE_KEY, LEGACY_PLAN_KEY_SUFFIX);
    const legacyUndoKey = findLegacyStorageKey(UNDO_STACK_KEY, LEGACY_UNDO_KEY_SUFFIX);
    if (legacyPlanKey) localStorage.removeItem(legacyPlanKey);
    if (legacyUndoKey) localStorage.removeItem(legacyUndoKey);
  } catch (err) {
    console.warn('Failed to clear storage:', err);
  }
}

/**
 * Creates a shareable link that encodes the current celebration plan in URL hash.
 */
export function generateShareUrl(plan: CelebrationPlan): string {
  try {
    // Pick essential fields to keep URL compact
    const compactPayload = {
      n: plan.eventName,
      t: plan.eventType,
      d: plan.targetDate,
      g: plan.guestCount,
      c: plan.currency,
      b: plan.totalBudget,
      ci: plan.city,
      v: plan.vibeNotes,
      bc: plan.budgetCategories.map((cat) => ({ id: cat.id, n: cat.name, p: cat.percentage, s: cat.spent })),
      tl: plan.timeline.map((t) => ({ id: t.id, t: t.title, d: t.daysBeforeEvent, c: t.completed, u: t.isUrgent })),
      vd: plan.vendors.map((v) => ({ id: v.id, n: v.name, c: v.category, e: v.estimatedCost, s: v.status, w: v.whatToConfirm })),
      id: plan.ideas.map((i) => ({ id: i.id, t: i.title, g: i.tag, d: i.description })),
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(compactPayload))));
    const url = new URL(window.location.href);
    url.hash = `share=${encoded}`;
    return url.toString();
  } catch (err) {
    console.error('Failed to encode share URL:', err);
    return window.location.href;
  }
}

/**
 * Parses shared plan from current URL hash if present.
 */
export function parseSharedPlanFromUrl(): CelebrationPlan | null {
  try {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (!hash || !hash.includes('share=')) return null;

    const encoded = hash.split('share=')[1]?.split('&')[0];
    if (!encoded) return null;

    const jsonStr = decodeURIComponent(escape(atob(encoded)));
    const p = JSON.parse(jsonStr);

    return {
      id: `shared_${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventName: p.n || 'Celebration Plan',
      eventType: p.t || 'wedding',
      targetDate: p.d || new Date().toISOString().split('T')[0],
      guestCount: p.g || 100,
      currency: p.c || 'INR',
      totalBudget: p.b || 500000,
      city: p.ci || 'City',
      vibeNotes: p.v || '',
      budgetCategories: (p.bc || []).map((cat: any) => ({
        id: cat.id,
        name: cat.n,
        percentage: cat.p,
        spent: cat.s || 0,
      })),
      timeline: (p.tl || []).map((t: any) => ({
        id: t.id,
        title: t.t,
        phase: 'Milestone',
        daysBeforeEvent: t.d || 14,
        dueDate: '',
        completed: !!t.c,
        isUrgent: !!t.u,
      })),
      vendors: (p.vd || []).map((v: any) => ({
        id: v.id,
        name: v.n,
        category: v.c,
        estimatedCost: v.e || 0,
        status: v.s || 'To contact',
        whatToConfirm: v.w || '',
      })),
      ideas: (p.id || []).map((i: any) => ({
        id: i.id,
        title: i.t,
        tag: i.g || 'Concept',
        description: i.d || '',
      })),
      summaryNote: 'Loaded from shared celebration link (Read-only view available).',
    };
  } catch (err) {
    console.warn('Failed to parse share URL hash:', err);
    return null;
  }
}

/**
 * Exports plan into formatted plain-text brief for sharing or printing.
 */
export function exportPlanAsText(plan: CelebrationPlan): string {
  const lines: string[] = [];
  lines.push(`====================================================`);
  lines.push(`EVORA — CELEBRATION PLAN BRIEF`);
  lines.push(`====================================================`);
  lines.push(`Event: ${plan.eventName.toUpperCase()}`);
  lines.push(`Type: ${plan.eventType.toUpperCase()} | City: ${plan.city}`);
  lines.push(`Target Date: ${formatDate(plan.targetDate)} | Guests: ${plan.guestCount}`);
  lines.push(`Total Budget: ${formatCurrency(plan.totalBudget, plan.currency)}`);
  lines.push(`Vibe / Notes: ${plan.vibeNotes || 'None provided'}`);
  lines.push(``);

  lines.push(`--- BUDGET ALLOCATION (ESTIMATES) ---`);
  plan.budgetCategories.forEach((c) => {
    const planned = Math.round((plan.totalBudget * c.percentage) / 100);
    lines.push(`• ${c.name}: ${c.percentage}% (${formatCurrency(planned, plan.currency)}) | Spent: ${formatCurrency(c.spent, plan.currency)}`);
  });
  lines.push(``);

  lines.push(`--- TIMELINE ACTION PLAN ---`);
  plan.timeline.forEach((t) => {
    lines.push(`[${t.completed ? 'X' : ' '}] ${t.daysBeforeEvent}d before: ${t.title}${t.isUrgent ? ' (URGENT)' : ''}`);
  });
  lines.push(``);

  lines.push(`--- VENDOR DIRECTORY ---`);
  plan.vendors.forEach((v) => {
    lines.push(`• [${v.status.toUpperCase()}] ${v.name} (${v.category}) — Est: ${formatCurrency(v.estimatedCost, plan.currency)}`);
    lines.push(`   Confirm tip: ${v.whatToConfirm}`);
  });
  lines.push(``);

  lines.push(`--- CURATED CELEBRATION IDEAS ---`);
  plan.ideas.forEach((i, idx) => {
    lines.push(`${idx + 1}. [${i.tag}] ${i.title}`);
    lines.push(`   ${i.description}`);
  });
  lines.push(``);
  lines.push(`Generated by Evora Event Planner. All figures are AI estimates.`);
  return lines.join('\n');
}

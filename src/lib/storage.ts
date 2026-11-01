import { z } from 'zod';
import {
  CelebrationPlan,
  CelebrationPlanSchema,
  DateOnlySchema,
} from '../types/plan';
import { formatCurrency, formatDate } from './formatters';

const STORAGE_KEY = 'evora_active_plan_v2';
const RECOVERY_KEY = 'evora_invalid_plan_recovery_v1';
const UNDO_STACK_KEY = 'evora_undo_history_v2';
const LEGACY_PLAN_KEY_SUFFIX = '_active_plan_v2';
const LEGACY_UNDO_KEY_SUFFIX = '_undo_history_v2';
let invalidStoredPlanFound = false;
let sharedRestoreWarning: string | null = null;
let storedRestoreWarning: string | null = null;

const SharedPayloadSchema = z.object({
  n: z.string().trim().min(2).max(100),
  t: z.enum(['wedding', 'birthday', 'community']),
  d: DateOnlySchema,
  g: z.number().int().min(1).max(50000),
  c: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  b: z.number().finite().min(1).max(10_000_000_000),
  ci: z.string().trim().min(2).max(100),
  v: z.string().max(1000),
  bc: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    n: z.string().trim().min(1).max(100),
    p: z.number().finite().min(0).max(100),
    s: z.number().finite().min(0).max(10_000_000_000),
  }).strict()).min(1).max(100),
  tl: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    t: z.string().trim().min(1).max(150),
    d: z.number().int().min(0).max(3650),
    c: z.boolean(),
    u: z.boolean().optional(),
  }).strict()).max(500),
  vd: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    n: z.string().trim().min(1).max(100),
    c: z.string().trim().min(1).max(80),
    e: z.number().finite().min(0).max(10_000_000_000),
    s: z.enum(['To contact', 'Contacted', 'Booked']),
    w: z.string().trim().min(1).max(300),
  }).strict()).max(500),
  id: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    t: z.string().trim().min(1).max(150),
    g: z.string().trim().min(1).max(80),
    d: z.string().max(1000),
  }).strict()).max(500),
}).strict();

export function hasInvalidStoredPlan(): boolean {
  return invalidStoredPlanFound;
}

export function getPlanRestoreWarning(): string | null {
  return [sharedRestoreWarning, storedRestoreWarning].filter(Boolean).join(' ') || null;
}

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
  invalidStoredPlanFound = false;
  storedRestoreWarning = null;
  try {
    const legacyKey = findLegacyStorageKey(STORAGE_KEY, LEGACY_PLAN_KEY_SUFFIX);
    for (const key of [STORAGE_KEY, legacyKey].filter((value): value is string => value !== null)) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        console.warn(`Saved plan in ${key} is not valid JSON:`, err);
        preserveInvalidPlan(raw);
        storedRestoreWarning = 'A saved plan could not be loaded. Its original data was preserved in browser storage; a sample plan is shown instead.';
        continue;
      }

      const result = CelebrationPlanSchema.safeParse(parsed);
      if (result.success) return result.data;
      console.warn(`Saved plan in ${key} did not match the plan schema:`, result.error.issues);
      preserveInvalidPlan(raw);
      storedRestoreWarning = 'A saved plan could not be loaded. Its original data was preserved in browser storage; a sample plan is shown instead.';
    }
    return null;
  } catch (err) {
    console.warn('Failed to load plan from localStorage:', err);
    return null;
  }
}

function preserveInvalidPlan(raw: string): void {
  invalidStoredPlanFound = true;
  try {
    if (!localStorage.getItem(RECOVERY_KEY)) localStorage.setItem(RECOVERY_KEY, raw);
  } catch (err) {
    console.warn('Failed to preserve invalid saved plan for recovery:', err);
  }
}

export function clearPlanStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RECOVERY_KEY);
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
export function generateShareUrl(plan: CelebrationPlan): string | null {
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
    return null;
  }
}

/**
 * Parses shared plan from current URL hash if present.
 */
export function parseSharedPlanFromUrl(): CelebrationPlan | null {
  sharedRestoreWarning = null;
  try {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (!hash || !hash.includes('share=')) return null;

    const encoded = hash.split('share=')[1]?.split('&')[0];
    if (!encoded) {
      sharedRestoreWarning = 'This shared plan link is incomplete. A saved or sample plan is shown instead.';
      return null;
    }

    const jsonStr = decodeURIComponent(escape(atob(encoded)));
    const parsed: unknown = JSON.parse(jsonStr);
    const result = SharedPayloadSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('Shared plan did not match the expected structure:', result.error.issues);
      sharedRestoreWarning = 'This shared plan is incomplete or invalid. A saved or sample plan is shown instead.';
      return null;
    }
    const p = result.data;
    const sharedPlan: CelebrationPlan = {
      id: `shared_${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventName: p.n,
      eventType: p.t,
      targetDate: p.d,
      guestCount: p.g,
      currency: p.c,
      totalBudget: p.b,
      city: p.ci,
      vibeNotes: p.v,
      budgetCategories: p.bc.map((cat) => ({
        id: cat.id,
        name: cat.n,
        percentage: cat.p,
        spent: cat.s,
      })),
      timeline: p.tl.map((t) => ({
        id: t.id,
        title: t.t,
        phase: 'Milestone',
        daysBeforeEvent: t.d,
        dueDate: '',
        completed: t.c,
        isUrgent: t.u ?? false,
      })),
      vendors: p.vd.map((v) => ({
        id: v.id,
        name: v.n,
        category: v.c,
        estimatedCost: v.e,
        status: v.s,
        whatToConfirm: v.w,
      })),
      ideas: p.id.map((i) => ({
        id: i.id,
        title: i.t,
        tag: i.g,
        description: i.d,
      })),
      summaryNote: 'Loaded from shared celebration link (Read-only view available).',
    };
    const fullPlan = CelebrationPlanSchema.safeParse(sharedPlan);
    if (!fullPlan.success) {
      console.warn('Decoded shared plan did not form a valid plan:', fullPlan.error.issues);
      sharedRestoreWarning = 'This shared plan is incomplete or invalid. A saved or sample plan is shown instead.';
      return null;
    }
    return fullPlan.data;
  } catch (err) {
    console.warn('Failed to parse share URL hash:', err);
    sharedRestoreWarning = 'This shared plan could not be decoded. A saved or sample plan is shown instead.';
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

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CelebrationPlanSchema,
  DateOnlySchema,
  PlanGenerationResponseSchema,
  PlanRequestSchema,
} from '../types/plan';
import { addDaysToDateOnly, daysBetweenDateOnly, formatDateOnly } from '../lib/dateOnly';
import {
  getPlanRestoreWarning,
  hasInvalidStoredPlan,
  loadPlanFromStorage,
  generateShareUrl,
  parseSharedPlanFromUrl,
} from '../lib/storage';
import { getBuiltinTemplate } from '../lib/templates';

class TestStorage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('plan and model schemas', () => {
  it('accepts a complete built-in plan and rejects missing nested data', () => {
    const plan = getBuiltinTemplate('birthday');
    expect(CelebrationPlanSchema.safeParse(plan).success).toBe(true);

    const incompletePlan = {
      ...plan,
      vendors: [{ ...plan.vendors[0], estimatedCost: Number.NaN }],
    };
    expect(CelebrationPlanSchema.safeParse(incompletePlan).success).toBe(false);
    expect(CelebrationPlanSchema.safeParse({ ...plan, timeline: undefined }).success).toBe(false);
  });

  it('rejects invalid numbers and impossible date-only values', () => {
    expect(DateOnlySchema.safeParse('2028-02-29').success).toBe(true);
    expect(DateOnlySchema.safeParse('2027-02-29').success).toBe(false);
    const validRequest = {
      eventType: 'wedding',
      eventName: 'A valid celebration',
      date: '2028-02-29',
      guests: 100,
      totalBudget: 10_000,
      city: 'Jaipur',
    };
    expect(PlanRequestSchema.safeParse(validRequest).success).toBe(true);
    expect(PlanRequestSchema.safeParse({ ...validRequest, date: '2027-02-29' }).success).toBe(false);
    expect(PlanRequestSchema.safeParse({ ...validRequest, guests: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(PlanRequestSchema.safeParse({ ...validRequest, totalBudget: -1 }).success).toBe(false);
    expect(PlanRequestSchema.safeParse({ ...validRequest, unrecognizedField: true }).success).toBe(false);
  });

  it('requires complete generated content and rejects unsafe amounts', () => {
    expect(PlanGenerationResponseSchema.safeParse({
      budgetCategories: [{ name: 'Venue', percentage: 100, spent: 0 }],
      timeline: [],
      vendors: [],
      ideas: [],
    }).success).toBe(true);
    expect(PlanGenerationResponseSchema.safeParse({
      budgetCategories: [{ name: 'Venue', percentage: Number.POSITIVE_INFINITY }],
      timeline: [],
      vendors: [],
      ideas: [],
    }).success).toBe(false);
    expect(PlanGenerationResponseSchema.safeParse({
      budgetCategories: [],
      timeline: [],
      vendors: [],
      ideas: [],
    }).success).toBe(false);
    expect(PlanGenerationResponseSchema.safeParse({
      budgetCategories: [{ name: 'Venue', percentage: 100 }],
      timeline: [],
      ideas: [],
    }).success).toBe(false);
    expect(PlanGenerationResponseSchema.safeParse({
      budgetCategories: [{ name: 'Venue', percentage: 100 }],
      timeline: [{ title: 'Book venue', phase: 'Planning', daysBeforeEvent: -1 }],
      vendors: [],
      ideas: [],
    }).success).toBe(false);
  });
});

describe('saved and shared plan validation', () => {
  it('preserves invalid local data and reports a graceful restore warning', () => {
    const localStorage = new TestStorage();
    const invalidSavedPlan = JSON.stringify({ eventName: 'Incomplete plan' });
    localStorage.setItem('evora_active_plan_v2', invalidSavedPlan);
    vi.stubGlobal('localStorage', localStorage);

    expect(loadPlanFromStorage()).toBeNull();
    expect(hasInvalidStoredPlan()).toBe(true);
    expect(localStorage.getItem('evora_active_plan_v2')).toBe(invalidSavedPlan);
    expect(localStorage.getItem('evora_invalid_plan_recovery_v1')).toBe(invalidSavedPlan);
    expect(getPlanRestoreWarning()).toContain('could not be loaded');
  });

  it('loads a complete saved plan and preserves malformed JSON for recovery', () => {
    const localStorage = new TestStorage();
    const validPlan = getBuiltinTemplate('community');
    localStorage.setItem('evora_active_plan_v2', JSON.stringify(validPlan));
    vi.stubGlobal('localStorage', localStorage);
    expect(loadPlanFromStorage()).toEqual(validPlan);

    localStorage.setItem('evora_active_plan_v2', '{broken-json');
    expect(loadPlanFromStorage()).toBeNull();
    expect(localStorage.getItem('evora_active_plan_v2')).toBe('{broken-json');
    expect(localStorage.getItem('evora_invalid_plan_recovery_v1')).toBe('{broken-json');
  });

  it('rejects incomplete compact shared-plan payloads', () => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify({ n: 'Missing required fields' }))));
    vi.stubGlobal('window', { location: { hash: `#share=${encoded}` } });

    expect(parseSharedPlanFromUrl()).toBeNull();
    expect(getPlanRestoreWarning()).toContain('incomplete or invalid');
  });

  it('rejects shared plans with invalid nested budget values', () => {
    const plan = getBuiltinTemplate('birthday');
    const payload = {
      n: plan.eventName,
      t: plan.eventType,
      d: plan.targetDate,
      g: plan.guestCount,
      c: plan.currency,
      b: plan.totalBudget,
      ci: plan.city,
      v: plan.vibeNotes,
      bc: [{ id: 'bad', n: 'Venue', p: 100, s: Number.NaN }],
      tl: [],
      vd: [],
      id: [],
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    vi.stubGlobal('window', { location: { hash: `#share=${encoded}` } });
    expect(parseSharedPlanFromUrl()).toBeNull();
  });

  it('loads the existing compact share format after validating it', () => {
    const browserWindow = { location: { href: 'https://evora.example/', hash: '' } };
    vi.stubGlobal('window', browserWindow);
    const sharedUrl = generateShareUrl(getBuiltinTemplate('birthday'));
    if (!sharedUrl) throw new Error('Expected a share link for a valid plan');
    browserWindow.location.hash = new URL(sharedUrl).hash;

    const sharedPlan = parseSharedPlanFromUrl();
    expect(sharedPlan?.eventType).toBe('birthday');
    expect(sharedPlan?.budgetCategories.length).toBeGreaterThan(0);
    expect(sharedPlan?.timeline[0].phase).toBe('Milestone');
  });

  it('reports share-link encoding failures instead of returning the current page URL', () => {
    const currentPage = 'https://evora.example/current-page';
    vi.stubGlobal('window', { location: { href: currentPage, hash: '' } });
    vi.stubGlobal('btoa', vi.fn(() => {
      throw new Error('encoding unavailable');
    }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(generateShareUrl(getBuiltinTemplate('birthday'))).toBeNull();
  });
});

describe('date-only calculations', () => {
  it('does calendar-day arithmetic without timezone conversion', () => {
    const previousTimezone = process.env.TZ;
    try {
      process.env.TZ = 'America/Los_Angeles';
      expect(addDaysToDateOnly('2027-03-13', 1)).toBe('2027-03-14');
      expect(addDaysToDateOnly('2027-01-01', -1)).toBe('2026-12-31');
      expect(daysBetweenDateOnly('2027-03-13', '2027-03-14')).toBe(1);
      expect(formatDateOnly('2027-03-14')).toBe('Mar 14, 2027');
      process.env.TZ = 'Pacific/Kiritimati';
      expect(formatDateOnly('2027-03-14')).toBe('Mar 14, 2027');
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = previousTimezone;
    }
  });
});

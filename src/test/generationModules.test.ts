import { describe, expect, it } from 'vitest';
import { applyGenerationModules, GENERATION_MODULES, INFORMATIONAL_MODULES } from '../lib/generationModules';
import { PlanRequestSchema } from '../types/plan';
import { getBuiltinTemplate } from '../lib/templates';

describe('Command Center generation module selections', () => {
  const plan = getBuiltinTemplate('birthday');

  it('uses the selected optional content modules in generated plans', () => {
    const vendorsOnly = applyGenerationModules(plan, ['Vendor Directory']);
    expect(vendorsOnly.vendors).toEqual(plan.vendors);
    expect(vendorsOnly.ideas).toEqual([]);

    const ideasOnly = applyGenerationModules(plan, ['City Ideas']);
    expect(ideasOnly.vendors).toEqual([]);
    expect(ideasOnly.ideas).toEqual(plan.ideas);

    const neither = applyGenerationModules(plan, []);
    expect(neither.vendors).toEqual([]);
    expect(neither.ideas).toEqual([]);

    const both = applyGenerationModules(plan, [...GENERATION_MODULES]);
    expect(both.vendors).toEqual(plan.vendors);
    expect(both.ideas).toEqual(plan.ideas);
  });

  it('defaults legacy creation requests to both generated content modules', () => {
    const parsed = PlanRequestSchema.parse({
      eventType: 'birthday',
      eventName: 'Sample Birthday',
      date: '2027-05-20',
      guests: 50,
      currency: 'INR',
      totalBudget: 100_000,
      city: 'Jaipur',
    });
    expect(parsed.selectedModules).toEqual([...GENERATION_MODULES]);
  });

  it('keeps core planning features explicitly informational', () => {
    expect(INFORMATIONAL_MODULES).toContain('Budget Normalisation');
    expect(INFORMATIONAL_MODULES).toContain('Compressed Timeline');
    expect(INFORMATIONAL_MODULES).toContain('What-If Simulator');
    expect(INFORMATIONAL_MODULES).toContain('Conversational Chat Editor');
  });
});

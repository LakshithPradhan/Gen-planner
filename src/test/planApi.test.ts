import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestGeneratedPlan } from '../lib/planApi';
import { getBuiltinTemplate } from '../lib/templates';
import { PlanRequestSchema } from '../types/plan';

const request = PlanRequestSchema.parse({
  eventType: 'birthday',
  eventName: 'Sample Birthday',
  date: '2027-06-15',
  guests: 40,
  totalBudget: 100_000,
  city: 'Pune',
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('plan generation API boundary', () => {
  it('sends validated request data and validates the returned plan', async () => {
    const plan = getBuiltinTemplate('birthday');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(plan), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestGeneratedPlan(request)).resolves.toEqual(plan);
    expect(fetchMock).toHaveBeenCalledWith('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  });

  it('rejects API failures and invalid plan responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('Unavailable', { status: 503 })
    ));
    await expect(requestGeneratedPlan(request)).rejects.toThrow('Plan API error (503)');

    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ eventName: 'Incomplete' }), { status: 200 })
    ));
    await expect(requestGeneratedPlan(request)).rejects.toThrow(
      'The plan service returned incomplete plan data.'
    );
  });
});

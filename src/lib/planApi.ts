import {
  CelebrationPlan,
  CelebrationPlanSchema,
  ParsedPlanRequest,
} from '../types/plan';

export async function requestGeneratedPlan(
  request: ParsedPlanRequest
): Promise<CelebrationPlan> {
  const response = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Plan API error (${response.status})`);
  }

  const responseData: unknown = await response.json();
  const result = CelebrationPlanSchema.safeParse(responseData);
  if (!result.success) {
    console.warn('Plan API returned invalid plan data:', result.error.issues);
    throw new Error('The plan service returned incomplete plan data.');
  }

  return result.data;
}

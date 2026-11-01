import { CelebrationPlan, GenerationModule } from '../types/plan';

export const GENERATION_MODULES = ['Vendor Directory', 'City Ideas'] as const satisfies readonly GenerationModule[];

export const INFORMATIONAL_MODULES = [
  'Budget Normalisation',
  'Compressed Timeline',
  'What-If Simulator',
  'Conversational Chat Editor',
] as const;

export function applyGenerationModules(
  plan: CelebrationPlan,
  selectedModules: readonly GenerationModule[]
): CelebrationPlan {
  return {
    ...plan,
    vendors: selectedModules.includes('Vendor Directory') ? plan.vendors : [],
    ideas: selectedModules.includes('City Ideas') ? plan.ideas : [],
  };
}

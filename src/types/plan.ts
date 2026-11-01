import { z } from 'zod';

export type EventType = 'wedding' | 'birthday' | 'community';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
export type VendorStatus = 'To contact' | 'Contacted' | 'Booked';
export const MAX_TIMELINE_TASKS = 500;
export const GenerationModuleSchema = z.enum(['Vendor Directory', 'City Ideas']);
export type GenerationModule = z.infer<typeof GenerationModuleSchema>;

export function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match || match[0] !== value) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

export const DateOnlySchema = z.string().refine(isValidDateOnly, {
  message: 'Expected a valid calendar date in YYYY-MM-DD format',
});

const NonEmptyTextSchema = z.string().trim().min(1);
const PositiveMoneySchema = z.number().finite().min(1).max(10_000_000_000);
const NonNegativeMoneySchema = z.number().finite().min(0).max(10_000_000_000);
const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{3,4}(?:[0-9A-Fa-f]{2}){0,2}$/);

export interface BudgetCategory {
  id: string;
  name: string;
  percentage: number;
  spent: number;
  color?: string;
  description?: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  phase: string;
  daysBeforeEvent: number;
  dueDate: string;
  completed: boolean;
  isUrgent?: boolean;
  category?: string;
}

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  status: VendorStatus;
  whatToConfirm: string;
  phoneOrContact?: string;
}

export interface CelebrationIdea {
  id: string;
  title: string;
  tag: string;
  description: string;
  saved?: boolean;
}

export interface CelebrationPlan {
  id: string;
  createdAt: string;
  eventName: string;
  eventType: EventType;
  targetDate: string;
  guestCount: number;
  currency: CurrencyCode;
  totalBudget: number;
  city: string;
  vibeNotes: string;
  budgetCategories: BudgetCategory[];
  timeline: TimelineTask[];
  vendors: VendorItem[];
  ideas: CelebrationIdea[];
  summaryNote?: string;
}

// Structured Edit Operations
export type PlanOperation =
  | { type: 'setBudgetTotal'; amount: number }
  | { type: 'setEventName'; eventName: string }
  | { type: 'setCategoryPct'; categoryId: string; percentage: number }
  | { type: 'addTask'; task: { title: string; daysBeforeEvent?: number; phase?: string; isUrgent?: boolean } }
  | { type: 'updateTask'; taskId: string; title?: string; daysBeforeEvent?: number; phase?: string; isUrgent?: boolean }
  | { type: 'completeTask'; taskId: string; completed: boolean }
  | { type: 'removeTask'; taskId: string }
  | { type: 'setGuests'; count: number }
  | { type: 'setDate'; date: string }
  | { type: 'addVendor'; vendor: { name: string; category: string; estimatedCost?: number; whatToConfirm: string } }
  | { type: 'updateVendorStatus'; vendorId: string; status: VendorStatus };

// Zod Schemas for API validation
export const PlanRequestSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'community']),
  eventName: z.string().trim().min(2).max(100),
  date: DateOnlySchema,
  guests: z.number().int().min(1).max(50000),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
  totalBudget: PositiveMoneySchema,
  city: z.string().trim().min(2).max(100),
  vibeNotes: z.string().max(1000).optional().default(''),
  selectedModules: z.array(GenerationModuleSchema)
    .max(2)
    .refine((modules) => new Set(modules).size === modules.length, 'Duplicate generation modules are not allowed')
    .default(['Vendor Directory', 'City Ideas']),
}).strict();

export type PlanRequestInput = z.input<typeof PlanRequestSchema>;
export type ParsedPlanRequest = z.output<typeof PlanRequestSchema>;

export const BudgetCategorySchema = z.object({
  id: NonEmptyTextSchema.max(100),
  name: NonEmptyTextSchema.max(100),
  percentage: z.number().finite().min(0).max(100),
  spent: NonNegativeMoneySchema,
  color: HexColorSchema.optional(),
  description: z.string().max(500).optional(),
});

export const TimelineTaskSchema = z.object({
  id: NonEmptyTextSchema.max(100),
  title: NonEmptyTextSchema.max(150),
  phase: NonEmptyTextSchema.max(80),
  daysBeforeEvent: z.number().int().min(0).max(3650),
  dueDate: z.union([DateOnlySchema, z.literal('')]),
  completed: z.boolean(),
  isUrgent: z.boolean().optional(),
  category: z.string().max(100).optional(),
});

export const VendorItemSchema = z.object({
  id: NonEmptyTextSchema.max(100),
  name: NonEmptyTextSchema.max(100),
  category: NonEmptyTextSchema.max(80),
  estimatedCost: NonNegativeMoneySchema,
  status: z.enum(['To contact', 'Contacted', 'Booked']),
  whatToConfirm: NonEmptyTextSchema.max(300),
  phoneOrContact: z.string().max(200).optional(),
});

export const CelebrationIdeaSchema = z.object({
  id: NonEmptyTextSchema.max(100),
  title: NonEmptyTextSchema.max(150),
  tag: NonEmptyTextSchema.max(80),
  description: NonEmptyTextSchema.max(1000),
  saved: z.boolean().optional(),
});

export const CelebrationPlanSchema = z.object({
  id: NonEmptyTextSchema.max(150),
  createdAt: z.string().datetime({ offset: true }),
  eventName: z.string().trim().min(2).max(100),
  eventType: z.enum(['wedding', 'birthday', 'community']),
  targetDate: DateOnlySchema,
  guestCount: z.number().int().min(1).max(50000),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  totalBudget: PositiveMoneySchema,
  city: z.string().trim().min(2).max(100),
  vibeNotes: z.string().max(1000),
  budgetCategories: z.array(BudgetCategorySchema).min(1).max(100),
  timeline: z.array(TimelineTaskSchema).max(MAX_TIMELINE_TASKS),
  vendors: z.array(VendorItemSchema).max(500),
  ideas: z.array(CelebrationIdeaSchema).max(500),
  summaryNote: z.string().max(2000).optional(),
});

export type ParsedCelebrationPlan = z.output<typeof CelebrationPlanSchema>;

export const PlanGenerationResponseSchema = z.object({
  budgetCategories: z.array(z.object({
    id: NonEmptyTextSchema.max(100).optional(),
    name: NonEmptyTextSchema.max(100),
    percentage: z.number().finite().min(0).max(100),
    spent: NonNegativeMoneySchema.optional().default(0),
    color: HexColorSchema.optional(),
    description: z.string().max(500).optional(),
  })).min(1).max(100),
  timeline: z.array(z.object({
    id: NonEmptyTextSchema.max(100).optional(),
    title: NonEmptyTextSchema.max(150),
    phase: NonEmptyTextSchema.max(80),
    daysBeforeEvent: z.number().int().min(0).max(3650),
    dueDate: z.union([DateOnlySchema, z.literal('')]).optional().default(''),
    completed: z.boolean().optional().default(false),
    isUrgent: z.boolean().optional().default(false),
  })).max(MAX_TIMELINE_TASKS),
  vendors: z.array(z.object({
    id: NonEmptyTextSchema.max(100).optional(),
    name: NonEmptyTextSchema.max(100),
    category: NonEmptyTextSchema.max(80),
    estimatedCost: NonNegativeMoneySchema,
    status: z.enum(['To contact', 'Contacted', 'Booked']),
    whatToConfirm: NonEmptyTextSchema.max(300),
  })).max(500),
  ideas: z.array(z.object({
    id: NonEmptyTextSchema.max(100).optional(),
    title: NonEmptyTextSchema.max(150),
    tag: NonEmptyTextSchema.max(80),
    description: NonEmptyTextSchema.max(1000),
  })).max(500),
  summaryNote: z.string().max(2000).optional(),
}).strict();

export type PlanGenerationResponse = z.output<typeof PlanGenerationResponseSchema>;

export const PlanOperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('setBudgetTotal'), amount: PositiveMoneySchema }),
  z.object({ type: z.literal('setEventName'), eventName: z.string().trim().min(2).max(100) }),
  z.object({
    type: z.literal('setCategoryPct'),
    categoryId: NonEmptyTextSchema.max(100),
    percentage: z.number().finite().min(0).max(100),
  }),
  z.object({
    type: z.literal('addTask'),
    task: z.object({
      title: z.string().trim().min(2).max(150),
      daysBeforeEvent: z.number().int().min(0).max(365).optional(),
      phase: z.string().trim().min(1).max(80).optional(),
      isUrgent: z.boolean().optional(),
    }),
  }),
  z.object({
    type: z.literal('updateTask'),
    taskId: NonEmptyTextSchema.max(150),
    title: z.string().trim().min(2).max(150).optional(),
    daysBeforeEvent: z.number().int().min(0).max(365).optional(),
    phase: z.string().trim().min(1).max(80).optional(),
    isUrgent: z.boolean().optional(),
  }).refine(
    ({ title, daysBeforeEvent, phase, isUrgent }) =>
      title !== undefined || daysBeforeEvent !== undefined || phase !== undefined || isUrgent !== undefined,
    { message: 'At least one task field must be updated' }
  ),
  z.object({ type: z.literal('completeTask'), taskId: NonEmptyTextSchema.max(150), completed: z.boolean() }),
  z.object({ type: z.literal('removeTask'), taskId: NonEmptyTextSchema.max(150) }),
  z.object({ type: z.literal('setGuests'), count: z.number().int().min(1).max(50000) }),
  z.object({ type: z.literal('setDate'), date: DateOnlySchema }),
  z.object({
    type: z.literal('addVendor'),
    vendor: z.object({
      name: z.string().trim().min(2).max(100),
      category: z.string().trim().min(2).max(80),
      estimatedCost: NonNegativeMoneySchema.optional(),
      whatToConfirm: z.string().trim().min(2).max(300),
    }),
  }),
  z.object({
    type: z.literal('updateVendorStatus'),
    vendorId: NonEmptyTextSchema.max(100),
    status: z.enum(['To contact', 'Contacted', 'Booked']),
  }),
]);

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  currentPlan: CelebrationPlanSchema,
}).strict();

export const ChatResponseSchema = z.object({
  reply: z.string().min(1).max(2000),
  operations: z.array(PlanOperationSchema),
}).strict();

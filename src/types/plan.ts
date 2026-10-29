import { z } from 'zod';

export type EventType = 'wedding' | 'birthday' | 'community';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
export type VendorStatus = 'To contact' | 'Contacted' | 'Booked';

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
  | { type: 'setCategoryPct'; categoryId: string; percentage: number }
  | { type: 'addTask'; task: { title: string; daysBeforeEvent?: number; phase?: string; isUrgent?: boolean } }
  | { type: 'completeTask'; taskId: string; completed: boolean }
  | { type: 'removeTask'; taskId: string }
  | { type: 'setGuests'; count: number }
  | { type: 'setDate'; date: string }
  | { type: 'addVendor'; vendor: { name: string; category: string; estimatedCost?: number; whatToConfirm: string } }
  | { type: 'updateVendorStatus'; vendorId: string; status: VendorStatus };

export interface ChatDiff {
  timestamp: number;
  userPrompt: string;
  aiExplanation: string;
  operations: PlanOperation[];
  beforeSnapshot: CelebrationPlan;
  afterSnapshot: CelebrationPlan;
}

// Zod Schemas for API validation
export const PlanRequestSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'community']),
  eventName: z.string().min(2).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(50000),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
  totalBudget: z.number().positive().max(10000000000),
  city: z.string().min(2).max(100),
  vibeNotes: z.string().max(1000).optional().default(''),
});

export type PlanRequestInput = z.infer<typeof PlanRequestSchema>;

export const PlanOperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('setBudgetTotal'), amount: z.number().positive() }),
  z.object({ type: z.literal('setCategoryPct'), categoryId: z.string(), percentage: z.number().min(0).max(100) }),
  z.object({
    type: z.literal('addTask'),
    task: z.object({
      title: z.string().min(2).max(150),
      daysBeforeEvent: z.number().int().optional(),
      phase: z.string().optional(),
      isUrgent: z.boolean().optional(),
    }),
  }),
  z.object({ type: z.literal('completeTask'), taskId: z.string(), completed: z.boolean() }),
  z.object({ type: z.literal('removeTask'), taskId: z.string() }),
  z.object({ type: z.literal('setGuests'), count: z.number().int().min(1).max(50000) }),
  z.object({ type: z.literal('setDate'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({
    type: z.literal('addVendor'),
    vendor: z.object({
      name: z.string().min(2).max(100),
      category: z.string().min(2).max(80),
      estimatedCost: z.number().min(0).optional(),
      whatToConfirm: z.string().min(2).max(300),
    }),
  }),
  z.object({
    type: z.literal('updateVendorStatus'),
    vendorId: z.string(),
    status: z.enum(['To contact', 'Contacted', 'Booked']),
  }),
]);

export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  currentPlan: z.any(),
});

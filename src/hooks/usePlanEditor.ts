import { CelebrationPlan, VendorItem, VendorStatus } from '../types/plan';
import { normalizeBudgetCategories } from '../lib/budget';
import { addDaysToDateOnly } from '../lib/dateOnly';

type PlanUpdateHandler = (plan: CelebrationPlan) => void;
type NewVendorDetails = Pick<VendorItem, 'name' | 'category' | 'estimatedCost' | 'whatToConfirm'>;

export function usePlanEditor(plan: CelebrationPlan, onUpdatePlan: PlanUpdateHandler) {
  const handleUpdateCategoryPct = (categoryId: string, percentage: number) => {
    const budgetCategories = plan.budgetCategories.map((category) =>
      category.id === categoryId
        ? { ...category, percentage: Math.max(0, Math.min(100, percentage)) }
        : category
    );
    onUpdatePlan({ ...plan, budgetCategories });
  };

  const handleUpdateCategorySpent = (categoryId: string, spent: number) => {
    const budgetCategories = plan.budgetCategories.map((category) =>
      category.id === categoryId ? { ...category, spent: Math.max(0, spent) } : category
    );
    onUpdatePlan({ ...plan, budgetCategories });
  };

  const handleNormalizeBudget = () => {
    onUpdatePlan({
      ...plan,
      budgetCategories: normalizeBudgetCategories(plan.budgetCategories),
    });
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    const timeline = plan.timeline.map((task) =>
      task.id === taskId ? { ...task, completed } : task
    );
    onUpdatePlan({ ...plan, timeline });
  };

  const handleAddTask = (
    title: string,
    daysBeforeEvent: number,
    phase: string,
    isUrgent: boolean
  ) => {
    const task = {
      id: `task_${Date.now()}`,
      title,
      phase,
      daysBeforeEvent,
      dueDate: addDaysToDateOnly(plan.targetDate, -daysBeforeEvent),
      completed: false,
      isUrgent,
    };
    onUpdatePlan({ ...plan, timeline: [task, ...plan.timeline] });
  };

  const handleUpdateVendorStatus = (vendorId: string, status: VendorStatus) => {
    const vendors = plan.vendors.map((vendor) =>
      vendor.id === vendorId ? { ...vendor, status } : vendor
    );
    onUpdatePlan({ ...plan, vendors });
  };

  const handleAddVendor = (details: NewVendorDetails) => {
    const vendor: VendorItem = {
      id: `vendor_${Date.now()}`,
      ...details,
      status: 'To contact',
    };
    onUpdatePlan({ ...plan, vendors: [...plan.vendors, vendor] });
  };

  const handleDeleteVendor = (vendorId: string) => {
    onUpdatePlan({
      ...plan,
      vendors: plan.vendors.filter((vendor) => vendor.id !== vendorId),
    });
  };

  const handleAddIdeas = (ideas: CelebrationPlan['ideas']) => {
    onUpdatePlan({ ...plan, ideas: [...plan.ideas, ...ideas] });
  };

  return {
    handleUpdateCategoryPct,
    handleUpdateCategorySpent,
    handleNormalizeBudget,
    handleToggleTask,
    handleAddTask,
    handleUpdateVendorStatus,
    handleAddVendor,
    handleDeleteVendor,
    handleAddIdeas,
  };
}

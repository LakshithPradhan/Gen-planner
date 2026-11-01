// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommandCenterModal } from '../components/CommandCenterModal';
import App from '../App';
import { IdeasView } from '../components/IdeasView';
import { PlanChatModal } from '../components/PlanChatModal';
import { TimelineView } from '../components/TimelineView';
import { VendorChecklist } from '../components/VendorChecklist';
import { usePlanEditor } from '../hooks/usePlanEditor';
import { copyTextToClipboard } from '../lib/clipboard';
import { applyOperations, DiffDetail } from '../lib/operations';
import { getBuiltinTemplate } from '../lib/templates';
import { CelebrationPlan, MAX_TIMELINE_TASKS } from '../types/plan';
import { DiffModal } from '../components/DiffModal';
import { CapabilitiesSection } from '../components/CapabilitiesSection';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const mountedRoots: Array<{ root: Root; container: HTMLDivElement }> = [];

async function render(element: React.ReactElement): Promise<HTMLDivElement> {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.push({ root, container });
  await act(async () => root.render(element));
  return container;
}

function click(element: Element): void {
  act(() => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function pressKey(key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
}

function activateButtonWithKeyboard(button: HTMLButtonElement, key: 'Enter' | ' '): void {
  button.focus();
  const keydown = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  button.dispatchEvent(keydown);
  if (key === ' ') {
    button.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
  }
  // jsdom omits the browser's native button keyboard activation default action.
  if (!keydown.defaultPrevented) click(button);
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (!setter) throw new Error('Input value setter is unavailable in the DOM test environment');
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function submit(form: HTMLFormElement): Promise<void> {
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

afterEach(async () => {
  await act(async () => {
    mountedRoots.splice(0).forEach(({ root, container }) => {
      root.unmount();
      container.remove();
    });
  });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('event creation and editing interactions', () => {
  it('exposes capability disclosures as keyboard-operable buttons with unique panel controls', async () => {
    const container = await render(
      <>
        <CapabilitiesSection />
        <CapabilitiesSection />
      </>
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>(
      'button[aria-controls*="-capability-"]'
    )];
    expect(buttons.length).toBeGreaterThan(0);

    const ids = [...container.querySelectorAll<HTMLElement>('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const button of buttons) {
      const panel = document.getElementById(button.getAttribute('aria-controls')!);
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute('aria-labelledby')).toBe(button.id);
    }

    const firstSectionButtons = buttons.slice(0, 6);
    const firstButton = firstSectionButtons[0];
    const firstPanel = document.getElementById(firstButton.getAttribute('aria-controls')!);
    expect(firstButton.getAttribute('aria-expanded')).toBe('true');
    expect(firstPanel?.hidden).toBe(false);
    click(firstButton);
    expect(firstButton.getAttribute('aria-expanded')).toBe('false');
    expect(firstPanel?.hidden).toBe(true);

    activateButtonWithKeyboard(firstButton, 'Enter');
    expect(firstButton.getAttribute('aria-expanded')).toBe('true');
    expect(firstPanel?.hidden).toBe(false);
    activateButtonWithKeyboard(firstButton, ' ');
    expect(firstButton.getAttribute('aria-expanded')).toBe('false');
    expect(firstPanel?.hidden).toBe(true);
  });

  it('keeps the default Command Center brief valid for form submission', async () => {
    const container = await render(
      <CommandCenterModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} isLoading={false} />
    );

    expect(container.querySelector('form')?.checkValidity()).toBe(true);
  });

  it('traps Command Center focus, closes with Escape, and restores the trigger focus', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    function Harness() {
      const [isOpen, setIsOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>Open Command Center</button>
          <CommandCenterModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onSubmit={onSubmit}
            isLoading={false}
          />
        </>
      );
    }

    const container = await render(<Harness />);
    const trigger = container.querySelector('button')!;
    trigger.focus();
    click(trigger);

    const dialog = container.querySelector('dialog')!;
    expect(document.activeElement).toBe(dialog.querySelector('input[type="text"]'));

    const focusable = [...dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )];
    focusable[focusable.length - 1].focus();
    const tabEvent = pressKey('Tab');
    expect(tabEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusable[0]);

    focusable[0].focus();
    const shiftTabEvent = pressKey('Tab', true);
    expect(shiftTabEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusable[focusable.length - 1]);

    await act(async () => {
      pressKey('Escape');
    });
    expect(container.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes only the topmost dialog on Escape and restores focus into the parent dialog', async () => {
    const plan = getBuiltinTemplate('birthday');
    function Harness() {
      const [chatOpen, setChatOpen] = React.useState(false);
      const [diffOpen, setDiffOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setChatOpen(true)}>Original trigger</button>
          <PlanChatModal
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            plan={plan}
            onPlanUpdated={vi.fn()}
            canUndo={!diffOpen}
            onUndo={() => setDiffOpen(true)}
          />
          <DiffModal
            isOpen={diffOpen}
            onClose={() => setDiffOpen(false)}
            diffs={[]}
            aiExplanation=""
            onUndo={vi.fn()}
          />
        </>
      );
    }

    const container = await render(<Harness />);
    const originalTrigger = container.querySelector('button')!;
    originalTrigger.focus();
    click(originalTrigger);
    const nestedTrigger = [...container.querySelectorAll<HTMLButtonElement>('dialog button')]
      .find((button) => button.textContent?.includes('Undo'))!;
    nestedTrigger.focus();
    click(nestedTrigger);

    expect(container.querySelectorAll('dialog')).toHaveLength(2);
    await act(async () => {
      pressKey('Escape');
    });
    expect(container.querySelectorAll('dialog')).toHaveLength(1);
    expect(document.activeElement).toBe(container.querySelector('[aria-label="Plan instruction"]'));

    await act(async () => {
      pressKey('Escape');
    });
    expect(container.querySelectorAll('dialog')).toHaveLength(0);
    expect(document.activeElement).toBe(originalTrigger);
  });

  it('submits the Command Center form with user-edited event details and selected modules', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const container = await render(
      <CommandCenterModal isOpen onClose={vi.fn()} onSubmit={onSubmit} isLoading={false} />
    );

    const inputs = container.querySelectorAll('form input');
    setInputValue(inputs[0] as HTMLInputElement, 'Test Celebration');
    setInputValue(inputs[1] as HTMLInputElement, '2027-06-15');
    setInputValue(inputs[2] as HTMLInputElement, '120');

    const cityIdeas = [...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('City Ideas'));
    expect(cityIdeas).toBeDefined();
    click(cityIdeas!);

    await submit(container.querySelector('form')!);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'Test Celebration',
      date: '2027-06-15',
      guests: 120,
      selectedModules: ['Vendor Directory'],
    }));
  });

  it('associates form labels and controls uniquely across repeated component instances', async () => {
    const plan = getBuiltinTemplate('birthday');
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const container = await render(
      <>
        <CommandCenterModal isOpen onClose={vi.fn()} onSubmit={onSubmit} isLoading={false} />
        <CommandCenterModal isOpen onClose={vi.fn()} onSubmit={onSubmit} isLoading={false} />
        <TimelineView tasks={plan.timeline} targetDate={plan.targetDate} onToggleTask={vi.fn()} onAddTask={vi.fn()} />
        <TimelineView tasks={plan.timeline} targetDate={plan.targetDate} onToggleTask={vi.fn()} onAddTask={vi.fn()} />
        <VendorChecklist vendors={plan.vendors} currency={plan.currency} onUpdateStatus={vi.fn()} onAddVendor={vi.fn()} onDeleteVendor={vi.fn()} />
        <VendorChecklist vendors={plan.vendors} currency={plan.currency} onUpdateStatus={vi.fn()} onAddVendor={vi.fn()} onDeleteVendor={vi.fn()} />
      </>
    );

    [...container.querySelectorAll('button')]
      .filter((button) => button.textContent?.includes('Add Custom Task') || button.textContent?.includes('Add Vendor'))
      .forEach(click);

    const labels = [...container.querySelectorAll('label')];
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((label) => label.control !== null)).toBe(true);

    const ids = [...container.querySelectorAll<HTMLElement>('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelectorAll('[aria-label="Search vendors"]')).toHaveLength(2);
    expect([...container.querySelectorAll('button[aria-pressed]')].length).toBeGreaterThan(0);
  });

  it('adds a timeline task through the task form', async () => {
    const onAddTask = vi.fn();
    const plan = getBuiltinTemplate('birthday');
    const container = await render(
      <TimelineView
        tasks={plan.timeline}
        targetDate="2027-06-15"
        onToggleTask={vi.fn()}
        onAddTask={onAddTask}
      />
    );

    click([...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Add Custom Task'))!);
    setInputValue(container.querySelector('input[type="text"]')!, 'Confirm accessibility setup');
    await submit(container.querySelector('form')!);

    expect(onAddTask).toHaveBeenCalledWith('Confirm accessibility setup', 14, 'Custom Milestone', false);
  });

  it('toggles a unique task ID through the direct timeline editor', async () => {
    const plan = getBuiltinTemplate('birthday');
    const target = plan.timeline.find((task) => !task.completed)!;
    const originalTimeline = plan.timeline.map((task) => ({ ...task }));
    const committedPlans: CelebrationPlan[] = [];

    function Harness() {
      const [currentPlan, setCurrentPlan] = React.useState(plan);
      const { handleToggleTask } = usePlanEditor(currentPlan, (updatedPlan) => {
        committedPlans.push(updatedPlan);
        setCurrentPlan(updatedPlan);
      });
      return (
        <TimelineView
          tasks={currentPlan.timeline}
          targetDate={currentPlan.targetDate}
          onToggleTask={handleToggleTask}
          onAddTask={vi.fn()}
        />
      );
    }

    const container = await render(<Harness />);
    const targetRow = [...container.querySelectorAll<HTMLElement>('.group.flex.items-center.justify-between')]
      .find((row) => row.textContent?.includes(target.title));
    const targetToggle = targetRow?.querySelector<HTMLButtonElement>(
      '[aria-label="Mark task as complete"]'
    );
    expect(targetToggle).not.toBeNull();
    click(targetToggle!);

    expect(committedPlans).toHaveLength(1);
    expect(committedPlans[0].timeline.find((task) => task.id === target.id)?.completed).toBe(true);
    expect(committedPlans[0].timeline.filter((task) => task.id !== target.id))
      .toEqual(plan.timeline.filter((task) => task.id !== target.id));
    expect(plan.timeline).toEqual(originalTimeline);
  });

  it('rejects direct timeline toggles for duplicate task IDs without changing the plan', async () => {
    const template = getBuiltinTemplate('birthday');
    const plan: CelebrationPlan = {
      ...template,
      timeline: [
        { ...template.timeline[0], id: 'duplicate-task-id', title: 'Book venue', completed: false },
        { ...template.timeline[1], id: 'duplicate-task-id', title: 'Confirm catering', completed: false },
        { ...template.timeline[2], id: 'unrelated-task-id', title: 'Confirm music', completed: false },
      ],
    };
    const originalTimeline = plan.timeline.map((task) => ({ ...task }));
    const committedPlans: CelebrationPlan[] = [];

    function Harness() {
      const [currentPlan, setCurrentPlan] = React.useState(plan);
      const { handleToggleTask } = usePlanEditor(currentPlan, (updatedPlan) => {
        committedPlans.push(updatedPlan);
        setCurrentPlan(updatedPlan);
      });
      return (
        <>
          <button type="button" onClick={() => handleToggleTask('missing-task-id', true)}>
            Toggle missing task
          </button>
          <TimelineView
            tasks={currentPlan.timeline}
            targetDate={currentPlan.targetDate}
            onToggleTask={handleToggleTask}
            onAddTask={vi.fn()}
          />
        </>
      );
    }

    const container = await render(<Harness />);
    click(container.querySelector('button')!);
    expect(committedPlans).toHaveLength(0);

    const toggles = [...container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Mark task as complete"]'
    )];
    expect(toggles).toHaveLength(3);

    click(toggles[0]);

    expect(committedPlans).toHaveLength(0);
    expect(plan.timeline).toEqual(originalTimeline);
    expect([...container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Mark task as complete"]'
    )]).toHaveLength(3);
    expect([...container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Mark task as incomplete"]'
    )]).toHaveLength(0);
    expect(container.querySelector('[role="alert"]')?.textContent)
      .toContain('ID is duplicated or no longer exists');
  });

  it('allows the 500th task and explains why a 501st task is rejected', async () => {
    const template = getBuiltinTemplate('birthday');
    const plan: CelebrationPlan = {
      ...template,
      timeline: Array.from({ length: MAX_TIMELINE_TASKS - 1 }, (_, index) => ({
        ...template.timeline[0],
        id: `limit-task-${index}`,
      })),
    };
    const committedPlans: CelebrationPlan[] = [];

    function Harness() {
      const [currentPlan, setCurrentPlan] = React.useState(plan);
      const updatePlan = (updatedPlan: CelebrationPlan) => {
        committedPlans.push(updatedPlan);
        setCurrentPlan(updatedPlan);
      };
      const { handleAddTask, handleToggleTask } = usePlanEditor(currentPlan, updatePlan);
      return (
        <>
          <output>{currentPlan.timeline.length}</output>
          <TimelineView
            tasks={currentPlan.timeline}
            targetDate={currentPlan.targetDate}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
          />
        </>
      );
    }

    const container = await render(<Harness />);
    const openForm = () => click([...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Add Custom Task'))!);

    openForm();
    setInputValue(container.querySelector('input[type="text"]')!, 'The 500th task');
    await submit(container.querySelector('form')!);

    expect(container.querySelector('output')?.textContent).toBe(String(MAX_TIMELINE_TASKS));
    expect(committedPlans).toHaveLength(1);
    expect(committedPlans[0].timeline[0].title).toBe('The 500th task');

    openForm();
    setInputValue(container.querySelector('input[type="text"]')!, 'The 501st task');
    await submit(container.querySelector('form')!);

    expect(container.querySelector('output')?.textContent).toBe(String(MAX_TIMELINE_TASKS));
    expect(committedPlans).toHaveLength(1);
    expect(container.querySelector('[role="alert"]')?.textContent)
      .toContain('up to 500 tasks');
    expect(container.querySelector('[role="alert"]')?.textContent)
      .toContain('Remove a task before adding another');
  });

  it('updates vendor status and adds a vendor from the checklist controls', async () => {
    const plan = getBuiltinTemplate('birthday');
    const vendor = plan.vendors[0];
    const onUpdateStatus = vi.fn();
    const onAddVendor = vi.fn();
    const container = await render(
      <VendorChecklist
        vendors={[vendor]}
        currency={plan.currency}
        onUpdateStatus={onUpdateStatus}
        onAddVendor={onAddVendor}
        onDeleteVendor={vi.fn()}
      />
    );

    const bookedButton = [...container.querySelectorAll('button')]
      .filter((button) => button.textContent?.includes('Booked'))
      .at(-1);
    click(bookedButton!);
    expect(onUpdateStatus).toHaveBeenCalledWith(vendor.id, 'Booked');

    click([...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Add Vendor'))!);
    const vendorName = container.querySelector<HTMLInputElement>('input[placeholder^="e.g. Royal Rajputana"]')!;
    const category = container.querySelector<HTMLInputElement>('input[placeholder^="e.g. Floral"]')!;
    setInputValue(vendorName, 'Bluebird Photography');
    setInputValue(category, 'Photography');
    await submit(container.querySelector('form')!);

    expect(onAddVendor).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Bluebird Photography',
      category: 'Photography',
    }));
  });

  it('offers event-specific ideas and clearly disables the action when that pool is exhausted', async () => {
    const plan = getBuiltinTemplate('birthday', { city: 'Pune', guests: 70 });
    const onAddIdeas = vi.fn();
    const container = await render(<IdeasView ideas={[]} plan={plan} onAddIdeas={onAddIdeas} />);

    expect(container.textContent).toContain('No ideas are available yet');
    vi.useFakeTimers();
    click([...container.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('More Ideas'))!);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(onAddIdeas).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ title: 'A Birthday Story Wall for Pune' }),
    ]));

    const exhaustedIdeas = [
      { id: 'existing-1', title: 'A Birthday Story Wall for Pune', tag: 'Memory Keeper', description: 'Existing idea' },
      { id: 'existing-2', title: 'Choose-Your-Own Birthday Toast', tag: 'Crowd Energy', description: 'Existing idea' },
      { id: 'existing-3', title: 'Birthday Guest Comfort Corner', tag: 'Guest Comfort', description: 'Existing idea' },
    ];
    const exhaustedContainer = await render(
      <IdeasView ideas={exhaustedIdeas} plan={plan} onAddIdeas={onAddIdeas} />
    );
    expect([...exhaustedContainer.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('More Ideas'))?.hasAttribute('disabled')).toBe(true);
    expect(exhaustedContainer.textContent).toContain('No additional event-specific ideas are available');
  });
});

describe('offline chat and clipboard behavior', () => {
  it('applies a supported chat operation when the chat API is unavailable', async () => {
    const plan: CelebrationPlan = getBuiltinTemplate('birthday', {
      eventName: 'Original Celebration',
      date: '2027-06-15',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API unavailable')));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onPlanUpdated = vi.fn((
      _updatedPlan: CelebrationPlan,
      _diffs: DiffDetail[],
      _aiExplanation: string
    ) => undefined);
    const container = await render(
      <PlanChatModal
        isOpen
        onClose={vi.fn()}
        plan={plan}
        onPlanUpdated={onPlanUpdated}
        canUndo={false}
        onUndo={vi.fn()}
      />
    );

    const input = container.querySelector<HTMLInputElement>('input[type="text"]')!;
    setInputValue(input, 'Rename event to Offline Updated Celebration');
    click(container.querySelector('button[aria-label="Send instruction"]')!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onPlanUpdated).toHaveBeenCalledTimes(1);
    const updatedPlan = onPlanUpdated.mock.calls[0][0];
    expect(updatedPlan.eventName).toBe('Offline Updated Celebration');
    expect(plan.eventName).toBe('Original Celebration');
    expect(container.textContent).toContain('Local mode:');
  });

  it('commits task replacement operations returned by the chat API', async () => {
    const plan = getBuiltinTemplate('birthday', { date: '2027-06-15' });
    const removedTask = plan.timeline[0];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'Replaced the task.',
        operations: [
          { type: 'removeTask', taskId: removedTask.id },
          {
            type: 'addTask',
            task: { title: 'Confirm accessibility setup', daysBeforeEvent: 7 },
          },
        ],
      }),
    }));
    const onPlanUpdated = vi.fn<(updatedPlan: CelebrationPlan, diffs: DiffDetail[], aiExplanation: string) => void>();
    const container = await render(
      <PlanChatModal
        isOpen
        onClose={vi.fn()}
        plan={plan}
        onPlanUpdated={onPlanUpdated}
        canUndo={false}
        onUndo={vi.fn()}
      />
    );

    setInputValue(container.querySelector<HTMLInputElement>('[aria-label="Plan instruction"]')!, 'Replace a timeline task');
    click(container.querySelector('button[aria-label="Send instruction"]')!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onPlanUpdated).toHaveBeenCalledTimes(1);
    const [updatedPlan, diffs] = onPlanUpdated.mock.calls[0];
    expect(updatedPlan.timeline).toHaveLength(plan.timeline.length);
    expect(updatedPlan.timeline.some((task) => task.id === removedTask.id)).toBe(false);
    expect(updatedPlan.timeline.some((task) => task.title === 'Confirm accessibility setup')).toBe(true);
    expect(diffs).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'New Task Added', after: 'Confirm accessibility setup' }),
      expect.objectContaining({ field: 'Task Removed', before: removedTask.title }),
    ]));
    expect(container.textContent).toContain('Replaced the task.');
  });

  it('uses the local fallback for a successful chat response with no operations', async () => {
    const plan = getBuiltinTemplate('birthday', { eventName: 'Original Celebration' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'No structured change.', operations: [] }),
    }));
    const onPlanUpdated = vi.fn<(updatedPlan: CelebrationPlan, diffs: DiffDetail[], aiExplanation: string) => void>();
    const container = await render(
      <PlanChatModal
        isOpen
        onClose={vi.fn()}
        plan={plan}
        onPlanUpdated={onPlanUpdated}
        canUndo={false}
        onUndo={vi.fn()}
      />
    );

    setInputValue(
      container.querySelector<HTMLInputElement>('[aria-label="Plan instruction"]')!,
      'Rename event to Locally Updated Celebration'
    );
    click(container.querySelector('button[aria-label="Send instruction"]')!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onPlanUpdated).toHaveBeenCalledTimes(1);
    expect(onPlanUpdated.mock.calls[0][0].eventName).toBe('Locally Updated Celebration');
    expect(onPlanUpdated.mock.calls[0][2]).toBe('Renamed the event to "Locally Updated Celebration".');
    expect(plan.eventName).toBe('Original Celebration');
    expect(onPlanUpdated.mock.calls[0][0].timeline).toEqual(plan.timeline);
    expect(container.textContent).toContain('Renamed the event to "Locally Updated Celebration".');
    expect(container.textContent).not.toContain('Local mode:');
    const assistantMessages = [...container.querySelectorAll('.whitespace-pre-line')]
      .filter((message) => message.textContent?.includes('Renamed the event to "Locally Updated Celebration".'));
    expect(assistantMessages).toHaveLength(1);
    expect(container.textContent.match(/AI PLANNER/g)).toHaveLength(2);
    expect(container.textContent).not.toContain('Analyzing constraints and executing plan operations');
    expect(container.querySelector<HTMLInputElement>('[aria-label="Plan instruction"]')?.disabled).toBe(false);
    expect(container.querySelector('[aria-live="polite"]')?.textContent)
      .toBe('Plan updated: 1 changes applied. Renamed the event to "Locally Updated Celebration".');
  });

  it('commits and undoes edits through the real App undo history, retaining its 16-entry limit', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(() => null),
      get length() { return 0; },
    });
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn() })));
    const container = await render(<App />);
    const dashboard = container.querySelector<HTMLElement>('#dashboard')!;
    const timelineTab = [...dashboard.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Temporal Timeline'))!;
    click(timelineTab);

    const firstTask = dashboard.querySelector<HTMLElement>('[aria-label="Mark task as incomplete"]')!;
    click(firstTask);
    expect(dashboard.querySelector('[aria-label="Mark task as complete"]')).not.toBeNull();
    expect(dashboard.querySelector('button[title="Undo last modification"]')).not.toBeNull();

    click(dashboard.querySelector('button[title="Undo last modification"]')!);
    expect(dashboard.querySelector('[aria-label="Mark task as incomplete"]')).not.toBeNull();
    expect(dashboard.querySelector('button[title="Undo last modification"]')).toBeNull();

    for (let index = 0; index < 17; index += 1) {
      const taskToggle = dashboard.querySelector<HTMLElement>(
        index % 2 === 0
          ? '[aria-label="Mark task as incomplete"]'
          : '[aria-label="Mark task as complete"]'
      );
      if (!taskToggle) throw new Error('Expected the task toggle to remain available');
      click(taskToggle);
    }

    for (let index = 0; index < 16; index += 1) {
      const undoButton = dashboard.querySelector<HTMLButtonElement>('button[title="Undo last modification"]');
      if (!undoButton) throw new Error(`Undo history ended after ${index} entries`);
      click(undoButton);
    }

    expect(dashboard.querySelector('[aria-label="Mark task as complete"]')).not.toBeNull();
    expect(dashboard.querySelector('button[title="Undo last modification"]')).toBeNull();
  });

  it('explains when a chat task addition is rejected at the task limit', async () => {
    const template = getBuiltinTemplate('birthday');
    const plan: CelebrationPlan = {
      ...template,
      timeline: Array.from({ length: MAX_TIMELINE_TASKS }, (_, index) => ({
        ...template.timeline[0],
        id: `chat-limit-task-${index}`,
      })),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'Added the task.',
        operations: [{ type: 'addTask', task: { title: 'Blocked chat task' } }],
      }),
    }));
    const onPlanUpdated = vi.fn<(updatedPlan: CelebrationPlan, diffs: DiffDetail[], aiExplanation: string) => void>();
    const container = await render(
      <PlanChatModal
        isOpen
        onClose={vi.fn()}
        plan={plan}
        onPlanUpdated={onPlanUpdated}
        canUndo={false}
        onUndo={vi.fn()}
      />
    );

    setInputValue(container.querySelector<HTMLInputElement>('[aria-label="Plan instruction"]')!, 'Add another task');
    click(container.querySelector('button[aria-label="Send instruction"]')!);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onPlanUpdated).not.toHaveBeenCalled();
    expect(plan.timeline).toHaveLength(MAX_TIMELINE_TASKS);
    expect(container.textContent).toContain('A plan can contain up to 500 tasks');
    expect(container.textContent).toContain('Remove a task before adding another');
  });

  it('returns the updated plan from the shared local operation engine', () => {
    const plan = getBuiltinTemplate('birthday');
    const result = applyOperations(plan, [
      { type: 'setGuests', count: 88 },
      { type: 'setBudgetTotal', amount: 240_000 },
    ]);

    expect(result.updatedPlan).toMatchObject({ guestCount: 88, totalBudget: 240_000 });
    expect(plan).not.toMatchObject({ guestCount: 88, totalBudget: 240_000 });
  });

  it('reports clipboard write success and failure without throwing', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    await expect(copyTextToClipboard('share-url')).resolves.toBe(true);

    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('permission denied')) } });
    await expect(copyTextToClipboard('share-url')).resolves.toBe(false);
  });
});

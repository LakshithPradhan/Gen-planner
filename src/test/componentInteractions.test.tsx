// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommandCenterModal } from '../components/CommandCenterModal';
import { IdeasView } from '../components/IdeasView';
import { PlanChatModal } from '../components/PlanChatModal';
import { TimelineView } from '../components/TimelineView';
import { VendorChecklist } from '../components/VendorChecklist';
import { copyTextToClipboard } from '../lib/clipboard';
import { applyOperations, DiffDetail } from '../lib/operations';
import { getBuiltinTemplate } from '../lib/templates';
import { CelebrationPlan } from '../types/plan';
import { DiffModal } from '../components/DiffModal';

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
    expect(document.activeElement).toBe(dialog.querySelector('#command-event-name'));

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
    expect(document.activeElement).toBe(container.querySelector('#chat-instruction'));

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

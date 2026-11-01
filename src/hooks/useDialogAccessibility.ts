import { RefObject, useLayoutEffect, useRef } from 'react';

interface DialogEntry {
  element: HTMLDialogElement;
  getInitialFocus: () => HTMLElement;
  close: () => void;
}

const openDialogs: DialogEntry[] = [];

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(dialog: HTMLDialogElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => {
    const style = window.getComputedStyle(element);
    return !element.hidden &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.tabIndex >= 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      !element.closest('[inert]');
  });
}

export function useDialogAccessibility(
  isOpen: boolean,
  onClose: () => void,
  dialogRef: RefObject<HTMLDialogElement | null>,
  initialFocusSelector?: string
): void {
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const activeDialog = dialog;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const getInitialFocus = (): HTMLElement => {
      const selectedElement = initialFocusSelector
        ? activeDialog.querySelector<HTMLElement>(initialFocusSelector)
        : null;
      if (selectedElement && !selectedElement.hasAttribute('disabled')) return selectedElement;
      return activeDialog.querySelector<HTMLElement>('[autofocus]') ??
        getFocusableElements(activeDialog)[0] ??
        activeDialog;
    };
    const entry: DialogEntry = {
      element: activeDialog,
      getInitialFocus,
      close: () => onCloseRef.current(),
    };
    openDialogs.push(entry);
    getInitialFocus().focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== entry || event.defaultPrevented) return;

      if (event.key === 'Escape' && !event.isComposing) {
        event.preventDefault();
        entry.close();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusableElements = getFocusableElements(activeDialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        activeDialog.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !activeDialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !activeDialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (
        openDialogs[openDialogs.length - 1] === entry &&
        event.target instanceof Node &&
        !activeDialog.contains(event.target)
      ) {
        entry.getInitialFocus().focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      const entryIndex = openDialogs.indexOf(entry);
      if (entryIndex !== -1) openDialogs.splice(entryIndex, 1);
      const canRestorePreviousFocus = previousFocus?.isConnected &&
        previousFocus !== document.body &&
        previousFocus !== document.documentElement &&
        !previousFocus.matches(':disabled') &&
        (previousFocus.matches(focusableSelector) ||
          (previousFocus.hasAttribute('tabindex') && previousFocus.tabIndex === -1));
      if (canRestorePreviousFocus) {
        previousFocus.focus();
      } else {
        openDialogs[openDialogs.length - 1]?.getInitialFocus().focus();
      }
    };
  }, [dialogRef, initialFocusSelector, isOpen]);
}

/**
 * Utilities to improve accessibility in the application
 */

/**
 * Checks if the user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Checks if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detects if the device is touch-enabled
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Announces a message to screen readers
 * @param message Message to announce
 * @param element Element where to announce (defaults to #status-announcer)
 */
export function announceToScreenReader(message: string, element?: HTMLElement): void {
  const announcer = element || document.getElementById('status-announcer');
  if (announcer) {
    announcer.textContent = message;
  }
}

/**
 * Adds ARIA attributes to make an element focusable and navigable
 */
export function makeElementFocusable(element: HTMLElement, label: string): void {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  element.setAttribute('aria-label', label);
}

/**
 * Sets the loading state for a button or control
 */
export function setLoadingState(
  element: HTMLElement,
  isLoading: boolean,
  loadingText = 'Loading...'
): void {
  if (isLoading) {
    element.setAttribute('aria-busy', 'true');
    if (element instanceof HTMLButtonElement) {
      element.disabled = true;
    }

    // Save original text if not already saved
    if (!element.dataset.originalText) {
      element.dataset.originalText = element.textContent || '';
    }

    // Change text and add loading indicator
    element.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
      </svg>
      ${loadingText}
    `;
  } else {
    element.setAttribute('aria-busy', 'false');
    if (element instanceof HTMLButtonElement) {
      element.disabled = false;
    }

    // Restore original text
    if (element.dataset.originalText) {
      element.textContent = element.dataset.originalText;
      delete element.dataset.originalText;
    }
  }
}

/**
 * Sets up keyboard navigation for elements in a list
 */
export function setupKeyboardNavigation(
  container: HTMLElement,
  selector: string,
  onAction: (element: HTMLElement) => void
): void {
  container.addEventListener('keydown', (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.matches(selector) && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onAction(target);
    }
  });
}

/**
 * Creates an alert element that announces to screen readers
 */
export function createAlert(
  message: string,
  type: 'success' | 'error' | 'info',
  duration = 5000
): HTMLElement {
  const alert = document.createElement('div');
  alert.className = `message message-${type}`;
  alert.setAttribute('role', 'alert');
  alert.setAttribute('aria-live', 'assertive');
  alert.textContent = message;

  // Auto-remove after specified time
  if (duration > 0) {
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, duration);
  }

  return alert;
}

/**
 * Applies appropriate labels to a tree data structure
 */
export function labelTreeStructure(
  container: HTMLElement,
  listSelector: string,
  itemSelector: string,
  headingId: string
): void {
  const list = container.querySelector(listSelector);
  if (!list) return;

  // Add ARIA attributes to the list
  list.setAttribute('role', 'tree');
  list.setAttribute('aria-labelledby', headingId);

  // Add ARIA attributes to each item
  const items = list.querySelectorAll(itemSelector);
  items.forEach((item, index) => {
    item.setAttribute('role', 'treeitem');
    item.setAttribute('tabindex', index === 0 ? '0' : '-1');
  });
}

/**
 * Improves modal/dialog accessibility
 */
export function setupAccessibleDialog(
  dialogElement: HTMLElement,
  openButtonSelector: string,
  closeButtonSelector: string
): {
  open: () => void;
  close: () => void;
} {
  const openButton = document.querySelector(openButtonSelector) as HTMLElement;
  const closeButton = document.querySelector(closeButtonSelector) as HTMLElement;
  let previousFocus: HTMLElement | null = null;

  // Function to open the dialog
  const open = () => {
    if (!dialogElement) return;

    // Save the element that had focus
    previousFocus = document.activeElement as HTMLElement;

    // Show the dialog
    dialogElement.removeAttribute('hidden');
    dialogElement.setAttribute('aria-hidden', 'false');

    // Focus the first interactive element
    const firstFocusable = dialogElement.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Announce to screen readers
    announceToScreenReader('Dialog opened');
  };

  // Function to close the dialog
  const close = () => {
    if (!dialogElement) return;

    // Hide the dialog
    dialogElement.setAttribute('hidden', 'true');
    dialogElement.setAttribute('aria-hidden', 'true');

    // Return focus to the previous element
    if (previousFocus) {
      previousFocus.focus();
    }

    // Announce to screen readers
    announceToScreenReader('Dialog closed');
  };

  // Set up event listeners
  if (openButton) {
    openButton.addEventListener('click', open);
  }

  if (closeButton) {
    closeButton.addEventListener('click', close);
  }

  // Set up ESC key to close
  dialogElement.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      close();
    }
  });

  // Trap focus within the dialog
  dialogElement.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const focusables = dialogElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusables[0] as HTMLElement;
      const lastFocusable = focusables[focusables.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });

  return { open, close };
}

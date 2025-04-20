/**
 * Utilidades para mejorar la accesibilidad en la aplicación
 */

/**
 * Verifica si el usuario prefiere el modo oscuro
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Verifica si el usuario prefiere reducir el movimiento
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detecta si el dispositivo es táctil
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Anuncia un mensaje para lectores de pantalla
 * @param message Mensaje a anunciar
 * @param element Elemento donde anunciar (por defecto busca #status-announcer)
 */
export function announceToScreenReader(message: string, element?: HTMLElement): void {
  const announcer = element || document.getElementById('status-announcer');
  if (announcer) {
    announcer.textContent = message;
  }
}

/**
 * Añade atributos ARIA para hacer un elemento focusable y navegable
 */
export function makeElementFocusable(element: HTMLElement, label: string): void {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  element.setAttribute('aria-label', label);
}

/**
 * Establece el estado de carga para un botón o control
 */
export function setLoadingState(
  element: HTMLElement,
  isLoading: boolean,
  loadingText = 'Cargando...',
): void {
  if (isLoading) {
    element.setAttribute('aria-busy', 'true');
    if (element instanceof HTMLButtonElement) {
      element.disabled = true;
    }

    // Guardar el texto original si no se ha guardado ya
    if (!element.dataset.originalText) {
      element.dataset.originalText = element.textContent || '';
    }

    // Cambiar el texto y añadir un indicador de carga
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

    // Restaurar el texto original
    if (element.dataset.originalText) {
      element.textContent = element.dataset.originalText;
      delete element.dataset.originalText;
    }
  }
}

/**
 * Configura una navegación con teclado para elementos en una lista
 */
export function setupKeyboardNavigation(
  container: HTMLElement,
  selector: string,
  onAction: (element: HTMLElement) => void,
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
 * Crea un elemento de alerta que se anuncia a lectores de pantalla
 */
export function createAlert(
  message: string,
  type: 'success' | 'error' | 'info',
  duration = 5000,
): HTMLElement {
  const alert = document.createElement('div');
  alert.className = `message message-${type}`;
  alert.setAttribute('role', 'alert');
  alert.setAttribute('aria-live', 'assertive');
  alert.textContent = message;

  // Auto-eliminar después del tiempo especificado
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
 * Aplica etiquetas adecuadas a una estructura de datos en árbol
 */
export function labelTreeStructure(
  container: HTMLElement,
  listSelector: string,
  itemSelector: string,
  headingId: string,
): void {
  const list = container.querySelector(listSelector);
  if (!list) return;

  // Añadir atributos ARIA a la lista
  list.setAttribute('role', 'tree');
  list.setAttribute('aria-labelledby', headingId);

  // Añadir atributos ARIA a cada elemento
  const items = list.querySelectorAll(itemSelector);
  items.forEach((item, index) => {
    item.setAttribute('role', 'treeitem');
    item.setAttribute('tabindex', index === 0 ? '0' : '-1');
  });
}

/**
 * Mejora la accesibilidad del modal/diálogo
 */
export function setupAccessibleDialog(
  dialogElement: HTMLElement,
  openButtonSelector: string,
  closeButtonSelector: string,
): {
  open: () => void;
  close: () => void;
} {
  const openButton = document.querySelector(openButtonSelector) as HTMLElement;
  const closeButton = document.querySelector(closeButtonSelector) as HTMLElement;
  let previousFocus: HTMLElement | null = null;

  // Función para abrir el diálogo
  const open = () => {
    if (!dialogElement) return;

    // Guardar el elemento que tenía el foco
    previousFocus = document.activeElement as HTMLElement;

    // Mostrar el diálogo
    dialogElement.removeAttribute('hidden');
    dialogElement.setAttribute('aria-hidden', 'false');

    // Enfocar el primer elemento interactivo
    const firstFocusable = dialogElement.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Anunciar a lectores de pantalla
    announceToScreenReader('Diálogo abierto');
  };

  // Función para cerrar el diálogo
  const close = () => {
    if (!dialogElement) return;

    // Ocultar el diálogo
    dialogElement.setAttribute('hidden', 'true');
    dialogElement.setAttribute('aria-hidden', 'true');

    // Devolver el foco al elemento anterior
    if (previousFocus) {
      previousFocus.focus();
    }

    // Anunciar a lectores de pantalla
    announceToScreenReader('Diálogo cerrado');
  };

  // Configurar event listeners
  if (openButton) {
    openButton.addEventListener('click', open);
  }

  if (closeButton) {
    closeButton.addEventListener('click', close);
  }

  // Configurar cierre con ESC
  dialogElement.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      close();
    }
  });

  // Atrapar el foco dentro del diálogo
  dialogElement.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const focusables = dialogElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

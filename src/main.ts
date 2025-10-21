import './style.css';
import './components/DropZone';
import './components/ImagePreview';
import './components/ConversionOptions';
import './components/ImageConverter';
import './utils/api';
import { setupOfflineDetection } from './utils/serviceWorkerRegistration';
import {
  prefersDarkMode,
  prefersReducedMotion,
  isTouchDevice,
  announceToScreenReader,
} from './utils/a11y';
import { logApiError } from './utils/logger';

/**
 * Detects accessibility preferences and loads corresponding options
 */
function setupAccessibilityFeatures() {
  // Detect dark mode
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Detect reduced motion preference
  const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Add classes to body according to user preferences
  function updateBodyClasses() {
    if (prefersDarkMode()) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    if (prefersReducedMotion()) {
      document.body.classList.add('reduced-motion');

      // Update the reduce motion checkbox if it exists
      const reduceMotionCheckbox = document.getElementById('reduce-motion') as HTMLInputElement;
      if (reduceMotionCheckbox) {
        reduceMotionCheckbox.checked = true;
      }
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  // Update on load
  updateBodyClasses();

  // Listen for preference changes
  darkModeMediaQuery.addEventListener('change', updateBodyClasses);
  reducedMotionMediaQuery.addEventListener('change', updateBodyClasses);
}

/**
 * Sets up touch event detection to improve UX
 */
function setupTouchDetection() {
  // Detect if device is touch-enabled
  function updateTouchClass() {
    if (isTouchDevice()) {
      document.body.classList.add('touch-device');
    } else {
      document.body.classList.remove('touch-device');
    }
  }

  // Update on load
  updateTouchClass();

  // Listen for changes (e.g., when connecting/disconnecting devices)
  window.addEventListener('resize', updateTouchClass);
}

/**
 * Sets up status announcements for screen readers
 */
function setupScreenReaderAnnouncer() {
  const statusAnnouncer = document.getElementById('status-announcer');

  if (statusAnnouncer) {
    // Check for errors during initial load
    window.addEventListener('error', e => {
      announceToScreenReader(`Application error: ${e.message}`);
    });

    // Announce when application is fully loaded
    window.addEventListener('load', () => {
      announceToScreenReader(
        'Image conversion application loaded successfully. You can start using the converter.'
      );
    });
  }
}

/**
 * Initializes the accessibility dialog
 */
function setupAccessibilityDialog() {
  const dialog = document.getElementById('a11y-dialog') as HTMLDialogElement;
  const a11yButton = document.getElementById('open-a11y-dialog') as HTMLButtonElement;
  const closeButton = document.getElementById('close-a11y-dialog') as HTMLButtonElement;

  // If elements are not found, exit
  if (!dialog || !a11yButton || !closeButton) {
    logApiError('accessibilityElements', new Error('Accessibility elements not found'));
    return;
  }

  // Configure accessibility button in header
  if (a11yButton) {
    a11yButton.addEventListener('click', e => {
      e.preventDefault();
      openAccessibilityDialog();
    });

    // Add accessible content to button
    a11yButton.innerHTML = `
      <svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v4"></path>
        <path d="M12 16h.01"></path>
        <path d="M4.93 7.5a8 8 0 0 1 14.14 0"></path>
        <path d="M4.93 16.5a8 8 0 0 0 14.14 0"></path>
      </svg>
      <span class="sr-only">Accessibility options</span>
    `;
  }

  // Configure dialog close
  if (closeButton) {
    closeButton.addEventListener('click', closeAccessibilityDialog);
  }

  // Load user preferences
  loadUserPreferences();

  // Handle high contrast option changes
  const highContrastToggle = dialog.querySelector('#high-contrast') as HTMLInputElement;
  if (highContrastToggle) {
    highContrastToggle.addEventListener('change', () => {
      const isHighContrast = highContrastToggle.checked;
      savePreference('highContrast', isHighContrast ? 'true' : 'false', highContrastToggle);
      document.body.classList.toggle('high-contrast', isHighContrast);
      announcePreferenceChange('High contrast', isHighContrast ? 'enabled' : 'disabled');
    });
  }

  // Handle dyslexic font option changes
  const dyslexicFontToggle = dialog.querySelector('#dyslexic-font') as HTMLInputElement;
  if (dyslexicFontToggle) {
    dyslexicFontToggle.addEventListener('change', () => {
      const isDyslexicFont = dyslexicFontToggle.checked;
      savePreference('dyslexicFont', isDyslexicFont ? 'true' : 'false', dyslexicFontToggle);
      document.body.classList.toggle('dyslexic-font', isDyslexicFont);
      announcePreferenceChange('Dyslexic font', isDyslexicFont ? 'enabled' : 'disabled');
    });
  }

  // Handle font size option changes
  const fontSizeOptions = dialog.querySelectorAll('input[name="font-size"]');
  fontSizeOptions.forEach(option => {
    const radio = option as HTMLInputElement;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        // Remove previous font size classes
        document.body.classList.remove('font-size-large', 'font-size-larger', 'font-size-largest');

        if (radio.value !== 'normal') {
          document.body.classList.add(`font-size-${radio.value}`);
        }

        savePreference('fontSize', radio.value, radio);
        announcePreferenceChange('Font size', getFontSizeName(radio.value));
      }
    });
  });

  // Handle reduced motion option changes
  const reducedMotionToggle = dialog.querySelector('#reduced-motion') as HTMLInputElement;
  if (reducedMotionToggle) {
    reducedMotionToggle.addEventListener('change', () => {
      const isReducedMotion = reducedMotionToggle.checked;
      savePreference('reducedMotion', isReducedMotion ? 'true' : 'false', reducedMotionToggle);
      document.body.classList.toggle('reduced-motion', isReducedMotion);
      announcePreferenceChange('Reduced motion', isReducedMotion ? 'enabled' : 'disabled');
    });
  }

  // Handle text spacing option changes
  const textSpacingOptions = dialog.querySelectorAll('input[name="text-spacing"]');
  textSpacingOptions.forEach(option => {
    const radio = option as HTMLInputElement;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        // Remove previous text spacing classes
        document.body.classList.remove('text-spacing-wider', 'text-spacing-widest');

        if (radio.value !== 'normal') {
          document.body.classList.add(`text-spacing-${radio.value}`);
        }

        savePreference('textSpacing', radio.value, radio);
        announcePreferenceChange('Text spacing', getTextSpacingName(radio.value));
      }
    });
  });
}

/**
 * Gets the readable name for font size
 */
function getFontSizeName(value: string): string {
  switch (value) {
    case 'large':
      return 'large';
    case 'larger':
      return 'extra large';
    default:
      return 'default';
  }
}

/**
 * Gets the readable name for text spacing
 */
function getTextSpacingName(value: string): string {
  switch (value) {
    case 'medium':
      return 'medium';
    case 'large':
      return 'wide';
    default:
      return 'default';
  }
}

/**
 * Sets up keyboard shortcuts for accessibility functions
 */
function setupKeyboardShortcuts() {
  let a11yDialog;
  let highContrastCheckbox;
  let dropZone;
  let convertButton;

  document.addEventListener('keydown', event => {
    // Only process if Ctrl+Alt is pressed (or Cmd+Alt on Mac)
    if ((event.ctrlKey || event.metaKey) && event.altKey) {
      switch (event.key.toLowerCase()) {
        case 'a':
          // Open/close accessibility dialog
          event.preventDefault();
          a11yDialog = document.getElementById('a11y-dialog');
          if (a11yDialog) {
            if (a11yDialog.hasAttribute('hidden')) {
              openAccessibilityDialog();
            } else {
              closeAccessibilityDialog();
            }
          }
          break;

        case 'c':
          // Toggle high contrast
          event.preventDefault();
          highContrastCheckbox = document.getElementById('high-contrast') as HTMLInputElement;
          if (highContrastCheckbox) {
            highContrastCheckbox.checked = !highContrastCheckbox.checked;
            highContrastCheckbox.dispatchEvent(new Event('change'));
          }
          break;

        case 'd':
          // Activate image upload area
          event.preventDefault();
          dropZone = document.querySelector('drop-zone') as HTMLElement;
          if (dropZone) {
            dropZone.click();
            announceToScreenReader('File selection activated to upload an image');
          }
          break;

        case 's':
          // Start conversion
          event.preventDefault();
          convertButton = document.querySelector(
            'button[data-action="convert"]'
          ) as HTMLButtonElement;
          if (convertButton) {
            convertButton.click();
            announceToScreenReader('Starting image conversion process');
          }
          break;
      }
    }
  });
}

/**
 * Opens the accessibility dialog
 */
function openAccessibilityDialog() {
  const a11yDialog = document.getElementById('a11y-dialog');
  if (a11yDialog) {
    a11yDialog.removeAttribute('hidden');
    a11yDialog.setAttribute('aria-hidden', 'false');

    // Focus the first interactive element
    const firstFocusable = a11yDialog.querySelector(
      'button, [href], input, select, textarea'
    ) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Announce opening
    announceToScreenReader('Accessibility options dialog opened');
  }
}

/**
 * Closes the accessibility dialog
 */
function closeAccessibilityDialog() {
  const a11yDialog = document.getElementById('a11y-dialog');
  const openBtn = document.getElementById('open-a11y-dialog');

  if (a11yDialog) {
    a11yDialog.setAttribute('hidden', 'true');
    a11yDialog.setAttribute('aria-hidden', 'true');

    // Return focus to the open button
    if (openBtn) {
      openBtn.focus();
    }

    // Announce closing
    announceToScreenReader('Accessibility options dialog closed');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  if (app) {
    app.innerHTML = `
      <image-converter></image-converter>
    `;

    // Set up accessibility features
    setupAccessibilityFeatures();
    setupTouchDetection();
    setupScreenReaderAnnouncer();
    setupAccessibilityDialog();
    setupKeyboardShortcuts();

    // Set up connection status detection
    setupOfflineDetection();
  }
});

/**
 * Saves an accessibility preference to localStorage
 */
function savePreference(key: string, value: string, targetElement?: HTMLElement) {
  try {
    localStorage.setItem(`a11y-${key}`, value);

    // Show visual feedback near the element that changed
    const confirmIcon = document.createElement('div');
    confirmIcon.className = 'save-confirm';
    confirmIcon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    // If we have a target element, position the check next to it
    if (targetElement) {
      // Get the parent container to position relatively
      const optionContainer = targetElement.closest('.a11y-option');
      if (optionContainer) {
        optionContainer.appendChild(confirmIcon);
      } else {
        // Fallback to dialog
        document.getElementById('a11y-dialog')?.appendChild(confirmIcon);
      }
    } else {
      // Fallback to dialog
      document.getElementById('a11y-dialog')?.appendChild(confirmIcon);
    }

    // Remove the icon after animation
    setTimeout(() => {
      confirmIcon.classList.add('fade-out');
      setTimeout(() => confirmIcon.remove(), 300);
    }, 1500);
  } catch (error) {
    logApiError(`savePreference_${key}`, error);
  }
}

/**
 * Announces preference changes to screen reader
 */
function announcePreferenceChange(option: string, value: string) {
  announceToScreenReader(`${option}: ${value}`);
}

/**
 * Loads saved user accessibility preferences
 */
function loadUserPreferences() {
  try {
    // High contrast
    const highContrast = localStorage.getItem('a11y-highContrast');
    if (highContrast === 'true') {
      document.body.classList.add('high-contrast');
      const highContrastToggle = document.querySelector('#high-contrast') as HTMLInputElement;
      if (highContrastToggle) highContrastToggle.checked = true;
    }

    // Dyslexic font
    const dyslexicFont = localStorage.getItem('a11y-dyslexicFont');
    if (dyslexicFont === 'true') {
      document.body.classList.add('dyslexic-font');
      const dyslexicFontToggle = document.querySelector('#dyslexic-font') as HTMLInputElement;
      if (dyslexicFontToggle) dyslexicFontToggle.checked = true;
    }

    // Font size
    const fontSize = localStorage.getItem('a11y-fontSize');
    if (fontSize && fontSize !== 'normal') {
      document.body.classList.add(`font-size-${fontSize}`);
      const fontSizeRadio = document.querySelector(
        `input[name="font-size"][value="${fontSize}"]`
      ) as HTMLInputElement;
      if (fontSizeRadio) fontSizeRadio.checked = true;
    }

    // Reduced motion
    const reducedMotion = localStorage.getItem('a11y-reducedMotion');
    if (reducedMotion === 'true') {
      document.body.classList.add('reduced-motion');
      const reducedMotionToggle = document.querySelector('#reduced-motion') as HTMLInputElement;
      if (reducedMotionToggle) reducedMotionToggle.checked = true;
    }

    // Text spacing
    const textSpacing = localStorage.getItem('a11y-textSpacing');
    if (textSpacing && textSpacing !== 'normal') {
      document.body.classList.add(`text-spacing-${textSpacing}`);
      const textSpacingRadio = document.querySelector(
        `input[name="text-spacing"][value="${textSpacing}"]`
      ) as HTMLInputElement;
      if (textSpacingRadio) textSpacingRadio.checked = true;
    }
  } catch (error) {
    logApiError('loadUserPreferences', error);
  }
}

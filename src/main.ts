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

/**
 * Detecta preferencias de accesibilidad y carga opciones correspondientes
 */
function setupAccessibilityFeatures() {
  // Detectar modo oscuro
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Detectar preferencia de reducción de movimiento
  const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Añadir clases al body según preferencias del usuario
  function updateBodyClasses() {
    if (prefersDarkMode()) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    if (prefersReducedMotion()) {
      document.body.classList.add('reduced-motion');

      // Actualizar el checkbox de reducir movimiento si existe
      const reduceMotionCheckbox = document.getElementById('reduce-motion') as HTMLInputElement;
      if (reduceMotionCheckbox) {
        reduceMotionCheckbox.checked = true;
      }
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }

  // Actualizar al cargar
  updateBodyClasses();

  // Escuchar cambios en las preferencias
  darkModeMediaQuery.addEventListener('change', updateBodyClasses);
  reducedMotionMediaQuery.addEventListener('change', updateBodyClasses);
}

/**
 * Configura la detección de eventos táctiles para mejorar UX
 */
function setupTouchDetection() {
  // Detectar si el dispositivo es táctil
  function updateTouchClass() {
    if (isTouchDevice()) {
      document.body.classList.add('touch-device');
    } else {
      document.body.classList.remove('touch-device');
    }
  }

  // Actualizar al cargar
  updateTouchClass();

  // Escuchar cambios (por ejemplo, al conectar/desconectar dispositivos)
  window.addEventListener('resize', updateTouchClass);
}

/**
 * Configura el anuncio de estado para lectores de pantalla
 */
function setupScreenReaderAnnouncer() {
  const statusAnnouncer = document.getElementById('status-announcer');

  if (statusAnnouncer) {
    // Verificar si hay errores en la carga inicial
    window.addEventListener('error', e => {
      announceToScreenReader(`Error en la aplicación: ${e.message}`);
    });

    // Anunciar cuando la aplicación esté completamente cargada
    window.addEventListener('load', () => {
      announceToScreenReader(
        'Aplicación de conversión de imágenes cargada correctamente. Puede empezar a usar el conversor.'
      );
    });
  }
}

/**
 * Inicializa el diálogo de accesibilidad
 */
function setupAccessibilityDialog() {
  const dialog = document.getElementById('a11y-dialog') as HTMLDialogElement;
  const a11yButton = document.getElementById('open-a11y-dialog') as HTMLButtonElement;
  const closeButton = document.getElementById('close-a11y-dialog') as HTMLButtonElement;

  // Si no se encuentran los elementos, salir
  if (!dialog || !a11yButton || !closeButton) {
    console.error('Elementos de accesibilidad no encontrados:', {
      dialog,
      a11yButton,
      closeButton,
    });
    return;
  }

  // Configurar botón de accesibilidad en el encabezado
  if (a11yButton) {
    a11yButton.addEventListener('click', e => {
      e.preventDefault();
      openAccessibilityDialog();
    });

    // Añadir contenido accesible al botón
    a11yButton.innerHTML = `
      <svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v4"></path>
        <path d="M12 16h.01"></path>
        <path d="M4.93 7.5a8 8 0 0 1 14.14 0"></path>
        <path d="M4.93 16.5a8 8 0 0 0 14.14 0"></path>
      </svg>
      <span class="sr-only">Opciones de accesibilidad</span>
    `;
  }

  // Configurar cierre del diálogo
  if (closeButton) {
    closeButton.addEventListener('click', closeAccessibilityDialog);
  }

  // Cargar preferencias del usuario
  loadUserPreferences();

  // Manejar cambios en opciones de alto contraste
  const highContrastToggle = dialog.querySelector('#high-contrast') as HTMLInputElement;
  if (highContrastToggle) {
    highContrastToggle.addEventListener('change', () => {
      const isHighContrast = highContrastToggle.checked;
      savePreference('highContrast', isHighContrast ? 'true' : 'false', highContrastToggle);
      document.body.classList.toggle('high-contrast', isHighContrast);
      announcePreferenceChange('Alto contraste', isHighContrast ? 'activado' : 'desactivado');
    });
  }

  // Manejar cambios en opciones de fuente para dislexia
  const dyslexicFontToggle = dialog.querySelector('#dyslexic-font') as HTMLInputElement;
  if (dyslexicFontToggle) {
    dyslexicFontToggle.addEventListener('change', () => {
      const isDyslexicFont = dyslexicFontToggle.checked;
      savePreference('dyslexicFont', isDyslexicFont ? 'true' : 'false', dyslexicFontToggle);
      document.body.classList.toggle('dyslexic-font', isDyslexicFont);
      announcePreferenceChange('Fuente para dislexia', isDyslexicFont ? 'activada' : 'desactivada');
    });
  }

  // Manejar cambios en opciones de tamaño de fuente
  const fontSizeOptions = dialog.querySelectorAll('input[name="font-size"]');
  fontSizeOptions.forEach(option => {
    const radio = option as HTMLInputElement;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        // Eliminar clases previas de tamaño de fuente
        document.body.classList.remove('font-size-large', 'font-size-larger', 'font-size-largest');

        if (radio.value !== 'normal') {
          document.body.classList.add(`font-size-${radio.value}`);
        }

        savePreference('fontSize', radio.value, radio);
        announcePreferenceChange('Tamaño de fuente', getFontSizeName(radio.value));
      }
    });
  });

  // Manejar cambios en opciones de movimiento reducido
  const reducedMotionToggle = dialog.querySelector('#reduced-motion') as HTMLInputElement;
  if (reducedMotionToggle) {
    reducedMotionToggle.addEventListener('change', () => {
      const isReducedMotion = reducedMotionToggle.checked;
      savePreference('reducedMotion', isReducedMotion ? 'true' : 'false', reducedMotionToggle);
      document.body.classList.toggle('reduced-motion', isReducedMotion);
      announcePreferenceChange('Movimiento reducido', isReducedMotion ? 'activado' : 'desactivado');
    });
  }

  // Manejar cambios en opciones de espaciado de texto
  const textSpacingOptions = dialog.querySelectorAll('input[name="text-spacing"]');
  textSpacingOptions.forEach(option => {
    const radio = option as HTMLInputElement;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        // Eliminar clases previas de espaciado de texto
        document.body.classList.remove('text-spacing-wider', 'text-spacing-widest');

        if (radio.value !== 'normal') {
          document.body.classList.add(`text-spacing-${radio.value}`);
        }

        savePreference('textSpacing', radio.value, radio);
        announcePreferenceChange('Espaciado de texto', getTextSpacingName(radio.value));
      }
    });
  });
}

/**
 * Obtiene el nombre legible del tamaño de fuente
 */
function getFontSizeName(value: string): string {
  switch (value) {
    case 'large':
      return 'grande';
    case 'larger':
      return 'muy grande';
    default:
      return 'predeterminado';
  }
}

/**
 * Obtiene el nombre legible del espaciado de texto
 */
function getTextSpacingName(value: string): string {
  switch (value) {
    case 'medium':
      return 'medio';
    case 'large':
      return 'amplio';
    default:
      return 'predeterminado';
  }
}

/**
 * Configura atajos de teclado para funciones de accesibilidad
 */
function setupKeyboardShortcuts() {
  let a11yDialog;
  let highContrastCheckbox;
  let dropZone;
  let convertButton;

  document.addEventListener('keydown', event => {
    // Solo procesar si Ctrl+Alt está presionado (o Cmd+Alt en Mac)
    if ((event.ctrlKey || event.metaKey) && event.altKey) {
      switch (event.key.toLowerCase()) {
        case 'a':
          // Abrir/cerrar diálogo de accesibilidad
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
          // Alternar alto contraste
          event.preventDefault();
          highContrastCheckbox = document.getElementById('high-contrast') as HTMLInputElement;
          if (highContrastCheckbox) {
            highContrastCheckbox.checked = !highContrastCheckbox.checked;
            highContrastCheckbox.dispatchEvent(new Event('change'));
          }
          break;

        case 'd':
          // Activar zona de carga de imágenes
          event.preventDefault();
          dropZone = document.querySelector('drop-zone') as HTMLElement;
          if (dropZone) {
            dropZone.click();
            announceToScreenReader('Activada la selección de archivos para cargar una imagen');
          }
          break;

        case 's':
          // Iniciar conversión
          event.preventDefault();
          convertButton = document.querySelector(
            'button[data-action="convert"]'
          ) as HTMLButtonElement;
          if (convertButton) {
            convertButton.click();
            announceToScreenReader('Iniciando proceso de conversión de imagen');
          }
          break;
      }
    }
  });
}

/**
 * Abre el diálogo de accesibilidad
 */
function openAccessibilityDialog() {
  const a11yDialog = document.getElementById('a11y-dialog');
  if (a11yDialog) {
    a11yDialog.removeAttribute('hidden');
    a11yDialog.setAttribute('aria-hidden', 'false');

    // Enfocar el primer elemento interactivo
    const firstFocusable = a11yDialog.querySelector(
      'button, [href], input, select, textarea'
    ) as HTMLElement;
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Anunciar apertura
    announceToScreenReader('Diálogo de opciones de accesibilidad abierto');
  }
}

/**
 * Cierra el diálogo de accesibilidad
 */
function closeAccessibilityDialog() {
  const a11yDialog = document.getElementById('a11y-dialog');
  const openBtn = document.getElementById('open-a11y-dialog');

  if (a11yDialog) {
    a11yDialog.setAttribute('hidden', 'true');
    a11yDialog.setAttribute('aria-hidden', 'true');

    // Devolver el foco al botón de apertura
    if (openBtn) {
      openBtn.focus();
    }

    // Anunciar cierre
    announceToScreenReader('Diálogo de opciones de accesibilidad cerrado');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  if (app) {
    app.innerHTML = `
      <image-converter></image-converter>
    `;

    // Configurar características de accesibilidad
    setupAccessibilityFeatures();
    setupTouchDetection();
    setupScreenReaderAnnouncer();
    setupAccessibilityDialog();
    setupKeyboardShortcuts();

    // Configurar detección de estado de conexión
    setupOfflineDetection();
  }
});

/**
 * Guarda una preferencia de accesibilidad en localStorage
 */
function savePreference(key: string, value: string, targetElement?: HTMLElement) {
  try {
    localStorage.setItem(`a11y-${key}`, value);

    // Mostrar feedback visual cerca del elemento que cambió
    const confirmIcon = document.createElement('div');
    confirmIcon.className = 'save-confirm';
    confirmIcon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    // Si tenemos un elemento objetivo, posicionar el check junto a él
    if (targetElement) {
      // Obtener el contenedor padre para posicionar relativamente
      const optionContainer = targetElement.closest('.a11y-option');
      if (optionContainer) {
        optionContainer.appendChild(confirmIcon);
      } else {
        // Fallback al diálogo
        document.getElementById('a11y-dialog')?.appendChild(confirmIcon);
      }
    } else {
      // Fallback al diálogo
      document.getElementById('a11y-dialog')?.appendChild(confirmIcon);
    }

    // Eliminar el ícono después de la animación
    setTimeout(() => {
      confirmIcon.classList.add('fade-out');
      setTimeout(() => confirmIcon.remove(), 300);
    }, 1500);
  } catch (error) {
    console.error(`Error al guardar preferencia ${key}:`, error);
  }
}

/**
 * Anuncia los cambios de preferencias al lector de pantalla
 */
function announcePreferenceChange(option: string, value: string) {
  announceToScreenReader(`${option}: ${value}`);
}

/**
 * Carga las preferencias de accesibilidad guardadas del usuario
 */
function loadUserPreferences() {
  try {
    // Alto contraste
    const highContrast = localStorage.getItem('a11y-highContrast');
    if (highContrast === 'true') {
      document.body.classList.add('high-contrast');
      const highContrastToggle = document.querySelector('#high-contrast') as HTMLInputElement;
      if (highContrastToggle) highContrastToggle.checked = true;
    }

    // Fuente para dislexia
    const dyslexicFont = localStorage.getItem('a11y-dyslexicFont');
    if (dyslexicFont === 'true') {
      document.body.classList.add('dyslexic-font');
      const dyslexicFontToggle = document.querySelector('#dyslexic-font') as HTMLInputElement;
      if (dyslexicFontToggle) dyslexicFontToggle.checked = true;
    }

    // Tamaño de fuente
    const fontSize = localStorage.getItem('a11y-fontSize');
    if (fontSize && fontSize !== 'normal') {
      document.body.classList.add(`font-size-${fontSize}`);
      const fontSizeRadio = document.querySelector(
        `input[name="font-size"][value="${fontSize}"]`
      ) as HTMLInputElement;
      if (fontSizeRadio) fontSizeRadio.checked = true;
    }

    // Movimiento reducido
    const reducedMotion = localStorage.getItem('a11y-reducedMotion');
    if (reducedMotion === 'true') {
      document.body.classList.add('reduced-motion');
      const reducedMotionToggle = document.querySelector('#reduced-motion') as HTMLInputElement;
      if (reducedMotionToggle) reducedMotionToggle.checked = true;
    }

    // Espaciado de texto
    const textSpacing = localStorage.getItem('a11y-textSpacing');
    if (textSpacing && textSpacing !== 'normal') {
      document.body.classList.add(`text-spacing-${textSpacing}`);
      const textSpacingRadio = document.querySelector(
        `input[name="text-spacing"][value="${textSpacing}"]`
      ) as HTMLInputElement;
      if (textSpacingRadio) textSpacingRadio.checked = true;
    }
  } catch (error) {
    console.error('Error al cargar preferencias de usuario:', error);
  }
}

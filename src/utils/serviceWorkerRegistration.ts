/**
 * Comprueba si la aplicación está siendo ejecutada en modo standalone
 * (en caso de que el usuario haya añadido la página a pantalla de inicio)
 */
export function isRunningStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

/**
 * Detecta si el dispositivo tiene conexión a internet
 */
export function setupOfflineDetection() {
  const updateOnlineStatus = () => {
    const statusAnnouncer = document.getElementById('status-announcer');
    const offlineIndicator = document.getElementById('offline-indicator');
    const app = document.getElementById('app');

    if (navigator.onLine) {
      // Estamos online
      if (app) {
        app.classList.remove('offline-mode');
      }
      if (offlineIndicator) {
        offlineIndicator.setAttribute('hidden', 'true');
        offlineIndicator.setAttribute('aria-hidden', 'true');
      }
      if (statusAnnouncer) {
        statusAnnouncer.textContent =
          'Conexión a internet restaurada. Todas las funciones están disponibles.';
      }
    } else {
      // Estamos offline
      if (app) {
        app.classList.add('offline-mode');
      }
      if (offlineIndicator) {
        offlineIndicator.removeAttribute('hidden');
        offlineIndicator.setAttribute('aria-hidden', 'false');
      }
      if (statusAnnouncer) {
        statusAnnouncer.textContent =
          'Sin conexión a internet. Algunas funciones pueden no estar disponibles.';
      }
    }
  };

  // Escuchar cambios en la conexión
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Verificar el estado inicial
  updateOnlineStatus();
}

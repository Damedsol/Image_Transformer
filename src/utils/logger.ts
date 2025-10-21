/**
 * Logger condicional para el frontend
 * Solo genera logs en modo desarrollo
 */

const isDevelopment = import.meta.env.DEV;

// Logger silencioso para producción
const silentLogger = {
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

// Logger de desarrollo con colores
const devLogger = {
  log: (...args: any[]) => console.log('[LOG]', ...args),
  info: (...args: any[]) => console.info('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

// Exportar logger condicional
export const logger = isDevelopment ? devLogger : silentLogger;

// Función helper para logging de errores de API
export const logApiError = (context: string, error: any) => {
  if (isDevelopment) {
    console.group(`🚨 API Error in ${context}`);
    console.error('Error details:', error);
    console.error('Stack trace:', error?.stack);
    console.groupEnd();
  }
};

// Función helper para logging de operaciones exitosas
export const logSuccess = (context: string, data?: any) => {
  if (isDevelopment) {
    console.group(`✅ Success in ${context}`);
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();
  }
};

export default logger;

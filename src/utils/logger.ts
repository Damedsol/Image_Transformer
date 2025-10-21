/**
 * Conditional logger for frontend
 * Only generates logs in development mode
 */

const isDevelopment = import.meta.env.DEV;

// Silent logger for production
const silentLogger = {
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

// Development logger with colors
const devLogger = {
  log: (...args: unknown[]) => console.warn('[LOG]', ...args),
  info: (...args: unknown[]) => console.warn('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  debug: (...args: unknown[]) => console.warn('[DEBUG]', ...args),
};

// Export conditional logger
export const logger = isDevelopment ? devLogger : silentLogger;

// Helper function for API error logging
export const logApiError = (context: string, error: unknown) => {
  if (isDevelopment) {
    console.warn(`🚨 API Error in ${context}`);
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
};

// Helper function for successful operation logging
export const logSuccess = (context: string, data?: unknown) => {
  if (isDevelopment) {
    console.warn(`✅ Success in ${context}`);
    if (data) {
      console.warn('Data:', data);
    }
  }
};

export default logger;

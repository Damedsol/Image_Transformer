import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Calculate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Silent logger for production
const silentLogger = {
  info: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  debug: (..._args: unknown[]) => {},
  fatal: (..._args: unknown[]) => {},
  level: 'silent',
};

// Function to create development logger
function createDevLogger(): pino.Logger {
  const logsDir = path.join(__dirname, '../../logs');

  // Create logs directory if it doesn't exist
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating logs directory:', error);
    process.exit(1);
  }

  // Dynamic log file configuration
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const logFileName = `${day}-${month}-${year}.log`;
  const logFilePath = path.join(logsDir, logFileName);

  // Configuration options for pino
  const pinoOptions = {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => {
        return { level: label.toUpperCase() };
      },
    },
  };

  // Create logger instance
  let logDestination;
  try {
    logDestination = pino.destination(logFilePath);
  } catch (destError) {
    console.error(
      `Critical error: Could not create log destination at ${logFilePath}. Exiting...`,
      destError
    );
    process.exit(1);
  }

  const logger = pino(pinoOptions, logDestination);

  // Log initial information
  logger.info('============================================');
  logger.info(`Logging initialized. Logs at: ${logFilePath}`);
  logger.info(`Current log level: ${logger.level.toUpperCase()}`);
  logger.info('============================================');

  return logger;
}

// Export conditional logger
export default isDevelopment ? createDevLogger() : silentLogger;

import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Calcular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Verificar si estamos en modo desarrollo
const isDevelopment = process.env.NODE_ENV === 'development';

// Logger silencioso para producción
const silentLogger = {
  info: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  debug: (..._args: unknown[]) => {},
  fatal: (..._args: unknown[]) => {},
  level: 'silent',
};

// Función para crear logger de desarrollo
function createDevLogger(): pino.Logger {
  const logsDir = path.join(__dirname, '../../logs');

  // Crear directorio de logs si no existe
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating logs directory:', error);
    process.exit(1);
  }

  // Configuración del archivo de log dinámico
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const logFileName = `${day}-${month}-${year}.log`;
  const logFilePath = path.join(logsDir, logFileName);

  // Opciones de configuración para pino
  const pinoOptions = {
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => {
        return { level: label.toUpperCase() };
      },
    },
  };

  // Crear instancia del logger
  let logDestination;
  try {
    logDestination = pino.destination(logFilePath);
  } catch (destError) {
    console.error(
      `Error crítico: No se pudo crear el destino del log en ${logFilePath}. Saliendo...`,
      destError
    );
    process.exit(1);
  }

  const logger = pino(pinoOptions, logDestination);

  // Loggear información inicial
  logger.info('============================================');
  logger.info(`Logging inicializado. Logs en: ${logFilePath}`);
  logger.info(`Nivel de log actual: ${logger.level.toUpperCase()}`);
  logger.info('============================================');

  return logger;
}

// Exportar logger condicional
export default isDevelopment ? createDevLogger() : silentLogger;

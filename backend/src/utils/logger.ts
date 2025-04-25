import pino from 'pino';
import fs from 'fs'; // Importar fs
import path from 'path'; // Importar path
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Calcular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Definir directorio de logs
const logsDir = path.join(__dirname, '../../logs');

// Crear directorio de logs si no existe
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log(`Directorio de logs creado en: ${logsDir}`);
  }
} catch (error) {
  console.error('Error al crear el directorio de logs:', error);
  // Salir si no se pueden escribir logs, ya que es el único destino
  process.exit(1);
}

// --- Configuración del archivo de log dinámico ---
const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
const year = String(now.getFullYear()).slice(-2); // Últimos 2 dígitos del año
const logFileName = `${day}-${month}-${year}.log`;
const logFilePath = path.join(logsDir, logFileName);
// -------------------------------------------------

// Opciones de configuración base para pino (logs siempre en JSON)
const pinoOptions = {
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
    // Podríamos añadir otros formateadores si es necesario
  },
};

// Crear e exportar la instancia del logger, siempre escribiendo al archivo
console.log(`Redirigiendo todos los logs a: ${logFilePath}`);
const logger = pino(pinoOptions, pino.destination(logFilePath));

// Loggear información inicial
logger.info('============================================');
logger.info(`Logging inicializado. Logs en: ${logFilePath}`);
logger.info(`Nivel de log actual: ${logger.level.toUpperCase()}`);
logger.info('============================================');

export default logger;

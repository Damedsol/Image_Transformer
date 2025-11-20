import express from 'express';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { imageRoutes } from './routes/imageRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import {
  configureHelmet,
  apiRateLimiter,
  protectFromPrototypePollution,
  preventClickjacking,
  validateContentType,
} from './middlewares/securityMiddleware.js';
import logger from './utils/logger.js';

// Calcular __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS (DEBE ir antes de Helmet)
/**
 * Normaliza una URL eliminando trailing slash y validando formato
 */
const normalizeOrigin = (origin: string): string | null => {
  const trimmed = origin.trim();
  if (!trimmed) return null;

  // Validar que sea una URL válida (http o https)
  try {
    const url = new URL(trimmed);
    // Solo permitir http y https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    // Retornar sin trailing slash
    return url.origin;
  } catch {
    return null;
  }
};

/**
 * Obtiene los orígenes CORS permitidos de forma segura
 */
const getCorsOrigins = (): string[] => {
  if (process.env.NODE_ENV === 'production') {
    const origins: string[] = [];

    // Agregar origen desde variable de entorno (para Netlify u otros servicios)
    if (process.env.CORS_ORIGIN) {
      const normalized = normalizeOrigin(process.env.CORS_ORIGIN);
      if (normalized) {
        origins.push(normalized);
      } else {
        logger.warn({ corsOrigin: process.env.CORS_ORIGIN }, 'CORS_ORIGIN inválido, será ignorado');
      }
    }

    // Agregar múltiples orígenes si están separados por coma
    if (process.env.CORS_ORIGINS) {
      const multipleOrigins = process.env.CORS_ORIGINS.split(',')
        .map(normalizeOrigin)
        .filter((origin): origin is string => origin !== null);
      origins.push(...multipleOrigins);
    }

    // En producción, solo permitir localhost si se especifica explícitamente
    // Esto es útil para testing local contra producción
    if (process.env.ALLOW_LOCALHOST === 'true') {
      origins.push('http://localhost:5173', 'http://localhost:3000');
    }

    // Si no hay orígenes configurados en producción, lanzar error
    if (origins.length === 0) {
      logger.error('No CORS origins configured in production! This is a security risk.');
      throw new Error(
        'CORS_ORIGIN must be configured in production environment for security reasons'
      );
    }

    return origins;
  }

  // Desarrollo: permitir todos los orígenes locales
  return ['http://localhost:3000', 'http://localhost:5173', 'http://localhost'];
};

const corsOrigins = getCorsOrigins();
logger.info({ corsOrigins, nodeEnv: process.env.NODE_ENV }, 'CORS origins configured');

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
    maxAge: 600, // 10 minutos
  })
);

// Aplicar middlewares de seguridad (después de CORS)
app.use(configureHelmet());
app.use(preventClickjacking);
app.use(protectFromPrototypePollution);

// Aplicar limitador de tasa a todas las rutas de la API
app.use('/api', apiRateLimiter);

// Middleware para parsear JSON (con límite de tamaño)
app.use(express.json({ limit: '1mb' }));
app.use(validateContentType(['application/json', 'multipart/form-data']));

// Ruta para servir archivos temporales (solo archivos permitidos)
app.use('/temp', (req, res, next): void => {
  // Solo permitir archivos con extensiones seguras
  if (/\.(zip|jpe?g|png|webp|avif|gif)$/i.exec(req.path)) {
    // Usar express.static directamente aquí podría causar problemas si no se llama a next
    // Es mejor dejar que el siguiente middleware (si existe) lo maneje o enviar la respuesta directamente
    express.static(path.join(__dirname, '../temp'))(req, res, next);
    return; // Asegurarse de que no se ejecute el res.status(403) después
  }
  res.status(403).send('Acceso denegado');
});

// Rutas API (aplicar límite de tasa específico si es necesario)
app.use('/api', imageRoutes);

// Ruta por defecto
app.get('/', (_req, res) => {
  res.json({ message: 'Image Transformer API' });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, `Servidor iniciado en puerto ${PORT}`);
});

// Manejar errores no capturados
process.on('uncaughtException', error => {
  logger.fatal({ err: error }, 'Error no capturado (uncaughtException). Saliendo...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Promesa rechazada no manejada (unhandledRejection)');
});

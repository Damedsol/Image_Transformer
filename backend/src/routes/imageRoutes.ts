import express from 'express';
import { convertImages, getFormats } from '../controllers/imageController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { errorHandler } from '../middlewares/errorMiddleware.js';
import { apiRateLimiter } from '../middlewares/securityMiddleware.js';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AppError } from '../utils/apiError.js';
import logger from '../utils/logger.js';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

// Limitador de tasa específico para conversión de imágenes (más restrictivo)
const convertRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_IMAGE_UPLOAD_WINDOW_MS || '3600000'), // 1 hora por defecto
  max: parseInt(process.env.RATE_LIMIT_IMAGE_UPLOAD_MAX || '20'), // 20 peticiones por hora
  standardHeaders: true,
  legacyHeaders: false,
  // Identificar al cliente mediante IP y user-agent para mayor precisión con soporte IPv6
  keyGenerator: req => {
    const ip = ipKeyGenerator(req.ip || 'unknown');
    return `${ip}-${req.headers['user-agent'] || 'unknown'}`;
  },
  handler: (_req, _res, next) => {
    next(
      new AppError('Demasiadas solicitudes de conversión. Por favor, intente más tarde.', 429, {
        code: 'RATE_LIMIT_EXCEEDED',
      })
    );
  },
});

// Middleware simple para loguear inicio de petición /convert
const logConvertRequestStart = (req: Request, _res: Response, next: NextFunction): void => {
  logger.info(
    { ip: req.ip, userAgent: req.headers['user-agent'], body: req.body },
    'Recibida solicitud POST /api/convert'
  );
  next();
};

// Rutas
router.get('/formats', apiRateLimiter, getFormats);

// Ruta de conversión con rate limiting específico
router.post(
  '/convert',
  logConvertRequestStart,
  convertRateLimiter,
  upload.array('images', parseInt(process.env.MAX_FILES_PER_REQUEST || '5')),
  convertImages
);

// Middleware de manejo de errores
router.use(errorHandler);

export { router as imageRoutes };

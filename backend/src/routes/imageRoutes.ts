import express from 'express';
import { convertImages, getFormats } from '../controllers/imageController';
import { upload } from '../middlewares/uploadMiddleware';
import { errorHandler } from '../middlewares/errorMiddleware';
import { apiRateLimiter } from '../middlewares/securityMiddleware';
import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/apiError';

const router = express.Router();

// Limitador de tasa específico para conversión de imágenes (más restrictivo)
const convertRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_IMAGE_UPLOAD_WINDOW_MS || '3600000'), // 1 hora por defecto
  max: parseInt(process.env.RATE_LIMIT_IMAGE_UPLOAD_MAX || '20'), // 20 peticiones por hora
  standardHeaders: true,
  legacyHeaders: false,
  // Identificar al cliente mediante IP y user-agent para mayor precisión
  keyGenerator: req => {
    return `${req.ip}-${req.headers['user-agent'] || 'unknown'}`;
  },
  handler: (req, res, next) => {
    next(
      new AppError('Demasiadas solicitudes de conversión. Por favor, intente más tarde.', 429, {
        code: 'RATE_LIMIT_EXCEEDED',
      })
    );
  },
});

// Rutas
router.get('/formats', apiRateLimiter, getFormats);

// Ruta de conversión con rate limiting específico
router.post(
  '/convert',
  convertRateLimiter, // Primero verificamos límite de tasa
  upload.array('images', parseInt(process.env.MAX_FILES_PER_REQUEST || '5')),
  convertImages
);

// Middleware de manejo de errores
router.use(errorHandler);

export { router as imageRoutes };

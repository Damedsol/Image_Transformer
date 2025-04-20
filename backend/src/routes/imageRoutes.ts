import express from 'express';
import { convertImages, getFormats } from '../controllers/imageController';
import { upload } from '../middlewares/uploadMiddleware';
import { errorHandler } from '../middlewares/errorMiddleware';
import { apiRateLimiter } from '../middlewares/securityMiddleware';
import rateLimit from 'express-rate-limit';
import { authenticateApiKey, authenticateJwt } from '../middlewares/authMiddleware';
import { AppError } from '../utils/apiError';

const router = express.Router();

// Middleware para autenticación opcional, prioriza JWT, luego API Key
const optionalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const hasAuthHeader =
    req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
  const hasApiKey = req.headers['x-api-key'];

  // Si no hay credenciales, continuamos sin autenticar
  if (!hasAuthHeader && !hasApiKey) {
    return next();
  }

  // Si hay token JWT, intentamos autenticar con JWT
  if (hasAuthHeader) {
    return authenticateJwt(req, res, err => {
      // Si hay error en JWT, pero tenemos API Key, intentamos con esa
      if (err && hasApiKey) {
        authenticateApiKey(req, res, next);
      } else if (err) {
        // Si solo había JWT y falló, devolvemos el error
        next(err);
      } else {
        // JWT exitoso
        next();
      }
    });
  }

  // Si solo hay API Key, autenticamos con ella
  if (hasApiKey) {
    return authenticateApiKey(req, res, next);
  }

  // Por seguridad, si llegamos aquí continuamos sin autenticar
  next();
};

// Limitador de tasa específico para conversión de imágenes (más restrictivo)
const convertRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_IMAGE_UPLOAD_WINDOW_MS || '3600000'), // 1 hora por defecto
  max: parseInt(process.env.RATE_LIMIT_IMAGE_UPLOAD_MAX || '20'), // 20 peticiones por hora
  standardHeaders: true,
  legacyHeaders: false,
  // Permite más peticiones a usuarios autenticados
  skip: req => {
    // Los usuarios autenticados tienen un límite más alto
    return req.user !== undefined || req.apiKey !== undefined;
  },
  handler: (req, res, next) => {
    next(
      new AppError(
        'Demasiadas solicitudes de conversión. Por favor, intente más tarde o autentíquese.',
        429,
        { code: 'RATE_LIMIT_EXCEEDED' }
      )
    );
  },
});

// Rutas
router.get('/formats', apiRateLimiter, getFormats);

// Ruta de conversión con autenticación opcional y rate limiting específico
router.post(
  '/convert',
  convertRateLimiter, // Primero verificamos límite de tasa
  optionalAuth, // Luego autenticación opcional
  upload.array('images', parseInt(process.env.MAX_FILES_PER_REQUEST || '5')),
  convertImages
);

// Middleware de manejo de errores
router.use(errorHandler);

export { router as imageRoutes };

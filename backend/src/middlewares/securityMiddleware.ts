import { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AppError } from '../utils/apiError.js';

/**
 * Configuración de Helmet con opciones de seguridad
 */
export const configureHelmet = (): RequestHandler => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'", 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-site' },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
    hsts: {
      maxAge: 15552000, // 180 días
      includeSubDomains: true,
      preload: true,
    },
  });
};

/**
 * Limitador de tasa para API
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos por defecto
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 peticiones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  // Usar múltiples factores para identificar al cliente con soporte IPv6
  keyGenerator: req => {
    const ip = ipKeyGenerator(req.ip || 'unknown');
    return `${ip}-${req.headers['user-agent'] || 'unknown'}`;
  },
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(AppError.tooManyRequests());
  },
});

/**
 * Middleware para prevenir vulnerabilidades de Prototype Pollution
 * Simplificado para evitar reasignar req.query y req.body
 */
export const protectFromPrototypePollution = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const dangerousProps = ['__proto__', 'constructor', 'prototype'];

  // Verificar y limpiar req.body (si existe y es objeto)
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const prop of dangerousProps) {
      if (Object.prototype.hasOwnProperty.call(req.body, prop)) {
        delete (req.body as Record<string, unknown>)[prop];
      }
    }
  }

  // Verificar y limpiar req.query (si existe y es objeto)
  if (req.query && typeof req.query === 'object') {
    for (const prop of dangerousProps) {
      // Necesitamos verificar el objeto req.query directamente
      if (Object.prototype.hasOwnProperty.call(req.query, prop)) {
        delete (req.query as Record<string, unknown>)[prop];
      }
    }
  }

  next();
};

/**
 * Middleware para validar tipos MIME
 */
export const validateContentType = (allowedTypes: string[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'];

    if (
      req.method !== 'GET' &&
      req.method !== 'HEAD' &&
      contentType &&
      !allowedTypes.some(type => contentType.includes(type))
    ) {
      return next(
        AppError.badRequest(
          `Tipo de contenido no permitido. Permitidos: ${allowedTypes.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Middleware para prevenir ataques de clickjacking
 */
export const preventClickjacking = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

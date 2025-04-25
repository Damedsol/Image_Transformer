import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ParsedQs } from 'qs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
  // Usar múltiples factores para identificar al cliente
  keyGenerator: req => {
    return `${req.ip}-${req.headers['user-agent'] || 'unknown'}`;
  },
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(AppError.tooManyRequests());
  },
});

/**
 * Middleware para prevenir vulnerabilidades de Prototype Pollution
 */
export const protectFromPrototypePollution = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const purifyObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    if (!obj || typeof obj !== 'object') return obj;

    // Eliminar propiedades peligrosas
    const dangerousProps = ['__proto__', 'constructor', 'prototype'];
    dangerousProps.forEach(prop => {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        delete obj[prop];
      }
    });

    // Recursivamente purificar objeto
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value && typeof value === 'object') {
          obj[key] = purifyObject(value as Record<string, unknown>);
        }
      }
    }

    return obj;
  };

  // Purificar body si es un objeto
  if (req.body && typeof req.body === 'object') {
    req.body = purifyObject(req.body);
  }

  // Purificar query params
  if (req.query && typeof req.query === 'object') {
    req.query = purifyObject(req.query as Record<string, unknown>) as ParsedQs;
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

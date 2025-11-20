import { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AppError } from '../utils/apiError.js';

/**
 * Configuración de Helmet con opciones de seguridad
 */
/**
 * Configuración de Helmet con políticas de seguridad estrictas
 * Compatible con CORS pero manteniendo seguridad
 */
export const configureHelmet = (): RequestHandler => {
  // Obtener orígenes permitidos desde variables de entorno para CSP
  const allowedOrigins: string[] = [];
  if (process.env.CORS_ORIGIN) {
    try {
      const url = new URL(process.env.CORS_ORIGIN);
      allowedOrigins.push(url.origin);
    } catch {
      // Ignorar si no es una URL válida
    }
  }
  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(',').forEach(origin => {
      try {
        const url = new URL(origin.trim());
        allowedOrigins.push(url.origin);
      } catch {
        // Ignorar si no es una URL válida
      }
    });
  }

  // Backend URL para connectSrc
  const backendUrl = process.env.BACKEND_URL || 'https://image-transformer-r99u.onrender.com';
  let backendOrigin: string;
  try {
    const url = new URL(backendUrl);
    backendOrigin = url.origin;
  } catch {
    backendOrigin = 'https://image-transformer-r99u.onrender.com';
  }

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline necesario para algunos frameworks
        styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline necesario para estilos inline
        imgSrc: ["'self'", 'data:', 'blob:'],
        // Permitir conexiones solo a orígenes específicos y conocidos
        connectSrc: [
          "'self'",
          backendOrigin,
          ...allowedOrigins,
          // Permitir conexiones desde el frontend al backend
          'https://*.onrender.com',
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"], // Bloquear plugins
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"], // Bloquear iframes
        workerSrc: ["'self'", 'blob:'],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // Configuración balanceada: permitir CORS pero mantener seguridad
    crossOriginEmbedderPolicy: false, // Necesario para CORS con credenciales
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Más seguro que unsafe-none
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Necesario para CORS
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Más seguro que no-referrer
    hsts: {
      maxAge: 31536000, // 1 año (máximo recomendado)
      includeSubDomains: true,
      preload: true,
    },
    // Prevenir clickjacking
    frameguard: {
      action: 'deny',
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

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/apiError';
import { JwtPayload, UserRole } from '../utils/types';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Extiende la interfaz de Request para añadir el usuario autenticado
declare global {
  interface CustomRequest extends Request {
    user?: JwtPayload;
    apiKey?: string;
  }
}

// Redefine Request para incluir nuestras propiedades
type EnhancedRequest = Request & {
  user?: JwtPayload;
  apiKey?: string;
};

/**
 * Middleware para verificar token JWT
 */
export const authenticateJwt = (req: EnhancedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token de autenticación no proporcionado'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(AppError.internal('Error de configuración del servidor'));
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Token expirado'));
    }

    return next(AppError.unauthorized('Token inválido'));
  }
};

/**
 * Middleware para verificar API Key
 */
export const authenticateApiKey = (req: EnhancedRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return next(AppError.unauthorized('API Key no proporcionada'));
  }

  // Aquí se implementaría la validación contra una base de datos
  // Por ahora, usamos una clave de ejemplo para demostración
  const validApiKey = process.env.API_KEY_EXAMPLE || 'test-api-key-12345';

  if (apiKey !== validApiKey) {
    return next(AppError.unauthorized('API Key inválida'));
  }

  req.apiKey = apiKey;
  next();
};

/**
 * Middleware para verificar roles de usuario
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: EnhancedRequest, res: Response, next: NextFunction) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    // Verificar que el rol del usuario esté en los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('No tiene permisos para acceder a este recurso'));
    }

    next();
  };
};

/**
 * Middleware para limitar la tasa de solicitudes por IP
 */
export const ipRateLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  // Aquí iría la lógica de limitación de tasa
  // Por simplicidad, este es un ejemplo básico
  // const ip = req.ip;
  // const requestTimestamp = Date.now();

  // Simulación: implementación real usaría Redis o similar
  // const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
  // const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100');

  // En una implementación real, este map estaría en Redis o similar
  // para compartirlo entre todas las instancias del servidor
  /*
    const ipRequestMap = new Map<string, number[]>();
    const requests = ipRequestMap.get(ip) || [];
    
    // Filtrar solicitudes dentro de la ventana de tiempo
    const recentRequests = requests.filter(
      (timestamp) => requestTimestamp - timestamp < rateLimitWindow
    );
    
    if (recentRequests.length >= maxRequests) {
      return next(AppError.tooManyRequests());
    }
    
    // Agregar la solicitud actual
    recentRequests.push(requestTimestamp);
    ipRequestMap.set(ip, recentRequests);
    */

  // En producción, implementar con Redis o similar
  next();
};

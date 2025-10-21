import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/types.js';
import { AppError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

/**
 * Middleware para manejar errores de forma centralizada
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Loguear el error usando el logger centralizado
  // Incluir el objeto de error completo para tener stack trace y detalles
  logger.error({ err }, 'Error no manejado interceptado por errorHandler');

  // Si es un AppError personalizado, usar su código de estado y detalles
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details && process.env.NODE_ENV === 'development' ? err.details : undefined,
      },
    });
    return;
  }

  // Categorizar errores comunes
  // Errores de validación
  if (err.message.includes('Validation error') || err.message.includes('validation failed')) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
    return;
  }

  // Errores de autenticación
  if (
    err.message.includes('jwt') ||
    err.message.includes('token') ||
    err.message.includes('unauthorized')
  ) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Error de autenticación',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
    return;
  }

  // Errores de autorización
  if (err.message.includes('permission') || err.message.includes('forbidden')) {
    res.status(403).json({
      success: false,
      error: {
        message: 'No tiene permisos para realizar esta acción',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
    return;
  }

  // Errores de Multer (subida de archivos)
  if (err.message.includes('Solo se permiten imágenes') || err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: {
        message: err.message || 'Error en la subida de archivos',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    });
    return;
  }

  // Error genérico (500 - Internal Server Error)
  res.status(500).json({
    success: false,
    error: {
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
};

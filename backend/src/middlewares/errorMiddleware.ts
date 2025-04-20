import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/types';

/**
 * Middleware para manejar errores de forma centralizada
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log del error para depuración
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Si es un ApiError personalizado, usar su código de estado y detalles
  if ('statusCode' in err) {
    const apiError = err as ApiError;
    return res.status(apiError.statusCode).json({
      success: false,
      error: {
        message: apiError.message,
        code: apiError.code,
        details:
          apiError.details && process.env.NODE_ENV === 'development' ? apiError.details : undefined,
      },
    });
  }

  // Categorizar errores comunes
  // Errores de validación
  if (err.message.includes('Validation error') || err.message.includes('validation failed')) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
  }

  // Errores de autenticación
  if (
    err.message.includes('jwt') ||
    err.message.includes('token') ||
    err.message.includes('unauthorized')
  ) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Error de autenticación',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
  }

  // Errores de autorización
  if (err.message.includes('permission') || err.message.includes('forbidden')) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'No tiene permisos para realizar esta acción',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
  }

  // Errores de Multer (subida de archivos)
  if (err.message.includes('Solo se permiten imágenes') || err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message || 'Error en la subida de archivos',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    });
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

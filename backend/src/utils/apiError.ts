import { ApiError } from './types';

/**
 * Clase para crear errores tipados y consistentes en la API
 */
export class AppError implements ApiError {
  public readonly message: string;
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly stack?: string;
  public readonly name: string = 'AppError';

  constructor(message: string, statusCode: number, options?: { code?: string; details?: unknown }) {
    this.message = message;
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    Error.captureStackTrace(this);
  }

  /**
   * Crea un error de validación (400 Bad Request)
   */
  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, { code: 'BAD_REQUEST', details });
  }

  /**
   * Crea un error de autenticación (401 Unauthorized)
   */
  static unauthorized(message = 'No autenticado'): AppError {
    return new AppError(message, 401, { code: 'UNAUTHORIZED' });
  }

  /**
   * Crea un error de autorización (403 Forbidden)
   */
  static forbidden(message = 'No autorizado'): AppError {
    return new AppError(message, 403, { code: 'FORBIDDEN' });
  }

  /**
   * Crea un error de recurso no encontrado (404 Not Found)
   */
  static notFound(message = 'Recurso no encontrado'): AppError {
    return new AppError(message, 404, { code: 'NOT_FOUND' });
  }

  /**
   * Crea un error de limitación de tasa (429 Too Many Requests)
   */
  static tooManyRequests(message = 'Demasiadas solicitudes'): AppError {
    return new AppError(message, 429, { code: 'TOO_MANY_REQUESTS' });
  }

  /**
   * Crea un error interno del servidor (500 Internal Server Error)
   */
  static internal(message = 'Error interno del servidor', details?: unknown): AppError {
    return new AppError(message, 500, { code: 'INTERNAL_ERROR', details });
  }
}

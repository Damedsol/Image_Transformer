import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/types.js';
import { AppError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

/**
 * Middleware to handle errors centrally
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error using the centralized logger
  // Include the complete error object to have stack trace and details
  logger.error({ err }, 'Unhandled error intercepted by errorHandler');

  // If it's a custom AppError, use its status code and details
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

  // Categorize common errors
  // Validation errors
  if (err.message.includes('Validation error') || err.message.includes('validation failed')) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid input data',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
    return;
  }

  // Authentication errors
  if (
    err.message.includes('jwt') ||
    err.message.includes('token') ||
    err.message.includes('unauthorized')
  ) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
    return;
  }

  // Authorization errors
  if (err.message.includes('permission') || err.message.includes('forbidden')) {
    res.status(403).json({
      success: false,
      error: {
        message: 'You do not have permission to perform this action',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
    return;
  }

  // Multer errors (file upload)
  if (err.message.includes('Only images are allowed') || err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: {
        message: err.message || 'File upload error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
    });
    return;
  }

  // Generic error (500 - Internal Server Error)
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
};

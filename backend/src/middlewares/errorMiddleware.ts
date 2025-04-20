import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);

  // Verificar si es un error de multer (subida de archivos)
  if (err.message.includes('Solo se permiten imágenes')) {
    return res.status(400).json({ error: err.message });
  }

  // Errores de validación
  if (err.message.includes('Validation error')) {
    return res.status(400).json({ error: err.message });
  }

  // Error por defecto
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

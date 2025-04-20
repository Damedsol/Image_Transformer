import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { processImage, createZipFromImages, cleanTempFiles } from '../utils/imageProcessor';
import { ConversionOptions, JwtPayload } from '../utils/types';
import { AppError } from '../utils/apiError';
import { safelyDeleteFile } from '../middlewares/uploadMiddleware';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de límites
const MAX_FILES_PER_REQUEST = parseInt(process.env.MAX_FILES_PER_REQUEST || '5');
const DAILY_QUOTA_PER_USER = parseInt(process.env.DAILY_QUOTA_PER_USER || '100');

// Almacenamiento en memoria para cuotas (en producción usar Redis o base de datos)
interface UserQuota {
  count: number;
  resetAt: Date;
}
const userQuotas = new Map<string, UserQuota>();

// Esquema de validación para opciones de conversión
const formatSchema = z.enum(['jpeg', 'png', 'webp', 'avif', 'gif']);
const conversionOptionsSchema = z.object({
  format: formatSchema,
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  quality: z.coerce.number().min(1).max(100).optional().default(80),
  maintainAspectRatio: z.coerce.boolean().optional().default(true),
});

// Interfaz para extender Request con la propiedad user
interface RequestWithUser extends Request {
  user?: JwtPayload;
}

/**
 * Verificar y actualizar la cuota de un usuario
 * @returns true si el usuario tiene cuota disponible, false si ha excedido su cuota
 */
const checkUserQuota = (userId: string): boolean => {
  // En un entorno de producción, esto debería persistirse en base de datos
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let userQuota = userQuotas.get(userId);

  // Si no existe la cuota o es de un día anterior, resetear
  if (!userQuota || userQuota.resetAt < today) {
    userQuota = {
      count: 0,
      resetAt: today,
    };
  }

  // Verificar si ha excedido la cuota
  if (userQuota.count >= DAILY_QUOTA_PER_USER) {
    return false;
  }

  // Actualizar contador
  userQuota.count += 1;
  userQuotas.set(userId, userQuota);

  return true;
};

/**
 * Convierte las imágenes según las opciones especificadas y devuelve un ZIP
 */
export const convertImages = async (req: Request, res: Response) => {
  // Lista de archivos temporales para limpiar
  const tempFilesToClean: string[] = [];

  try {
    if (!req.files || !Array.isArray(req.files)) {
      throw new AppError('No se han subido imágenes', 400);
    }

    // Verificar cantidad máxima de archivos
    if (req.files.length > MAX_FILES_PER_REQUEST) {
      throw new AppError(
        `Número máximo de archivos excedido. Máximo permitido: ${MAX_FILES_PER_REQUEST}`,
        400
      );
    }

    // Verificar cuota de usuario si está autenticado
    const userId = (req as RequestWithUser).user?.userId || req.ip || 'anonymous';
    if (!checkUserQuota(userId)) {
      throw new AppError(
        `Ha excedido su cuota diaria de procesamiento (${DAILY_QUOTA_PER_USER} imágenes)`,
        429,
        { code: 'QUOTA_EXCEEDED' }
      );
    }

    // Validar opciones de conversión
    const validationResult = conversionOptionsSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError('Opciones de conversión inválidas', 400, {
        code: 'VALIDATION_ERROR',
        details: validationResult.error.format(),
      });
    }

    // Opciones de conversión validadas
    const options: ConversionOptions = validationResult.data;

    // Añadir archivos originales a la lista de limpieza
    (req.files as Express.Multer.File[]).forEach(file => {
      tempFilesToClean.push(file.path);
    });

    // Procesar cada imagen subida
    const processedImages = await Promise.all(
      (req.files as Express.Multer.File[]).map(file =>
        processImage(
          {
            path: file.path,
            originalname: file.originalname,
          },
          options
        )
      )
    );

    // Añadir imágenes procesadas a la lista de limpieza
    processedImages.forEach(img => {
      tempFilesToClean.push(img.path);
    });

    // Crear nombre para el ZIP basado en la marca de tiempo y un identificador aleatorio
    const zipFileName = `converted_images_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Crear ZIP con las imágenes procesadas
    const zipPath = await createZipFromImages(processedImages, zipFileName);

    // Añadir el ZIP a la lista de limpieza
    tempFilesToClean.push(zipPath);

    // Devolver la URL para descargar el ZIP
    const zipUrl = `/temp/output/${path.basename(zipPath)}`;

    // Registrar uso para auditoría si está habilitado
    if (process.env.ENABLE_AUDIT_LOG === 'true') {
      // console.log(`[AUDIT] Usuario ${userId} procesó ${req.files.length} imágenes a formato ${options.format}`);
    }

    // Preparar respuesta
    const responseData = {
      success: true,
      message: 'Imágenes convertidas correctamente',
      zipUrl,
      images: processedImages.map(img => ({
        originalName: path.basename(img.path),
        format: img.format,
        width: img.width,
        height: img.height,
      })),
    };

    // Enviar respuesta
    res.json(responseData);

    // Configurar eliminación de archivos temporales después de un tiempo prudencial
    cleanTempFiles(tempFilesToClean);
  } catch (error) {
    console.error('Error al convertir imágenes:', error);

    // Si es un AppError, usamos su estructura
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      });
    } else {
      // Error genérico
      res.status(500).json({
        success: false,
        error: {
          message: 'Error al procesar las imágenes',
          details: (error as Error).message,
        },
      });
    }

    // Limpiar archivos temporales en caso de error
    tempFilesToClean.forEach(filePath => {
      safelyDeleteFile(filePath);
    });
  }
};

/**
 * Devuelve los formatos de imagen disponibles
 */
export const getFormats = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      formats: ['jpeg', 'png', 'webp', 'avif', 'gif'],
      limits: {
        maxFilesPerRequest: MAX_FILES_PER_REQUEST,
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
        dailyQuota: DAILY_QUOTA_PER_USER,
        maxDimensions: {
          width: parseInt(process.env.MAX_IMAGE_WIDTH || '4000'),
          height: parseInt(process.env.MAX_IMAGE_HEIGHT || '4000'),
        },
      },
    },
  });
};

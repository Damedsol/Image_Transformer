import { Request, Response } from 'express';
import path from 'path';
import { z } from 'zod';
import { processImage, createZipFromImages, cleanTempFiles } from '../utils/imageProcessor.js';
import { ConversionOptions, ConversionResult } from '../utils/types.js';
import { AppError } from '../utils/apiError.js';
import { safelyDeleteFile } from '../middlewares/uploadMiddleware.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de límites
const MAX_FILES_PER_REQUEST = parseInt(process.env.MAX_FILES_PER_REQUEST || '5');
const DAILY_QUOTA_PER_IP = parseInt(process.env.DAILY_QUOTA_PER_IP || '100');

// Almacenamiento en memoria para cuotas (en producción usar Redis o base de datos)
interface IPQuota {
  count: number;
  resetAt: Date;
}
const ipQuotas = new Map<string, IPQuota>();

// Esquema de validación para opciones de conversión
const formatSchema = z.enum(['jpeg', 'png', 'webp', 'avif', 'gif']);
const conversionOptionsSchema = z.object({
  format: formatSchema,
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  quality: z.coerce.number().min(1).max(100).optional().default(80),
  maintainAspectRatio: z.coerce.boolean().optional().default(true),
});

/**
 * Verificar y actualizar la cuota de un IP
 * @returns true si el IP tiene cuota disponible, false si ha excedido su cuota
 */
const checkIPQuota = (ip: string): boolean => {
  // En un entorno de producción, esto debería persistirse en base de datos
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let ipQuota = ipQuotas.get(ip);

  // Si no existe la cuota o es de un día anterior, resetear
  if (!ipQuota || ipQuota.resetAt < today) {
    ipQuota = {
      count: 0,
      resetAt: today,
    };
  }

  // Verificar si ha excedido la cuota
  if (ipQuota.count >= DAILY_QUOTA_PER_IP) {
    return false;
  }

  // Actualizar contador
  ipQuota.count += 1;
  ipQuotas.set(ip, ipQuota);

  return true;
};

/**
 * Convierte las imágenes según las opciones especificadas y devuelve un ZIP
 */
export const convertImages = async (req: Request, res: Response): Promise<void> => {
  // Lista DE TODOS los archivos temporales generados en esta petición
  const allTempFiles: string[] = [];
  let zipPath: string | undefined;
  let processedImages: ConversionResult[] = [];

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

    // Obtener IP del cliente
    const clientIP = req.ip || 'unknown';

    // Verificar cuota de IP
    if (!checkIPQuota(clientIP)) {
      logger.warn(
        {
          ip: clientIP,
          action: 'QUOTA_EXCEEDED',
          limit: DAILY_QUOTA_PER_IP,
          userAgent: req.headers['user-agent'] || 'unknown',
        },
        'Intento de exceder cuota diaria'
      );

      throw new AppError(
        `Ha excedido su cuota diaria de procesamiento (${DAILY_QUOTA_PER_IP} imágenes)`,
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
    logger.info({ options }, 'Opciones de conversión validadas');

    // Añadir archivos originales a la lista global de limpieza
    req.files.forEach(file => {
      allTempFiles.push(file.path);
    });

    // Procesar cada imagen subida
    logger.info({ numFiles: req.files.length }, 'Iniciando procesamiento de imágenes');
    processedImages = await Promise.all(
      req.files.map((file: Express.Multer.File) =>
        processImage(
          {
            path: file.path,
            originalname: file.originalname,
          },
          options
        )
      )
    );

    // Añadir imágenes procesadas a la lista global de limpieza
    processedImages.forEach(img => {
      allTempFiles.push(img.path);
    });

    logger.info({ numProcessed: processedImages.length }, 'Procesamiento de imágenes completado');

    // Crear nombre para el ZIP basado en la marca de tiempo y un identificador aleatorio
    const zipFileName = `converted_images_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Crear ZIP con las imágenes procesadas
    logger.info({ zipFileName }, 'Iniciando creación de archivo ZIP');
    zipPath = await createZipFromImages(processedImages, zipFileName);
    logger.info({ zipPath }, 'Archivo ZIP creado exitosamente');

    // Añadir el ZIP a la lista global de limpieza
    allTempFiles.push(zipPath);

    // --- Limpieza Inmediata de Originales y Procesados ---
    logger.debug('Limpiando archivos originales y procesados...');
    // Eliminar archivos originales
    req.files.forEach(file => {
      safelyDeleteFile(file.path);
    });
    // Eliminar imágenes procesadas individuales
    processedImages.forEach(img => {
      safelyDeleteFile(img.path);
    });
    logger.debug('Limpieza inmediata completada.');
    // ------------------------------------------------------

    // Devolver la URL para descargar el ZIP
    const zipUrl = `/temp/output/${path.basename(zipPath)}`;
    logger.info({ zipUrl }, 'URL del ZIP generada para la respuesta');

    // Registrar uso para auditoría con logger.info
    logger.info(
      {
        ip: clientIP,
        action: 'IMAGE_CONVERSION_SUCCESS',
        numImages: req.files.length,
        format: options.format,
        userAgent: req.headers['user-agent'] || 'unknown',
        zipFile: path.basename(zipPath),
      },
      'Conversión de imágenes completada exitosamente'
    );

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
    logger.info({ responseData }, 'Enviando respuesta exitosa al cliente');
    res.json(responseData);

    // Configurar eliminación RETRASADA SOLO para el archivo ZIP
    logger.debug({ zipFile: zipPath }, `Programando limpieza retrasada para: ${zipPath}`);
    cleanTempFiles([zipPath]); // Solo el ZIP
  } catch (error: unknown) {
    logger.error(
      {
        err: error,
        ip: req?.ip,
        userAgent: req?.headers ? req.headers['user-agent'] : undefined,
      },
      'Error durante la conversión de imágenes'
    );

    // Limpieza INMEDIATA de TODOS los archivos temporales en caso de error
    logger.warn(
      { numFiles: allTempFiles.length },
      'Error detectado. Iniciando limpieza inmediata de todos los archivos temporales...'
    );
    allTempFiles.forEach(filePath => {
      safelyDeleteFile(filePath);
    });
    logger.warn('Limpieza por error completada.');

    // Enviar respuesta de error
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
          details: error instanceof Error ? error.message : 'Error desconocido genérico',
        },
      });
    }
  }
};

/**
 * Devuelve los formatos de imagen disponibles
 */
export const getFormats = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      formats: ['jpeg', 'png', 'webp', 'avif', 'gif'],
      limits: {
        maxFilesPerRequest: MAX_FILES_PER_REQUEST,
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
        dailyQuota: DAILY_QUOTA_PER_IP,
        maxDimensions: {
          width: parseInt(process.env.MAX_IMAGE_WIDTH || '4000'),
          height: parseInt(process.env.MAX_IMAGE_HEIGHT || '4000'),
        },
      },
    },
  });
};

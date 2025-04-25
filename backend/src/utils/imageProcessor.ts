import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { ConversionOptions, ImageFile, ConversionResult } from './types.js';
import { AppError } from './apiError.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Crear equivalentes a __dirname y __filename para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Configurar límites de Sharp basados en variables de entorno
const sharpConcurrency = parseInt(process.env.SHARP_CONCURRENCY || '1');
// Configurar Sharp con límites de memoria
sharp.cache(false); // Desactivar caché para evitar fugas de memoria
sharp.concurrency(sharpConcurrency); // Limitar procesamiento concurrente
sharp.simd(false); // Desactivar aceleración SIMD para reducir uso de memoria

// Obtener límites máximos de dimensiones
const MAX_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || '4000');
const MAX_HEIGHT = parseInt(process.env.MAX_IMAGE_HEIGHT || '4000');
const MAX_DIMENSIONS = MAX_WIDTH * MAX_HEIGHT;
const MAX_ZIP_SIZE = parseInt(process.env.MAX_ZIP_SIZE || '25000000');
const IMAGE_PROCESSING_TIMEOUT = parseInt(process.env.IMAGE_PROCESSING_TIMEOUT || '30') * 1000;

// Verificar y crear el directorio para archivos procesados
const tempDir = path.join(__dirname, '../../temp');
const outputDir = path.join(tempDir, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Verifica que una ruta esté dentro del directorio permitido
 */
const ensurePathIsWithinBoundary = (filePath: string, allowedDirectory: string): boolean => {
  const normalizedPath = path.normalize(filePath);
  const normalizedAllowedDir = path.normalize(allowedDirectory);

  return normalizedPath.startsWith(normalizedAllowedDir);
};

/**
 * Procesa una imagen con Sharp según las opciones especificadas
 * con manejo de límites de recursos
 */
export const processImage = async (
  imageFile: ImageFile,
  options: ConversionOptions
): Promise<ConversionResult> => {
  // Verificar que la ruta está dentro del directorio permitido
  if (!ensurePathIsWithinBoundary(imageFile.path, tempDir)) {
    throw new AppError('Ruta de archivo no permitida', 403);
  }

  // Crear un temporizador para limitar el tiempo de procesamiento
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError('Tiempo de procesamiento excedido', 408, { code: 'TIMEOUT_ERROR' }));
    }, IMAGE_PROCESSING_TIMEOUT);
  });

  try {
    // Carrera entre el procesamiento y el timeout
    return await Promise.race([processImageWithLimits(imageFile, options), timeoutPromise]);
  } catch (error) {
    console.error('Error al procesar la imagen:', error);

    // Verificar si es un error de memoria o recursos
    const errorMsg = (error as Error).message.toLowerCase();
    if (
      errorMsg.includes('memory') ||
      errorMsg.includes('allocation') ||
      errorMsg.includes('heap')
    ) {
      throw new AppError(
        'Error de recursos al procesar la imagen. La imagen podría ser demasiado grande.',
        413,
        { code: 'RESOURCE_LIMIT_ERROR' }
      );
    }

    throw new AppError(`Error al procesar la imagen: ${(error as Error).message}`, 500);
  }
};

/**
 * Implementación interna del procesador de imágenes con control de límites
 */
const processImageWithLimits = async (
  imageFile: ImageFile,
  options: ConversionOptions
): Promise<ConversionResult> => {
  // Verificar que la ruta está dentro del directorio permitido
  if (!ensurePathIsWithinBoundary(imageFile.path, tempDir)) {
    throw new AppError('Ruta de archivo no permitida', 403);
  }

  // Obtener información de la imagen original
  const imageInfo = await sharp(imageFile.path, {
    limitInputPixels: MAX_DIMENSIONS, // Limitar tamaño en píxeles
    sequentialRead: true, // Menor uso de memoria para imágenes grandes
  }).metadata();

  // Verificar dimensiones máximas de la imagen original (usar ?. y ??)
  if (
    (imageInfo.width ?? 0) > MAX_WIDTH ||
    (imageInfo.height ?? 0) > MAX_HEIGHT ||
    (imageInfo.width ?? 0) * (imageInfo.height ?? 0) > MAX_DIMENSIONS
  ) {
    throw new AppError(
      `Dimensiones de imagen exceden el límite permitido (${MAX_WIDTH}x${MAX_HEIGHT})`,
      413,
      { code: 'DIMENSION_LIMIT_ERROR' }
    );
  }

  // Preparar opciones de procesamiento
  let width = options.width;
  let height = options.height;

  // Validar dimensiones solicitadas
  if (width !== undefined && width > MAX_WIDTH) {
    width = MAX_WIDTH;
  }

  if (height !== undefined && height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
  }

  // Si no se especifica width o height, usar las dimensiones originales (usar ?. y ??)
  if (width === undefined) {
    width = Math.min(imageInfo.width ?? MAX_WIDTH, MAX_WIDTH);
  }

  if (height === undefined) {
    height = Math.min(imageInfo.height ?? MAX_HEIGHT, MAX_HEIGHT);
  }

  // Mantener relación de aspecto si se especifica (usar ?. y verificaciones)
  if (
    options.maintainAspectRatio &&
    width !== undefined &&
    height !== undefined &&
    imageInfo.width !== undefined &&
    imageInfo.height !== undefined &&
    imageInfo.height > 0
  ) {
    const aspectRatio = imageInfo.width / imageInfo.height;
    if (width / height > aspectRatio) {
      width = Math.round(height * aspectRatio);
    } else {
      height = Math.round(width / aspectRatio);
    }
  }

  // Crear nombre para archivo procesado
  const fileNameWithoutExt = path.basename(
    imageFile.originalname, // originalname debería estar presente
    path.extname(imageFile.originalname)
  );
  const outputFileName = `${fileNameWithoutExt}_${width ?? 'auto'}x${height ?? 'auto'}.${options.format}`;
  const outputPath = path.join(outputDir, outputFileName);

  // Verificar que la ruta de salida está dentro del directorio permitido
  if (!ensurePathIsWithinBoundary(outputPath, tempDir)) {
    throw new AppError('Ruta de salida no permitida', 403);
  }

  // Procesar la imagen con Sharp
  const sharpInstance = sharp(imageFile.path, {
    failOnError: true,
    limitInputPixels: MAX_DIMENSIONS, // Limitar tamaño en píxeles
    sequentialRead: true, // Menor uso de memoria para imágenes grandes
  });

  // Aplicar redimensionamiento si se especifican dimensiones
  if (width !== undefined || height !== undefined) {
    sharpInstance.resize({
      width,
      height,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  // Determinar calidad basada en el tamaño del archivo original para optimización
  let quality = options.quality ?? 80; // Usar ??
  let fileSizeMB = 0;
  try {
    const stats = fs.statSync(imageFile.path);
    fileSizeMB = stats.size / (1024 * 1024);
  } catch (statError) {
    console.warn(`No se pudo obtener el tamaño del archivo ${imageFile.path}:`, statError);
    // Continuar con la calidad por defecto si no se puede obtener el tamaño
  }

  // Ajuste dinámico de calidad basado en tamaño
  if (fileSizeMB > 4) {
    quality = Math.min(quality, 70); // Reducir calidad para archivos grandes
  }

  // Aplicar opciones de formato y calidad (options.format debería estar presente)
  switch (options.format) {
    case 'jpeg':
      sharpInstance.jpeg({ quality });
      break;
    case 'png':
      sharpInstance.png({ quality });
      break;
    case 'webp':
      sharpInstance.webp({ quality });
      break;
    case 'avif':
      sharpInstance.avif({ quality });
      break;
    case 'gif':
      sharpInstance.gif();
      break;
    default:
      // Formato por defecto
      sharpInstance.jpeg({ quality });
  }

  // Guardar la imagen procesada
  await sharpInstance.toFile(outputPath);

  // Obtener información de la imagen procesada
  const processedInfo = await sharp(outputPath).metadata();

  return {
    path: outputPath,
    format: options.format, // options.format debería estar presente
    width: processedInfo.width ?? width ?? 0, // Usar ??
    height: processedInfo.height ?? height ?? 0, // Usar ??
  };
};

/**
 * Crea un archivo ZIP con las imágenes procesadas y devuelve la ruta del ZIP
 */
export const createZipFromImages = async (
  processedImages: ConversionResult[],
  zipFileName: string
): Promise<string> => {
  const zipPath = path.join(outputDir, `${zipFileName}.zip`);

  // Verificar que la ruta del ZIP esté dentro del directorio permitido
  if (!ensurePathIsWithinBoundary(zipPath, tempDir)) {
    throw new AppError('Ruta de archivo no permitida', 403);
  }

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Nivel de compresión máximo
  });

  // Manejar errores del stream de salida
  output.on('error', err => {
    console.error('Error en el stream de salida:', err);
    throw new AppError('Error al crear el archivo ZIP', 500);
  });

  // Pipe el archivo de salida al archivo
  archive.pipe(output);

  // Verificar tamaño total de los archivos
  let totalSize = 0;
  for (const image of processedImages) {
    // Verificar que la ruta está dentro del directorio permitido
    if (!ensurePathIsWithinBoundary(image.path, tempDir)) {
      throw new AppError('Ruta de archivo no permitida', 403);
    }

    const stats = fs.statSync(image.path);
    totalSize += stats.size;

    // Comprobar si el tamaño ya excede el límite configurado
    if (totalSize > MAX_ZIP_SIZE) {
      throw new AppError(
        `El tamaño total de las imágenes excede el límite permitido (${MAX_ZIP_SIZE / 1000000} MB)`,
        413,
        { code: 'ZIP_SIZE_LIMIT_ERROR' }
      );
    }

    const fileName = path.basename(image.path);
    archive.file(image.path, { name: fileName });
  }

  // Finalizar el archivo
  await archive.finalize();

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve(zipPath);
    });

    output.on('error', err => {
      reject(err);
    });
  });
};

/**
 * Limpia archivos temporales después de un tiempo determinado
 */
export const cleanTempFiles = (
  filePaths: string[],
  delayMs = parseInt(process.env.TEMP_FILES_CLEANUP_MS || '300000')
): void => {
  setTimeout(() => {
    filePaths.forEach(filePath => {
      // Verificar que el archivo sigue dentro del directorio temporal
      if (ensurePathIsWithinBoundary(filePath, tempDir)) {
        try {
          fs.access(filePath, fs.constants.F_OK, accessErr => {
            if (!accessErr) {
              // El archivo existe, intentar eliminarlo
              fs.unlink(filePath, unlinkErr => {
                if (unlinkErr) {
                  // Error silenciado intencionalmente
                }
              });
            }
          });
        } catch {
          // Error silenciado intencionalmente
        }
      } else {
        // Error silenciado intencionalmente
      }
    });
  }, delayMs);
};

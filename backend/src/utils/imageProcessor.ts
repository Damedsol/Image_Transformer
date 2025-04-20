import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { ConversionOptions, ImageFile, ConversionResult } from './types';
import { AppError } from './apiError';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar límites de Sharp basados en variables de entorno
const sharpMemoryLimit = parseInt(process.env.SHARP_MEMORY_LIMIT || '1024');
// Configurar Sharp con límites de memoria
sharp.cache(false); // Desactivar caché para evitar fugas de memoria
sharp.concurrency(1); // Limitar procesamiento concurrente
if (sharpMemoryLimit > 0) {
  try {
    sharp.simd(false); // Desactivar aceleración SIMD si hay restricciones de memoria
    // Sharp limita píxeles a nivel de instancia, no a nivel global
  } catch (err) {
    console.warn('No se pudo establecer límites en Sharp:', err);
  }
}

// Obtener límites máximos de dimensiones
const MAX_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || '4000');
const MAX_HEIGHT = parseInt(process.env.MAX_IMAGE_HEIGHT || '4000');
const MAX_ZIP_SIZE = parseInt(process.env.MAX_ZIP_SIZE || '25000000');
const IMAGE_PROCESSING_TIMEOUT = parseInt(process.env.IMAGE_PROCESSING_TIMEOUT || '30') * 1000;

// Verificar y crear el directorio para archivos procesados
const tempDir = path.join(__dirname, '../../temp');
const outputDir = path.join(tempDir, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Procesa una imagen con Sharp según las opciones especificadas
 * con manejo de límites de recursos
 */
export const processImage = async (
  imageFile: ImageFile,
  options: ConversionOptions
): Promise<ConversionResult> => {
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
  // Obtener información de la imagen original
  const imageInfo = await sharp(imageFile.path).metadata();

  // Verificar dimensiones máximas de la imagen original
  if (
    (imageInfo.width && imageInfo.width > MAX_WIDTH) ||
    (imageInfo.height && imageInfo.height > MAX_HEIGHT)
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
  if (width && width > MAX_WIDTH) {
    width = MAX_WIDTH;
  }

  if (height && height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
  }

  // Si no se especifica width o height, usar las dimensiones originales
  if (!width && imageInfo.width) {
    width = Math.min(imageInfo.width, MAX_WIDTH);
  }

  if (!height && imageInfo.height) {
    height = Math.min(imageInfo.height, MAX_HEIGHT);
  }

  // Mantener relación de aspecto si se especifica
  if (options.maintainAspectRatio && width && height && imageInfo.width && imageInfo.height) {
    const aspectRatio = imageInfo.width / imageInfo.height;
    if (width / height > aspectRatio) {
      width = Math.round(height * aspectRatio);
    } else {
      height = Math.round(width / aspectRatio);
    }
  }

  // Crear nombre para archivo procesado
  const fileNameWithoutExt = path.basename(
    imageFile.originalname,
    path.extname(imageFile.originalname)
  );
  const outputFileName = `${fileNameWithoutExt}_${width}x${height}.${options.format}`;
  const outputPath = path.join(outputDir, outputFileName);

  // Procesar la imagen con Sharp
  const sharpInstance = sharp(imageFile.path, {
    failOnError: true,
    limitInputPixels: MAX_WIDTH * MAX_HEIGHT, // Limitar tamaño en píxeles
  });

  // Aplicar redimensionamiento si se especifican dimensiones
  if (width || height) {
    sharpInstance.resize({
      width,
      height,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  // Determinar calidad basada en el tamaño del archivo original para optimización
  let quality = options.quality || 80;
  const stats = fs.statSync(imageFile.path);
  const fileSizeMB = stats.size / (1024 * 1024);

  // Ajuste dinámico de calidad basado en tamaño
  if (fileSizeMB > 4) {
    quality = Math.min(quality, 70); // Reducir calidad para archivos grandes
  }

  // Aplicar opciones de formato y calidad
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
    format: options.format,
    width: processedInfo.width || width || 0,
    height: processedInfo.height || height || 0,
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
      const finalStats = fs.statSync(zipPath);
      // console.log(`Archivo ZIP creado: ${zipPath}, tamaño: ${finalStats.size} bytes`);

      // Verificar tamaño final del ZIP
      if (finalStats.size > MAX_ZIP_SIZE) {
        fs.unlinkSync(zipPath); // Eliminar el ZIP si excede el tamaño
        reject(
          new AppError(`El archivo ZIP resultante excede el tamaño máximo permitido`, 413, {
            code: 'ZIP_SIZE_LIMIT_ERROR',
          })
        );
      } else {
        resolve(zipPath);
      }
    });

    archive.on('error', err => {
      console.error('Error al crear el archivo ZIP:', err);
      reject(new AppError('Error al crear el archivo ZIP', 500));
    });
  });
};

/**
 * Limpia los archivos temporales después de un tiempo determinado
 */
export const cleanTempFiles = (
  filePaths: string[],
  delayMs = parseInt(process.env.TEMP_FILES_CLEANUP_MS || '300000')
) => {
  setTimeout(() => {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          // console.log(`Archivo temporal eliminado: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error al eliminar archivo temporal ${filePath}:`, error);
      }
    });
  }, delayMs);
};

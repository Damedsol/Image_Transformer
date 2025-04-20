import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { ConversionOptions, ImageFile, ConversionResult } from './types';

// Verificar y crear el directorio para archivos procesados
const outputDir = path.join(__dirname, '../../temp/output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Procesa una imagen con Sharp según las opciones especificadas
 */
export const processImage = async (
  imageFile: ImageFile,
  options: ConversionOptions,
): Promise<ConversionResult> => {
  try {
    // Obtener información de la imagen original
    const imageInfo = await sharp(imageFile.path).metadata();

    // Preparar opciones de procesamiento
    let width = options.width;
    let height = options.height;

    // Si no se especifica width o height, usar las dimensiones originales
    if (!width && imageInfo.width) {
      width = imageInfo.width;
    }

    if (!height && imageInfo.height) {
      height = imageInfo.height;
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
      path.extname(imageFile.originalname),
    );
    const outputFileName = `${fileNameWithoutExt}_${width}x${height}.${options.format}`;
    const outputPath = path.join(outputDir, outputFileName);

    // Procesar la imagen con Sharp
    const sharpInstance = sharp(imageFile.path);

    // Aplicar redimensionamiento si se especifican dimensiones
    if (width || height) {
      sharpInstance.resize({
        width,
        height,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }

    // Aplicar opciones de formato y calidad
    switch (options.format) {
      case 'jpeg':
        sharpInstance.jpeg({ quality: options.quality || 80 });
        break;
      case 'png':
        sharpInstance.png({ quality: options.quality || 80 });
        break;
      case 'webp':
        sharpInstance.webp({ quality: options.quality || 80 });
        break;
      case 'avif':
        sharpInstance.avif({ quality: options.quality || 80 });
        break;
      case 'gif':
        sharpInstance.gif();
        break;
      default:
        // Formato por defecto
        sharpInstance.jpeg({ quality: options.quality || 80 });
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
  } catch (error) {
    console.error('Error al procesar la imagen:', error);
    throw new Error(`Error al procesar la imagen: ${(error as Error).message}`);
  }
};

/**
 * Crea un archivo ZIP con las imágenes procesadas y devuelve la ruta del ZIP
 */
export const createZipFromImages = async (
  processedImages: ConversionResult[],
  zipFileName: string,
): Promise<string> => {
  const zipPath = path.join(outputDir, `${zipFileName}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Nivel de compresión máximo
  });

  // Manejar errores del stream de salida
  output.on('error', (err) => {
    console.error('Error en el stream de salida:', err);
    throw err;
  });

  // Pipe el archivo de salida al archivo
  archive.pipe(output);

  // Agregar cada imagen procesada al ZIP
  for (const image of processedImages) {
    const fileName = path.basename(image.path);
    archive.file(image.path, { name: fileName });
  }

  // Finalizar el archivo
  await archive.finalize();

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Archivo ZIP creado: ${zipPath}, tamaño: ${archive.pointer()} bytes`);
      resolve(zipPath);
    });

    archive.on('error', (err) => {
      console.error('Error al crear el archivo ZIP:', err);
      reject(err);
    });
  });
};

/**
 * Limpia los archivos temporales después de un tiempo determinado
 */
export const cleanTempFiles = (filePaths: string[], delayMs = 300000) => {
  // 5 minutos por defecto
  setTimeout(() => {
    filePaths.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Archivo temporal eliminado: ${filePath}`);
      }
    });
  }, delayMs);
};

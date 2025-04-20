import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { processImage, createZipFromImages, cleanTempFiles } from '../utils/imageProcessor';
import { ConversionOptions, ImageFormat } from '../utils/types';

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
 * Convierte las imágenes según las opciones especificadas y devuelve un ZIP
 */
export const convertImages = async (req: Request, res: Response) => {
  // Lista de archivos temporales para limpiar
  const tempFilesToClean: string[] = [];

  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No se han subido imágenes' });
    }

    // Validar opciones de conversión
    const validationResult = conversionOptionsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Opciones de conversión inválidas',
        details: validationResult.error.format(),
      });
    }

    // Opciones de conversión validadas
    const options: ConversionOptions = validationResult.data;

    // Añadir archivos originales a la lista de limpieza
    (req.files as Express.Multer.File[]).forEach((file) => {
      tempFilesToClean.push(file.path);
    });

    // Procesar cada imagen subida
    const processedImages = await Promise.all(
      (req.files as Express.Multer.File[]).map((file) =>
        processImage(
          {
            path: file.path,
            originalname: file.originalname,
          },
          options,
        ),
      ),
    );

    // Añadir imágenes procesadas a la lista de limpieza
    processedImages.forEach((img) => {
      tempFilesToClean.push(img.path);
    });

    // Crear nombre para el ZIP basado en la marca de tiempo
    const zipFileName = `converted_images_${Date.now()}`;

    // Crear ZIP con las imágenes procesadas
    const zipPath = await createZipFromImages(processedImages, zipFileName);

    // Añadir el ZIP a la lista de limpieza
    tempFilesToClean.push(zipPath);

    // Devolver la URL para descargar el ZIP
    const zipUrl = `/temp/output/${path.basename(zipPath)}`;

    // Preparar respuesta
    const responseData = {
      success: true,
      message: 'Imágenes convertidas correctamente',
      zipUrl,
      images: processedImages.map((img) => ({
        originalName: path.basename(img.path),
        format: img.format,
        width: img.width,
        height: img.height,
      })),
    };

    // Enviar respuesta
    res.json(responseData);

    // Configurar eliminación de archivos temporales después de un tiempo prudencial
    // para asegurar que el cliente tenga tiempo de descargar el zip
    setTimeout(() => {
      tempFilesToClean.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Archivo temporal eliminado: ${filePath}`);
        }
      });
    }, 60000); // 1 minuto después de enviar la respuesta
  } catch (error) {
    console.error('Error al convertir imágenes:', error);
    res.status(500).json({
      error: 'Error al procesar las imágenes',
      message: (error as Error).message,
    });

    // Limpiar archivos temporales en caso de error
    tempFilesToClean.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Archivo temporal eliminado después de error: ${filePath}`);
      }
    });
  }
};

/**
 * Devuelve los formatos de imagen disponibles
 */
export const getFormats = (req: Request, res: Response) => {
  res.json({
    formats: ['jpeg', 'png', 'webp', 'avif', 'gif'],
  });
};

import { Request, Response } from 'express';
import path from 'path';
import { z } from 'zod';
import { processImage, createZipFromImages, cleanTempFiles } from '../utils/imageProcessor.js';
import { ConversionOptions, ConversionResult } from '../utils/types.js';
import { AppError } from '../utils/apiError.js';
import { safelyDeleteFile } from '../middlewares/uploadMiddleware.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration limits
const MAX_FILES_PER_REQUEST = parseInt(process.env.MAX_FILES_PER_REQUEST || '5');
const DAILY_QUOTA_PER_IP = parseInt(process.env.DAILY_QUOTA_PER_IP || '100');

// In-memory storage for quotas (in production use Redis or database)
interface IPQuota {
  count: number;
  resetAt: Date;
}
const ipQuotas = new Map<string, IPQuota>();

// Validation schema for conversion options
const formatSchema = z.enum(['jpeg', 'png', 'webp', 'avif', 'gif']);
const conversionOptionsSchema = z.object({
  format: formatSchema,
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  quality: z.coerce.number().min(1).max(100).optional().default(80),
  maintainAspectRatio: z.coerce.boolean().optional().default(true),
});

/**
 * Check and update IP quota
 * @returns true if IP has available quota, false if quota exceeded
 */
const checkIPQuota = (ip: string): boolean => {
  // In a production environment, this should be persisted in a database
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let ipQuota = ipQuotas.get(ip);

  // If quota doesn't exist or is from a previous day, reset
  if (!ipQuota || ipQuota.resetAt < today) {
    ipQuota = {
      count: 0,
      resetAt: today,
    };
  }

  // Check if quota has been exceeded
  if (ipQuota.count >= DAILY_QUOTA_PER_IP) {
    return false;
  }

  // Update counter
  ipQuota.count += 1;
  ipQuotas.set(ip, ipQuota);

  return true;
};

/**
 * Converts images according to specified options and returns a ZIP
 */
export const convertImages = async (req: Request, res: Response): Promise<void> => {
  // List of ALL temporary files generated in this request
  const allTempFiles: string[] = [];
  let zipPath: string | undefined;
  let processedImages: ConversionResult[] = [];

  try {
    if (!req.files || !Array.isArray(req.files)) {
      throw new AppError('No images uploaded', 400);
    }

    // Check maximum number of files
    if (req.files.length > MAX_FILES_PER_REQUEST) {
      throw new AppError(
        `Maximum number of files exceeded. Maximum allowed: ${MAX_FILES_PER_REQUEST}`,
        400
      );
    }

    // Get client IP
    const clientIP = req.ip || 'unknown';

    // Check IP quota
    if (!checkIPQuota(clientIP)) {
      logger.warn(
        {
          ip: clientIP,
          action: 'QUOTA_EXCEEDED',
          limit: DAILY_QUOTA_PER_IP,
          userAgent: req.headers['user-agent'] || 'unknown',
        },
        'Attempt to exceed daily quota'
      );

      throw new AppError(
        `You have exceeded your daily processing quota (${DAILY_QUOTA_PER_IP} images)`,
        429,
        { code: 'QUOTA_EXCEEDED' }
      );
    }

    // Validate conversion options
    const validationResult = conversionOptionsSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError('Invalid conversion options', 400, {
        code: 'VALIDATION_ERROR',
        details: validationResult.error.format(),
      });
    }

    // Validated conversion options
    const options: ConversionOptions = {
      format: validationResult.data.format,
      width: validationResult.data.width,
      height: validationResult.data.height,
      quality: validationResult.data.quality,
      maintainAspectRatio: validationResult.data.maintainAspectRatio,
    };
    logger.info({ options }, 'Conversion options validated');

    // Add original files to global cleanup list
    req.files.forEach(file => {
      allTempFiles.push(file.path);
    });

    // Process each uploaded image
    logger.info({ numFiles: req.files.length }, 'Starting image processing');
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

    // Add processed images to global cleanup list
    processedImages.forEach(img => {
      allTempFiles.push(img.path);
    });

    logger.info({ numProcessed: processedImages.length }, 'Image processing completed');

    // Create ZIP name based on timestamp and random identifier
    const zipFileName = `converted_images_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Create ZIP with processed images
    logger.info({ zipFileName }, 'Starting ZIP file creation');
    zipPath = await createZipFromImages(processedImages, zipFileName);
    logger.info({ zipPath }, 'ZIP file created successfully');

    // Add ZIP to global cleanup list
    allTempFiles.push(zipPath);

    // --- Immediate Cleanup of Originals and Processed ---
    logger.debug('Cleaning up original and processed files...');
    // Delete original files
    req.files.forEach(file => {
      safelyDeleteFile(file.path);
    });
    // Delete individual processed images
    processedImages.forEach(img => {
      safelyDeleteFile(img.path);
    });
    logger.debug('Immediate cleanup completed.');
    // ------------------------------------------------------

    // Return URL to download the ZIP
    const zipUrl = `/temp/output/${path.basename(zipPath)}`;
    logger.info({ zipUrl }, 'ZIP URL generated for response');

    // Log usage for audit with logger.info
    logger.info(
      {
        ip: clientIP,
        action: 'IMAGE_CONVERSION_SUCCESS',
        numImages: req.files.length,
        format: options.format,
        userAgent: req.headers['user-agent'] || 'unknown',
        zipFile: path.basename(zipPath),
      },
      'Image conversion completed successfully'
    );

    // Prepare response
    const responseData = {
      success: true,
      message: 'Images converted successfully',
      zipUrl,
      images: processedImages.map(img => ({
        originalName: path.basename(img.path),
        format: img.format,
        width: img.width,
        height: img.height,
      })),
    };

    // Send response
    logger.info({ responseData }, 'Sending successful response to client');
    res.json(responseData);

    // Configure DELAYED deletion ONLY for the ZIP file
    logger.debug({ zipFile: zipPath }, `Scheduling delayed cleanup for: ${zipPath}`);
    cleanTempFiles([zipPath]); // Only the ZIP
  } catch (error: unknown) {
    logger.error(
      {
        err: error,
        ip: req?.ip,
        userAgent: req?.headers ? req.headers['user-agent'] : undefined,
      },
      'Error during image conversion'
    );

    // IMMEDIATE cleanup of ALL temporary files in case of error
    logger.warn(
      { numFiles: allTempFiles.length },
      'Error detected. Starting immediate cleanup of all temporary files...'
    );
    allTempFiles.forEach(filePath => {
      safelyDeleteFile(filePath);
    });
    logger.warn('Error cleanup completed.');

    // Send error response
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
      // Generic error
      res.status(500).json({
        success: false,
        error: {
          message: 'Error processing images',
          details: error instanceof Error ? error.message : 'Unknown generic error',
        },
      });
    }
  }
};

/**
 * Returns available image formats
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

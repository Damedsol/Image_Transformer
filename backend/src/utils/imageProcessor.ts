import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { ConversionOptions, ImageFile, ConversionResult } from './types.js';
import { AppError } from './apiError.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './logger.js';

// Create equivalents to __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Configure Sharp limits based on environment variables
const sharpConcurrency = parseInt(process.env.SHARP_CONCURRENCY || '1');
// Configure Sharp with memory limits
sharp.cache(false); // Disable cache to avoid memory leaks
sharp.concurrency(sharpConcurrency); // Limit concurrent processing
sharp.simd(false); // Disable SIMD acceleration to reduce memory usage

// Get maximum dimension limits
const MAX_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || '4000');
const MAX_HEIGHT = parseInt(process.env.MAX_IMAGE_HEIGHT || '4000');
const MAX_DIMENSIONS = MAX_WIDTH * MAX_HEIGHT;
const MAX_ZIP_SIZE = parseInt(process.env.MAX_ZIP_SIZE || '25000000');
const IMAGE_PROCESSING_TIMEOUT = parseInt(process.env.IMAGE_PROCESSING_TIMEOUT || '30') * 1000;

// Check and create directory for processed files
const tempDir = path.join(__dirname, '../../temp');
const outputDir = path.join(tempDir, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Verifies that a path is within the allowed directory
 */
const ensurePathIsWithinBoundary = (filePath: string, allowedDirectory: string): boolean => {
  const normalizedPath = path.normalize(filePath);
  const normalizedAllowedDir = path.normalize(allowedDirectory);

  return normalizedPath.startsWith(normalizedAllowedDir);
};

/**
 * Processes an image with Sharp according to specified options
 * with resource limit handling
 */
export const processImage = async (
  imageFile: ImageFile,
  options: ConversionOptions
): Promise<ConversionResult> => {
  logger.debug({ imageFile, options }, 'Starting processImage');
  // Verify that the path is within the allowed directory
  if (!ensurePathIsWithinBoundary(imageFile.path, tempDir)) {
    throw new AppError('File path not allowed', 403);
  }

  // Create a timer to limit processing time
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new AppError('Processing time exceeded', 408, { code: 'TIMEOUT_ERROR' }));
    }, IMAGE_PROCESSING_TIMEOUT);
  });

  try {
    logger.debug({ imagePath: imageFile.path }, 'Executing processImageWithLimits with timeout');
    // Race between processing and timeout
    const result = await Promise.race([processImageWithLimits(imageFile, options), timeoutPromise]);
    logger.debug({ result }, 'processImage completed successfully');
    return result;
  } catch (error) {
    logger.error({ err: error, imageFile }, 'Error in processImage');
    console.error('Error processing image:', error);

    // Check if it's a memory or resource error
    const errorMsg = (error as Error).message.toLowerCase();
    if (
      errorMsg.includes('memory') ||
      errorMsg.includes('allocation') ||
      errorMsg.includes('heap')
    ) {
      throw new AppError('Resource error processing image. The image might be too large.', 413, {
        code: 'RESOURCE_LIMIT_ERROR',
      });
    }

    throw new AppError(`Error processing image: ${(error as Error).message}`, 500);
  }
};

/**
 * Internal implementation of image processor with limit control
 */
const processImageWithLimits = async (
  imageFile: ImageFile,
  options: ConversionOptions
): Promise<ConversionResult> => {
  logger.debug({ imageFile, options }, 'Starting processImageWithLimits');
  // Verify that the path is within the allowed directory
  if (!ensurePathIsWithinBoundary(imageFile.path, tempDir)) {
    throw new AppError('File path not allowed', 403);
  }

  // Get original image information
  logger.debug({ imagePath: imageFile.path }, 'Getting original image metadata');
  const imageInfo = await sharp(imageFile.path, {
    limitInputPixels: MAX_DIMENSIONS, // Limit pixel size
    sequentialRead: true, // Lower memory usage for large images
  }).metadata();
  logger.debug({ imageInfo }, 'Metadata obtained');

  // Check maximum dimensions of original image (use ?. and ??)
  if (
    (imageInfo.width ?? 0) > MAX_WIDTH ||
    (imageInfo.height ?? 0) > MAX_HEIGHT ||
    (imageInfo.width ?? 0) * (imageInfo.height ?? 0) > MAX_DIMENSIONS
  ) {
    throw new AppError(`Image dimensions exceed allowed limit (${MAX_WIDTH}x${MAX_HEIGHT})`, 413, {
      code: 'DIMENSION_LIMIT_ERROR',
    });
  }

  // Prepare processing options
  let width = options.width;
  let height = options.height;

  // Validate requested dimensions
  if (width !== undefined && width > MAX_WIDTH) {
    width = MAX_WIDTH;
  }

  if (height !== undefined && height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
  }

  // If width or height is not specified, use original dimensions (use ?. and ??)
  if (width === undefined) {
    width = Math.min(imageInfo.width ?? MAX_WIDTH, MAX_WIDTH);
  }

  if (height === undefined) {
    height = Math.min(imageInfo.height ?? MAX_HEIGHT, MAX_HEIGHT);
  }

  // Maintain aspect ratio if specified (use ?. and checks)
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

  // Create name for processed file
  const fileNameWithoutExt = path.basename(
    imageFile.originalname, // originalname should be present
    path.extname(imageFile.originalname)
  );
  const outputFileName = `${fileNameWithoutExt}_${width ?? 'auto'}x${height ?? 'auto'}.${options.format}`;
  const outputPath = path.join(outputDir, outputFileName);

  // Verify that the output path is within the allowed directory
  if (!ensurePathIsWithinBoundary(outputPath, tempDir)) {
    throw new AppError('Output path not allowed', 403);
  }

  // Process image with Sharp
  logger.debug({ imagePath: imageFile.path }, 'Creating Sharp instance');
  const sharpInstance = sharp(imageFile.path, {
    failOnError: true,
    limitInputPixels: MAX_DIMENSIONS, // Limit pixel size
    sequentialRead: true, // Lower memory usage for large images
  });

  // Apply resizing if dimensions are specified
  if (width !== undefined || height !== undefined) {
    logger.debug({ resizeDims: { width, height } }, 'Applying resizing');
    sharpInstance.resize({
      width,
      height,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  // Determine quality based on original file size for optimization
  let quality = options.quality ?? 80; // Use ??
  let fileSizeMB = 0;
  try {
    const stats = fs.statSync(imageFile.path);
    fileSizeMB = stats.size / (1024 * 1024);
  } catch (statError) {
    console.warn(`Could not get file size for ${imageFile.path}:`, statError);
    // Continue with default quality if size cannot be obtained
  }

  // Dynamic quality adjustment based on size
  if (fileSizeMB > 4) {
    quality = Math.min(quality, 70); // Reduce quality for large files
  }

  // Apply format and quality options (options.format should be present)
  logger.debug({ quality, format: options.format }, 'Applying format and quality');
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
      // Default format
      sharpInstance.jpeg({ quality });
  }

  // Save processed image
  logger.debug({ outputPath }, 'Saving processed image to file');
  await sharpInstance.toFile(outputPath);
  logger.info({ outputPath }, 'Processed image saved successfully');

  // Get processed image information
  logger.debug({ outputPath }, 'Getting processed image metadata');
  const processedInfo = await sharp(outputPath).metadata();

  const result: ConversionResult = {
    path: outputPath,
    format: options.format,
    width: processedInfo.width ?? width ?? 0,
    height: processedInfo.height ?? height ?? 0,
  };
  logger.debug({ result }, 'processImageWithLimits completed successfully');
  return result;
};

/**
 * Creates a ZIP file with processed images and returns the ZIP path
 */
export const createZipFromImages = async (
  processedImages: ConversionResult[],
  zipFileName: string
): Promise<string> => {
  logger.info({ numFiles: processedImages.length, zipFileName }, 'Starting createZipFromImages');
  const zipPath = path.join(outputDir, `${zipFileName}.zip`);

  // Verify that the ZIP path is within the allowed directory
  if (!ensurePathIsWithinBoundary(zipPath, tempDir)) {
    throw new AppError('File path not allowed', 403);
  }

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression level
  });

  // Handle output stream errors
  output.on('error', err => {
    logger.error({ err, zipPath }, 'Error in writeStream when creating ZIP');
    // Consider if throwing AppError here is best or if already handled
    // throw new AppError('Error creating ZIP file', 500);
  });

  // Pipe output file to file
  archive.pipe(output);

  // Check total file size
  let totalSize = 0;
  logger.debug('Adding files to ZIP...');
  for (const image of processedImages) {
    // Verify that the path is within the allowed directory
    if (!ensurePathIsWithinBoundary(image.path, tempDir)) {
      throw new AppError('File path not allowed', 403);
    }

    const stats = fs.statSync(image.path);
    totalSize += stats.size;
    logger.debug({ file: image.path, size: stats.size }, 'Adding file to ZIP');

    // Check if size already exceeds configured limit
    if (totalSize > MAX_ZIP_SIZE) {
      throw new AppError(
        `Total image size exceeds allowed limit (${MAX_ZIP_SIZE / 1000000} MB)`,
        413,
        { code: 'ZIP_SIZE_LIMIT_ERROR' }
      );
    }

    const fileName = path.basename(image.path);
    archive.file(image.path, { name: fileName });
  }
  logger.debug({ totalSize }, 'All files added to ZIP descriptor');

  // Finalize file
  logger.debug('Finalizing ZIP file (writing to disk)...');
  await archive.finalize();
  logger.info({ zipPath, totalSize }, 'ZIP file finalized and written');

  // Promise resolves/rejects based on output stream events
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      logger.info({ zipPath }, 'ZIP stream closed, creation completed.');
      resolve(zipPath);
    });

    // Error is already handled with output.on('error', ...), but we add reject just in case
    archive.on('error', err => {
      logger.error({ err, zipPath }, 'Error in archiver during ZIP creation');
      reject(new AppError(`Error creating ZIP file: ${err.message}`, 500));
    });
  });
};

/**
 * Cleans temporary files after a specified time
 */
export const cleanTempFiles = (
  filePaths: string[],
  delayMs = parseInt(process.env.TEMP_FILES_CLEANUP_MS || '300000')
): void => {
  logger.debug({ files: filePaths, delayMs }, 'Scheduling temporary file cleanup');
  setTimeout(() => {
    filePaths.forEach(filePath => {
      logger.debug({ file: filePath }, 'Attempting scheduled file cleanup');
      // Verify that the file is still within the temporary directory
      if (ensurePathIsWithinBoundary(filePath, tempDir)) {
        try {
          // We use existsSync to simplify, since it's a cleanup operation
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, unlinkErr => {
              if (unlinkErr) {
                logger.warn(
                  { err: unlinkErr, file: filePath },
                  'Error removing scheduled temporary file'
                );
              } else {
                logger.info({ file: filePath }, 'Scheduled temporary file removed successfully');
              }
            });
          } else {
            logger.debug(
              { file: filePath },
              'Scheduled temporary file no longer exists, skipping removal'
            );
          }
        } catch (err) {
          logger.error({ err, file: filePath }, 'Unexpected error during scheduled file cleanup');
        }
      } else {
        logger.warn(
          { file: filePath },
          'Attempt to remove file outside temporary directory during scheduled cleanup'
        );
      }
    });
  }, delayMs);
};

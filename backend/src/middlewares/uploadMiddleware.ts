import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
// Eliminar importación no usada de sharp
import { fileURLToPath } from 'url';
// import { Request } from 'express';
import { AppError } from '../utils/apiError.js';
import logger from '../utils/logger.js'; // Importar logger

// Configuración para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorios necesarios
const tempDir = path.join(__dirname, '../../temp');
const uploadsDir = path.join(tempDir, 'uploads');
const outputDir = path.join(tempDir, 'output');

// Crear directorios si no existen
[tempDir, uploadsDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Función de sanitización del nombre de archivo
const sanitizeFileName = (filename: string): string => {
  // Eliminar caracteres especiales y espacios
  let sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_');

  // Truncar nombres muy largos
  if (sanitized.length > 100) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 90) + ext;
  }

  return sanitized;
};

// Generar nombre único para el archivo
const generateUniqueFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalname);
  const sanitizedName = sanitizeFileName(path.basename(originalname, ext));

  return `${sanitizedName}-${timestamp}-${randomString}${ext}`;
};

// Configurar el almacenamiento de multer
const storage = multer.diskStorage({
  destination: function (_req: Express.Request, _file: Express.Multer.File, cb) {
    logger.debug({ destinationDir: uploadsDir }, 'Determinando destino de subida');
    cb(null, uploadsDir);
  },
  filename: function (_req: Express.Request, file: Express.Multer.File, cb) {
    const uniqueFilename = generateUniqueFilename(file.originalname);
    logger.debug(
      { originalname: file.originalname, uniqueFilename },
      'Generando nombre de archivo único'
    );
    cb(null, uniqueFilename);
  },
});

// Validar tipos de archivos permitidos
const validateFileType = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  logger.debug(
    { filename: file.originalname, mimetype: file.mimetype },
    'Validando tipo de archivo'
  );
  // Lista de mimetypes permitidos
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Lista de extensiones permitidas
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const mimetype = file.mimetype.toLowerCase();
  const extension = path.extname(file.originalname).toLowerCase();

  // Verificar tanto el mimetype como la extensión
  if (allowedMimeTypes.includes(mimetype) && allowedExtensions.includes(extension)) {
    logger.debug(
      { filename: file.originalname },
      'Tipo de archivo válido, aceptando provisionalmente'
    );
    cb(null, true); // Aceptar provisionalmente
  } else {
    logger.warn({ filename: file.originalname, mimetype, extension }, 'Tipo de archivo rechazado');
    cb(new AppError(`Solo se permiten imágenes en formato ${allowedExtensions.join(', ')}`, 400));
  }
};

// Crear middleware de multer
export const upload = multer({
  storage,
  fileFilter: validateFileType,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB por defecto
    files: 10, // Máximo 10 archivos simultáneos
  },
});

// Función para eliminar archivos de forma segura
export const safelyDeleteFile = (filePath: string): boolean => {
  logger.debug({ file: filePath }, 'Intentando eliminar archivo de forma segura');
  try {
    // Verificar que el archivo existe
    if (fs.existsSync(filePath)) {
      // Verificar que el archivo está dentro de los directorios permitidos
      const normalizedPath = path.normalize(filePath);
      const isInTempDir = normalizedPath.startsWith(path.normalize(tempDir));

      if (!isInTempDir) {
        logger.error(
          { file: filePath },
          'Intento de eliminar archivo fuera del directorio temporal'
        );
        return false;
      }

      // Eliminar el archivo
      fs.unlinkSync(filePath);
      logger.info({ file: filePath }, 'Archivo eliminado exitosamente (safelyDeleteFile)');
      return true;
    }
    logger.warn({ file: filePath }, 'Archivo no encontrado para eliminar (safelyDeleteFile)');
    return false;
  } catch (error) {
    logger.error({ err: error, file: filePath }, 'Error en safelyDeleteFile');
    return false;
  }
};

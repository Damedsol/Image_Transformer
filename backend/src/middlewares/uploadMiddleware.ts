import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
// Eliminar importación no usada de sharp
import { fileURLToPath } from 'url';
// import { Request } from 'express';
import { AppError } from '../utils/apiError.js';

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
    cb(null, uploadsDir);
  },
  filename: function (_req: Express.Request, file: Express.Multer.File, cb) {
    cb(null, generateUniqueFilename(file.originalname));
  },
});

// Validar tipos de archivos permitidos
const validateFileType = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Lista de mimetypes permitidos
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Lista de extensiones permitidas
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const mimetype = file.mimetype.toLowerCase();
  const extension = path.extname(file.originalname).toLowerCase();

  // Verificar tanto el mimetype como la extensión
  if (allowedMimeTypes.includes(mimetype) && allowedExtensions.includes(extension)) {
    // No podemos validar contenido de forma asíncrona aquí de forma fiable
    // La validación de contenido real debería hacerse después de que multer complete la subida
    // Este es un punto a mejorar: validar después de la subida, no durante el filtro
    cb(null, true); // Aceptar provisionalmente
  } else {
    // Rechazar si el tipo MIME o la extensión no son válidos
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
  try {
    // Verificar que el archivo existe
    if (fs.existsSync(filePath)) {
      // Verificar que el archivo está dentro de los directorios permitidos
      const normalizedPath = path.normalize(filePath);
      const isInTempDir = normalizedPath.startsWith(path.normalize(tempDir));

      if (!isInTempDir) {
        console.error(`Intento de eliminar archivo fuera del directorio temporal: ${filePath}`);
        return false;
      }

      // Eliminar el archivo
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error al eliminar archivo ${filePath}:`, error);
    return false;
  }
};

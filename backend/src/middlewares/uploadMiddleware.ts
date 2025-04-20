import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
// import { Request } from 'express';
import { AppError } from '../utils/apiError';

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
  destination: function (req: Express.Request, file: Express.Multer.File, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req: Express.Request, file: Express.Multer.File, cb) {
    cb(null, generateUniqueFilename(file.originalname));
  },
});

/**
 * Valida el contenido de la imagen usando sharp
 */
const validateImage = async (file: Express.Multer.File): Promise<boolean> => {
  try {
    // Verificar firma real del archivo usando sharp
    await sharp(file.path).metadata();
    return true;
  } catch (error) {
    // Si sharp no puede procesar el archivo, no es una imagen válida
    console.error(`Archivo inválido detectado: ${file.originalname}`);
    return false;
  }
};

// Validar tipos de archivos permitidos
const validateFileType = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Lista de mimetypes permitidos
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Lista de extensiones permitidas
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const mimetype = file.mimetype.toLowerCase();
  const extension = path.extname(file.originalname).toLowerCase();

  // Verificar tanto el mimetype como la extensión
  if (allowedMimeTypes.includes(mimetype) && allowedExtensions.includes(extension)) {
    // Realizar verificación adicional asíncrona para validar el contenido
    file.stream.on('end', async () => {
      try {
        const isValid = await validateImage(file);
        if (!isValid) {
          // No podemos rechazar el archivo aquí porque ya se guardó,
          // pero podemos eliminarlo si no es válido
          safelyDeleteFile(file.path);
          console.error(`Contenido de imagen inválido eliminado: ${file.originalname}`);
        }
      } catch (error) {
        safelyDeleteFile(file.path);
        console.error(`Error validando imagen: ${file.originalname}`, error);
      }
    });

    cb(null, true);
  } else {
    cb(new AppError(`Solo se permiten imágenes en formato JPEG, JPG, PNG y WEBP`, 400));
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

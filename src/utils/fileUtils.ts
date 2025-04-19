import { ImageFormat, ImageInfo, ConversionOptions } from '../types/image';

/**
 * Genera un ID único para cada imagen
 */
export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Convierte bytes a un formato legible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Crea una URL de vista previa para un archivo de imagen
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('No se pudo crear la vista previa de la imagen'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Obtiene las dimensiones de una imagen
 */
export const getImageDimensions = (
  imageUrl: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('No se pudieron obtener las dimensiones de la imagen'));
    };

    img.src = imageUrl;
  });
};

/**
 * Valida si un archivo es una imagen con formato soportado
 */
export const isValidImage = (file: File): boolean => {
  const validTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/avif',
  ];

  return validTypes.includes(file.type);
};

/**
 * Obtiene la extensión del archivo a partir del tipo MIME
 */
export const getExtensionFromMimeType = (mimeType: string): ImageFormat | null => {
  const mimeMap: Record<string, ImageFormat> = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpeg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/avif': 'avif',
  };

  return mimeMap[mimeType] || null;
};

/**
 * Prepara un archivo de imagen para su procesamiento
 */
export const prepareImageFile = async (file: File): Promise<ImageInfo> => {
  const preview = await createImagePreview(file);
  const dimensions = await getImageDimensions(preview);
  const extension = getExtensionFromMimeType(file.type) || 'png';

  const defaultOptions: ConversionOptions = {
    format: extension,
    quality: 90,
    maintainAspectRatio: true,
  };

  return {
    id: generateUniqueId(),
    file,
    preview,
    name: file.name,
    size: file.size,
    type: file.type,
    dimensions,
    conversionOptions: defaultOptions,
  };
};

/**
 * Simula el envío de archivos al servidor (solo para desarrollo frontend)
 */
export const simulateFileUpload = async (
  files: ImageInfo[],
  options: ConversionOptions,
): Promise<string[]> => {
  // Esto simula una llamada a API
  return new Promise((resolve) => {
    // Simulamos un retraso para imitar una petición real
    setTimeout(() => {
      // En un caso real, aquí se enviarían los archivos a un servidor
      const downloadUrls = files.map((file) => `download-${file.id}.${options.format}`);
      resolve(downloadUrls);
    }, 1500);
  });
};

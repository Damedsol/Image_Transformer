export interface ImageFile {
  path: string;
  originalname: string;
}

export interface ConversionOptions {
  format: ImageFormat;
  width?: number;
  height?: number;
  quality?: number;
  maintainAspectRatio?: boolean;
}

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';

export interface ConversionResult {
  path: string;
  format: ImageFormat;
  width: number;
  height: number;
}

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

// Interfaces para autenticación y seguridad
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export type UserRole = 'user' | 'admin';

export interface ApiKey {
  key: string;
  name: string;
  permissions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

// Interfaces para manejo de errores avanzado
export interface ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;
}

// Interfaz para respuestas API estandarizadas
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

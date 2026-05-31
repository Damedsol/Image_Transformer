/**
 * Tipos de formato de imagen soportados
 */
export type ImageFormat =
	| "png"
	| "jpeg"
	| "webp"
	| "gif"
	| "bmp"
	| "tiff"
	| "avif";

/**
 * Opciones de conversión de imagen
 */
export interface ConversionOptions {
	format: ImageFormat;
	quality?: number;
	width?: number;
	height?: number;
	maintainAspectRatio?: boolean;
}

/**
 * Información de la imagen para la vista previa y conversión
 */
export interface ImageInfo {
	id: string;
	file: File;
	preview: string;
	name: string;
	size: number;
	type: string;
	dimensions?: {
		width: number;
		height: number;
	};
	conversionOptions: ConversionOptions;
}

/**
 * Estado de la conversión
 */
export type ConversionStatus = "idle" | "processing" | "success" | "error";

/**
 * Respuesta del servidor (simulada para front-end)
 */
export interface ConversionResponse {
	status: ConversionStatus;
	message?: string;
	downloadUrl?: string;
	convertedFile?: Blob;
}

import { ConversionOptions, ImageInfo } from "../types/image";
import { logger, logApiError, logSuccess } from "./logger";

// Usar variable de entorno o fallback dinámico según el hostname
const API_URL: string =
	(import.meta.env.VITE_API_URL as string | undefined) ||
	(typeof window !== "undefined" &&
	(window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1")
		? "http://localhost:3001/api"
		: "/api");

/**
 * Interfaz para la respuesta de la API al convertir imágenes
 */
interface ConversionResponse {
	success: boolean;
	message: string;
	zipUrl: string;
	images: {
		originalName: string;
		format: string;
		width: number;
		height: number;
	}[];
}

/**
 * Envía imágenes al servidor para su conversión
 */
export const convertImagesAPI = async (
	files: ImageInfo[],
	options: ConversionOptions,
): Promise<string> => {
	try {
		// Crear un FormData para enviar los archivos
		const formData = new FormData();

		// Agregar cada imagen al FormData
		files.forEach((image) => {
			formData.append("images", image.file);
		});

		// Agregar las opciones de conversión
		formData.append("format", options.format);

		if (options.quality) {
			formData.append("quality", options.quality.toString());
		}

		if (options.width) {
			formData.append("width", options.width.toString());
		}

		if (options.height) {
			formData.append("height", options.height.toString());
		}

		if (options.maintainAspectRatio !== undefined) {
			formData.append(
				"maintainAspectRatio",
				options.maintainAspectRatio.toString(),
			);
		}

		logger.debug("Sending request to server:", {
			format: options.format,
			quality: options.quality,
			width: options.width,
			height: options.height,
			maintainAspectRatio: options.maintainAspectRatio,
			fileCount: files.length,
		});

		// Enviar la solicitud a la API
		const response = await fetch(`${API_URL}/convert`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			let errorMessage = "Failed to convert the images";
			try {
				const errorData = (await response.json()) as {
					error?: { message?: string };
					message?: string;
				};
				errorMessage =
					errorData.error?.message || errorData.message || errorMessage;
			} catch (parseError) {
				const error =
					parseError instanceof Error
						? parseError
						: new Error(String(parseError));
				logApiError("parseErrorResponse", error);
			}
			throw new Error(errorMessage);
		}

		const data = (await response.json()) as ConversionResponse;

		if (!data.success) {
			throw new Error(data.message || "Image conversion failed");
		}

		// Construir la URL completa para descargar el ZIP
		// Si data.zipUrl ya es una URL completa, usarla directamente; si no, construirla
		const baseUrl = API_URL.replace("/api", "");
		const zipDownloadUrl = data.zipUrl.startsWith("http")
			? data.zipUrl
			: `${baseUrl}${data.zipUrl}`;
		logSuccess("imageConversion", {
			zipUrl: zipDownloadUrl,
			imagesCount: data.images.length,
		});
		return zipDownloadUrl;
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logApiError("convertImages", err);
		throw err;
	}
};

/**
 * Obtiene los formatos de imagen disponibles desde la API
 */
export const getAvailableFormats = async (): Promise<string[]> => {
	try {
		const response = await fetch(`${API_URL}/formats`);

		if (!response.ok) {
			throw new Error("Failed to fetch the available formats");
		}

		const data = (await response.json()) as { formats?: string[] };
		return data.formats || [];
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logApiError("getFormats", err);
		return ["jpeg", "png", "webp", "avif", "gif"]; // Default formats
	}
};

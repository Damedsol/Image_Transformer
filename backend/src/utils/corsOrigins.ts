/**
 * CORS allowlist resolution, kept out of `index.ts` so it can be unit-tested
 * without booting the HTTP server.
 *
 * Development is PATTERN-based on purpose: the Vite dev server silently moves to
 * :5174, :5175… when :5173 is taken, and the browser then sends
 * `Origin: http://localhost:5174`. A closed list of exact ports made every
 * /api/convert call fail with "No 'Access-Control-Allow-Origin' header is
 * present". Production stays an exact-match list.
 */
import logger from "./logger.js";

/**
 * An allowed CORS origin: an exact origin (production) or a pattern (development).
 * The `cors` package matches arrays element by element, so both shapes coexist.
 */
export type CorsOrigin = string | RegExp;

/**
 * Development allowlist: loopback only, ANY port. The dev server picks an
 * arbitrary port when the default is busy, and it may be reached as localhost,
 * 127.0.0.1 or [::1]. Anchored so look-alikes (http://localhost.evil.com,
 * https://localhost:5174) never match.
 */
const DEV_ORIGINS: readonly RegExp[] = [
	/^http:\/\/localhost(:\d+)?$/,
	/^http:\/\/127\.0\.0\.1(:\d+)?$/,
	/^http:\/\/\[::1\](:\d+)?$/,
];

/**
 * Normalizes a URL, dropping any trailing slash. Returns null when the value is
 * empty or not an http(s) origin, so a misconfigured entry is dropped instead of
 * being allowed by accident.
 */
const normalizeOrigin = (origin: string): string | null => {
	const trimmed = origin.trim();
	if (!trimmed) return null;

	// Validar que sea una URL válida (http o https)
	try {
		const url = new URL(trimmed);
		// Solo permitir http y https
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return null;
		}
		// Retornar sin trailing slash
		return url.origin;
	} catch {
		return null;
	}
};

/**
 * Obtiene los orígenes CORS permitidos de forma segura
 */
export const getCorsOrigins = (): CorsOrigin[] => {
	if (process.env.NODE_ENV === "production") {
		const origins: string[] = [];

		// Agregar origen desde variable de entorno (para Netlify u otros servicios)
		if (process.env.CORS_ORIGIN) {
			const normalized = normalizeOrigin(process.env.CORS_ORIGIN);
			if (normalized) {
				origins.push(normalized);
			} else {
				logger.warn(
					{ corsOrigin: process.env.CORS_ORIGIN },
					"CORS_ORIGIN invalid, will be ignored",
				);
			}
		}

		// Agregar múltiples orígenes si están separados por coma
		if (process.env.CORS_ORIGINS) {
			const multipleOrigins = process.env.CORS_ORIGINS.split(",")
				.map(normalizeOrigin)
				.filter((origin): origin is string => origin !== null);
			origins.push(...multipleOrigins);
		}

		// En producción, solo permitir localhost si se especifica explícitamente
		// Esto es útil para testing local contra producción
		if (process.env.ALLOW_LOCALHOST === "true") {
			origins.push("http://localhost:5173", "http://localhost:3000");
		}

		// Si no hay orígenes configurados en producción, lanzar error
		if (origins.length === 0) {
			logger.error(
				"No CORS origins configured in production! This is a security risk.",
			);
			throw new Error(
				"CORS_ORIGIN must be configured in production environment for security reasons",
			);
		}

		return origins;
	}

	// Desarrollo: permitir cualquier puerto de loopback (el dev server de Vite
	// se mueve a 5174+ cuando 5173 está ocupado).
	return [...DEV_ORIGINS];
};

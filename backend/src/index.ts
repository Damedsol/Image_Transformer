import "./utils/loadEnv.js";
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { imageRoutes } from "./routes/imageRoutes.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import {
	configureHelmet,
	configureTrustProxy,
	apiRateLimiter,
	preventClickjacking,
	registerBodyMiddleware,
} from "./middlewares/securityMiddleware.js";
import logger from "./utils/logger.js";
import {
	cleanupStartup,
	schedulePeriodicCleanup,
} from "./utils/tempCleanup.js";
import { getCorsOrigins } from "./utils/corsOrigins.js";

// Calcular __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Behind Render/nginx: honor X-Forwarded-For so req.ip reflects the real
// client. Without this, all clients share one rate-limit/quota bucket.
// TRUST_PROXY_HOPS=0 when reachable directly (see securityMiddleware).
const trustProxyHops = configureTrustProxy(app);
const PORT = process.env.PORT || 3001;

// Temp file lifecycle: sweep orphaned files (lost TTL timers from crashes or
// restarts) at startup, then periodically remove any file older than the max
// age. The per-file TTL cleanup (cleanTempFiles) still handles the fast path.
const TEMP_CLEANUP_INTERVAL_MS = parseInt(
	process.env.TEMP_CLEANUP_INTERVAL_MS || "300000",
);
const TEMP_FILE_MAX_AGE_MS = parseInt(
	process.env.TEMP_FILE_MAX_AGE_MS || "1800000",
);
cleanupStartup();
schedulePeriodicCleanup(TEMP_CLEANUP_INTERVAL_MS, TEMP_FILE_MAX_AGE_MS);

// Configuración de CORS (DEBE ir antes de Helmet). Permitir cualquier puerto de
// loopback en desarrollo es deliberado: el dev server de Vite se mueve de puerto
// cuando 5173 está ocupado. Ver utils/corsOrigins.ts.
const corsOrigins = getCorsOrigins();
logger.info(
	{ corsOrigins, nodeEnv: process.env.NODE_ENV },
	"CORS origins configured",
);

app.use(
	cors({
		origin: corsOrigins,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type"],
		credentials: true,
		maxAge: 600, // 10 minutos
	}),
);

// Aplicar middlewares de seguridad (después de CORS)
app.use(configureHelmet());
app.use(preventClickjacking);

// Aplicar limitador de tasa a todas las rutas de la API
app.use("/api", apiRateLimiter);

// Pipeline de cuerpo en orden: parsear JSON antes de sanear (si el guard
// corre antes del parser, req.body es undefined y no sanea nada).
registerBodyMiddleware(app);

// Ruta para servir archivos temporales (solo archivos permitidos)
app.use("/temp", (req, res, next): void => {
	// Solo permitir archivos con extensiones seguras
	if (/\.(zip|jpe?g|png|webp|avif|gif)$/i.exec(req.path)) {
		// Usar express.static directamente aquí podría causar problemas si no se llama a next
		// Es mejor dejar que el siguiente middleware (si existe) lo maneje o enviar la respuesta directamente
		express.static(path.join(__dirname, "../temp"))(req, res, next);
		return; // Asegurarse de que no se ejecute el res.status(403) después
	}
	res.status(403).send("Access denied");
});

// Rutas API (aplicar límite de tasa específico si es necesario)
app.use("/api", imageRoutes);

// Ruta por defecto
app.get("/", (_req, res) => {
	res.json({ message: "Image Transformer API" });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, () => {
	logger.info(
		{ port: PORT, env: process.env.NODE_ENV, trustProxyHops },
		`Server started on port ${PORT}`,
	);
});

// Handle uncaught errors
process.on("uncaughtException", (error) => {
	logger.fatal(
		{ err: error },
		"Uncaught exception (uncaughtException). Exiting...",
	);
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error(
		{ reason, promise },
		"Unhandled promise rejection (unhandledRejection)",
	);
});

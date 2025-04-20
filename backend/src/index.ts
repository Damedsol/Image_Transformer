import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { imageRoutes } from './routes/imageRoutes';
import { errorHandler } from './middlewares/errorMiddleware';
import {
  configureHelmet,
  apiRateLimiter,
  protectFromPrototypePollution,
  preventClickjacking,
  validateContentType,
} from './middlewares/securityMiddleware';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Aplicar middlewares de seguridad
app.use(configureHelmet());
app.use(preventClickjacking);
app.use(protectFromPrototypePollution);

// Configuración de CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com'] // Dominio en producción
        : ['http://localhost:3000'], // Dominio local de desarrollo
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
    maxAge: 600, // 10 minutos
  })
);

// Aplicar limitador de tasa a todas las rutas de la API
app.use('/api', apiRateLimiter);

// Middleware para parsear JSON (con límite de tamaño)
app.use(express.json({ limit: '1mb' }));
app.use(validateContentType(['application/json', 'multipart/form-data']));

// Ruta para servir archivos temporales (solo archivos permitidos)
app.use('/temp', (req, res, next) => {
  // Solo permitir archivos con extensiones seguras
  if (req.path.match(/\.(zip|jpe?g|png|webp|avif|gif)$/i)) {
    return express.static(path.join(__dirname, '../temp'))(req, res, next);
  }
  res.status(403).send('Acceso denegado');
});

// Rutas API (aplicar límite de tasa específico si es necesario)
app.use('/api', imageRoutes);

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({ message: 'Image Transformer API' });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, () => {
  // console.log(`🔒 Servidor seguro corriendo en puerto ${PORT}`);
  // console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
});

// Manejar errores no capturados
process.on('uncaughtException', error => {
  console.error('Error no capturado:', error);
  // En producción, aquí podríamos notificar a un servicio de monitoreo
});

process.on('unhandledRejection', reason => {
  console.error('Promesa rechazada no manejada:', reason);
  // En producción, aquí podríamos notificar a un servicio de monitoreo
});

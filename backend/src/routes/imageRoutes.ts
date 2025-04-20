import express from 'express';
import { convertImages, getFormats } from '../controllers/imageController';
import { upload } from '../middlewares/uploadMiddleware';
import { errorHandler } from '../middlewares/errorMiddleware';

const router = express.Router();

// Rutas
router.post('/convert', upload.array('images', 10), convertImages);
router.get('/formats', getFormats);

// Middleware de manejo de errores
router.use(errorHandler);

export { router as imageRoutes };

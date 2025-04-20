import express from 'express';
import cors from 'cors';
import path from 'path';
import { imageRoutes } from './routes/imageRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta para servir archivos temporales
app.use('/temp', express.static(path.join(__dirname, '../temp')));

// Rutas API
app.use('/api', imageRoutes);

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({ message: 'Image Transformer API' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

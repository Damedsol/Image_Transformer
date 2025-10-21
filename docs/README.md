# 📚 Documentación - ImageTransformer

## 🎯 Descripción del Proyecto

**ImageTransformer** es una aplicación web para convertir imágenes entre diferentes formatos (JPEG, PNG, WebP, AVIF, GIF) con opciones de redimensionamiento y compresión.

## 🏗️ Arquitectura

- **Frontend**: TypeScript + Vite + Web Components
- **Backend**: Node.js + Express + Sharp
- **Contenedores**: Docker + Docker Compose
- **Logging**: Sistema condicional (desarrollo/producción)

## 📖 Documentación Disponible

### 🔧 Configuración y Despliegue

- [🐳 Docker Setup](DOCKER.md) - Configuración de contenedores y perfiles
- [📝 Sistema de Logging](LOGGING.md) - Logging condicional para desarrollo/producción

### 🚀 Inicio Rápido

#### Desarrollo

```bash
# Iniciar con logs detallados
docker-compose --profile development up
```

#### Producción

```bash
# Iniciar sin logs (optimizado)
docker-compose --profile production up
```

## 🎯 Características Principales

### ✅ **Funcionalidades**

- Conversión de imágenes entre formatos
- Redimensionamiento con mantenimiento de aspecto
- Compresión con control de calidad
- Descarga en archivo ZIP
- Interfaz accesible y responsive

### 🔒 **Seguridad**

- Rate limiting por IP
- Validación de tipos de archivo
- Límites de tamaño y cantidad
- Headers de seguridad (Helmet)
- CORS configurado

### 📊 **Rendimiento**

- Procesamiento asíncrono
- Limpieza automática de archivos temporales
- Logging condicional (cero overhead en producción)
- Compresión gzip

## 🛠️ Tecnologías

### Frontend

- **TypeScript** - Tipado estático
- **Vite** - Build tool moderno
- **Web Components** - Componentes reutilizables
- **CSS Grid/Flexbox** - Layout responsive

### Backend

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Sharp** - Procesamiento de imágenes
- **Pino** - Logger de alto rendimiento
- **Zod** - Validación de esquemas

### DevOps

- **Docker** - Contenedores
- **Docker Compose** - Orquestación
- **Nginx** - Servidor web (producción)
- **Multi-stage builds** - Optimización de imágenes

## 📁 Estructura del Proyecto

```
imageTransformer/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores de rutas
│   │   ├── middlewares/    # Middlewares de seguridad
│   │   ├── routes/         # Definición de rutas
│   │   └── utils/          # Utilidades (logger, procesamiento)
│   ├── logs/               # Logs de desarrollo
│   └── temp/               # Archivos temporales
├── src/                    # Frontend TypeScript
│   ├── components/         # Web Components
│   ├── utils/             # Utilidades frontend
│   └── types/             # Definiciones TypeScript
├── docs/                  # Documentación
├── docker/                # Configuración Docker
└── scripts/               # Scripts de utilidad
```

## 🔍 Monitoreo y Logs

### Desarrollo

- Logs detallados en `backend/logs/`
- Console logs en frontend
- Docker logs visibles

### Producción

- Sin logs (rendimiento optimizado)
- Sin archivos de log
- Docker logging deshabilitado

## 🚀 Comandos Útiles

```bash
# Desarrollo
docker-compose --profile development up
docker-compose --profile development down

# Producción
docker-compose --profile production up
docker-compose --profile production down

# Ver logs (solo desarrollo)
docker-compose logs -f backend-dev

# Limpiar contenedores
docker-compose down --volumes --remove-orphans
```

## 📞 Soporte

Para más información, consulta la documentación específica en cada archivo de la carpeta `docs/`.

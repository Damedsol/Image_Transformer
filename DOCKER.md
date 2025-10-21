# 🐳 Configuración Docker - Image Transformer

Este proyecto utiliza un sistema de perfiles de Docker Compose para manejar tanto el entorno de desarrollo como el de producción con un solo archivo `docker-compose.yml`.

## 📋 Perfiles Disponibles

### 🔧 Desarrollo (`development`)

- **Backend**: Puerto 3001 con hot-reload
- **Frontend**: Puerto 5173 con Vite dev server
- **Volúmenes**: Montados para desarrollo en tiempo real
- **Variables**: Configuradas para desarrollo

### 🚀 Producción (`production`)

- **Backend**: Puerto 3001 optimizado
- **Frontend**: Puerto 80 con Nginx
- **Volúmenes**: Solo para datos persistentes
- **Variables**: Configuradas para producción

## 🚀 Comandos Disponibles

### Desarrollo

```bash
# Iniciar en modo desarrollo
npm run docker:dev

# Detener servicios de desarrollo
npm run docker:dev:down

# Ver logs de desarrollo
npm run docker:dev:logs
```

### Producción

```bash
# Iniciar en modo producción (en segundo plano)
npm run docker:prod

# Detener servicios de producción
npm run docker:prod:down

# Ver logs de producción
npm run docker:prod:logs
```

### Comandos Generales

```bash
# Ver estado de todos los contenedores
npm run docker:status

# Ver logs de frontend
npm run docker:frontend:logs

# Ver logs de backend
npm run docker:backend:logs

# Limpiar sistema Docker
npm run docker:prune
```

## 🔧 Comandos Docker Compose Directos

### Desarrollo

```bash
# Iniciar perfil de desarrollo
docker compose --profile development up --build

# Detener perfil de desarrollo
docker compose --profile development down

# Ver logs
docker compose --profile development logs -f
```

### Producción

```bash
# Iniciar perfil de producción
docker compose --profile production up --build -d

# Detener perfil de producción
docker compose --profile production down

# Ver logs
docker compose --profile production logs -f
```

## 📁 Estructura de Servicios

### Desarrollo

- `backend-dev`: Backend con hot-reload
- `frontend-dev`: Frontend con Vite dev server

### Producción

- `backend-prod`: Backend optimizado
- `frontend-prod`: Frontend con Nginx

## 🌐 Puertos

### Desarrollo

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Producción

- **Frontend**: http://localhost:80
- **Backend**: http://localhost:3001

## 📦 Volúmenes

- `backend-temp`: Almacenamiento temporal para archivos procesados
- Volúmenes de desarrollo: Montados para hot-reload

## 🔄 Migración desde Configuración Anterior

Si tenías `docker-compose.prod.yml`, ya no es necesario. Ahora todo se maneja con perfiles:

```bash
# Antes
docker compose -f docker-compose.prod.yml up -d

# Ahora
docker compose --profile production up --build -d
```

## 🛠️ Troubleshooting

### Limpiar todo y empezar de nuevo

```bash
npm run docker:prune
docker compose down --volumes --remove-orphans
```

### Ver todos los servicios

```bash
docker compose ps
```

### Reconstruir imágenes

```bash
docker compose --profile development build --no-cache
docker compose --profile production build --no-cache
```

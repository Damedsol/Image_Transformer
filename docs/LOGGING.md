# 📝 Sistema de Logging - ImageTransformer

## 🎯 Objetivo

Este proyecto implementa un sistema de logging **condicional** que:

- ✅ **Desarrollo**: Genera logs detallados para debugging
- ❌ **Producción**: Completamente silencioso, sin logs

## 🏗️ Arquitectura

### Backend (Node.js + Pino)

- **Desarrollo**: Logs en archivos JSON en `backend/logs/`
- **Producción**: Logger silencioso (no genera archivos ni output)

### Frontend (TypeScript + Vite)

- **Desarrollo**: Console logs con colores y contexto
- **Producción**: Logger silencioso (no output en consola)

## 🔧 Configuración

### Variables de Entorno

```bash
# Desarrollo
NODE_ENV=development
LOG_LEVEL=debug

# Producción
NODE_ENV=production
LOG_LEVEL=silent
```

### Docker Profiles

```yaml
# Desarrollo
profiles: [development]
environment:
  - NODE_ENV=development
  - LOG_LEVEL=debug

# Producción
profiles: [production]
environment:
  - NODE_ENV=production
  - LOG_LEVEL=silent
logging:
  driver: "none"
```

## 📁 Estructura de Logs

```
backend/
├── logs/                    # Solo en desarrollo
│   ├── 25-12-24.log        # Archivos diarios
│   └── 26-12-24.log
└── src/utils/
    └── logger.ts           # Logger condicional
```

## 🚀 Uso

### Desarrollo

```bash
# Iniciar con logs
docker-compose --profile development up

# Ver logs en tiempo real
docker-compose logs -f backend-dev
```

### Producción

```bash
# Iniciar sin logs
docker-compose --profile production up

# Verificar que no hay logs
docker-compose logs backend-prod  # Debería estar vacío
```

## 🧹 Limpieza de Logs

### Automática

El sistema de logging condicional **no requiere limpieza manual**:

- **Desarrollo**: Los logs se generan solo cuando es necesario
- **Producción**: No se generan logs en absoluto
- **Docker**: Los volúmenes se manejan automáticamente

### Manual (solo si es necesario)

```bash
# Limpiar logs del backend (desarrollo)
rm -rf backend/logs/*

# Limpiar logs de Docker
rm -rf logs/*
```

## 🔍 Verificación

### Desarrollo

- ✅ Logs aparecen en `backend/logs/`
- ✅ Console logs en frontend
- ✅ Docker logs visibles

### Producción

- ❌ No hay archivos en `backend/logs/`
- ❌ No hay console logs
- ❌ Docker logging deshabilitado

## 📊 Tipos de Logs

### Backend

- `logger.info()` - Información general
- `logger.error()` - Errores
- `logger.warn()` - Advertencias
- `logger.debug()` - Debug detallado

### Frontend

- `logApiError()` - Errores de API
- `logSuccess()` - Operaciones exitosas
- `logger.debug()` - Debug general

## ⚡ Rendimiento

### Desarrollo

- Logs detallados para debugging
- Archivos de log para análisis
- Console output para desarrollo

### Producción

- **Cero overhead** de logging
- **Cero archivos** de log
- **Cero output** en consola
- Máximo rendimiento

## 🛡️ Seguridad

- **Desarrollo**: Logs pueden contener información sensible
- **Producción**: Completamente silencioso, sin exposición de datos
- **Docker**: Logging driver deshabilitado en producción

## 🔧 Troubleshooting

### Si aparecen logs en producción:

1. Verificar `NODE_ENV=production`
2. Verificar `LOG_LEVEL=silent`
3. Verificar Docker logging driver

### Si no aparecen logs en desarrollo:

1. Verificar `NODE_ENV=development`
2. Verificar `LOG_LEVEL=debug`
3. Verificar permisos de escritura en `backend/logs/`

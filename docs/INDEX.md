# 📋 Índice de Documentación

## 🎯 Documentación Principal

| Documento                | Descripción                            | Estado      |
| ------------------------ | -------------------------------------- | ----------- |
| [README.md](README.md)   | Documentación general del proyecto     | ✅ Completo |
| [DOCKER.md](DOCKER.md)   | Configuración de Docker y contenedores | ✅ Completo |
| [LOGGING.md](LOGGING.md) | Sistema de logging condicional         | ✅ Completo |

## 🏗️ Arquitectura

### Frontend

- **Framework**: TypeScript + Vite
- **Componentes**: Web Components nativos
- **Styling**: CSS Grid + Flexbox
- **Build**: Vite con optimizaciones

### Backend

- **Runtime**: Node.js + Express
- **Procesamiento**: Sharp para imágenes
- **Logging**: Pino (condicional)
- **Validación**: Zod para esquemas

### DevOps

- **Contenedores**: Docker + Docker Compose
- **Perfiles**: Desarrollo vs Producción
- **Servidor**: Nginx (producción)
- **Logging**: Condicional por entorno

## 🔧 Configuración

### Variables de Entorno

#### Desarrollo

```bash
NODE_ENV=development
LOG_LEVEL=debug
VITE_DEBUG=true
```

#### Producción

```bash
NODE_ENV=production
LOG_LEVEL=silent
```

### Docker Profiles

#### Desarrollo

```yaml
profiles: [development]
environment:
  - NODE_ENV=development
  - LOG_LEVEL=debug
volumes:
  - backend-logs:/app/logs
```

#### Producción

```yaml
profiles: [production]
environment:
  - NODE_ENV=production
  - LOG_LEVEL=silent
logging:
  driver: 'none'
```

## 🚀 Comandos de Despliegue

### Desarrollo

```bash
# Iniciar con logs
docker-compose --profile development up

# Ver logs en tiempo real
docker-compose logs -f backend-dev
```

### Producción

```bash
# Iniciar optimizado
docker-compose --profile production up

# Verificar sin logs
docker-compose logs backend-prod
```

## 📊 Monitoreo

### Desarrollo

- ✅ Logs en `backend/logs/`
- ✅ Console logs frontend
- ✅ Docker logs visibles

### Producción

- ❌ Sin logs (optimizado)
- ❌ Sin archivos de log
- ❌ Docker logging deshabilitado

## 🔍 Troubleshooting

### Problemas Comunes

1. **Logs aparecen en producción**
   - Verificar `NODE_ENV=production`
   - Verificar `LOG_LEVEL=silent`

2. **No aparecen logs en desarrollo**
   - Verificar `NODE_ENV=development`
   - Verificar permisos de escritura

3. **Docker no inicia**
   - Verificar perfiles correctos
   - Verificar variables de entorno

## 📁 Estructura de Documentación

```
docs/
├── README.md          # Documentación general
├── INDEX.md          # Este archivo (índice)
├── DOCKER.md         # Configuración Docker
└── LOGGING.md        # Sistema de logging
```

## 🎯 Próximos Pasos

- [ ] Documentación de API
- [ ] Guía de contribución
- [ ] Testing y CI/CD
- [ ] Monitoreo avanzado

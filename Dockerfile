FROM node:22.14.0-alpine AS base

WORKDIR /app

# Archivos necesarios para instalación
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Etapa de desarrollo
FROM base AS development
ENV NODE_ENV=development
RUN pnpm install
COPY . .
EXPOSE 5173
# Usar sh para mejor compatibilidad entre sistemas
CMD ["sh", "-c", "pnpm run dev -- --host 0.0.0.0"]

# Etapa de compilación para producción
FROM base AS builder
ENV NODE_ENV=production
RUN pnpm install --prod=false
COPY . .
RUN pnpm run build

# Etapa de producción con nginx para servir los estáticos
FROM nginx:stable-alpine AS production
# Copiar los archivos estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuración para que las rutas SPA funcionen correctamente
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 
FROM node:24-alpine@sha256:50c8e8ca1d27439048670df5883f32d57cf81cff6233222c893fd0d9884cbd81 AS base

WORKDIR /app

# Archivos necesarios para instalación
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar pnpm
RUN npm install -g pnpm@11.15.0

# Etapa de desarrollo
FROM base AS development
ENV NODE_ENV=development
RUN pnpm install --ignore-scripts
# No copiar los archivos al inicio, los montaremos como volumen
EXPOSE 5173
# Configurar Vite para observar cambios y habilitar HMR
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV FAST_REFRESH=true
ENV VITE_HMR=true
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0", "--watch"]

# Etapa de compilación para producción
FROM base AS builder
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=production
RUN pnpm install --ignore-scripts
COPY . .
RUN pnpm run build

# Etapa de producción con nginx para servir los estáticos
# Unprivileged nginx: runs as the `nginx` user (no root). It cannot bind
# ports < 1024, so the SPA is served on 8080 (see docker-compose.prod.yml).
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:daa17b944bac2b578e962da4c61ad72a59233b3c63abea17113acaf4e6b9aea4 AS production
# Copiar los archivos estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html
# Configuración para que las rutas SPA funcionen correctamente
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"] 
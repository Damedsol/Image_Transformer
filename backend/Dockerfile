FROM node:22.14.0-alpine AS base

WORKDIR /app

# Archivos necesarios para instalación
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Etapa de desarrollo
FROM base AS development
ENV NODE_ENV=development
# Instalar tsx globalmente para hot-reloading
RUN npm install -g tsx
RUN pnpm install
# No copiar los archivos al inicio, los montaremos como volumen
EXPOSE 3001
# Configurar tsx para mejor hot-reloading
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV TSX_DISABLE_CACHE=false
ENV DEBUG=tsx:*
# Usar tsx para ejecutar la aplicación
CMD ["tsx", "watch", "--clear-screen=false", "src/index.ts"]

# Etapa de compilación para producción
FROM base AS builder
ENV NODE_ENV=production
RUN pnpm install --prod=false
COPY . .
RUN pnpm run build

# Etapa de producción
FROM base AS production
ENV NODE_ENV=production
RUN pnpm install --prod
COPY --from=builder /app/dist ./dist
COPY .env.example ./.env
EXPOSE 3001
CMD ["sh", "-c", "node dist/index.js"] 
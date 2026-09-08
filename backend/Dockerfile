FROM node:24-alpine AS base

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.15.0

# Copy workspace dependency configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Development stage
FROM base AS development
ENV NODE_ENV=development
# Install tsx globally for development hot-reloading
RUN npm install -g tsx
RUN pnpm install --ignore-scripts
# Set working directory to the backend workspace package
WORKDIR /app/backend
EXPOSE 3001
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV TSX_DISABLE_CACHE=false
ENV DEBUG=tsx:*
CMD ["tsx", "watch", "--clear-screen=false", "src/index.ts"]

# Compilation/build stage for production
FROM base AS builder
ENV NODE_ENV=production
RUN pnpm install --ignore-scripts
COPY . .
WORKDIR /app/backend
RUN pnpm run build

# Production runtime stage
FROM base AS production
ENV NODE_ENV=production
RUN pnpm install --prod --ignore-scripts
COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/.env.example ./backend/.env
WORKDIR /app/backend
EXPOSE 3001
CMD ["sh", "-c", "node dist/index.js"]
# 📚 Documentation - ImageTransformer

## 🎯 Project Description

**ImageTransformer** is a high-performance web application for converting images between different formats (JPEG, PNG, WebP, AVIF, GIF) with resizing and compression options. Built as a pnpm monorepo workspace.

## 🏗️ Architecture

- **Frontend**: TypeScript (v6.0+) + Vite (v8.0+) + Native Web Components
- **Backend**: Node.js (v24.0.0+) + Express (v5.2.1) + Sharp (v0.34.5)
- **Quality Control**: Oxlint (lightning-fast linting) + Biome (unified formatter) + lint-filenames (strict file/directory naming check)
- **Git Hook Automation**: Husky + lint-staged + commitlint
- **Containers**: Docker + Docker Compose with individual environment-specific configurations
- **Logging**: Conditional, zero-overhead high-performance system (using Pino)

## 📖 Available Documentation

### 🔧 Configuration and Deployment

- [🐳 Docker Setup](DOCKER.md) — Container configuration and profiles
- [📝 Logging System](LOGGING.md) — Conditional logging for development/production
- [📋 Complete Index](INDEX.md) — Main index mapping all documentation

### 🚀 Quick Start

Ensure you have **Node.js >=24.0.0** and **pnpm >=11.0.0** installed.

#### Development (Local workspace)

```bash
# Install workspace dependencies
pnpm install

# Start frontend and backend concurrently
pnpm dev
# Or filter individually:
# Frontend dev: pnpm dev
# Backend dev:  pnpm --filter image-transformer-backend dev
```

#### Development (Docker containerized)

```bash
# Start development containers with active volumes and hot-reloading
docker compose up --build
```

#### Production (Docker containerized)

```bash
# Start production containers with optimized configurations in detached mode
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🎯 Main Features

### ✅ **Functionality**
- High-fidelity image conversion between multiple industry formats.
- Precision resizing with automatic aspect ratio maintenance.
- Compression and quality management per format.
- Batch processing and download of results in ZIP archives.
- Responsive, premium styling with accessibility (A11y) considerations.

### 🔒 **Security**
- Strict rate limiting per client IP.
- Rigid input mime-type and payload size validation via Zod.
- Secure request headers optimized using Helmet.
- Fully restricted CORS configurations.

### 📊 **Performance & Quality**
- Lightning-fast asynchronous queue processing.
- Automatic background cleanup of temporary uploads/results: per-request deletion on success/error, a startup sweep for files orphaned by crashes/restarts, and a periodic sweep for files older than `TEMP_FILE_MAX_AGE_MS` (default 30 min) — see [README → Temp File Lifecycle](../README.md).
- Code quality secured via Biome formatters, Oxlint linters, and Husky hooks.
- Conditional logging causing zero overhead in production.

---

## 🛠️ Tech Stack & Tooling

### Frontend
- **TypeScript** — High-precision static type checking.
- **Vite** — High-performance bundler and dev server.
- **Web Components** — Framework-less reusable UI structures.
- **CSS Grid/Flexbox** — Modern, fluid responsive layout.

### Backend
- **Node.js & Express** — Optimized backend server structure.
- **Sharp** — Fast image resizing, compression, and conversion engine.
- **Pino** — Low-overhead structured JSON logger.
- **Zod** — Rigid schemas validation.

### Quality Control & DevOps
- **Oxlint** — Extremely fast code linting replacing legacy ESLint.
- **Biome** — Consolidated workspace-wide formatter replacing Prettier.
- **lint-filenames** — Enforces strict kebab-case directory/file structures.
- **Docker & Compose** — Standardized microservices orchestration.

---

## 📁 Project Structure

```
imageTransformer/
├── .agents/                 # Agent harness (manifest, checkpoint, context, docs, skills)
├── .husky/                  # Automated Git hooks
├── backend/                 # Backend Workspace (pnpm workspace)
│   ├── src/                 # API controllers, routers, and processing layers
│   │   ├── controllers/     # Route endpoints controllers
│   │   ├── middlewares/     # Rate limiters & security hooks
│   │   ├── routes/          # Express route definitions
│   │   └── utils/           # Utilities (Pino logger, image engines)
│   ├── logs/                # Local development log files
│   └── temp/                # Target folder for active processing
├── src/                     # Frontend Application Source Code
│   ├── components/          # Reusable PascalCase Custom Web Components
│   ├── utils/               # Frontend camelCase utilities
│   ├── types/               # TypeScript specifications and contracts
│   └── main.ts              # Frontend main entry point
├── docs/                    # Architectural manuals and guides
├── docker/                  # Dockerfiles and environment recipes
├── biome.json               # Global Biome ruleset
└── pnpm-workspace.yaml      # Monorepo catalogs & hoisting configuration
```

---

## 🔍 Monitoring and Logs

### Development
- Comprehensive structured JSON logs captured in `backend/logs/`.
- Full stdout Docker console logs enabled.

### Production
- Logging engine silent (no log writes or CLI pollution).
- Container logging driver completely disabled (`driver: "none"`) to maximize performance.

---

## 🚀 Useful Docker Commands

```bash
# Start development containers with active volumes and hot-reloading
docker compose up --build

# Stop development containers
docker compose down

# Start production containers in background-detached mode
docker compose -f docker-compose.prod.yml up -d --build

# Stop production containers
docker compose -f docker-compose.prod.yml down

# Clean up local containers, volumes, and dangling resources
docker compose down --volumes --remove-orphans
docker compose -f docker-compose.prod.yml down --volumes --remove-orphans
docker system prune -f
```

---

## 📄 License & Contact

This project is licensed under the **Creative Commons Attribution 4.0 International (CC BY 4.0)**.  
👉 Developed by **Damedsol** · [GitHub](https://github.com/Damedsol/Image_Transformer) · [LinkedIn](https://www.linkedin.com/in/david-medina-soloza/).

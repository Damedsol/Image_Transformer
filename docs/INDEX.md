# 📋 Documentation Index - ImageTransformer

This index provides a comprehensive map of all available technical documentation, architectural specifications, and deployment guides inside the ImageTransformer workspace.

---

## 🎯 Core Documentation Map

| Resource / Guide | Scope & Purpose | Document Reference | Status |
| :--- | :--- | :--- | :--- |
| **General Overview** | High-level system descriptions, tech stack details, and project features. | [docs/README.md](README.md) | ✅ Complete |
| **Docker Orchestration** | Setup guidelines, deployment commands, environment configurations, and individual Compose files. | [docs/DOCKER.md](DOCKER.md) | ✅ Complete |
| **Logging Subsystem** | Conditional logging logic, performance optimization strategy, and environment configuration. | [docs/LOGGING.md](LOGGING.md) | ✅ Complete |

---

## 🏗️ High-Level Architecture Overview

### 1. Frontend Workspace
- **Language & Runtime:** TypeScript (v6.0+) with Vite (v8.0+) for superfast compilation and hot module replacement (HMR).
- **Core Design:** Reusable, standard-compliant vanilla **Web Components** built without framework dependencies or compile-time performance penalties.
- **Styling Paradigm:** Flexbox layouts, HSL color palettes, standard CSS variables (custom properties), and fluid layout grids.
- **Optimizations:** Advanced code-splitting and asset minification.

### 2. Backend Workspace
- **Language & Runtime:** Node.js (v24.0.0+) with Express (v5.2.1) structured inside a strict pnpm workspace environment.
- **Image Engine:** Native C++ **Sharp** (v0.34.5) library binding, allowing parallel high-speed compression, resizing, and format conversions.
- **Data Validation:** Schema modeling and type inference using **Zod** (v4.3.6) to guarantee request-payload structural integrity.
- **Logging Layer:** Zero-overhead structured logging using **Pino** (v10.3.1).

### 3. Quality Control (Tooling)
- **Fast Linting:** **Oxlint** replaces legacy ESLint, carrying out static analysis in milliseconds.
- **Code Formatter:** Unified workspace **Biome** ruleset providing immediate file formatting replacing Prettier.
- **File Structure:** **ls-lint** rules checking naming casing (directories in kebab-case, components in PascalCase, code in camelCase).
- **Quality Gates:** Automates Husky pre-commit triggers using lint-staged (running Oxlint and Biome on staged changes).

---

## 🔧 Environment Blueprint

The project determines runtime behavior dynamically based on system environment variables:

### Local Settings (`.env`)

#### Development
```bash
# Node Environment
NODE_ENV=development
# Debug Level
LOG_LEVEL=debug
```

#### Production
```bash
# Node Environment
NODE_ENV=production
# Debug Level (Silence stdout/stderr)
LOG_LEVEL=silent
```

### Docker Compose Environments Setup

#### Development Configuration
- **File:** `docker-compose.yml` (default)
- **Exposed Ports:** Frontend (`http://localhost:5173`), Backend (`http://localhost:3001`).
- **Volumes:** Dev code binding mapped locally for real-time compilation and hot-reloading.

#### Production Configuration
- **File:** `docker-compose.prod.yml`
- **Exposed Ports:** Nginx reverse proxy serving frontend (`http://localhost:8080`), Backend (`http://localhost:3001`).
- **Volumes:** Safe volume mount for temporary active image transformations; logging driver set to `json-file` with strict rotation limits.

---

## 🚀 Common Command Reference

### Docker Container Management

#### Development Deploy
```bash
# Compile and boot up development containers with live log streaming
docker compose up --build
```

#### Production Detached Deploy
```bash
# Boot up production microservices in background-detached mode
docker compose -f docker-compose.prod.yml up -d --build
```

#### Complete Cleanup
```bash
# Stop services and drop container instances, networks, and persistent volumes
docker compose down --volumes --remove-orphans
```

---

## 🔍 Trouble Shooting Shortcuts

1. **Log Output Appears in Production Container:**
   - Double-check that `NODE_ENV` is set to `production` and `LOG_LEVEL` is set to `silent`.
   - Ensure you deployed using the production compose file.

2. **File Casing Fails on Git Commits:**
   - Pre-commit hook blocks casing errors via `ls-lint`. Review filenames to make sure directories use kebab-case and components use PascalCase.

3. **Node/pnpm Compatibility Errors:**
   - Verify that your local execution engines comply with Node.js `>=24.0.0` and pnpm `>=11.0.0` declared inside the root `package.json` engines definitions.

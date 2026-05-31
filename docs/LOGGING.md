# 📝 Logging System - ImageTransformer

## 🎯 Architecture Objective

This project enforces a strict, **conditional** high-performance logging subsystem designed to maximize utility during development and completely eliminate overhead in production:

- ✅ **Development**: Verbose, detailed JSON and colored stdout logging for active debugging.
- ❌ **Production**: Completely silent. Generates zero log files, zero standard outputs (stdout/stderr), and disables Docker container-level logging engines to achieve peak request-throughput.

---

## 🏗️ Technical Implementation

### 1. Backend (Node.js + Pino)

We utilize **Pino**, an extremely fast, low-overhead JSON logging framework:
- **Development**: Writes structured JSON logs into `backend/logs/` categorized in daily `.log` files (e.g., `DD-MM-YY.log`). Developers can format these logs into human-readable colored stdout console lines using `pino-pretty` (via script).
- **Production**: Configured with `LOG_LEVEL=silent`. The logger converts its inner execution pipelines into no-op functions, completely bypassing CPU overhead and avoiding raw file write operations.

### 2. Frontend (TypeScript + Vite)

A custom frontend logging wrapper filters output using environment variables:
- **Development**: Outputs colored, context-specific logs within the browser console to track network requests, active conversions, and Web Component states.
- **Production**: Wraps the logger into empty declarations. Console outputs (`console.log`, `console.debug`) are fully blocked or stripped during build optimization.

---

## 🔧 Environment Variables & Configuration

The logging system is automatically configured based on runtime environment variables:

### 1. Local Configuration (`.env`)

#### Development

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

#### Production

```bash
NODE_ENV=production
LOG_LEVEL=silent
```

### 2. Docker Compose Environment Settings

Within `docker-compose.yml` (development) and `docker-compose.prod.yml` (production), environment variables and container options enforce conditional structures:

#### Development (`docker-compose.yml`)

```yaml
environment:
  - NODE_ENV=development
  - PORT=3001
  - LOG_LEVEL=debug
volumes:
  - ./backend:/app:delegated
  - backend-logs:/app/logs
```

#### Production (`docker-compose.prod.yml`)

```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - LOG_LEVEL=silent
# Enforce a strict log rotation policy for standard output errors
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 📁 Logging Directory Structure

```
backend/
├── logs/                      # Active folder in development only
│   ├── 31-05-26.log           # Daily-rotated structured logs
│   └── 01-06-26.log
└── src/
    └── utils/
        └── logger.ts          # Core conditional logger engine
```

---

## 🚀 Execution & Verification Commands

### 1. Local Workspace Development

Run development servers with active terminal console outputs:
```bash
# Start frontend
pnpm dev

# Start backend (outputs development logs)
pnpm --filter image-transformer-backend dev
```

### 2. Verified Detached Containers

#### Development Mode (Verbose Logs)
```bash
# Start development containers in detached mode
docker compose up -d

# Stream development container logs in real time
docker compose logs -f backend
```

#### Production Mode (Silent & High Speed)
```bash
# Start production containers in detached mode
docker compose -f docker-compose.prod.yml up -d

# Verify no custom logging activity (stdout stream should have no Pino logs)
docker compose -f docker-compose.prod.yml logs backend
```

---

## 🧹 Maintenance & Log Cleanup

### Automatic Cleanup
Due to the conditional architecture, **no manual log rotating or scheduling is required in production**:
- Production services write exactly `0 bytes` of logs.
- Temporary development files are automatically isolated in local ignored dirs.

### Manual Reset (Development environments)
If developers need to purge local debug caches manually:
```bash
# Remove all backend development daily logs
rm -rf backend/logs/*.log
```

---

## 🔍 Quality Verification Checklist

| Check Area | Development Expectation | Production Expectation |
| :--- | :--- | :--- |
| **Backend Logs Directory** | Active daily `.log` files written. | Directory remains empty or not created. |
| **Browser Console** | Contextual conversion actions printed. | Zero custom console logs visible. |
| **Docker Compose Output** | Container standard output printed. | `docker compose logs` outputs nothing. |
| **Performance Impact** | Trace/Debug logs active. | **Zero CPU/IO overhead** from logger. |

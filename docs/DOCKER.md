# 🐳 Docker Infrastructure - Image Transformer

This project utilizes a clean separation of concerns for containerized environments, dividing local development workflows and secure production VPS-aligned orchestration into two separate configurations.

---

## 🔧 Local Development Workflow

The default configuration is optimized for rapid feedback loops, real-time file synchronization, and hot-reloading.

### Service Architecture
- **Backend (`backend`)**: Express server running on port `3001` via `tsx watch` for hot-reloading.
- **Frontend (`frontend`)**: Vite dev server hosting files on port `5173` with network access.
- **Shared Volumes**: Source directories are mounted directly to allow instant workspace hot-reloads.

### Commands
```bash
# Build and start development environment in the foreground
docker compose up --build

# Run development containers in the background (detached mode)
docker compose up -d

# View live console logs
docker compose logs -f

# Shut down and clean up services
docker compose down
```

---

## 🚀 Production VPS Deployment Workflow

The production environment is structured to align with professional, secure, and resource-constrained infrastructures (such as private cloud VPS architectures).

### Architectural Guardrails
1. **Perimeter Security**: Services utilize strict process isolation with `security_opt: ["no-new-privileges:true"]` and running with init process integration (`init: true`).
2. **Resource Constraints**: Strict RAM limit ceilings are enforced to preserve host environment stability:
   - **Frontend**: Max memory `256M` (Nginx static content server).
   - **Backend**: Max memory `512M` (Express/Sharp image processor).
3. **Log Rotation**: Disk safety is guaranteed by imposing strict log rotations (`max-size: "10m"`, `max-file: "3"`).
4. **Proxy Network Integration**: Services are integrated into an external network (`proxy-net`) dynamically named through environment variables. This allows the application to attach directly to existing reverse proxies (e.g., Nginx Proxy Manager) without hardcoded references.
5. **Non-Root Runtimes**: no production process runs as root — the backend runs as `USER node` and the frontend runs the `nginx-unprivileged` image (USER `nginx`). All `FROM` lines are digest-pinned for reproducible base layers (see [ADR-0004](../.agents/docs/adr/0004-container-hardening.md)).

### Production Ports (read this before deploying)

Production publishes **no ports to the host** — services talk only inside the external proxy network. The port inventory is fixed (no `ports:` mappings, no overrides):

| Service | Container port | Reachable from | Notes |
| :--- | :--- | :--- | :--- |
| `backend` | `3001` | internal only (`proxy-net`) | Express API; also serves `/temp/` downloads |
| `frontend` | **`8080`** | internal only (`proxy-net`) | Unprivileged nginx cannot bind ports < 1024 |

> **Nginx Proxy Manager:** point this service's Proxy Host at `image-transformer-frontend:8080` (scheme `http`), **not** `:80`. Until NPM targets `:8080`, the site answers `502` after redeploying — update NPM in the same deploy window. Backend `:3001` is never a target (the frontend reverse-proxies `/api/` and `/temp/` internally).

| Environment Variable | Description | Default Value |
| :--- | :--- | :--- |
| `DOCKER_PROXY_NETWORK` | The external Docker network of your reverse proxy. | `proxy-tier` |

### Production Nginx Hardening

The production frontend image serves the compiled SPA through **Nginx** (`docker/nginx.conf`). Key runtime facts:

- **Config is build-time**: the application reads its configuration from build arguments (`VITE_API_URL`), **not** from runtime JS files. There is no need for `env.js`, `config.js`, `aws-*.js`, `credentials.js`, etc. — those are **scanner probes** and are rejected anyway.
- **Hardened defaults** enforced by `docker/nginx.conf`:
  - Blocks dotfiles, sensitive config files (`package.json`, `docker-compose*.yml`, `serverless.yml`, …), and unused tech endpoints (Swagger, Kibana, GraphQL).
  - Redirects the browser's default `/favicon.ico` probe to the real `/favicon.svg` (avoids the recurring 404).
  - Silently returns `404` for runtime-config scanner probes (`env.js`, `config.js`, `__env.js`, `credentials.js`, `sw.js`, `aws*.js`) without cluttering the error log.
  - Silently returns `404` for CMS/Vite-probe paths (`/wp-includes`, `/wp-content`, `/wp-admin`, `/media/system`, `/@fs`) without cluttering the error log.
  - Sends a strict `Content-Security-Policy` on every response (same-origin scripts/styles, images `self` + `data:`/`blob:` for previews, `frame-ancestors 'none'`) as defense-in-depth for DOM-XSS.
- The `/api/` and `/temp/` paths are reverse-proxied to the backend container; the SPA fallback (`try_files … /index.html`) handles client routing.

### Commands
```bash
# Before launching, ensure your proxy network is created on the host (if not already existing)
# Example: docker network create proxy-tier

# Build and deploy the production stack in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# Inspect running production containers
docker compose -f docker-compose.prod.yml ps

# View production logging streams (optimized and rotated)
docker compose -f docker-compose.prod.yml logs -f

# Tear down the production stack safely
docker compose -f docker-compose.prod.yml down
```

---

## 📦 Shared Data Persistence

- **Development only — `backend-temp`**: mounted inside the backend container for transient image operations (the dev backend runs as root, so volume ownership is a non-issue).
- **Production: ephemeral container storage, no volume.** `backend/temp/` holds only uploads/ZIPs with a 5-minute TTL (see [Temporary File Lifecycle](../README.md#temporary-file-lifecycle)), so persistence buys nothing — and a root-owned named volume would break the non-root (`USER node`) runtime. On redeploy, any not-yet-downloaded ZIP is lost by design.

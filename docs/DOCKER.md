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

### Production Environment Variables

You can configure the deployment settings by exposing these variables in the environment or specifying them in a root `.env` file:

| Environment Variable | Description | Default Value |
| :--- | :--- | :--- |
| `BACKEND_PORT` | Port to map the Express backend API on the host. | `3001` |
| `FRONTEND_PORT` | Port to map the Nginx frontend static server on the host. | `8080` |
| `DOCKER_PROXY_NETWORK` | The external Docker network of your reverse proxy. | `proxy-tier` |

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

The stack defines a persistent local volume:
- **`backend-temp`**: Mounted inside the backend Express container to handle safe storage and automatic cleanup of transient image operations.

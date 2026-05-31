# 🐳 Docker Configuration - Image Transformer

This project utilizes the **Docker Compose profiles** system to orchestrate both development and production microservices configurations under a single, unified `docker-compose.yml` environment.

---

## 📋 Available Profiles & Services

### 🔧 Development Profile (`development`)

Standardized for real-time development workflows with hot-reloading:
- **Backend Service (`backend-dev`)**: Express server running on port `3001` via `tsx watch` for automatic hot-reloading.
- **Frontend Service (`frontend-dev`)**: Vite dev server hosting files on port `5173` with network exposure.
- **Shared Volumes**: Code directory mapped into containers for real-time synch and instant updates.
- **Development Environment**: Local environment variables tuned for debugging and verbose logging levels.

### 🚀 Production Profile (`production`)

Highly optimized for peak performance and minimal resource overhead:
- **Backend Service (`backend-prod`)**: Optimized Express compilation on port `3001` with background temporary file garbage collection.
- **Frontend Service (`frontend-prod`)**: Bundled static resources served directly via an optimized **Nginx** reverse proxy on port `80`.
- **Zero Logging overhead**: Logging level silent (stdout disabled, no files generated, container-level logging driver explicitly muted).
- **Persistent Volumes**: Restricted only to core shared data folders for temporary processing.

---

## 🚀 Orchestration Commands (Docker Compose)

All container orchestration must be run through standard `docker compose` CLI commands.

### 1. Development Lifecycle

Start the development profile, capturing live logs and mounting workspaces:
```bash
# Start and compile development containers
docker compose --profile development up --build

# Run development containers in the background (detached mode)
docker compose --profile development up -d

# View live stream logs for development containers
docker compose --profile development logs -f

# Terminate and cleanup development services
docker compose --profile development down
```

### 2. Production Lifecycle

Deploy optimized builds into production configuration:
```bash
# Compile and start production services (detached mode)
docker compose --profile production up --build -d

# View production logging streams (silent by design)
docker compose --profile production logs -f

# Terminate and clean up production containers
docker compose --profile production down
```

### 3. Maintenance & Troubleshooting

```bash
# Check running containers state across all profiles
docker compose ps

# Inspect raw logs for a specific service
docker compose logs -f backend-dev
docker compose logs -f frontend-prod

# Completely wipe containers, persistent volumes, and orphaned networks
docker compose down --volumes --remove-orphans

# Prune system cache and dangling images
docker system prune -a --volumes -f

# Force-rebuild image caches without reusing layer histories
docker compose --profile development build --no-cache
docker compose --profile production build --no-cache
```

---

## 🌐 Service Connectivity & Ports

| Environment | Service | Exposed URL / Port | Internal Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | Frontend | [http://localhost:5173](http://localhost:5173) | 5173 | Hot-reloading Vite web interface. |
| **Development** | Backend | [http://localhost:3001](http://localhost:3001) | 3001 | Express API in debug mode. |
| **Production** | Frontend | [http://localhost:80](http://localhost:80) | 80 | Premium Nginx static files server. |
| **Production** | Backend | [http://localhost:3001](http://localhost:3001) | 3001 | Express API in silent performance mode. |

---

## 📦 Volume Mounts Mapping

The container network provisions persistent directories to isolate files:
- **`backend-temp`**: Volatile directory mounted inside the Express instances to temporarily cache processed image artifacts.
- **Development Workspaces**: Direct code mounts enabling real-time compiler triggers inside the virtual containers without manual rebuild steps.

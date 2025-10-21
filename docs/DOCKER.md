# 🐳 Docker Configuration - Image Transformer

This project uses a Docker Compose profiles system to handle both development and production environments with a single `docker-compose.yml` file.

## 📋 Available Profiles

### 🔧 Development (`development`)

- **Backend**: Port 3001 with hot-reload
- **Frontend**: Port 5173 with Vite dev server
- **Volumes**: Mounted for real-time development
- **Variables**: Configured for development

### 🚀 Production (`production`)

- **Backend**: Port 3001 optimized
- **Frontend**: Port 80 with Nginx
- **Volumes**: Only for persistent data
- **Variables**: Configured for production

## 🚀 Available Commands

### Development

```bash
# Start in development mode
npm run docker:dev

# Stop development services
npm run docker:dev:down

# View development logs
npm run docker:dev:logs
```

### Production

```bash
# Start in production mode (background)
npm run docker:prod

# Stop production services
npm run docker:prod:down

# View production logs
npm run docker:prod:logs
```

### General Commands

```bash
# View status of all containers
npm run docker:status

# View frontend logs
npm run docker:frontend:logs

# View backend logs
npm run docker:backend:logs

# Clean Docker system
npm run docker:prune
```

## 🔧 Direct Docker Compose Commands

### Development

```bash
# Start development profile
docker compose --profile development up --build

# Stop development profile
docker compose --profile development down

# View logs
docker compose --profile development logs -f
```

### Production

```bash
# Start production profile
docker compose --profile production up --build -d

# Stop production profile
docker compose --profile production down

# View logs
docker compose --profile production logs -f
```

## 📁 Service Structure

### Development

- `backend-dev`: Backend with hot-reload
- `frontend-dev`: Frontend with Vite dev server

### Production

- `backend-prod`: Optimized backend
- `frontend-prod`: Frontend with Nginx

## 🌐 Ports

### Development

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Production

- **Frontend**: http://localhost:80
- **Backend**: http://localhost:3001

## 📦 Volumes

- `backend-temp`: Temporary storage for processed files
- Development volumes: Mounted for hot-reload

## 🔄 Migration from Previous Configuration

If you had `docker-compose.prod.yml`, it's no longer needed. Now everything is handled with profiles:

```bash
# Before
docker compose -f docker-compose.prod.yml up -d

# Now
docker compose --profile production up --build -d
```

## 🛠️ Troubleshooting

### Clean everything and start fresh

```bash
npm run docker:prune
docker compose down --volumes --remove-orphans
```

### View all services

```bash
docker compose ps
```

### Rebuild images

```bash
docker compose --profile development build --no-cache
docker compose --profile production build --no-cache
```

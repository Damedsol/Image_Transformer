# 📚 Documentation - ImageTransformer

## 🎯 Project Description

**ImageTransformer** is a web application for converting images between different formats (JPEG, PNG, WebP, AVIF, GIF) with resizing and compression options.

## 🏗️ Architecture

- **Frontend**: TypeScript + Vite + Web Components
- **Backend**: Node.js + Express + Sharp
- **Containers**: Docker + Docker Compose
- **Logging**: Conditional system (development/production)

## 📖 Available Documentation

### 🔧 Configuration and Deployment

- [🐳 Docker Setup](DOCKER.md) - Container configuration and profiles
- [📝 Logging System](LOGGING.md) - Conditional logging for development/production

### 🚀 Quick Start

#### Development

```bash
# Start with detailed logs
docker-compose --profile development up
```

#### Production

```bash
# Start without logs (optimized)
docker-compose --profile production up
```

## 🎯 Main Features

### ✅ **Functionality**

- Image conversion between formats
- Resizing with aspect ratio maintenance
- Compression with quality control
- ZIP file download
- Accessible and responsive interface

### 🔒 **Security**

- IP rate limiting
- File type validation
- Size and quantity limits
- Security headers (Helmet)
- CORS configured

### 📊 **Performance**

- Asynchronous processing
- Automatic cleanup of temporary files
- Conditional logging (zero overhead in production)
- Gzip compression

## 🛠️ Technologies

### Frontend

- **TypeScript** - Static typing
- **Vite** - Modern build tool
- **Web Components** - Reusable components
- **CSS Grid/Flexbox** - Responsive layout

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Sharp** - Image processing
- **Pino** - High-performance logger
- **Zod** - Schema validation

### DevOps

- **Docker** - Containers
- **Docker Compose** - Orchestration
- **Nginx** - Web server (production)
- **Multi-stage builds** - Image optimization

## 📁 Project Structure

```
imageTransformer/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middlewares/    # Security middlewares
│   │   ├── routes/         # Route definitions
│   │   └── utils/          # Utilities (logger, processing)
│   ├── logs/               # Development logs
│   └── temp/               # Temporary files
├── src/                    # TypeScript Frontend
│   ├── components/         # Web Components
│   ├── utils/             # Frontend utilities
│   └── types/             # TypeScript definitions
├── docs/                  # Documentation
├── docker/                # Docker configuration
└── scripts/               # Utility scripts
```

## 🔍 Monitoring and Logs

### Development

- Detailed logs in `backend/logs/`
- Console logs in frontend
- Docker logs visible

### Production

- No logs (optimized performance)
- No log files
- Docker logging disabled

## 🚀 Useful Commands

```bash
# Development
docker-compose --profile development up
docker-compose --profile development down

# Production
docker-compose --profile production up
docker-compose --profile production down

# View logs (development only)
docker-compose logs -f backend-dev

# Clean containers
docker-compose down --volumes --remove-orphans
```

## 📞 Support

For more information, check the specific documentation in each file in the `docs/` folder.

# 📝 Logging System - ImageTransformer

## 🎯 Objective

This project implements a **conditional** logging system that:

- ✅ **Development**: Generates detailed logs for debugging
- ❌ **Production**: Completely silent, no logs

## 🏗️ Architecture

### Backend (Node.js + Pino)

- **Development**: JSON logs in `backend/logs/`
- **Production**: Silent logger (no files or output generated)

### Frontend (TypeScript + Vite)

- **Development**: Console logs with colors and context
- **Production**: Silent logger (no console output)

## 🔧 Configuration

### Environment Variables

```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug

# Production
NODE_ENV=production
LOG_LEVEL=silent
```

### Docker Profiles

```yaml
# Development
profiles: [development]
environment:
  - NODE_ENV=development
  - LOG_LEVEL=debug

# Production
profiles: [production]
environment:
  - NODE_ENV=production
  - LOG_LEVEL=silent
logging:
  driver: "none"
```

## 📁 Log Structure

```
backend/
├── logs/                    # Only in development
│   ├── 25-12-24.log        # Daily files
│   └── 26-12-24.log
└── src/utils/
    └── logger.ts           # Conditional logger
```

## 🚀 Usage

### Development

```bash
# Start with logs
docker-compose --profile development up

# View logs in real time
docker-compose logs -f backend-dev
```

### Production

```bash
# Start without logs
docker-compose --profile production up

# Verify no logs
docker-compose logs backend-prod  # Should be empty
```

## 🧹 Log Cleanup

### Automatic

The conditional logging system **does not require manual cleanup**:

- **Development**: Logs are generated only when needed
- **Production**: No logs are generated at all
- **Docker**: Volumes are managed automatically

### Manual (only if necessary)

```bash
# Clean backend logs (development)
rm -rf backend/logs/*

# Clean Docker logs
rm -rf logs/*
```

## 🔍 Verification

### Development

- ✅ Logs appear in `backend/logs/`
- ✅ Console logs in frontend
- ✅ Docker logs visible

### Production

- ❌ No files in `backend/logs/`
- ❌ No console logs
- ❌ Docker logging disabled

## 📊 Log Types

### Backend

- `logger.info()` - General information
- `logger.error()` - Errors
- `logger.warn()` - Warnings
- `logger.debug()` - Detailed debug

### Frontend

- `logApiError()` - API errors
- `logSuccess()` - Successful operations
- `logger.debug()` - General debug

## ⚡ Performance

### Development

- Detailed logs for debugging
- Log files for analysis
- Console output for development

### Production

- **Zero overhead** from logging
- **Zero log files**
- **Zero console output**
- Maximum performance

## 🛡️ Security

- **Development**: Logs may contain sensitive information
- **Production**: Completely silent, no data exposure
- **Docker**: Logging driver disabled in production

## 🔧 Troubleshooting

### If logs appear in production:

1. Check `NODE_ENV=production`
2. Check `LOG_LEVEL=silent`
3. Check Docker logging driver

### If logs don't appear in development:

1. Check `NODE_ENV=development`
2. Check `LOG_LEVEL=debug`
3. Check write permissions in `backend/logs/`

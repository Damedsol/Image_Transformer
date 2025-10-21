# 📋 Documentation Index

## 🎯 Main Documentation

| Document                 | Description                        | Status      |
| ------------------------ | ---------------------------------- | ----------- |
| [README.md](README.md)   | General project documentation      | ✅ Complete |
| [DOCKER.md](DOCKER.md)   | Docker and container configuration | ✅ Complete |
| [LOGGING.md](LOGGING.md) | Conditional logging system         | ✅ Complete |

## 🏗️ Architecture

### Frontend

- **Framework**: TypeScript + Vite
- **Components**: Native Web Components
- **Styling**: CSS Grid + Flexbox
- **Build**: Vite with optimizations

### Backend

- **Runtime**: Node.js + Express
- **Processing**: Sharp for images
- **Logging**: Pino (conditional)
- **Validation**: Zod for schemas

### DevOps

- **Containers**: Docker + Docker Compose
- **Profiles**: Development vs Production
- **Server**: Nginx (production)
- **Logging**: Conditional by environment

## 🔧 Configuration

### Environment Variables

#### Development

```bash
NODE_ENV=development
LOG_LEVEL=debug
VITE_DEBUG=true
```

#### Production

```bash
NODE_ENV=production
LOG_LEVEL=silent
```

### Docker Profiles

#### Development

```yaml
profiles: [development]
environment:
  - NODE_ENV=development
  - LOG_LEVEL=debug
volumes:
  - backend-logs:/app/logs
```

#### Production

```yaml
profiles: [production]
environment:
  - NODE_ENV=production
  - LOG_LEVEL=silent
logging:
  driver: 'none'
```

## 🚀 Deployment Commands

### Development

```bash
# Start with logs
docker-compose --profile development up

# View logs in real time
docker-compose logs -f backend-dev
```

### Production

```bash
# Start optimized
docker-compose --profile production up

# Verify no logs
docker-compose logs backend-prod
```

## 📊 Monitoring

### Development

- ✅ Logs in `backend/logs/`
- ✅ Frontend console logs
- ✅ Docker logs visible

### Production

- ❌ No logs (optimized)
- ❌ No log files
- ❌ Docker logging disabled

## 🔍 Troubleshooting

### Common Issues

1. **Logs appear in production**
   - Check `NODE_ENV=production`
   - Check `LOG_LEVEL=silent`

2. **Logs don't appear in development**
   - Check `NODE_ENV=development`
   - Check write permissions

3. **Docker doesn't start**
   - Check correct profiles
   - Check environment variables

## 📁 Documentation Structure

```
docs/
├── README.md          # General documentation
├── INDEX.md          # This file (index)
├── DOCKER.md         # Docker configuration
└── LOGGING.md        # Logging system
```

## 🎯 Next Steps

- [ ] API documentation
- [ ] Contribution guide
- [ ] Testing and CI/CD
- [ ] Advanced monitoring

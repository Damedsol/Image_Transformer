# ImageTransformer 🖼️

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-username/imageTransformer)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.1-646CFF?logo=vite)](https://vitejs.dev/)
[![Sharp](https://img.shields.io/badge/Sharp-0.33.2-green?logo=sharp)](https://sharp.pixelplumbing.com/)
[![Express](https://img.shields.io/badge/Express-4.18.2-black?logo=express)](https://expressjs.com/)

## Description

A powerful web application for transforming and converting images between different formats. Built with TypeScript, Vite for the frontend, and Express with Sharp for the backend processing. This application offers a modern interface for efficient image manipulation.

## Main Features

- ✅ Convert images between multiple formats (JPG, PNG, WebP, AVIF, GIF)
- 🔍 Resize and optimize images
- 🎨 Apply filters and transformations
- 💾 Batch processing for multiple images
- 📦 Download results as individual files or ZIP archives
- 📱 Responsive design with accessibility features
- 🌓 Light and dark theme support

## Technologies Used

### Frontend

- TypeScript
- Vite
- Web Components (vanilla)
- CSS Custom Properties

### Backend

- Node.js
- Express
- Sharp (image processing)
- Multer (file uploads)
- Archiver (ZIP creation)
- Zod (validation)

### DevOps & Tools

- Docker & Docker Compose
- ESLint + Prettier
- Husky (Git hooks)
- Commitlint

## Requirements

- Node.js (version 16 or higher)
- PNPM
- Docker & Docker Compose (optional, for containerized deployment)

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/your-username/imageTransformer.git
   cd imageTransformer
   ```

2. Install dependencies:

   ```bash
   pnpm install
   cd backend
   pnpm install
   cd ..
   ```

3. Configure the environment:

   ```bash
   # Copy and edit the environment variables
   cp backend/.env.example backend/.env
   ```

4. Start the development services:

   ```bash
   # Using Docker (Development)
   docker compose --profile development up --build

   # Using Docker (Production)
   docker compose --profile production up --build -d

   # Without Docker
   pnpm dev
   ```

5. Open your browser at:
   - **Development**: [http://localhost:5173](http://localhost:5173)
   - **Production**: [http://localhost:80](http://localhost:80)

## How to Use the Application

1. Drag and drop images into the upload area or use the file selector
2. Select the desired output format and transformation options
3. Apply transformations to preview the results
4. Click "Convert" to process the images
5. Download the transformed images individually or as a ZIP archive

## Project Structure

```
/
├── src/               # Frontend source code
│   ├── components/    # Web components
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── assets/        # Static assets
│   └── main.ts        # Entry point
├── backend/           # Backend API
│   ├── src/           # Backend source code
│   └── temp/          # Temporary storage for processed files
├── docker/            # Docker configuration files
└── public/            # Static files
```

## Available Scripts

- `pnpm dev`: Start the frontend development server
- `pnpm build`: Build the frontend for production
- `pnpm preview`: Preview the built frontend version
- `pnpm lint`: Run ESLint to check the code
- `pnpm format`: Format the code with Prettier
- `pnpm lint:fix`: Run lint with automatic fixing

## Docker Commands

### Development

```bash
# Start development environment
docker compose --profile development up --build

# Stop development environment
docker compose --profile development down

# View development logs
docker compose --profile development logs -f
```

### Production

```bash
# Start production environment
docker compose --profile production up --build -d

# Stop production environment
docker compose --profile production down

# View production logs
docker compose --profile production logs -f
```

### General Docker Commands

```bash
# View all containers
docker compose ps

# View logs for specific services
docker compose logs -f backend-dev backend-prod
docker compose logs -f frontend-dev frontend-prod

# Clean up Docker resources
docker system prune -f
```

## Docker Configuration

This project uses Docker Compose with profiles to manage both development and production environments:

### Profiles Available

- **`development`**: Hot-reload enabled, volumes mounted, ports 5173/3001
- **`production`**: Optimized build, Nginx frontend, ports 80/3001

### Services

- **Backend**: Node.js with Express and Sharp for image processing
- **Frontend**: Vite dev server (dev) or Nginx (prod)

### Volumes

- `backend-temp`: Persistent storage for processed files
- Development volumes: Mounted for hot-reload

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md).

## Development Workflow

This project follows conventional commits and uses Husky to enforce code quality through Git hooks:

- Pre-commit: Runs linting and formatting checks
- Commit-msg: Validates commit message format

## Contributing

If you want to contribute to this project:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/new-feature`)
3. Make your changes following the project's code conventions
4. Commit your changes using conventional commits (`git commit -m 'feat: add new feature'`)
5. Push your changes (`git push origin feature/new-feature`)
6. Open a Pull Request

## License

This project is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

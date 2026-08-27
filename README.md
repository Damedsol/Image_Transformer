# ImageTransformer 🖼️

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Version](https://img.shields.io/badge/version-1.3.2-blue.svg)](https://github.com/Damedsol/Image_Transformer)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Sharp](https://img.shields.io/badge/Sharp-0.34.5-green?logo=sharp)](https://sharp.pixelplumbing.com/)
[![Express](https://img.shields.io/badge/Express-5.2.1-black?logo=express)](https://expressjs.com/)

A powerful web application for transforming and converting images between different formats. Built as a high-performance monorepo using **pnpm workspace**, with TypeScript and Vite for the frontend, and Express with Sharp for backend image processing. This application offers a modern, accessible interface for efficient image manipulation.

---

## 🛠️ Technical Specifications & Stack

| Component / Layer | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Backend Core** | Node.js (Express) | v5.2.1 | Lightweight server structure with robust routing and middleware. |
| **Image Engine** | Sharp | v0.34.5 | High-performance Node.js image processing library. |
| **Frontend Core** | TypeScript & Vite | v6.0 / v8.0 | Superfast frontend dev server and production builder with modern ES2022+ features. |
| **UI Components** | Vanilla Web Components | ES2022 | Modular, reusable UI components built without framework overhead. |
| **Quality Control** | Oxlint & Biome | Latest | Lightning-fast linting and formatting replacing ESLint & Prettier. |
| **File Structure** | ls-lint | Latest | Validates directory and file naming structures. |
| **DevOps / Tools** | Docker & Compose | Latest | Standardized containerization for development and production environments. |

---

## ⚙️ Installation & Configuration

Follow these steps to deploy your local development environment quickly:

### Prerequisites

Ensure you have installed:
- **Node.js** (v24.0.0 or higher)
- **pnpm** (v11.0.0 or higher)
- **Docker & Docker Compose** (Optional, for containerized environments)

### Deployment Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Damedsol/Image_Transformer.git
   cd Image_Transformer
   ```

2. **Configure Environment Variables**
   Copy the example environment template file and update it with your local credentials and configurations:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Install Workspace Dependencies**
   Since this project uses a unified **pnpm workspace**, install all dependencies from the root directory:
   ```bash
   pnpm install
   ```

4. **Spin Up Optional Services (Docker Compose)**
   To run containerized services using Docker:
   ```bash
   # Start development containers with active volumes and hot-reloading
   docker compose up --build
   ```

---

## 🚀 Usage

Execute commands from the project root using `pnpm` to launch dev servers or run quality control checks:

### Development Servers

- **Frontend (Vite Dev Server):**
  ```bash
  pnpm dev
  ```
- **Backend (Express Watch mode):**
  ```bash
  pnpm --filter image-transformer-backend dev
  ```

### Production Build & Execution

- **Build Frontend and Backend:**
  ```bash
  pnpm build
  ```
- **Start Compiled Backend:**
  ```bash
  pnpm --filter image-transformer-backend start
  ```

### Common Quality Control Utilities

- **Code Formatting:** `pnpm format` (formats the entire workspace with Biome).
- **Linter & File Names Check:** `pnpm lint` (runs Oxlint for deep inspection and ls-lint for strict casing checks).
- **TypeScript Type Verification:** `pnpm type-check` (performs dry-run compilation using `tsc --noEmit`).

---

## 🗂️ Temporary File Lifecycle

Uploaded images and generated ZIPs live under `backend/temp/` (`uploads/` + `output/`) and are removed automatically so nothing accumulates on the server:

- **Per-request cleanup:** on any success or error, all uploaded originals and processed files are deleted immediately (`TEMP_FILES_CLEANUP_MS` only delays ZIP deletion to allow the download, default 5 min).
- **Startup sweep:** on boot, everything left in `temp/` from a previous session is removed (timers from a crashed/restarted process cannot run).
- **Periodic sweep:** a background interval deletes any file older than the max age, covering edge cases where the per-file timer was lost.

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `TEMP_FILES_CLEANUP_MS` | `300000` | Delay before a generated ZIP is deleted (download window). |
| `TEMP_CLEANUP_INTERVAL_MS` | `300000` | Interval of the periodic temp directory sweep. |
| `TEMP_FILE_MAX_AGE_MS` | `1800000` | Max age for a temp file before the periodic sweep removes it. |

---

## 📁 Project Structure

```
imageTransformer/
├── .agents/              # System agent configuration files and local tools
├── .gemini/              # Gemini CLI specific local configurations & templates
├── .husky/               # Git lifecycle hooks
├── backend/              # Node.js API Service (pnpm workspace package)
│   ├── src/              # Express controllers, routes, and processing logic
│   ├── temp/             # Temporary folder for active transformations
│   ├── package.json      # Backend-specific package configurations
│   └── context.md        # Local backend contextual memory
├── docs/                 # Detailed manuals and architectural documentations
├── public/               # Frontend static assets and configurations
├── src/                  # Frontend Application Source Code
│   ├── assets/           # Icons, images, and visual resources
│   ├── components/       # Custom Web Components (PascalCase)
│   ├── utils/            # Shared client utility functions (camelCase)
│   └── main.ts           # Frontend main application entry-point
├── biome.json            # Global unified Biome formatter configuration
├── pnpm-workspace.yaml   # Monorepo hoisting and overrides setup
├── context.md            # Root context and development memory log
└── README.md             # This documentation file
```

---

## 🏷️ UI & Components Style Guide (Badges & Icons)

This project promotes a clean, accessible standard for using visual indicators, badges, and icons.

### 1. HTML Structure for Icon Badges

To guarantee accessibility (A11y), ensure you hide decorative icons from screen readers using `aria-hidden="true"`, or add an explicit `aria-label` for standalone iconographic indicators.

```html
<!-- Status Badge with Icon and Text -->
<span class="badge badge-success">
  <span class="badge-icon" aria-hidden="true">✔</span>
  <span class="badge-text">ACTIVE</span>
</span>

<!-- Pure Iconographic Badge (Without visible text) -->
<span class="badge badge-warning" aria-label="Warning: Action Pending">
  <span class="badge-icon" aria-hidden="true">⚠</span>
</span>
```

### 2. Common CSS Classes

- `.badge`: Base layout structure (flexbox layout, padding, font sizing, border-radius).
- `.badge-success` / `.badge-error` / `.badge-warning` / `.badge-info`: Semantic color palette variants.
- `.badge-icon`: Padding and alignment for embedded glyphs.

---

## 📚 Technical Documentation Index

For in-depth architectural design, software flow charts, and logging behaviors, refer to the documents located in the [docs/](docs/) directory:

👉 **[📖 General Documentation](docs/README.md)** — Project overview, detailed architecture & specifications.  
👉 **[🐳 Docker Setup Guide](docs/DOCKER.md)** — Container environment setup, volumes, and deployment profiles.  
👉 **[📝 Logging Subsystem](docs/LOGGING.md)** — High-performance conditional logging using Pino.  
👉 **[📋 Complete Manual Index](docs/INDEX.md)** — Consolidated index and guide navigation.  

---

## 📄 License

This project is licensed under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**.  
👉 **[Read Full LICENSE.md](./LICENSE.md)**

---

## 🎨 Fonts & Third-Party Licenses

The bundled fonts and runtime dependencies are redistributed under their own licenses:

- **Figtree** — SIL Open Font License 1.1 (`assets/fonts/Figtree/OFL.txt`)
- **IBM Plex Mono** — SIL Open Font License 1.1 (`assets/fonts/IBM_Plex_Mono/OFL.txt`)
- **Iconoir** — MIT (`assets/icons/` — vendored icon SVGs)
- **Express, Multer, Zod, Pino, Helmet, CORS, Archiver, express-rate-limit** — MIT
- **Sharp** — Apache-2.0
- **dotenv** — BSD-2-Clause

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the full list.

---

## 👤 Author

Developed with ❤️ by **Damedsol**:
- **GitHub:** [@Damedsol](https://github.com/Damedsol)
- **LinkedIn:** [David Medina Soloza](https://www.linkedin.com/in/david-medina-soloza/)

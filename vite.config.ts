/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		watch: {
			usePolling: true,
			interval: 300,
			ignored: ["node_modules/**", "dist/**"],
		},
		// Bind to localhost for local dev (hardens against Vite dev-server CVEs).
		// Docker dev overrides this via `--host 0.0.0.0` in docker-compose.yml.
		host: "localhost",
		hmr: {
			clientPort: 5173,
			host: "localhost",
			overlay: true,
		},
	},
	optimizeDeps: {
		force: false,
	},
	css: {
		devSourcemap: true,
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/__tests__/setup.ts"],
		include: [
			"src/__tests__/**/*.test.ts",
			"backend/src/__tests__/**/*.test.ts",
		],
		css: true,
	},
});

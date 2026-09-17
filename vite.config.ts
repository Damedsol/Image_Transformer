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
		// Fail loudly instead of drifting to 5174+: a silent port change also
		// invalidates the backend CORS allowlist.
		strictPort: true,
		// No `clientPort`: HMR must follow the port the server actually owns.
		// Pinning 5173 while this server ran on 5174 pointed the HMR socket at
		// another project's Vite instance ("WebSocket closed without opened").
		hmr: {
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

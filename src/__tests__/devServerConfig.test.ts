/**
 * Dev-server config guard (R3 of the dev-port-fallback cycle).
 *
 * R3 — Vite must fail loudly instead of silently moving to another port, and HMR
 *      must never pin a `clientPort` the HTTP server may not own. Pinning 5173
 *      while the server ran on 5174 pointed the HMR socket at *another project's*
 *      Vite instance: "[vite] failed to connect to websocket / WebSocket closed
 *      without opened". Silent drift also invalidates the backend CORS allowlist.
 */
import { describe, it, expect } from "vitest";
import config from "../../vite.config";

describe("R3 · vite dev server must not drift ports silently", () => {
	it("fails fast when the port is taken (strictPort)", () => {
		expect(config.server?.strictPort).toBe(true);
	});

	it("never pins HMR to a fixed clientPort (it must follow the server)", () => {
		const { hmr } = config.server ?? {};
		const clientPort =
			typeof hmr === "object" && hmr !== null ? hmr.clientPort : undefined;
		expect(clientPort).toBeUndefined();
	});

	it("keeps the localhost bind and polling watch that Docker dev relies on", () => {
		expect(config.server?.host).toBe("localhost");
		expect(config.server?.watch?.usePolling).toBe(true);
	});
});

/**
 * Tests for the hardened Content-Security-Policy in securityMiddleware.ts.
 * Regression (ses_fbb1 audit, LOW #8): the backend CSP must not allow
 * `'unsafe-inline'` scripts/styles and must not whitelist the
 * `https://*.onrender.com` wildcard in `connectSrc` — only exact origins.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildCspDirectives } from "../middlewares/securityMiddleware.js";

const ENV_KEYS = ["CORS_ORIGIN", "CORS_ORIGINS", "BACKEND_URL"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
	for (const key of ENV_KEYS) {
		savedEnv[key] = process.env[key];
		delete process.env[key];
	}
});

afterEach(() => {
	for (const key of ENV_KEYS) {
		if (savedEnv[key] === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = savedEnv[key];
		}
	}
});

describe("buildCspDirectives", () => {
	it("does not allow 'unsafe-inline' in scriptSrc", () => {
		const directives = buildCspDirectives();
		expect(directives.scriptSrc).not.toContain("'unsafe-inline'");
	});

	it("does not allow 'unsafe-inline' in styleSrc", () => {
		const directives = buildCspDirectives();
		expect(directives.styleSrc).not.toContain("'unsafe-inline'");
	});

	it("does not whitelist the *.onrender.com wildcard in connectSrc", () => {
		const directives = buildCspDirectives();
		const wildcards = (directives.connectSrc ?? []).filter((src) =>
			src.includes("*"),
		);
		expect(wildcards).toEqual([]);
	});

	it("includes the exact backend origin in connectSrc", () => {
		process.env.BACKEND_URL = "https://image-transformer-r99u.onrender.com";
		const directives = buildCspDirectives();
		expect(directives.connectSrc).toContain(
			"https://image-transformer-r99u.onrender.com",
		);
	});

	it("keeps defaultSrc locked to 'self'", () => {
		const directives = buildCspDirectives();
		expect(directives.defaultSrc).toEqual(["'self'"]);
	});

	it("falls back to the exact backend origin when no env is set", () => {
		const directives = buildCspDirectives();
		expect(directives.connectSrc).toContain(
			"https://image-transformer-r99u.onrender.com",
		);
		expect((directives.connectSrc ?? []).some((src) => src.includes("*"))).toBe(
			false,
		);
	});

	it("adds exact CORS origins to connectSrc without wildcards", () => {
		process.env.CORS_ORIGIN = "https://app.example.com/";
		process.env.CORS_ORIGINS = "https://a.example.com, https://b.example.com";
		const directives = buildCspDirectives();
		expect(directives.connectSrc).toContain("https://app.example.com");
		expect(directives.connectSrc).toContain("https://a.example.com");
		expect(directives.connectSrc).toContain("https://b.example.com");
	});
});

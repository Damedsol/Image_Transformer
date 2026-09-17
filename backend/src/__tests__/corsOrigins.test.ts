/**
 * Dev-origin guard (R1/R2 of the dev-port-fallback cycle).
 *
 * R1 — `pnpm dev` must survive a Vite port fallback. When :5173 is already taken
 *      (e.g. another project's dev server), Vite serves this app on :5174 and the
 *      browser's `Origin` changes to `http://localhost:5174`. The dev allowlist
 *      used to be a closed list of exact ports, so every call to
 *      /api/convert died as "No 'Access-Control-Allow-Origin' header is present".
 *      Development must accept ANY local port.
 *
 * R2 — the production allowlist must stay an exact-match list driven by
 *      CORS_ORIGIN / CORS_ORIGINS (plus the explicit ALLOW_LOCALHOST opt-in) and
 *      must keep throwing when nothing is configured. No pattern may leak there:
 *      a regex is only safe because dev-only.
 *
 * The assertions run the REAL `cors` middleware instead of re-implementing its
 * matching rules, so a change in the shape of the allowlist (string vs RegExp)
 * cannot silently pass.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import cors from "cors";
import type { Request, Response } from "express";
import { getCorsOrigins, type CorsOrigin } from "../utils/corsOrigins.js";

const ENV_KEYS = [
	"NODE_ENV",
	"CORS_ORIGIN",
	"CORS_ORIGINS",
	"ALLOW_LOCALHOST",
] as const;
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

/**
 * Runs the real `cors` middleware for a single GET with the given Origin and
 * returns the response headers it set.
 */
const corsHeadersFor = (
	origins: CorsOrigin[] | string,
	origin: string,
): Record<string, string> => {
	const headers: Record<string, string> = {};
	const res = {
		setHeader: (name: string, value: string) => {
			headers[name.toLowerCase()] = String(value);
		},
		getHeader: (name: string) => headers[name.toLowerCase()],
	} as unknown as Response;
	const req = { method: "GET", headers: { origin } } as unknown as Request;

	cors({
		origin: origins,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type"],
		credentials: true,
	})(req, res, () => {});

	return headers;
};

const ACAO = "access-control-allow-origin";

describe("R1 · development accepts any local port", () => {
	beforeEach(() => {
		process.env.NODE_ENV = "development";
	});

	it("allows the port Vite actually fell back to (5174) and neighbours", () => {
		const origins = getCorsOrigins();
		for (const origin of [
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5180",
			"http://localhost",
		]) {
			expect(corsHeadersFor(origins, origin)[ACAO], origin).toBe(origin);
		}
	});

	it("allows loopback alternatives (127.0.0.1, ::1) on any port", () => {
		const origins = getCorsOrigins();
		for (const origin of [
			"http://127.0.0.1:5174",
			"http://[::1]:5174",
			"http://localhost:3000",
		]) {
			expect(corsHeadersFor(origins, origin)[ACAO], origin).toBe(origin);
		}
	});

	it("still refuses remote and look-alike origins", () => {
		const origins = getCorsOrigins();
		for (const origin of [
			"https://evil.example.com",
			"http://localhost.evil.com",
			"http://localhost:5174.evil.com",
			"https://localhost:5174",
		]) {
			expect(corsHeadersFor(origins, origin)[ACAO], origin).toBeUndefined();
		}
	});
});

describe("R2 · production allowlist stays exact and explicit", () => {
	beforeEach(() => {
		process.env.NODE_ENV = "production";
	});

	it("normalizes CORS_ORIGIN (trailing slash) into a single exact origin", () => {
		process.env.CORS_ORIGIN = "https://app.example.com/";
		const origins = getCorsOrigins();

		expect(origins).toEqual(["https://app.example.com"]);
		expect(corsHeadersFor(origins, "https://app.example.com")[ACAO]).toBe(
			"https://app.example.com",
		);
	});

	it("accepts the comma-separated CORS_ORIGINS list and drops invalid entries", () => {
		process.env.CORS_ORIGINS =
			"https://a.example.com, ftp://nope.example.com, not-a-url, https://b.example.com";
		expect(getCorsOrigins()).toEqual([
			"https://a.example.com",
			"https://b.example.com",
		]);
	});

	it("does not fall back to any local origin implicitly", () => {
		process.env.CORS_ORIGIN = "https://app.example.com";
		const origins = getCorsOrigins();
		expect(
			corsHeadersFor(origins, "http://localhost:5174")[ACAO],
		).toBeUndefined();
		expect(
			corsHeadersFor(origins, "https://app.example.com.evil.com")[ACAO],
		).toBeUndefined();
	});

	it("only adds localhost with the explicit ALLOW_LOCALHOST opt-in", () => {
		process.env.CORS_ORIGIN = "https://app.example.com";
		process.env.ALLOW_LOCALHOST = "true";
		const origins = getCorsOrigins();

		expect(origins).toContain("http://localhost:5173");
		expect(origins).toContain("http://localhost:3000");
		expect(origins.some((origin) => origin instanceof RegExp)).toBe(false);
	});

	it("throws when no origin is configured (fail loud, never open)", () => {
		expect(() => getCorsOrigins()).toThrow(/CORS_ORIGIN/);
	});
});

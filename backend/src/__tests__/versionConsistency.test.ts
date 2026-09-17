/**
 * Release-version guard (R1 of the 2026-09-17 version-bump cycle).
 *
 * A release must move EVERY carrier of the version: the root `package.json`
 * (source of truth), `backend/package.json`, the README badge, the two default
 * image tags in `docker-compose.prod.yml` and `.agents/project_manifest.yaml`.
 * Nothing checked that before, so a half-applied bump (typically the harness
 * manifest left behind) could ship silently — the 2.0.0 release commit f128550
 * only worked because a human remembered all of them.
 *
 * Zero dependencies: plain file reads plus regexes, so the guard costs nothing
 * to keep. `pnpm-lock.yaml` is deliberately NOT a carrier: pnpm stores no
 * version for workspace projects, so `preferFrozenLockfile` is unaffected.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = process.cwd();
const read = (relativePath: string): string =>
	fs.readFileSync(path.join(root, relativePath), "utf8");

type Carrier = {
	/** Human label used in failure messages. */
	label: string;
	file: string;
	/** First capture group must be the version. */
	pattern: RegExp;
};

/** Every place that carries the released version, except the source of truth. */
const CARRIERS: Carrier[] = [
	{
		label: "backend manifest",
		file: "backend/package.json",
		pattern: /"version":\s*"(\d+\.\d+\.\d+)"/,
	},
	{
		label: "README badge",
		file: "README.md",
		pattern: /badge\/version-(\d+\.\d+\.\d+)-/,
	},
	{
		label: "compose backend image default",
		file: "docker-compose.prod.yml",
		pattern: /BACKEND_IMAGE:-image-transformer-backend:(\d+\.\d+\.\d+)\}/,
	},
	{
		label: "compose frontend image default",
		file: "docker-compose.prod.yml",
		pattern: /FRONTEND_IMAGE:-image-transformer-frontend:(\d+\.\d+\.\d+)\}/,
	},
	{
		label: "harness manifest",
		file: ".agents/project_manifest.yaml",
		pattern: /^version:\s*"(\d+\.\d+\.\d+)"/m,
	},
];

/** Version declared by the root manifest — the single source of truth. */
const rootVersion = (JSON.parse(read("package.json")) as { version: string })
	.version;

const versionOf = (carrier: Carrier): string | null =>
	read(carrier.file).match(carrier.pattern)?.[1] ?? null;

/** `<file>: <actual>, expected <expected>` — one line per drifting carrier. */
const mismatchMessage = (
	carrier: Carrier,
	actual: string | null,
	expected: string,
): string => `${carrier.file}: ${actual ?? "no version"}, expected ${expected}`;

/**
 * Pure detector: returns one message per carrier whose version differs from
 * `expected` (or that carries no version at all).
 */
const findVersionMismatches = (
	expected: string,
	carriers: readonly Carrier[],
	lookup: (carrier: Carrier) => string | null = versionOf,
): string[] =>
	carriers
		.filter((carrier) => lookup(carrier) !== expected)
		.map((carrier) => mismatchMessage(carrier, lookup(carrier), expected));

describe("R1 · release version is consistent across every carrier", () => {
	it("declares a valid semver in the root manifest (source of truth)", () => {
		expect(rootVersion).toMatch(/^\d+\.\d+\.\d+$/);
	});

	it("carries a version in every carrier, at the root version", () => {
		for (const carrier of CARRIERS) {
			expect(versionOf(carrier), `${carrier.label} (${carrier.file})`).toMatch(
				/^\d+\.\d+\.\d+$/,
			);
		}
		expect(findVersionMismatches(rootVersion, CARRIERS)).toEqual([]);
	});

	it("detects a half-applied bump (detector is not vacuous)", () => {
		const mismatches = findVersionMismatches("2.1.0", CARRIERS, () => "2.0.0");
		expect(mismatches).toHaveLength(CARRIERS.length);
		expect(mismatches[0]).toContain("expected 2.1.0");
	});

	it("detects exactly the left-behind carrier", () => {
		const lookup = (carrier: Carrier): string | null =>
			carrier.label === "harness manifest" ? "2.0.0" : "2.1.0";
		const mismatches = findVersionMismatches("2.1.0", CARRIERS, lookup);
		expect(mismatches).toHaveLength(1);
		expect(mismatches[0]).toContain(".agents/project_manifest.yaml");
	});
});

/**
 * Dependency-automation config guard.
 *
 * Regression IDs (review_2026-09-17_dependency-refresh-dependabot.md):
 *
 *  - ID-01: an `ignore` entry in `.github/dependabot.yml` whose package is NOT a
 *    direct dependency is a no-op for version updates (Dependabot only bumps
 *    manifest-declared dependencies) but still applies to SECURITY updates,
 *    which patch the lockfile — where transitive packages live. Its only
 *    possible effect is therefore to silently skip a security-update PR, while
 *    the version ceiling is already enforced by the pnpm-workspace.yaml
 *    overrides and the manifest ranges.
 *
 *  - ID-03: with `resolutionMode: lowest-direct`, a range override whose floor
 *    sits BELOW an exact manifest pin wins and silently holds the older
 *    version. Real bug: `zod` was declared `4.6.2` but resolved to `4.4.3`
 *    because the mirroring override read `>=4.4.0`.
 *
 * Zero dependencies: both YAML files are parsed with a tiny line-oriented
 * reader instead of pulling a YAML package into the tree.
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = process.cwd();
const read = (relativePath: string): string =>
	fs.readFileSync(path.join(root, relativePath), "utf8");

// ── minimal parsers ──────────────────────────────────────────────────────────

const SCALAR =
	/^\s+(?:"([^"]+)"|'([^']+)'|([\w@/.-]+)):\s*(?:"([^"]+)"|'([^']+)'|(\S+))\s*$/;

const unquote = (line: string, key: string): string =>
	line.match(new RegExp(`${key}:\\s*"?([^"\\s]+)"?`))?.[1] ?? "";

/** Reads the `overrides:` block of pnpm-workspace.yaml. */
const parseOverrides = (yaml: string): Record<string, string> => {
	const out: Record<string, string> = {};
	let inBlock = false;
	for (const line of yaml.split("\n")) {
		if (/^overrides:\s*$/.test(line)) {
			inBlock = true;
			continue;
		}
		if (!inBlock) continue;
		if (/^\S/.test(line)) break; // next top-level key
		const m = line.match(SCALAR);
		if (!m) continue;
		out[m[1] ?? m[2] ?? m[3]] = m[4] ?? m[5] ?? m[6];
	}
	return out;
};

/** `"minimatch@^10.0.0"` → `minimatch`; `"@types/node@1.0.0"` → `@types/node`. */
const overrideName = (key: string): string => {
	const at = key.indexOf("@", key.startsWith("@") ? 1 : 0);
	return at === -1 ? key : key.slice(0, at);
};

/** Lowest version mentioned by a range spec (`">=4.6.2"` → `4.6.2`). */
const floorOf = (spec: string): string | null =>
	spec.match(/\d+\.\d+\.\d+/)?.[0] ?? null;

const compare = (a: string, b: string): number => {
	const [x1, y1, z1] = a.split(".").map(Number);
	const [x2, y2, z2] = b.split(".").map(Number);
	return x1 - x2 || y1 - y2 || z1 - z2;
};

/**
 * ID-03 checker: every override that mirrors a DIRECT dependency must keep a
 * floor at or above that dependency's exact pin, otherwise the pin is ignored.
 */
const findFloorViolations = (
	overrides: Record<string, string>,
	pins: Record<string, string>,
): string[] => {
	const violations: string[] = [];
	for (const [key, spec] of Object.entries(overrides)) {
		const pin = pins[overrideName(key)];
		if (!pin || !/^\d+\.\d+\.\d+$/.test(pin)) continue; // not an exact direct pin
		const floor = floorOf(spec);
		if (floor && compare(floor, pin) < 0) {
			violations.push(
				`${overrideName(key)}: override "${spec}" (floor ${floor}) < pin ${pin}`,
			);
		}
	}
	return violations;
};

/** Exact pins declared by a manifest (range/catalog specs are skipped). */
const exactPinsOf = (pkgJson: string): Record<string, string> => {
	const pkg = JSON.parse(pkgJson) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const all = { ...pkg.dependencies, ...pkg.devDependencies };
	const pins: Record<string, string> = {};
	for (const [name, spec] of Object.entries(all)) {
		if (/^\d+\.\d+\.\d+$/.test(spec)) pins[name] = spec;
	}
	return pins;
};

type UpdateEntry = {
	ecosystem: string;
	dirs: string[];
	interval: string;
	ignored: string[];
	groupedTypes: string[];
};

/** Line-oriented reader for the structures we actually rely on in dependabot.yml. */
const parseDependabot = (yaml: string) => {
	const lines = yaml.split("\n");
	const starts: number[] = [];
	lines.forEach((line, i) => {
		if (/^\s*-\s*package-ecosystem:/.test(line)) starts.push(i);
	});
	const entries: UpdateEntry[] = starts.map((start, index) => {
		const block = lines.slice(start, starts[index + 1] ?? lines.length);
		const text = block.join("\n");
		const dirs = [
			...text.matchAll(/^\s*-\s*"(\/[^"]*)"\s*$/gm),
			...text.matchAll(/^\s*directory:\s*"([^"]+)"/gm),
		].map((m) => m[1]);
		return {
			ecosystem: unquote(block[0], "package-ecosystem"),
			dirs,
			interval: unquote(text, "interval"),
			ignored: [
				...text.matchAll(/^\s*-\s*dependency-name:\s*"?([^"\s]+)"?/gm),
			].map((m) => m[1]),
			groupedTypes: [...text.matchAll(/update-types:\s*\[([^\]]*)\]/g)].flatMap(
				(m) => m[1].split(",").map((t) => t.trim().replace(/"/g, "")),
			),
		};
	});
	return { version: Number(unquote(yaml, "version")), entries };
};

// ── fixtures ─────────────────────────────────────────────────────────────────

const overrides = parseOverrides(read("pnpm-workspace.yaml"));
const allManifestDeps = new Set([
	...Object.keys(
		(JSON.parse(read("package.json")) as { devDependencies?: object })
			.devDependencies ?? {},
	),
	...Object.keys(
		(JSON.parse(read("backend/package.json")) as { dependencies?: object })
			.dependencies ?? {},
	),
]);
const dependabot = parseDependabot(read(".github/dependabot.yml"));

// ── tests ────────────────────────────────────────────────────────────────────

describe("ID-03 · exact manifest pin vs mirroring override floor", () => {
	it("detects the historical bug (zod declared 4.6.2, floor pinned 4.4.3)", () => {
		expect(
			findFloorViolations({ zod: ">=4.4.0" }, { zod: "4.6.2" }),
		).toHaveLength(1);
	});

	it("accepts a floor at the pin or above it", () => {
		expect(
			findFloorViolations({ zod: ">=4.6.2" }, { zod: "4.6.2" }),
		).toHaveLength(0);
		expect(
			findFloorViolations({ zod: ">=4.7.0" }, { zod: "4.6.2" }),
		).toHaveLength(0);
	});

	it("ignores overrides that do not mirror a direct exact pin", () => {
		expect(
			findFloorViolations({ undici: "7.29.0" }, { zod: "4.6.2" }),
		).toHaveLength(0);
	});

	it("holds for every override in this repository", () => {
		const pins = {
			...exactPinsOf(read("package.json")),
			...exactPinsOf(read("backend/package.json")),
		};
		expect(findFloorViolations(overrides, pins)).toEqual([]);
	});

	it("covers all backend runtime pins that have a mirroring override", () => {
		const mirrored = Object.keys(overrides)
			.map(overrideName)
			.filter((name) => name in exactPinsOf(read("backend/package.json")));
		expect(mirrored.sort()).toEqual(["multer", "sharp", "zod"]);
	});
});

describe("ID-01 · Dependabot ignores must target direct dependencies", () => {
	it("never ignores a package that is absent from every workspace manifest", () => {
		const npmEntry = dependabot.entries.find((e) => e.ecosystem === "npm");
		const inert = (npmEntry?.ignored ?? []).filter(
			(name) => !allManifestDeps.has(name),
		);
		expect(
			inert,
			"ignore entries only suppress security updates when the package is transitive",
		).toEqual([]);
	});

	it("still declares its direct dependencies, so the guard is not vacuous", () => {
		expect(allManifestDeps.has("zod")).toBe(true);
		expect(allManifestDeps.has("sharp")).toBe(true);
		expect(allManifestDeps.size).toBeGreaterThanOrEqual(15);
	});
});

describe("R9 · dependabot.yml structure", () => {
	it("declares version 2 with at least one update entry", () => {
		expect(dependabot.version).toBe(2);
		expect(dependabot.entries.length).toBeGreaterThanOrEqual(1);
	});

	it("gives every entry an ecosystem, a directory and a schedule", () => {
		for (const entry of dependabot.entries) {
			expect(entry.ecosystem, "ecosystem").not.toBe("");
			expect(entry.dirs.length, `dirs of ${entry.ecosystem}`).toBeGreaterThan(
				0,
			);
			expect(entry.interval, `interval of ${entry.ecosystem}`).not.toBe("");
		}
	});

	it("never registers the same directory twice for one ecosystem", () => {
		for (const entry of dependabot.entries) {
			expect(new Set(entry.dirs).size, entry.ecosystem).toBe(entry.dirs.length);
		}
	});

	it("keeps majors out of the minor/patch group so they arrive one by one", () => {
		const npmEntry = dependabot.entries.find((e) => e.ecosystem === "npm");
		expect(npmEntry?.groupedTypes).toContain("minor");
		expect(npmEntry?.groupedTypes).toContain("patch");
		expect(npmEntry?.groupedTypes).not.toContain("major");
	});
});

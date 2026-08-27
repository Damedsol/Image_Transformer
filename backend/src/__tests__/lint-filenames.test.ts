/**
 * lint-filenames (ls-lint replacement) — black-box parity suite.
 *
 * The script replaces `@ls-lint/ls-lint` (unmaintained Go binary). These tests
 * spawn the real CLI against temporary fixture trees and assert the exact
 * stdout/stderr/exit-code contract that ls-lint v2.3.1 produces:
 *   - no violations → empty output, exit 0
 *   - violations   → `{path} failed for `{ext}` rules: {names | ...}` to stderr, exit 1
 *
 * Runs under the backend suite (has `@types/node` for fs/child_process/os/path).
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SCRIPT = path.resolve("scripts/lint-filenames.mjs");

type FixtureEntry = { path: string; isDir?: boolean; content?: string };

function realConfig(): string {
	return fs.readFileSync(path.resolve(".ls-lint.json"), "utf8");
}

function runInFixture(
	entries: FixtureEntry[],
	args: string[] = [],
): {
	status: number | null;
	stdout: string;
	stderr: string;
} {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lint-files-"));
	try {
		fs.writeFileSync(path.join(dir, ".ls-lint.json"), realConfig());
		for (const entry of entries) {
			const target = path.join(dir, entry.path);
			if (entry.isDir) {
				fs.mkdirSync(target, { recursive: true });
				fs.writeFileSync(path.join(target, ".keep"), "");
			} else {
				fs.mkdirSync(path.dirname(target), { recursive: true });
				fs.writeFileSync(target, entry.content ?? "");
			}
		}
		const result = spawnSync(process.execPath, [SCRIPT, ...args], {
			cwd: dir,
			encoding: "utf8",
		});
		return {
			status: result.status,
			stdout: result.stdout ?? "",
			stderr: result.stderr ?? "",
		};
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

describe("lint-filenames (ls-lint replacement)", () => {
	it("passes a clean tree and exits 0 with no output", () => {
		const r = runInFixture([
			{ path: "src/components/ConversionOptions.ts" },
			{ path: "src/components/DropZone.ts" },
			{ path: "src/components/ImageConverter.ts" },
			{ path: "src/components/Foo.test.ts" },
			{ path: "src/utils/api.ts" },
			{ path: "src/utils/fileUtils.ts" },
			{ path: "src/types/image.ts" },
			{ path: "src/main.ts" },
			{ path: "backend/src/controllers/imageController.ts" },
			{ path: "backend/src/middlewares/errorMiddleware.ts" },
			{ path: "backend/src/routes/imageRoutes.ts" },
			{ path: "backend/src/utils/logger.ts" },
			{ path: "backend/index.ts" },
			{ path: "README.md" },
			{ path: "AGENTS.md" },
			{ path: "LICENSE.md" },
			{ path: "THIRD_PARTY_NOTICES.md" },
			{ path: "docs/LOGGING.md" },
			{ path: "docker/nginx.conf" },
			{ path: "package.json" },
			{ path: "backend/package.json" },
			{ path: "src/style.css" },
		]);
		expect(r.status).toBe(0);
		expect(r.stdout).toBe("");
		expect(r.stderr).toBe("");
	});

	it("reports a PascalCase violation with the exact ls-lint line and exit 1", () => {
		const r = runInFixture([{ path: "src/components/foo.ts" }]);
		expect(r.status).toBe(1);
		expect(r.stderr).toContain(
			"src/components/foo.ts failed for `.ts` rules: pascalcase\n",
		);
		expect(r.stdout).toBe("");
	});

	it("reports a non-kebab directory name with `.dir` rules", () => {
		const r = runInFixture([{ path: "src/SomeDir", isDir: true }]);
		expect(r.status).toBe(1);
		expect(r.stderr).toContain(
			"src/SomeDir failed for `.dir` rules: kebabcase\n",
		);
	});

	it("does not flag dotfiles, extensionless, or multi-dot files", () => {
		const r = runInFixture([
			{ path: ".env.example" },
			{ path: ".gitattributes" },
			{ path: ".gitignore" },
			{ path: "Dockerfile" },
			{ path: "src/vite-env.d.ts" },
			{ path: "src/types/custom-elements.d.ts" },
			{ path: "eslint.config.js" },
			{ path: "commitlint.config.js" },
		]);
		expect(r.status).toBe(0);
		expect(r.stderr).toBe("");
	});

	it("accepts ls-lint per-rune edge cases (ssrVFor, leading/double hyphen, digit-lead, unicode)", () => {
		const r = runInFixture([
			// `src/utils` is camelCase-only, so camel-only names live there:
			{ path: "src/utils/ssrVFor.ts" },
			{ path: "src/utils/123abc.ts" },
			{ path: "src/utils/añadir.ts" },
			// `src/types` resolves to the root `.ts` rule (kebab-case | camelCase),
			// so hyphen-leading/consecutive names are valid there:
			{ path: "src/types/-foo.ts" },
			{ path: "src/types/foo--bar.ts" },
		]);
		expect(r.status).toBe(0);
		expect(r.stderr).toBe("");
	});

	it("reports both rules when an OR rule fails on every option", () => {
		const r = runInFixture([{ path: "src/PlainBad.ts" }]);
		// `src` resolves to the root ruleset (no specific `src` key), `.ts` is
		// kebab-case | camelCase → "PlainBad" fails both → line lists both names.
		expect(r.status).toBe(1);
		expect(r.stderr).toContain(
			"src/PlainBad.ts failed for `.ts` rules: kebabcase | camelcase\n",
		);
	});

	it("supports --warn (errors to stdout, exit 0)", () => {
		const r = runInFixture([{ path: "src/components/foo.ts" }], ["--warn"]);
		expect(r.status).toBe(0);
		expect(r.stderr).toBe("");
		expect(r.stdout).toContain(
			"src/components/foo.ts failed for `.ts` rules: pascalcase\n",
		);
	});

	it("supports --error-output-format json", () => {
		const r = runInFixture(
			[{ path: "src/components/foo.ts" }, { path: "src/SomeDir", isDir: true }],
			["--error-output-format", "json"],
		);
		expect(r.status).toBe(1);
		const parsed = JSON.parse(r.stderr) as Record<
			string,
			Record<string, string[]>
		>;
		expect(parsed["src/components/foo.ts"]).toEqual({ ".ts": ["pascalcase"] });
		expect(parsed["src/SomeDir"]).toEqual({ ".dir": ["kebabcase"] });
	});

	it("supports --version", () => {
		const r = runInFixture([], ["--version"]);
		expect(r.status).toBe(0);
		expect(r.stdout).toContain("lint-filenames");
	});

	it("passes the actual repository root (parity with a clean repo)", () => {
		const r = spawnSync(process.execPath, [SCRIPT], {
			cwd: path.resolve("."),
			encoding: "utf8",
		});
		expect(r.status).toBe(0);
		expect(r.stderr).toBe("");
	});
});

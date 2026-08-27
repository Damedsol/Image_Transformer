/**
 * License & attribution consistency guard.
 * Regression: footer, LICENSE, README, manifest and font assets must all
 * reference the same license (CC BY 4.0) with no contradictory claims
 * (e.g. CC BY-NC-SA, bare "Created by" copyright, machine-local file:// links).
 */
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = process.cwd();

const read = (relativePath: string): string =>
	fs.readFileSync(path.join(root, relativePath), "utf8");

describe("license & attribution consistency", () => {
	it("declares CC BY 4.0 everywhere and never CC BY-NC-SA", () => {
		const files = [
			"LICENSE.md",
			"README.md",
			"docs/README.md",
			"index.html",
			".agents/project_manifest.yaml",
		];
		for (const file of files) {
			const content = read(file);
			expect(content, file).toContain("CC BY 4.0");
			expect(content, file).not.toContain("CC BY-NC-SA");
		}
	});

	it("does not reference machine-local file:// paths in docs", () => {
		expect(read("README.md")).not.toContain("file:///");
	});

	it("footer uses CC-standard attribution without a bare 'Created by' claim", () => {
		const content = read("index.html");
		const attribution =
			content.match(/<p class="footer-attribution">([\s\S]*?)<\/p>/)?.[1] ?? "";
		expect(attribution).toContain("Damedsol");
		expect(attribution).toContain("CC BY 4.0");
		expect(attribution).not.toContain("©");
		expect(content).not.toContain("Created by");
	});

	it("footer links to the GitHub README", () => {
		expect(read("index.html")).toContain("Image_Transformer#readme");
	});

	it("ships OFL license text for bundled fonts", () => {
		expect(fs.existsSync(path.join(root, "assets/fonts/Figtree/OFL.txt"))).toBe(
			true,
		);
		expect(
			fs.existsSync(path.join(root, "assets/fonts/IBM_Plex_Mono/OFL.txt")),
		).toBe(true);
	});

	it("declares the SPDX license id in both package.json files", () => {
		const rootPkg = JSON.parse(read("package.json")) as { license?: string };
		const backendPkg = JSON.parse(read("backend/package.json")) as {
			license?: string;
		};
		expect(rootPkg.license).toBe("CC-BY-4.0");
		expect(backendPkg.license).toBe("CC-BY-4.0");
	});
});

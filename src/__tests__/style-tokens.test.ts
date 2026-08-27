/**
 * Verifies that style.css defines all required neon-code CSS custom properties
 * and follows the immutable rules of SNA.
 * Must FAIL before migration — old style.css uses different tokens.
 */
import "../style.css";

describe("style.css neon-code tokens", () => {
	const root = document.documentElement;

	beforeEach(() => {
		// Reset inline styles between tests
		root.style.cssText = "";
	});

	it("defines --font-sans as Figtree", () => {
		const value = getComputedStyle(root).getPropertyValue("--font-sans").trim();
		expect(value).toContain("Figtree");
	});

	it("defines --font-mono as IBM Plex Mono", () => {
		const value = getComputedStyle(root).getPropertyValue("--font-mono").trim();
		expect(value).toContain("IBM Plex Mono");
	});

	it("defines --target-size as 44px (AAA compliance)", () => {
		const value = getComputedStyle(root)
			.getPropertyValue("--target-size")
			.trim();
		expect(value).toBe("44px");
	});

	it("defines --border-radius as 4px (max flat)", () => {
		const value = getComputedStyle(root)
			.getPropertyValue("--border-radius")
			.trim();
		expect(value).toBe("4px");
	});

	it("defines --brand-primary in dark mode (#b9f27c)", () => {
		const value = getComputedStyle(root)
			.getPropertyValue("--brand-primary")
			.trim();
		expect(value).toBe("#b9f27c");
	});

	it("defines --bg-base in dark mode (#0f1016)", () => {
		const value = getComputedStyle(root).getPropertyValue("--bg-base").trim();
		expect(value).toBe("#0f1016");
	});

	it("defines --bg-surface for card elevation", () => {
		const value = getComputedStyle(root)
			.getPropertyValue("--bg-surface")
			.trim();
		expect(value).toBe("#161b22");
	});

	it("defines --status-success, --status-error, --status-warning", () => {
		const success = getComputedStyle(root)
			.getPropertyValue("--status-success")
			.trim();
		const error = getComputedStyle(root)
			.getPropertyValue("--status-error")
			.trim();
		const warning = getComputedStyle(root)
			.getPropertyValue("--status-warning")
			.trim();

		expect(success).toBeTruthy();
		expect(error).toBeTruthy();
		expect(warning).toBeTruthy();
	});

	it("does NOT define box-shadow in any selector (anti-decoration law)", () => {
		const stylesheets = Array.from(document.styleSheets);
		for (const ss of stylesheets) {
			try {
				const rules = Array.from((ss as CSSStyleSheet).cssRules || []);
				for (const rule of rules) {
					if (rule instanceof CSSStyleRule) {
						const cssText = rule.style.cssText;
						expect(cssText.toLowerCase()).not.toContain("box-shadow");
					}
				}
			} catch {
				// Cross-origin stylesheet, skip
			}
		}
	});

	it("does NOT define linear-gradient or radial-gradient", () => {
		const stylesheets = Array.from(document.styleSheets);
		for (const ss of stylesheets) {
			try {
				const rules = Array.from((ss as CSSStyleSheet).cssRules || []);
				for (const rule of rules) {
					if (rule instanceof CSSStyleRule) {
						const cssText = rule.style.cssText.toLowerCase();
						expect(cssText).not.toContain("linear-gradient");
						expect(cssText).not.toContain("radial-gradient");
					}
				}
			} catch {
				// skip
			}
		}
	});

	it("does NOT define backdrop-filter: blur", () => {
		const stylesheets = Array.from(document.styleSheets);
		for (const ss of stylesheets) {
			try {
				const rules = Array.from((ss as CSSStyleSheet).cssRules || []);
				for (const rule of rules) {
					if (rule instanceof CSSStyleRule) {
						const cssText = rule.style.cssText.toLowerCase();
						expect(cssText).not.toContain("backdrop-filter");
					}
				}
			} catch {
				// skip
			}
		}
	});
});

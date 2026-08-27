/**
 * Tests for <tn-icon> Web Component (SNA-36).
 */
import "../../components/TnIcon";
import { mount } from "../helpers/dom";

describe("tn-icon (SNA-36)", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders an SVG element inside Shadow DOM", () => {
		const el = mount("tn-icon");
		el.setAttribute("name", "check");
		el.setAttribute("size", "24");

		const shadow = el.shadowRoot;
		expect(shadow).not.toBeNull();

		const svg = shadow!.querySelector("svg");
		expect(svg).not.toBeNull();
		expect(svg!.getAttribute("width")).toBe("24");
		expect(svg!.getAttribute("height")).toBe("24");
	});

	it("uses square stroke-linecap and miter stroke-linejoin (cyberpunk-flat)", () => {
		const el = mount("tn-icon");
		el.setAttribute("name", "check");

		const svg = el.shadowRoot!.querySelector("svg")!;
		expect(svg.style.strokeLinecap).toBe("square");
		expect(svg.style.strokeLinejoin).toBe("miter");
	});

	it("has aria-hidden='true' by default for decorative icons", () => {
		const el = mount("tn-icon");
		el.setAttribute("name", "image");

		const svg = el.shadowRoot!.querySelector("svg")!;
		expect(svg.getAttribute("aria-hidden")).toBe("true");
	});

	it("supports color attribute passed as stroke color", () => {
		const el = mount("tn-icon");
		el.setAttribute("name", "alert");
		el.setAttribute("color", "#b9f27c");

		const svg = el.shadowRoot!.querySelector("svg")!;
		expect(svg.getAttribute("stroke")).toBe("#b9f27c");
	});

	it("defaults to currentColor when no color attribute", () => {
		const el = mount("tn-icon");
		el.setAttribute("name", "settings");

		const svg = el.shadowRoot!.querySelector("svg")!;
		expect(svg.getAttribute("stroke")).toBe("currentColor");
	});

	it("warns for unregistered icon name via console.warn", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = mount("tn-icon");
		el.setAttribute("name", "nonexistent-icon");

		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("Unknown icon"),
		);
		warnSpy.mockRestore();
	});

	it("accepts registered icon name without error", () => {
		const el = mount("tn-icon");
		el.setAttribute("name", "upload");

		const svg = el.shadowRoot!.querySelector("svg");
		expect(svg).not.toBeNull();
	});

	it("renders brand icons (github, linkedin) via Iconoir", () => {
		for (const name of ["github", "linkedin"]) {
			const el = mount("tn-icon");
			el.setAttribute("name", name);
			const svg = el.shadowRoot!.querySelector("svg");
			expect(svg, `icon "${name}"`).not.toBeNull();
			expect(svg!.getAttribute("aria-hidden")).toBe("true");
		}
	});
});

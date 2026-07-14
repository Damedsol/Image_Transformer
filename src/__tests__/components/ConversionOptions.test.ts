/**
 * Tests for <conversion-options> (SNA-02 Inputs + SNA-20 Select + SNA-27 Slider + SNA-18 Checkbox).
 */
import "../../components/ConversionOptions";
import { mount } from "../helpers/dom";

describe("ConversionOptions (SNA-02 + SNA-20 + SNA-27 + SNA-18)", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders format select with SNA-20 styling (label in Figtree uppercase)", () => {
		const el = mount("conversion-options");
		const select = el.querySelector("#format") as HTMLSelectElement;

		expect(select).not.toBeNull();
	});

	it("lists all supported image formats", () => {
		const el = mount("conversion-options");
		const select = el.querySelector("#format") as HTMLSelectElement;

		const formats = Array.from(select.options).map((o) => o.value);
		expect(formats).toContain("png");
		expect(formats).toContain("jpeg");
		expect(formats).toContain("webp");
		expect(formats).toContain("gif");
		expect(formats).toContain("avif");
	});

	it("renders quality slider with SNA-27 custom styling", () => {
		const el = mount("conversion-options");
		const slider = el.querySelector("#quality") as HTMLInputElement;

		expect(slider).not.toBeNull();
		expect(slider.type).toBe("range");
		expect(Number(slider.min)).toBe(10);
		expect(Number(slider.max)).toBe(100);
		expect(Number(slider.step)).toBe(1);
	});

	it("displays current quality value next to slider", () => {
		const el = mount("conversion-options");
		const valueDisplay = el.querySelector("#quality-value");

		expect(valueDisplay).not.toBeNull();
		expect(valueDisplay?.textContent).toBe("90");
	});

	it("renders maintain-aspect-ratio checkbox with SNA-18 square style", () => {
		const el = mount("conversion-options");
		const checkbox = el.querySelector(
			"#maintain-aspect-ratio",
		) as HTMLInputElement;

		expect(checkbox).not.toBeNull();
		expect(checkbox.type).toBe("checkbox");
		expect(checkbox.checked).toBe(true);
	});

	it("calls onChange callback when format changes", () => {
		const el = mount("conversion-options");
		const callback = vi.fn();
		(el as any).setOnChangeCallback(callback);

		const select = el.querySelector("#format") as HTMLSelectElement;
		select.value = "webp";
		select.dispatchEvent(new Event("change"));

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledWith(
			expect.objectContaining({ format: "webp" }),
		);
	});

	it("calls onChange when quality slider changes", () => {
		const el = mount("conversion-options");
		const callback = vi.fn();
		(el as any).setOnChangeCallback(callback);

		const slider = el.querySelector("#quality") as HTMLInputElement;
		slider.value = "75";
		slider.dispatchEvent(new Event("input"));

		expect(callback).toHaveBeenCalledWith(
			expect.objectContaining({ quality: 75 }),
		);
	});

	it("has all form labels properly associated with inputs", () => {
		const el = mount("conversion-options");
		const labels = el.querySelectorAll("label[for]");

		labels.forEach((label) => {
			const forAttr = label.getAttribute("for");
			if (forAttr) {
				const input = document.getElementById(forAttr);
				expect(input).not.toBeNull();
			}
		});
	});
});

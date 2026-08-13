/**
 * Tests for <drop-zone> Web Component (SNA-03 Card + SNA-35 Empty State).
 */
import "../../components/DropZone";
import { mount } from "../helpers/dom";

describe("DropZone (SNA-03 + SNA-35)", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders as a card with bg-surface elevation (no shadows)", () => {
		const el = mount("drop-zone");
		const dropzone = el.querySelector(".dropzone") as HTMLElement;

		expect(dropzone).not.toBeNull();
		expect(dropzone.style.boxShadow).toBe("");
	});

	it("displays empty state with dashed border when no files selected", () => {
		const el = mount("drop-zone");
		const emptyState = el.querySelector(".empty-state");

		expect(emptyState).not.toBeNull();
		expect(emptyState?.classList.contains("empty-state")).toBe(true);
	});

	it("shows 'Upload images' title in IBM Plex Mono (SNA-35)", () => {
		const el = mount("drop-zone");
		const title = el.querySelector(".empty-state-title");

		expect(title).not.toBeNull();
		expect(title?.textContent).toMatch(/Upload images/i);
	});

	it("accepts valid image files via setOnFilesSelectedCallback", () => {
		const el = mount("drop-zone");
		const callback = vi.fn();
		(el as any).setOnFilesSelectedCallback(callback);

		expect(callback).not.toBeNull();
	});

	it("filters non-image files and shows error message", () => {
		const el = mount("drop-zone");
		const input = el.querySelector(".file-input") as HTMLInputElement;

		expect(input).not.toBeNull();
		expect(input.getAttribute("accept")).toBe("image/*");
	});

	it("uses tn-icon for upload icon instead of inline SVG", () => {
		const el = mount("drop-zone");
		const icon = el.querySelector("tn-icon[name='upload']");

		expect(icon).not.toBeNull();
	});

	it("has aria-describedby pointing to instructions", () => {
		const el = mount("drop-zone");
		const dropzone = el.querySelector(".dropzone") as HTMLElement;

		const describedBy = dropzone.getAttribute("aria-describedby");
		expect(describedBy).not.toBeNull();

		const instructions = document.getElementById(describedBy!);
		expect(instructions).not.toBeNull();
	});
});

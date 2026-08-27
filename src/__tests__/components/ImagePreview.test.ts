/**
 * Tests for <image-preview> (SNA-03 Card + SNA-08 Badge).
 */
import "../../components/ImagePreview";
import { mount } from "../helpers/dom";

describe("ImagePreview (SNA-03 + SNA-08)", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	const mockImage = {
		id: "img-1",
		file: new File([""], "test.png", { type: "image/png" }),
		preview: "data:image/png;base64,iVBORw0KGgo=",
		name: "test.png",
		size: 204800,
		type: "image/png",
		dimensions: { width: 800, height: 600 },
		conversionOptions: { format: "webp" as const, quality: 90 },
	};

	it("renders as a card with bg-surface background (no shadows)", () => {
		const el = mount("image-preview");
		(el as any).image = mockImage;

		const card = el.querySelector(".preview-item") as HTMLElement;
		expect(card).not.toBeNull();
		expect(card.style.boxShadow).toBe("");
	});

	it("displays image name and size", () => {
		const el = mount("image-preview");
		(el as any).image = mockImage;

		const name = el.querySelector(".preview-name");
		const meta = el.querySelector(".preview-meta");

		expect(name?.textContent).toBe("test.png");
		expect(meta?.textContent).toContain("KB");
	});

	it("shows format badge with SNA-08 styling", () => {
		const el = mount("image-preview");
		(el as any).image = mockImage;

		const badge = el.querySelector(".badge");
		expect(badge).not.toBeNull();
		expect(badge?.textContent).toMatch(/PNG/i);
	});

	it("renders remove button with btn-outline styling (SNA-01)", () => {
		const el = mount("image-preview");
		(el as any).image = mockImage;

		const removeBtn = el.querySelector(".preview-remove") as HTMLButtonElement;
		expect(removeBtn).not.toBeNull();
		expect(removeBtn.classList.contains("btn-outline")).toBe(true);
	});

	it("calls onRemove callback when remove button clicked", () => {
		const el = mount("image-preview");
		(el as any).image = mockImage;
		const callback = vi.fn();
		(el as any).setOnRemoveCallback(callback);

		const removeBtn = el.querySelector(".preview-remove") as HTMLButtonElement;
		removeBtn.click();

		expect(callback).toHaveBeenCalledWith("img-1");
	});

	it("displays dimensions in W x H format", () => {
		const el = mount("image-preview");
		(el as any).image = mockImage;

		const metaText = el.querySelector(".preview-meta")?.textContent || "";
		expect(metaText).toContain("800");
		expect(metaText).toContain("600");
	});
});

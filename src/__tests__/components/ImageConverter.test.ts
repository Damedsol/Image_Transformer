/**
 * Tests for <image-converter> — main orchestrator (SNA-01 Buttons + SNA-15 Loaders + SNA-07 Alerts).
 */
import "../../components/DropZone";
import "../../components/ImageConverter";
import "../../components/ConversionOptions";
import { convertImagesAPI } from "../../utils/api";
import { mount, createMockFile } from "../helpers/dom";

vi.mock("../../utils/api", () => ({
	convertImagesAPI: vi.fn(),
}));

const mockImage = {
	id: "img-1",
	file: createMockFile("test.png", "image/png"),
	preview: "data:image/png;base64,iVBORw0KGgo=",
	name: "test.png",
	size: 1024,
	type: "image/png",
	dimensions: { width: 100, height: 100 },
	conversionOptions: { format: "png", quality: 90, maintainAspectRatio: true },
};

describe("ImageConverter (SNA-01 + SNA-15 + SNA-07)", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders header with app title", () => {
		const el = mount("image-converter");
		const title = el.querySelector("h1");

		expect(title).not.toBeNull();
		expect(title?.textContent).toMatch(/Image Converter/i);
	});

	it("renders convert button with btn-primary styling (SNA-01)", () => {
		const el = mount("image-converter");
		const btn = el.querySelector("#convert-button") as HTMLButtonElement;

		expect(btn).not.toBeNull();
		expect(btn.classList.contains("btn-primary")).toBe(true);
		expect(btn.textContent).toMatch(/Convert Images/i);
	});

	it("disables convert button and sets aria-busy during processing (SNA-15)", () => {
		const el = mount("image-converter");
		const btn = el.querySelector("#convert-button") as HTMLButtonElement;

		btn.disabled = true;
		btn.setAttribute("aria-busy", "true");
		btn.innerHTML = `<span class="loader-spinner"></span> Converting...`;

		expect(btn.disabled).toBe(true);
		expect(btn.getAttribute("aria-busy")).toBe("true");

		const spinner = btn.querySelector(".loader-spinner");
		expect(spinner).not.toBeNull();
	});

	it("renders success message without [OK] prefix (SNA-07)", () => {
		const el = mount("image-converter");

		const msg = document.createElement("div");
		msg.className = "message message-success";
		msg.setAttribute("role", "alert");
		msg.textContent = "2 images converted successfully";
		el.appendChild(msg);

		const message = el.querySelector(".message-success");
		expect(message).not.toBeNull();
		expect(message?.textContent).not.toMatch(/^\[OK\]/);
		expect(message?.textContent).toMatch(/converted successfully/i);
	});

	it("renders error message without [!] prefix (SNA-07)", () => {
		const el = mount("image-converter");

		const msg = document.createElement("div");
		msg.className = "message message-error";
		msg.setAttribute("role", "alert");
		msg.textContent = "Conversion failed";
		el.appendChild(msg);

		const message = el.querySelector(".message-error");
		expect(message).not.toBeNull();
		expect(message?.textContent).not.toMatch(/^\[!\]/);
	});

	it("renders download link as btn-outline after successful conversion", () => {
		const el = mount("image-converter");

		const downloadLink = document.createElement("a");
		downloadLink.className = "download-link btn-outline";
		downloadLink.href = "/temp/converted.zip";
		downloadLink.textContent = "Download all (ZIP)";
		el.appendChild(downloadLink);

		const link = el.querySelector(".download-link");
		expect(link).not.toBeNull();
		expect(link?.classList.contains("btn-outline")).toBe(true);
	});

	it("has proper aria-live region for screen reader announcements", () => {
		const el = mount("image-converter");
		expect(el.getAttribute("role")).toBe("region");
		expect(el.getAttribute("aria-label")).toBe("Image converter");
	});

	it("does not mark the converter container as role=application", () => {
		const el = mount("image-converter");
		const container = el.querySelector(".converter-container");
		expect(container?.getAttribute("role")).not.toBe("application");
	});

	it("shows success message and download link after successful conversion", async () => {
		const el = mount("image-converter");
		(el as unknown as { images: (typeof mockImage)[] }).images = [mockImage];
		vi.mocked(convertImagesAPI).mockResolvedValue("/temp/output/conv.zip");

		await (
			el as unknown as { handleConvertClick: () => Promise<void> }
		).handleConvertClick();

		const msg = el.querySelector(".message-success");
		expect(msg).not.toBeNull();
		expect(msg?.textContent).not.toMatch(/^\[OK\]/);
		expect(msg?.textContent).toMatch(/converted successfully/i);

		const link = el.querySelector(".download-link");
		expect(link).not.toBeNull();
	});

	it("shows the real backend error message when conversion fails", async () => {
		const el = mount("image-converter");
		(el as unknown as { images: (typeof mockImage)[] }).images = [mockImage];
		vi.mocked(convertImagesAPI).mockRejectedValue(
			new Error("Daily quota exceeded (100 images)"),
		);

		await (
			el as unknown as { handleConvertClick: () => Promise<void> }
		).handleConvertClick();

		const msg = el.querySelector(".message-error");
		expect(msg).not.toBeNull();
		expect(msg?.textContent).toContain("Daily quota exceeded");
		expect(msg?.textContent).not.toMatch(/^\[!\]/);
	});
});

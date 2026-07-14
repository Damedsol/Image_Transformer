/**
 * Tests for <image-converter> — main orchestrator (SNA-01 Buttons + SNA-15 Loaders + SNA-07 Alerts).
 */
import "../../components/DropZone";
import "../../components/ImageConverter";
import "../../components/ConversionOptions";
import { mount } from "../helpers/dom";

describe("ImageConverter (SNA-01 + SNA-15 + SNA-07)", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("renders header with app title", () => {
		const el = mount("image-converter");
		const title = el.querySelector("h1");

		expect(title).not.toBeNull();
		expect(title?.textContent).toMatch(/IMAGE_CONVERTER/i);
	});

	it("renders convert button with btn-primary styling (SNA-01)", () => {
		const el = mount("image-converter");
		const btn = el.querySelector("#convert-button") as HTMLButtonElement;

		expect(btn).not.toBeNull();
		expect(btn.classList.contains("btn-primary")).toBe(true);
		expect(btn.textContent).toMatch(/CONVERT_IMAGES/i);
	});

	it("disables convert button and sets aria-busy during processing (SNA-15)", () => {
		const el = mount("image-converter");
		const btn = el.querySelector("#convert-button") as HTMLButtonElement;

		btn.disabled = true;
		btn.setAttribute("aria-busy", "true");
		btn.innerHTML = `<span class="loader-spinner"></span> CONVERTING...`;

		expect(btn.disabled).toBe(true);
		expect(btn.getAttribute("aria-busy")).toBe("true");

		const spinner = btn.querySelector(".loader-spinner");
		expect(spinner).not.toBeNull();
	});

	it("shows alert messages with [OK] prefix for success (SNA-07)", () => {
		const el = mount("image-converter");

		const msg = document.createElement("div");
		msg.className = "message message-success";
		msg.setAttribute("role", "alert");
		msg.textContent = "[OK] Images converted successfully";
		el.appendChild(msg);

		const message = el.querySelector(".message-success");
		expect(message).not.toBeNull();
		expect(message?.textContent).toMatch(/^\[OK\]/);
	});

	it("shows alert messages with [!] prefix for errors (SNA-07)", () => {
		const el = mount("image-converter");

		const msg = document.createElement("div");
		msg.className = "message message-error";
		msg.setAttribute("role", "alert");
		msg.textContent = "[!] Conversion failed";
		el.appendChild(msg);

		const message = el.querySelector(".message-error");
		expect(message).not.toBeNull();
		expect(message?.textContent).toMatch(/^\[!\]/);
	});

	it("renders download link as btn-outline after successful conversion", () => {
		const el = mount("image-converter");

		const downloadLink = document.createElement("a");
		downloadLink.className = "download-link btn-outline";
		downloadLink.href = "/temp/converted.zip";
		downloadLink.textContent = "DOWNLOAD_ZIP";
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
});

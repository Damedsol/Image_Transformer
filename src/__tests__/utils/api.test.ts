/**
 * Tests for api.ts — error extraction from backend responses.
 * Regression: backend returns { success:false, error:{ message } } (object),
 * not a plain string. convertImagesAPI must surface the real message,
 * never "[object Object]".
 */
import { convertImagesAPI } from "../../utils/api";
import { createMockFile } from "../helpers/dom";
import type { ImageInfo, ConversionOptions } from "../../types/image";

const mockImage: ImageInfo = {
	id: "img-1",
	file: createMockFile("test.png", "image/png"),
	preview: "data:image/png;base64,iVBORw0KGgo=",
	name: "test.png",
	size: 1024,
	type: "image/png",
	conversionOptions: { format: "png", quality: 90, maintainAspectRatio: true },
};

const defaultOptions: ConversionOptions = {
	format: "png",
	quality: 90,
	maintainAspectRatio: true,
};

describe("convertImagesAPI error handling", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("throws the real backend message when the API returns a structured error object", async () => {
		const mockResponse = {
			ok: false,
			status: 413,
			json: async () => ({
				success: false,
				error: { message: "Image dimensions exceed allowed limit (3840x2160)" },
			}),
		};
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

		await expect(convertImagesAPI([mockImage], defaultOptions)).rejects.toThrow(
			"Image dimensions exceed allowed limit (3840x2160)",
		);
	});

	it("does not surface '[object Object]' when error payload uses the { error: object } shape", async () => {
		const mockResponse = {
			ok: false,
			status: 500,
			json: async () => ({
				success: false,
				error: { message: "Error processing image: something failed" },
			}),
		};
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

		const error = await convertImagesAPI([mockImage], defaultOptions).catch(
			(e: unknown) => e,
		);
		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).not.toBe("[object Object]");
		expect((error as Error).message).toContain("Error processing image");
	});

	it("falls back to a generic message when the error payload is not parseable", async () => {
		const mockResponse = {
			ok: false,
			status: 500,
			json: async () => {
				throw new Error("unexpected token");
			},
		};
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

		await expect(convertImagesAPI([mockImage], defaultOptions)).rejects.toThrow(
			"Failed to convert the images",
		);
	});
});

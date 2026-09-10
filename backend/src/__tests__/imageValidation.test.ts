/**
 * Tests for imageValidation.ts (imageValidation helpers).
 * Regression (audit MEDIUM): upload validation trusted only the
 * client-supplied MIME type + extension. The on-disk magic number must match
 * the claimed extension before any processing or quota is consumed.
 */
import { describe, it, expect } from "vitest";
import {
	detectImageKind,
	isMagicAllowed,
	kindForExtension,
} from "../utils/imageValidation.js";

const bytes = (values: number[]): Uint8Array => new Uint8Array(values);
const ascii = (text: string): number[] => [...text].map((c) => c.charCodeAt(0));

describe("detectImageKind", () => {
	it("detects JPEG by SOI marker", () => {
		expect(detectImageKind(bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toBe("jpeg");
	});

	it("detects PNG by signature", () => {
		expect(
			detectImageKind(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
		).toBe("png");
	});

	it("detects GIF87a and GIF89a", () => {
		expect(detectImageKind(bytes([...ascii("GIF87a"), 0, 0]))).toBe("gif");
		expect(detectImageKind(bytes([...ascii("GIF89a"), 0, 0]))).toBe("gif");
	});

	it("detects WebP by RIFF....WEBP", () => {
		expect(
			detectImageKind(bytes([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")])),
		).toBe("webp");
	});

	it("detects AVIF by ftyp box with avif brand", () => {
		expect(
			detectImageKind(
				bytes([0, 0, 0, 32, ...ascii("ftyp"), ...ascii("avif"), 0, 0]),
			),
		).toBe("avif");
	});

	it("returns null for text, empty and truncated inputs", () => {
		expect(detectImageKind(bytes(ascii("hello world!")))).toBeNull();
		expect(detectImageKind(bytes([]))).toBeNull();
		expect(detectImageKind(bytes([0x89, 0x50, 0x4e]))).toBeNull();
	});

	it("does not confuse RIFF without WEBP for WebP", () => {
		expect(
			detectImageKind(bytes([...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE")])),
		).toBeNull();
	});
});

describe("kindForExtension", () => {
	it("maps the allowed upload extensions", () => {
		expect(kindForExtension(".jpg")).toBe("jpeg");
		expect(kindForExtension(".jpeg")).toBe("jpeg");
		expect(kindForExtension(".png")).toBe("png");
		expect(kindForExtension(".webp")).toBe("webp");
		expect(kindForExtension(".gif")).toBe("gif");
		expect(kindForExtension(".avif")).toBe("avif");
	});

	it("is case-insensitive and rejects unknown extensions", () => {
		expect(kindForExtension(".PNG")).toBe("png");
		expect(kindForExtension(".svg")).toBeNull();
		expect(kindForExtension("")).toBeNull();
	});
});

describe("isMagicAllowed", () => {
	it("accepts matching content and filename", () => {
		const png = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		expect(isMagicAllowed(png, "photo.png")).toBe(true);
	});

	it("rejects mismatched content (renamed payload)", () => {
		const jpeg = bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
		expect(isMagicAllowed(jpeg, "photo.png")).toBe(false);
	});

	it("rejects non-image content regardless of extension", () => {
		const text = bytes(ascii("#!/bin/sh\nmalicious"));
		expect(isMagicAllowed(text, "run.png")).toBe(false);
	});
});

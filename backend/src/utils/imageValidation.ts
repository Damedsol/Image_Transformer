import fs from "fs";
import { AppError } from "./apiError.js";

/**
 * Magic-number validation for uploaded images.
 * The multer pre-filter only sees the client-supplied MIME type + extension,
 * both attacker-controlled. These helpers verify the on-disk bytes match the
 * claimed type before any processing or quota is consumed. Sharp remains the
 * final safety net (`failOn: "error"`).
 */

export type ImageKind = "jpeg" | "png" | "webp" | "gif" | "avif";

const startsWith = (header: Uint8Array, prefix: number[]): boolean =>
	prefix.every((byte, index) => header[index] === byte);

const asciiBytes = (text: string): number[] =>
	[...text].map((char) => char.charCodeAt(0));

/**
 * Detects the image kind from its leading bytes (magic number).
 * Returns null when the header is too short or matches no known signature.
 */
export const detectImageKind = (header: Uint8Array): ImageKind | null => {
	if (header.length >= 3 && startsWith(header, [0xff, 0xd8, 0xff])) {
		return "jpeg";
	}
	if (
		header.length >= 8 &&
		startsWith(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
	) {
		return "png";
	}
	if (
		header.length >= 6 &&
		(startsWith(header, asciiBytes("GIF87a")) ||
			startsWith(header, asciiBytes("GIF89a")))
	) {
		return "gif";
	}
	if (
		header.length >= 12 &&
		startsWith(header, asciiBytes("RIFF")) &&
		startsWith(header.subarray(8), asciiBytes("WEBP"))
	) {
		return "webp";
	}
	if (
		header.length >= 12 &&
		startsWith(header.subarray(4), asciiBytes("ftyp")) &&
		(startsWith(header.subarray(8), asciiBytes("avif")) ||
			startsWith(header.subarray(8), asciiBytes("avis")))
	) {
		return "avif";
	}
	return null;
};

const extensionToKind: Record<string, ImageKind> = {
	".jpg": "jpeg",
	".jpeg": "jpeg",
	".png": "png",
	".webp": "webp",
	".gif": "gif",
	".avif": "avif",
};

/** Maps a file extension to its expected image kind (case-insensitive). */
export const kindForExtension = (extension: string): ImageKind | null =>
	extensionToKind[extension.toLowerCase()] ?? null;

/**
 * True only when the on-disk magic number matches the claimed filename.
 * Extension extraction (path.extname) stays with the caller.
 */
export const isMagicAllowed = (
	header: Uint8Array,
	originalName: string,
): boolean => {
	const dot = originalName.lastIndexOf(".");
	const expected = dot >= 0 ? kindForExtension(originalName.slice(dot)) : null;
	const actual = detectImageKind(header);
	return expected !== null && actual !== null && expected === actual;
};

const HEADER_BYTES = 12;

/** Reads the leading bytes of an uploaded file for magic validation. */
export const readFileHeader = (filePath: string): Uint8Array => {
	const file = fs.openSync(filePath, "r");
	try {
		const buffer = Buffer.alloc(HEADER_BYTES);
		const read = fs.readSync(file, buffer, 0, HEADER_BYTES, 0);
		return new Uint8Array(buffer.buffer, buffer.byteOffset, read);
	} finally {
		fs.closeSync(file);
	}
};

/**
 * Rejects uploads whose bytes do not match their extension.
 * Throws AppError 400; the controller's guaranteed cleanup removes the file.
 */
export const validateUploadedImageMagic = (
	filePath: string,
	originalName: string,
): void => {
	let header: Uint8Array;
	try {
		header = readFileHeader(filePath);
	} catch {
		throw new AppError("Unable to inspect uploaded file", 400, {
			code: "INVALID_FILE_CONTENT",
		});
	}
	if (!isMagicAllowed(header, originalName)) {
		throw new AppError("File content does not match its extension", 400, {
			code: "INVALID_FILE_CONTENT",
		});
	}
};

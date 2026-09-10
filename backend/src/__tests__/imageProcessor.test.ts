/**
 * Tests for imageProcessor.ts pure helpers.
 * Regression (audit MEDIUM/BUG): processed-image filenames must be unique
 * per request (no cross-request collisions), the processing timeout must be
 * cancellable (no dangling sharp work/timers), and a failed ZIP build must
 * close its streams instead of leaking file descriptors.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventEmitter } from "events";
import {
	buildProcessedFileName,
	createProcessingTimeout,
	trackArchiveCompletion,
} from "../utils/imageProcessor.js";
import { AppError } from "../utils/apiError.js";

describe("buildProcessedFileName", () => {
	it("is deterministic for the same inputs", () => {
		expect(buildProcessedFileName("photo.png", 100, 100, "webp", "aaaa")).toBe(
			"photo_100x100_aaaa.webp",
		);
	});

	it("is unique per random suffix so concurrent requests cannot collide", () => {
		const first = buildProcessedFileName("photo.png", 100, 100, "webp", "aaaa");
		const second = buildProcessedFileName(
			"photo.png",
			100,
			100,
			"webp",
			"bbbb",
		);
		expect(second).not.toBe(first);
	});

	it("neutralizes path separators and leading dots from the client name", () => {
		const name = buildProcessedFileName(
			"../../etc/passwd.png",
			1,
			1,
			"png",
			"cccc",
		);
		expect(name).not.toContain("/");
		expect(name).not.toContain("\\");
		expect(name.startsWith(".")).toBe(false);
	});
});

describe("createProcessingTimeout", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("rejects with the timeout error after the deadline", async () => {
		const { promise } = createProcessingTimeout(
			1000,
			() => new AppError("Processing time exceeded", 408),
		);
		const assertion = expect(promise).rejects.toMatchObject({
			statusCode: 408,
		});
		await vi.advanceTimersByTimeAsync(1000);
		await assertion;
	});

	it("cancel prevents the late rejection (no dangling timer)", async () => {
		const { promise, cancel } = createProcessingTimeout(
			1000,
			() => new AppError("Processing time exceeded", 408),
		);
		let settled = false;
		promise.then(
			() => {
				settled = true;
			},
			() => {
				settled = true;
			},
		);
		cancel();
		await vi.advanceTimersByTimeAsync(5000);
		expect(settled).toBe(false);
	});
});

describe("trackArchiveCompletion", () => {
	it("destroys the output stream when the archiver errors", async () => {
		const archive = new EventEmitter();
		let destroyed = false;
		const output = Object.assign(new EventEmitter(), {
			destroy: () => {
				destroyed = true;
			},
		});
		const pending = trackArchiveCompletion(
			archive as never,
			output as never,
			"/tmp/test.zip",
		);
		const assertion = expect(pending).rejects.toThrow(
			"Error creating ZIP file",
		);
		archive.emit("error", new Error("boom"));
		await assertion;
		expect(destroyed).toBe(true);
	});

	it("resolves when the output stream closes", async () => {
		const archive = new EventEmitter();
		const output = Object.assign(new EventEmitter(), { destroy: () => {} });
		const pending = trackArchiveCompletion(
			archive as never,
			output as never,
			"/tmp/test.zip",
		);
		output.emit("close");
		await expect(pending).resolves.toBe("/tmp/test.zip");
	});
});

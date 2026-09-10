/**
 * Tests for errorMiddleware.ts — production-safe error responses.
 * Regression (audit MEDIUM): the handler must never throw while handling an
 * error, and must not echo internal/upload error messages to clients in
 * production.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { errorHandler } from "../middlewares/errorMiddleware.js";

const buildRes = () => {
	const res: Record<string, unknown> = {};
	res.status = vi.fn().mockReturnValue(res);
	res.json = vi.fn().mockReturnValue(res);
	return res as unknown as {
		status: ReturnType<typeof vi.fn>;
		json: ReturnType<typeof vi.fn>;
	};
};

const req = {} as never;
const next = (() => {}) as never;

describe("errorHandler", () => {
	const OLD_ENV = process.env.NODE_ENV;

	beforeEach(() => {
		process.env.NODE_ENV = "production";
	});

	afterEach(() => {
		process.env.NODE_ENV = OLD_ENV;
	});

	it("does not throw when the thrown value is not an Error", () => {
		// Arrange
		const res = buildRes();
		// Act + Assert: must respond 500 instead of throwing a TypeError.
		expect(() =>
			errorHandler("boom" as never, req, res as never, next),
		).not.toThrow();
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ success: false }),
		);
	});

	it("does not echo upload error messages verbatim in production", () => {
		// Arrange
		const res = buildRes();
		const err = new Error(
			"MulterError: File too large for field 'images[0]' (limit 10485760 bytes)",
		);
		err.name = "MulterError";
		// Act
		errorHandler(err, req, res as never, next);
		// Assert
		expect(res.status).toHaveBeenCalledWith(400);
		const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
			error: { message: string };
		};
		expect(body.error.message).not.toContain(".png");
		expect(body.error.message).toBe("File upload error");
	});
});

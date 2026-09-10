/**
 * Tests for toPublicErrorBody (apiError.ts).
 * Regression (audit MEDIUM): unexpected internal failures must surface a
 * generic message in production; internal details (messages, paths) are only
 * exposed when NODE_ENV=development.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AppError, toPublicErrorBody } from "../utils/apiError.js";

describe("toPublicErrorBody", () => {
	const OLD_ENV = process.env.NODE_ENV;

	beforeEach(() => {
		process.env.NODE_ENV = "production";
	});

	afterEach(() => {
		process.env.NODE_ENV = OLD_ENV;
	});

	it("returns a generic message for unexpected errors in production", () => {
		const body = toPublicErrorBody(new Error("/tmp/secret.png EACCES"));
		expect(body.message).toBe("Error processing images");
		expect(body.details).toBeUndefined();
	});

	it("exposes internal details only in development", () => {
		process.env.NODE_ENV = "development";
		const body = toPublicErrorBody(new Error("/tmp/secret.png EACCES"));
		expect(body.details).toContain("/tmp/secret.png");
	});

	it("keeps AppError messages but hides their details in production", () => {
		const body = toPublicErrorBody(
			new AppError("Invalid conversion options", 400, {
				code: "VALIDATION_ERROR",
				details: { field: "width" },
			}),
		);
		expect(body.message).toBe("Invalid conversion options");
		expect(body.code).toBe("VALIDATION_ERROR");
		expect(body.details).toBeUndefined();
	});
});

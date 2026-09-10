/**
 * Tests for the conversion options schema (imageController.ts).
 * Regression (audit BUG): `z.coerce.boolean()` parses the string "false"
 * as true, so maintainAspectRatio can never be disabled from form data.
 */
import { describe, it, expect } from "vitest";
import { conversionOptionsSchema } from "../controllers/imageController.js";

describe("conversionOptionsSchema", () => {
	it('parses the string "false" as false', () => {
		const result = conversionOptionsSchema.safeParse({
			format: "jpeg",
			maintainAspectRatio: "false",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.maintainAspectRatio).toBe(false);
		}
	});

	it('parses the string "true" as true and defaults to true', () => {
		const withTrue = conversionOptionsSchema.safeParse({
			format: "jpeg",
			maintainAspectRatio: "true",
		});
		expect(withTrue.success).toBe(true);
		if (withTrue.success) {
			expect(withTrue.data.maintainAspectRatio).toBe(true);
		}
		const missing = conversionOptionsSchema.safeParse({ format: "jpeg" });
		expect(missing.success).toBe(true);
		if (missing.success) {
			expect(missing.data.maintainAspectRatio).toBe(true);
		}
	});
});

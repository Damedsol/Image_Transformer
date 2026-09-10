/**
 * Tests for the conversion rate limiter key (imageRoutes.ts).
 * Regression (audit MEDIUM): the strict /convert limiter must key on IP
 * only — User-Agent is attacker-controlled and rotating it must not reset
 * the limit.
 */
import { describe, it, expect } from "vitest";
import { convertRateLimitKey } from "../routes/imageRoutes.js";

const reqWithUA = (ua: string) =>
	({ ip: "9.9.9.9", headers: { "user-agent": ua } }) as never;

describe("convertRateLimitKey", () => {
	it("ignores User-Agent so rotating it cannot bypass the limit", () => {
		expect(convertRateLimitKey(reqWithUA("A"))).toBe(
			convertRateLimitKey(reqWithUA("B")),
		);
	});

	it("keys IPv6 clients by subnet", () => {
		const first = convertRateLimitKey({
			ip: "2001:db8:abcd:0012::1",
			headers: {},
		} as never);
		const sameSubnet = convertRateLimitKey({
			ip: "2001:db8:abcd:0012::2",
			headers: {},
		} as never);
		expect(sameSubnet).toBe(first);
	});
});

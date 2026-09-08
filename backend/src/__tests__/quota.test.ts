/**
 * Tests for the bounded in-memory IP quota store (quota.ts).
 * Regression (ses_fbb1 audit, LOW #11): the daily per-IP quota Map must not
 * grow unbounded — entries are capped and evicted (expired first, then LRU)
 * while the daily count/reset semantics stay intact.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { QuotaStore } from "../utils/quota.js";

beforeEach(() => {
	vi.useRealTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("QuotaStore", () => {
	it("allows requests below the daily limit and blocks at the limit", () => {
		// Arrange
		const store = new QuotaStore({ maxEntries: 10 });
		// Act + Assert
		expect(store.checkAndConsume("1.1.1.1", 2)).toBe(true);
		expect(store.checkAndConsume("1.1.1.1", 2)).toBe(true);
		expect(store.checkAndConsume("1.1.1.1", 2)).toBe(false);
	});

	it("tracks quotas independently per IP", () => {
		// Arrange
		const store = new QuotaStore({ maxEntries: 10 });
		// Act
		expect(store.checkAndConsume("1.1.1.1", 1)).toBe(true);
		// Assert
		expect(store.checkAndConsume("1.1.1.1", 1)).toBe(false);
		expect(store.checkAndConsume("2.2.2.2", 1)).toBe(true);
	});

	it("resets the counter on a new day", () => {
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 7, 27, 12, 0, 0));
		const store = new QuotaStore({ maxEntries: 10 });
		expect(store.checkAndConsume("1.1.1.1", 1)).toBe(true);
		expect(store.checkAndConsume("1.1.1.1", 1)).toBe(false);
		// Act: move to the next day
		vi.setSystemTime(new Date(2026, 7, 28, 12, 0, 0));
		// Assert
		expect(store.checkAndConsume("1.1.1.1", 1)).toBe(true);
	});

	it("evicts the least-recently-used entry when maxEntries is exceeded", () => {
		// Arrange
		const store = new QuotaStore({ maxEntries: 2 });
		store.checkAndConsume("old-ip", 100);
		store.checkAndConsume("new-ip", 100);
		// Act: a third IP forces eviction of the LRU entry ("old-ip")
		store.checkAndConsume("third-ip", 100);
		// Assert
		expect(store.size).toBe(2);
		expect(store.has("old-ip")).toBe(false);
		expect(store.has("new-ip")).toBe(true);
		expect(store.has("third-ip")).toBe(true);
	});

	it("evicts expired entries before live ones when full", () => {
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 7, 27, 12, 0, 0));
		const store = new QuotaStore({ maxEntries: 2 });
		store.checkAndConsume("stale-ip", 100);
		store.checkAndConsume("live-ip", 100);
		// Act: the stale entry expires overnight; live-ip is touched on day 2
		// so it stays live, then a new IP arrives
		vi.setSystemTime(new Date(2026, 7, 28, 12, 0, 0));
		store.checkAndConsume("live-ip", 100);
		store.checkAndConsume("fresh-ip", 100);
		// Assert: the expired entry was evicted, the live one survived
		expect(store.size).toBe(2);
		expect(store.has("stale-ip")).toBe(false);
		expect(store.has("live-ip")).toBe(true);
		expect(store.has("fresh-ip")).toBe(true);
	});

	it("never exceeds maxEntries even with a maxEntries of 1", () => {
		// Arrange
		const store = new QuotaStore({ maxEntries: 1 });
		// Act
		store.checkAndConsume("1.1.1.1", 100);
		store.checkAndConsume("2.2.2.2", 100);
		// Assert
		expect(store.size).toBe(1);
		expect(store.has("2.2.2.2")).toBe(true);
	});
});

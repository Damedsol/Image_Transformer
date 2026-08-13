/**
 * Tests for tempCleanup.ts — orphaned temp file management.
 * Regression: files left in backend/temp (uploads/output) after a process
 * restart must be swept by startup + periodic cleanup. TTL timers alone are
 * lost on crash, leaking files on the server.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
	isFileExpired,
	isWithinTemp,
	cleanupDirectory,
} from "../utils/tempCleanup.js";

const tempRoots: string[] = [];

const makeTempDir = (): string => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "imgtrans-test-"));
	tempRoots.push(dir);
	return dir;
};

const touchFile = (dir: string, name: string, mtimeMs: number): string => {
	const filePath = path.join(dir, name);
	fs.writeFileSync(filePath, "x");
	fs.utimesSync(filePath, new Date(mtimeMs), new Date(mtimeMs));
	return filePath;
};

afterEach(() => {
	for (const dir of tempRoots.splice(0)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

describe("isFileExpired", () => {
	it("returns true when the file is older than the max age", () => {
		expect(isFileExpired(1_000, 10_000, 5_000)).toBe(true);
	});

	it("returns false when the file is newer than the max age", () => {
		expect(isFileExpired(9_000, 10_000, 5_000)).toBe(false);
	});

	it("returns false when exactly at the max age boundary", () => {
		expect(isFileExpired(5_000, 10_000, 5_000)).toBe(false);
	});
});

describe("isWithinTemp", () => {
	it("accepts the temp root itself", () => {
		const dir = makeTempDir();
		expect(isWithinTemp(dir)).toBe(false); // outside the real backend/temp
		expect(isWithinTemp(path.join(process.cwd(), "backend", "temp"))).toBe(
			true,
		);
	});

	it("rejects paths outside the temp directory", () => {
		expect(isWithinTemp(os.tmpdir())).toBe(false);
	});
});

describe("cleanupDirectory", () => {
	it("removes only expired regular files and returns the count", () => {
		const dir = makeTempDir();
		const now = 100_000;
		touchFile(dir, "old.txt", now - 60_000); // expired (60s old, maxAge 10s)
		touchFile(dir, "new.txt", now - 1_000); // fresh

		const removed = cleanupDirectory(dir, 10_000, now);

		expect(removed).toBe(1);
		expect(fs.existsSync(path.join(dir, "old.txt"))).toBe(false);
		expect(fs.existsSync(path.join(dir, "new.txt"))).toBe(true);
	});

	it("does not touch files inside subdirectories", () => {
		const dir = makeTempDir();
		const sub = path.join(dir, "sub");
		fs.mkdirSync(sub);
		touchFile(sub, "nested.txt", 1_000); // very old

		const removed = cleanupDirectory(dir, 10_000, 100_000);

		expect(removed).toBe(0);
		expect(fs.existsSync(path.join(sub, "nested.txt"))).toBe(true);
	});

	it("removes every file when maxAge is 0 (startup sweep)", () => {
		const dir = makeTempDir();
		touchFile(dir, "a.zip", 1_000);
		touchFile(dir, "b.webp", 2_000);

		const removed = cleanupDirectory(dir, 0, 100_000);

		expect(removed).toBe(2);
		expect(fs.readdirSync(dir)).toHaveLength(0);
	});

	it("returns 0 and does not throw when the directory does not exist", () => {
		const dir = path.join(os.tmpdir(), "imgtrans-missing-" + Date.now());
		expect(cleanupDirectory(dir, 10_000, 100_000)).toBe(0);
	});
});

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import logger from "./logger.js";

// Create equivalents to __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const tempDir = path.join(__dirname, "../../temp");
export const uploadsDir = path.join(tempDir, "uploads");
export const outputDir = path.join(tempDir, "output");

/**
 * True when dirPath is the temp root or a directory inside it.
 * Used to guarantee cleanup never operates outside the temp folder.
 */
export const isWithinTemp = (dirPath: string): boolean => {
	const normalized = path.normalize(dirPath);
	const normalizedTemp = path.normalize(tempDir);
	return (
		normalized === normalizedTemp ||
		normalized.startsWith(normalizedTemp + path.sep)
	);
};

/**
 * Pure predicate: true when a file mtime is older than maxAgeMs.
 */
export const isFileExpired = (
	mtimeMs: number,
	nowMs: number,
	maxAgeMs: number,
): boolean => nowMs - mtimeMs > maxAgeMs;

/**
 * Removes regular files inside dirPath whose mtime is older than maxAgeMs.
 * Does NOT recurse into subdirectories and never follows symlinks.
 * Returns the number of files removed.
 */
export const cleanupDirectory = (
	dirPath: string,
	maxAgeMs: number,
	nowMs = Date.now(),
): number => {
	let removed = 0;
	let entries: string[] = [];
	try {
		entries = fs.readdirSync(dirPath);
	} catch (error) {
		logger.warn(
			{ err: error, dirPath },
			"Could not read temp directory for cleanup",
		);
		return 0;
	}

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry);
		try {
			const stats = fs.lstatSync(fullPath);
			if (!stats.isFile()) continue; // never touch subdirs or symlinks
			if (isFileExpired(stats.mtimeMs, nowMs, maxAgeMs)) {
				fs.unlinkSync(fullPath);
				removed += 1;
				logger.info({ file: fullPath }, "Removed expired temp file");
			}
		} catch (error) {
			logger.warn({ err: error, file: fullPath }, "Could not remove temp file");
		}
	}
	return removed;
};

/**
 * Removes every file currently left in the upload/output dirs.
 * Run once at startup: a fresh process cannot have pending downloads from a
 * previous session, so anything left there is orphaned (e.g. timers lost on
 * crash/restart).
 */
export const cleanupStartup = (): void => {
	const removedUploads = cleanupDirectory(uploadsDir, 0);
	const removedOutput = cleanupDirectory(outputDir, 0);
	logger.info(
		{ removedUploads, removedOutput },
		"Startup temp directory cleanup completed",
	);
};

/**
 * Schedules a periodic sweep that removes files older than maxAgeMs.
 * Covers files whose TTL timer was lost (crash, restart, SIGTERM) and any
 * other orphaned artifacts. The timer is unref'd so it never keeps the
 * process alive.
 */
export const schedulePeriodicCleanup = (
	intervalMs: number,
	maxAgeMs: number,
): NodeJS.Timeout => {
	const timer = setInterval(() => {
		const removedUploads = cleanupDirectory(uploadsDir, maxAgeMs);
		const removedOutput = cleanupDirectory(outputDir, maxAgeMs);
		if (removedUploads + removedOutput > 0) {
			logger.info(
				{ removedUploads, removedOutput },
				"Periodic temp cleanup removed files",
			);
		}
	}, intervalMs);
	timer.unref();
	return timer;
};

/**
 * Bounded in-memory store for the daily per-IP processing quota.
 * The store caps the number of tracked IPs: when full, expired entries
 * (previous day) are evicted first, then the least-recently-used entry.
 * Quotas are intentionally not persisted across restarts (same as before).
 */
export interface QuotaEntry {
	count: number;
	resetAt: Date;
}

export interface QuotaStoreOptions {
	maxEntries?: number;
}

const DEFAULT_MAX_ENTRIES = 10_000;

const startOfToday = (now: Date): Date =>
	new Date(now.getFullYear(), now.getMonth(), now.getDate());

export class QuotaStore {
	private readonly maxEntries: number;
	private readonly entries = new Map<string, QuotaEntry>();

	constructor(options: QuotaStoreOptions = {}) {
		this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
	}

	get size(): number {
		return this.entries.size;
	}

	has(ip: string): boolean {
		return this.entries.has(ip);
	}

	/**
	 * Check the quota for an IP and consume one unit when available.
	 * @returns true if the IP has available quota, false if exhausted.
	 */
	checkAndConsume(ip: string, limit: number): boolean {
		const today = startOfToday(new Date());
		let entry = this.entries.get(ip);

		if (!entry || entry.resetAt < today) {
			entry = { count: 0, resetAt: today };
			this.insert(ip, entry);
		} else {
			// Refresh recency so active IPs survive LRU eviction.
			this.entries.delete(ip);
			this.entries.set(ip, entry);
		}

		if (entry.count >= limit) {
			return false;
		}

		entry.count += 1;
		return true;
	}

	private insert(ip: string, entry: QuotaEntry): void {
		if (!this.entries.has(ip)) {
			this.evictIfFull();
		}
		this.entries.set(ip, entry);
	}

	private evictIfFull(): void {
		if (this.entries.size < this.maxEntries) {
			return;
		}
		const today = startOfToday(new Date());
		for (const [key, entry] of this.entries) {
			if (entry.resetAt < today) {
				this.entries.delete(key);
			}
		}
		while (this.entries.size >= this.maxEntries) {
			const oldest = this.entries.keys().next();
			if (oldest.done) {
				return;
			}
			this.entries.delete(oldest.value);
		}
	}
}

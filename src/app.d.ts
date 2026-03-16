declare global {
	namespace App {
		interface Platform {
			env: {
				DB: import('@cloudflare/workers-types').D1Database;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};

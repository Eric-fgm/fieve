abstract class Session {
	public abstract run(sql: string, params?: unknown[]): unknown;
	public abstract get<T extends Record<string, unknown>>(sql: string, params?: unknown[]): T | null;
	public abstract all<T extends Record<string, unknown>>(sql: string, params?: unknown[]): T[];
	public abstract prepare(
		sql: string,
		params: unknown[],
	): {
		run: () => unknown;
		get: <T extends Record<string, unknown>>() => T | null;
		all: <T extends Record<string, unknown>>() => T[];
	};
}

export default Session;

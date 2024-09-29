import type { Redis, RedisOptions } from "ioredis";

export namespace Store {
	export type Config = Omit<RedisOptions, "db">;

	export type Instance = {
		set: Redis["set"];
		get: Redis["get"];
		del: (...args: [...keys: string[]]) => Promise<number>;
	};
}

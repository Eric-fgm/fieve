import Redis from "ioredis";

import type { Database, Store } from "@/types";

const createStore = (config: Store.Config | { db: Database.Instance }): Store.Instance => {
	if ("db" in config) {
		const { db } = config;
		return {
			get: async (key: string) => {
				const result = await db.findOne("store").where({ "store.key": { "==": key } });
				return result ? result.value : null;
			},
			set: async (key: string, value: string) => {
				await db.insert("store").values({ key, value });
				return "OK";
			},
			del: async (...keys: string[]) => {
				await Promise.all(keys.map((key) => db.delete("store").where({ key: { "==": key } })));
				return keys.length;
			},
		};
	}

	return new Redis(config);
};

export default createStore;

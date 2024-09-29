import { Database as SQLiteDatabase } from "bun:sqlite";
import { createDatabase as createOrm } from "@fieve/orm";

import * as schema from "@/database/schema";

import type { Database } from "@/types/database";

const createDatabase = (config: Database.Config) => {
	const { path, options } = config;

	const client = new SQLiteDatabase(path, options);

	return createOrm(client, schema);
};

export default createDatabase;

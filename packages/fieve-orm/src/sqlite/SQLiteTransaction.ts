import SQLiteDatabase from "@/sqlite/SQLiteDatabase";

import type SQLiteTable from "@/sqlite/SQLiteTable";
import type SQLiteSession from "@/sqlite/SQLiteSession";
import type { Schema } from "@/types";

abstract class SQLiteTransaction<TSchema extends Schema<SQLiteTable>> extends SQLiteDatabase<TSchema> {
	protected nestedIndex;

	constructor(schema: TSchema, session: SQLiteSession<TSchema>, nestedIndex = 0) {
		super(schema, session);
		this.nestedIndex = nestedIndex;
	}

	public rollback() {
		throw new Error("rollback");
	}
}

export default SQLiteTransaction;

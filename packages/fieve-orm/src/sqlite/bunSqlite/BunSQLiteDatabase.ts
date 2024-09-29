import { createDatabase } from "@/sqlite/bunSqlite";
import SQLiteDatabase from "@/sqlite/SQLiteDatabase";
import BunSQLiteSession from "@/sqlite/bunSqlite/BunSQLiteSession";

import type { Database } from "bun:sqlite";
import type SQLiteTable from "@/sqlite/SQLiteTable";
import type { RawSchema, Schema } from "@/types";

class BunSQLiteDatabase<TSchema extends Schema<SQLiteTable>> extends SQLiteDatabase<TSchema> {
	private client: Database;

	constructor(client: Database, schema: TSchema) {
		super(schema, new BunSQLiteSession(client, schema));
		this.client = client;
	}

	public merge<TRawSchema extends RawSchema<SQLiteTable>>(newSchema: TRawSchema) {
		const oldSchema = { ...this.schema.tables, ...this.schema.relations };

		for (const key in newSchema) {
			if (oldSchema[key]) {
				console.warn(`Table or Relations "${key}" has been overwritten`);
			}
		}

		const mergedSchema = { ...oldSchema, ...newSchema };

		return createDatabase(this.client, mergedSchema);
	}
}

export default BunSQLiteDatabase;

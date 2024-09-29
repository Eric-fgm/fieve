import SQLiteInsertQuery from "@/sqlite/queryBuilders/SQLiteInsertQuery";
import SQLiteSelectQuery from "@/sqlite/queryBuilders/SQLiteSelectQuery";
import SQLiteUpdateQuery from "@/sqlite/queryBuilders/SQLiteUpdateQuery";
import SQLiteDeleteQuery from "@/sqlite/queryBuilders/SQLiteDeleteQuery";

import type SQLiteSession from "@/sqlite/SQLiteSession";
import type SQLiteTransaction from "@/sqlite/SQLiteTransaction";
import type SQLiteTable from "@/sqlite/SQLiteTable";
import type { Schema, Prettify } from "@/types";

class SQLiteDatabase<TSchema extends Schema<SQLiteTable>> {
	protected schema: TSchema;
	protected session: SQLiteSession<TSchema>;

	declare readonly $inferSelect: { [K in keyof TSchema["tables"]]: TSchema["tables"][K]["$inferSelect"] };
	declare readonly $inferInsert: Prettify<{ [K in keyof TSchema["tables"]]: TSchema["tables"][K]["$inferInsert"] }>;

	constructor(schema: TSchema, session: SQLiteSession<TSchema>) {
		this.schema = schema;
		this.session = session;
	}

	public findOne<K extends keyof TSchema["tables"]>(tableName: K) {
		const selectedTable = (this.schema.tables as TSchema["tables"])[tableName];
		return new SQLiteSelectQuery(this.session, selectedTable, this.schema, "one");
	}

	public findAll<K extends keyof TSchema["tables"]>(tableName: K) {
		const selectedTable = (this.schema.tables as TSchema["tables"])[tableName];
		return new SQLiteSelectQuery(this.session, selectedTable, this.schema, "many");
	}

	public insert<K extends keyof TSchema["tables"]>(tableName: K) {
		const selectedTable = (this.schema.tables as TSchema["tables"])[tableName];
		return new SQLiteInsertQuery(this.session, selectedTable);
	}

	public update<K extends keyof TSchema["tables"]>(tableName: K) {
		const selectedTable = (this.schema.tables as TSchema["tables"])[tableName];
		return new SQLiteUpdateQuery(this.session, selectedTable);
	}

	public delete<K extends keyof TSchema["tables"]>(tableName: K) {
		const selectedTable = (this.schema.tables as TSchema["tables"])[tableName];
		return new SQLiteDeleteQuery(this.session, selectedTable);
	}

	public transaction<T>(transaction: (tx: SQLiteTransaction<TSchema>) => T) {
		return this.session.transaction(transaction);
	}

	public raw(sql: string, params?: unknown[]) {
		return this.session.run(sql, params);
	}
}

export default SQLiteDatabase;

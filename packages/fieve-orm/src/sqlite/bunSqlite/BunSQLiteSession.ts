import SQLiteSession from "@/sqlite/SQLiteSession";
import BunSQLiteTransaction from "@/sqlite/bunSqlite/BunSQLiteTransaction";

import type { Database } from "bun:sqlite";
import type SQLiteTable from "@/sqlite/SQLiteTable";
import type SQLiteTransaction from "@/sqlite/SQLiteTransaction";
import type { Schema } from "@/types";

class BunSQLiteSession<TSchema extends Schema<SQLiteTable>> extends SQLiteSession<TSchema> {
	private client: Database;
	private schema: TSchema;

	constructor(client: Database, schema: TSchema) {
		super();
		this.client = client;
		this.schema = schema;
	}

	public override run(sql: string, params: unknown[] = []) {
		return this.client.query(sql).run(...(params as never)) as {
			changes: number;
			lastInsertRowid: number | bigint;
		};
	}

	public override get<TResult extends Record<string, unknown>>(sql: string, params: unknown[] = []) {
		return this.client.query<TResult, never>(sql).get(...(params as never));
	}

	public override all<TResult extends Record<string, unknown>>(sql: string, params: unknown[] = []) {
		return this.client.query<TResult, never>(sql).all(...(params as never));
	}

	public override prepare(
		sql: string,
		params: unknown[],
	): {
		run: () => unknown;
		get: <T extends Record<string, unknown>>() => T | null;
		all: <T extends Record<string, unknown>>() => T[];
	} {
		return { run: () => this.run(sql, params), get: () => this.get(sql, params), all: () => this.all(sql, params) };
	}

	public override transaction<T>(transaction: (tx: SQLiteTransaction<TSchema>) => T): T {
		const tx = new BunSQLiteTransaction(this.schema, this);
		let result: T | undefined;
		const nativeTx = this.client.transaction(() => {
			result = transaction(tx);
		});
		nativeTx.deferred();
		return result as T;
	}
}

export default BunSQLiteSession;

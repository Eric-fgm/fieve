import Session from "@/core/Session";

import type SQLiteTransaction from "@/sqlite/SQLiteTransaction";
import type SQLiteTable from "@/sqlite/SQLiteTable";
import type { Schema } from "@/types";

abstract class SQLiteSession<TSchema extends Schema<SQLiteTable>> extends Session {
	public abstract transaction<T>(transaction: (tx: SQLiteTransaction<TSchema>) => T): T;
}

export default SQLiteSession;

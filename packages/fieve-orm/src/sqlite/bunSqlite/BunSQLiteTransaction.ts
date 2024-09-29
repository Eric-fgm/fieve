import SQLiteTransaction from "@/sqlite/SQLiteTransaction";

import type SQLiteTable from "@/sqlite/SQLiteTable";
import type { Schema } from "@/types";

class BunSQLiteTransaction<TSchema extends Schema<SQLiteTable>> extends SQLiteTransaction<TSchema> {
	public override transaction<T>(transaction: (tx: BunSQLiteTransaction<TSchema>) => T): T {
		const savepointName = `sp${this.nestedIndex}`;
		const tx = new BunSQLiteTransaction(this.schema, this.session, this.nestedIndex + 1);
		this.session.run(`savepoint ${savepointName}`);
		try {
			const result = transaction(tx);
			this.session.run(`release savepoint ${savepointName}`);
			return result;
		} catch (err) {
			this.session.run(`rollback to savepoint ${savepointName}`);
			throw err;
		}
	}
}

export default BunSQLiteTransaction;

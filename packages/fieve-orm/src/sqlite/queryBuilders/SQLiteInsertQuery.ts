import Dialect from "@/core/Dialect";
import QueryPromise from "@/core/QueryPromise";

import type Session from "@/core/Session";
import type { ReturningStatement, ValuesStatement } from "@/core/Dialect";
import type SQLiteTable from "@/sqlite/SQLiteTable";

type InsertQueryResult<
	TTable extends SQLiteTable,
	TMode,
	TReturning extends ReturningStatement,
	TResult = {
		[K in keyof TReturning as TReturning[K] extends true ? K : never]: K extends keyof TTable["$inferSelect"]
			? TTable["$inferSelect"][K]
			: never;
	},
> = TMode extends "one" ? TResult : TResult[];

class SQLiteInsertQuery<
	TTable extends SQLiteTable = SQLiteTable,
	TMode extends "one" | "many" = "one",
	TReturning extends ReturningStatement | undefined = undefined,
	TResult = TReturning extends ReturningStatement ? InsertQueryResult<TTable, TMode, TReturning> : unknown,
> extends QueryPromise<TResult> {
	private dialect = new Dialect();
	private session: Session;
	private table: TTable;
	private state: {
		values?: ValuesStatement;
		returning?: ReturningStatement;
	};

	constructor(session: Session, table: TTable) {
		super();
		this.session = session;
		this.table = table;
		this.state = {};
	}

	public values<
		TColumns extends keyof TTable["$inferSelect"],
		TValue extends Pick<TTable["$inferInsert"], TColumns>,
		TStatement extends TValue | TValue[],
	>(statement: TStatement) {
		this.state.values = statement;

		return this as SQLiteInsertQuery<TTable, TStatement extends unknown[] ? "many" : "one">;
	}

	public returning<TReturning extends ReturningStatement<keyof TTable["$inferSelect"]>>(statement?: TReturning) {
		this.state.returning = statement;
		return this as SQLiteInsertQuery<TTable, TMode, TReturning>;
	}

	public async execute() {
		if (!this.state.values) {
			throw new Error("No values found");
		}

		const { sql, params, parseRow } = this.dialect.parseInsertQuery(
			this.table,
			this.state.values,
			this.state.returning,
		);

		const preparedQuery = this.session.prepare(sql, params);

		if (Array.isArray(this.state.values)) {
			const rows = preparedQuery.all();
			return rows.map(parseRow) as TResult;
		}

		return parseRow(preparedQuery.get()) as TResult;
	}
}

export default SQLiteInsertQuery;

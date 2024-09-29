import Dialect from "@/core/Dialect";
import QueryPromise from "@/core/QueryPromise";

import type Session from "@/core/Session";
import type { ReturningStatement, SetsStatement, WhereStatement } from "@/core/Dialect";
import type SQLiteTable from "@/sqlite/SQLiteTable";
import type { Prettify } from "@/types";

type UpdateQueryResult<TTable extends SQLiteTable, TReturning extends ReturningStatement> = Prettify<{
	[K in keyof TReturning as TReturning[K] extends true ? K : never]: K extends keyof TTable["$inferSelect"]
		? TTable["$inferSelect"][K]
		: never;
}>;

class SQLiteUpdateQuery<
	TTable extends SQLiteTable = SQLiteTable,
	TReturning extends ReturningStatement | undefined = undefined,
	TResult = TReturning extends ReturningStatement ? UpdateQueryResult<TTable, TReturning> : unknown,
> extends QueryPromise<TResult> {
	private dialect = new Dialect();
	private session: Session;
	private table: TTable;
	private state: {
		sets?: SetsStatement;
		where?: WhereStatement;
		returning?: ReturningStatement;
	};

	constructor(session: Session, table: TTable) {
		super();
		this.session = session;
		this.table = table;
		this.state = {};
	}

	public sets<TColumns extends keyof TTable["$inferSelect"]>(
		statement: Partial<Pick<TTable["$inferSelect"], TColumns>>,
	) {
		this.state.sets = Object.fromEntries(Object.entries(statement).filter(([_, value]) => value !== undefined));

		return this;
	}

	public where(statement: WhereStatement<TTable["$inferSelect"]>) {
		this.state.where = statement;

		return this;
	}

	public returning<TReturning extends ReturningStatement<keyof TTable["$inferSelect"]>>(statement: TReturning) {
		this.state.returning = statement;

		return this as SQLiteUpdateQuery<TTable, TReturning>;
	}

	public async execute() {
		if (!this.state.sets) {
			throw new Error("No sets found");
		}

		const { sql, params, parseRow } = this.dialect.parseUpdateQuery(
			this.table,
			this.state.sets,
			this.state.where,
			this.state.returning,
		);

		const preparedQuery = this.session.prepare(sql, params);

		return parseRow(preparedQuery.get()) as TResult;
	}
}

export default SQLiteUpdateQuery;

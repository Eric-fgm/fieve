import Dialect from "@/core/Dialect";
import QueryPromise from "@/core/QueryPromise";

import type Session from "@/core/Session";
import type { FieldsStatement, ReturningStatement, WhereStatement } from "@/core/Dialect";
import type SQLiteTable from "@/sqlite/SQLiteTable";
import type { Prettify } from "@/types";

type DeleteQueryResult<TTable extends SQLiteTable, TReturning extends ReturningStatement> = Prettify<{
	[K in keyof TReturning as TReturning[K] extends true ? K : never]: K extends keyof TTable["$inferSelect"]
		? TTable["$inferSelect"][K]
		: never;
}>;

class SQLiteDeleteQuery<
	TTable extends SQLiteTable = SQLiteTable,
	TReturning extends ReturningStatement | undefined = undefined,
	TResult = TReturning extends ReturningStatement ? DeleteQueryResult<TTable, TReturning> : unknown,
> extends QueryPromise<TResult> {
	private dialect = new Dialect();
	private session: Session;
	private table: TTable;
	private state: {
		fields?: FieldsStatement;
		where?: WhereStatement;
		returning?: ReturningStatement;
	};

	constructor(session: Session, table: TTable) {
		super();
		this.session = session;
		this.table = table;
		this.state = {};
	}

	public where(statement: WhereStatement<TTable["$inferSelect"]>) {
		this.state.where = statement;

		return this;
	}

	public returning<TReturning extends ReturningStatement<keyof TTable["$inferSelect"]>>(statement?: TReturning) {
		this.state.returning = statement;

		return this as SQLiteDeleteQuery<TTable, TReturning>;
	}

	public async execute() {
		const { sql, params, parseRow } = this.dialect.parseDeleteQuery(this.table, this.state.where, this.state.returning);

		const preparedQuery = this.session.prepare(sql, params);

		return parseRow(preparedQuery.get()) as TResult;
	}
}

export default SQLiteDeleteQuery;

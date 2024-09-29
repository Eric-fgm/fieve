import SQLiteColumnBuilder from "@/sqlite/columns/SQLiteColumnBuilder";
import SQLiteIntegerColumn from "@/sqlite/columns/SQLiteIntegerColumn";

import type { NotNull, HasDefault } from "@/core/ColumnBuilder";
import type { SQLiteIntegerColumnProps } from "@/sqlite/columns/SQLiteIntegerColumn";

class SQLiteIntegerColumnBuilder<
	TProps extends SQLiteIntegerColumnProps = SQLiteIntegerColumnProps,
> extends SQLiteColumnBuilder<TProps> {
	constructor(table: TProps["table"], name: TProps["name"]) {
		super(table, name, "integer");
	}

	public primaryKey(): HasDefault<NotNull<this>> {
		this.state.hasDefault = true;
		this.state.primaryKey = true;
		this.state.notNull = true;
		return this as HasDefault<NotNull<this>>;
	}

	public override build() {
		return new SQLiteIntegerColumn<this["_"]>(
			this.state.table,
			this.state.name,
			this.state.unique,
			this.state.notNull,
			this.state.hasDefault,
			this.state.defaultValue,
			this.state.references,
			this.state.hasReferences,
			this.state.primaryKey,
		);
	}
}

export default SQLiteIntegerColumnBuilder;

import SQLiteColumnBuilder from "@/sqlite/columns/SQLiteColumnBuilder";
import SQLiteBooleanColumn from "@/sqlite/columns/SQLiteBooleanColumn";

import type { SQLiteBooleanColumnProps } from "@/sqlite/columns/SQLiteBooleanColumn";

class SQLiteBooleanColumnBuilder<
	TProps extends SQLiteBooleanColumnProps = SQLiteBooleanColumnProps,
> extends SQLiteColumnBuilder<TProps> {
	constructor(table: TProps["table"], name: TProps["name"]) {
		super(table, name, "integer");
	}

	public override build() {
		return new SQLiteBooleanColumn<this["_"]>(
			this.state.table,
			this.state.name,
			this.state.unique,
			this.state.notNull,
			this.state.hasDefault,
			this.state.defaultValue,
			this.state.references,
			this.state.hasReferences,
		);
	}
}

export default SQLiteBooleanColumnBuilder;

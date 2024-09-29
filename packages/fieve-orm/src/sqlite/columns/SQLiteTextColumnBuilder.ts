import SQLiteColumnBuilder from "@/sqlite/columns/SQLiteColumnBuilder";
import SQLiteTextColumn, { type SQLiteTextColumnProps } from "@/sqlite/columns/SQLiteTextColumn";

class SQLiteTextColumnBuilder<
	TProps extends SQLiteTextColumnProps = SQLiteTextColumnProps,
> extends SQLiteColumnBuilder<TProps> {
	constructor(table: TProps["table"], name: TProps["name"]) {
		super(table, name, "text");
	}

	override build() {
		return new SQLiteTextColumn<this["_"]>(
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

export default SQLiteTextColumnBuilder;

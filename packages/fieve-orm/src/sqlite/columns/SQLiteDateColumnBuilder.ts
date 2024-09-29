import SQLiteColumnBuilder from "@/sqlite/columns/SQLiteColumnBuilder";
import SQLiteTextColumn, { type SQLiteDateColumnProps } from "@/sqlite/columns/SQLiteDateColumn";

class SQLiteDateColumnBuilder<
	TProps extends SQLiteDateColumnProps = SQLiteDateColumnProps,
> extends SQLiteColumnBuilder<TProps> {
	constructor(table: TProps["table"], name: TProps["name"]) {
		super(table, name, "integer");
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

export default SQLiteDateColumnBuilder;

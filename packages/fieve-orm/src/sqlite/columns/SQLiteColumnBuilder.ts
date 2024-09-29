import ColumnBuilder from "@/core/ColumnBuilder";
import SQLiteColumn, { type SQLiteColumnProps } from "@/sqlite/columns/SQLiteColumn";

type HasReferences<T extends ColumnBuilder> = T & {
	_: {
		hasReferences: true;
	};
};

class SQLiteColumnBuilder<TProps extends SQLiteColumnProps = SQLiteColumnProps> extends ColumnBuilder<TProps> {
	references(column: TProps["references"]): HasReferences<this> {
		this.state.references = column;
		this.state.hasReferences = true;
		return this as HasReferences<this>;
	}

	build() {
		return new SQLiteColumn<this["_"]>(
			this.state.table,
			this.state.name,
			this.state.datatype,
			this.state.unique,
			this.state.notNull,
			this.state.hasDefault,
			this.state.defaultValue,
			this.state.references,
			this.state.hasReferences,
		);
	}
}

export default SQLiteColumnBuilder;

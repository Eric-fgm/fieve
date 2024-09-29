import SQLiteColumn, { type SQLiteColumnProps } from "@/sqlite/columns/SQLiteColumn";

export interface SQLiteTextColumnProps extends SQLiteColumnProps {
	datatype: "text";
	defaultValue: string;
}

class SQLiteTextColumn<TProps extends SQLiteTextColumnProps = SQLiteTextColumnProps> extends SQLiteColumn<TProps> {
	constructor(
		table: TProps["table"],
		name: TProps["name"],
		unique: TProps["unique"],
		notNull: TProps["notNull"],
		hasDefault: TProps["hasDefault"],
		defaultValue: TProps["defaultValue"],
		references: TProps["references"],
		hasReferences: TProps["hasReferences"],
	) {
		super(table, name, "text", unique, notNull, hasDefault, defaultValue, references, hasReferences);
	}
}

export default SQLiteTextColumn;

import SQLiteColumn, { type SQLiteColumnProps } from "@/sqlite/columns/SQLiteColumn";

export interface SQLiteIntegerColumnProps extends SQLiteColumnProps {
	datatype: "integer";
	primaryKey: boolean;
	defaultValue: number;
}

class SQLiteIntegerColumn<
	TProps extends SQLiteIntegerColumnProps = SQLiteIntegerColumnProps,
> extends SQLiteColumn<TProps> {
	private primaryKey: TProps["primaryKey"];

	constructor(
		table: TProps["table"],
		name: TProps["name"],
		unique: TProps["unique"],
		notNull: TProps["notNull"],
		hasDefault: TProps["hasDefault"],
		defaultValue: TProps["defaultValue"],
		references: TProps["references"],
		hasReferences: TProps["hasReferences"],
		primaryKey: TProps["primaryKey"],
	) {
		super(table, name, "integer", unique, notNull, hasDefault, defaultValue, references, hasReferences);
		this.primaryKey = primaryKey;
	}

	public override toSQL(): string {
		const sqlChunks = [super.toSQL()];

		if (this.primaryKey) {
			sqlChunks.push("primary key");
		}

		return sqlChunks.join(" ");
	}
}

export default SQLiteIntegerColumn;

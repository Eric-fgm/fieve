import SQLiteColumn, { type SQLiteColumnProps } from "@/sqlite/columns/SQLiteColumn";

export interface SQLiteDateColumnProps extends SQLiteColumnProps {
	datatype: "integer";
	defaultValue: Date;
}

class SQLiteDateColumn<TProps extends SQLiteDateColumnProps = SQLiteDateColumnProps> extends SQLiteColumn<TProps> {
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
		super(table, name, "integer", unique, notNull, hasDefault, defaultValue, references, hasReferences);
	}

	public override mapTo(value: this["$infer"]): unknown {
		return value instanceof Date ? value.getTime() : value;
	}

	public override mapFrom(value: unknown): this["$infer"] {
		if (value === null) return null as this["$infer"];
		if (typeof value === "number") return new Date(value);
		return new Date();
	}
}

export default SQLiteDateColumn;

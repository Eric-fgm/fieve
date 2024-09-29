import SQLiteColumn, { type SQLiteColumnProps } from "@/sqlite/columns/SQLiteColumn";

export interface SQLiteBooleanColumnProps extends SQLiteColumnProps {
	datatype: "integer";
	defaultValue: boolean;
}

class SQLiteBooleanColumn<
	TProps extends SQLiteBooleanColumnProps = SQLiteBooleanColumnProps,
> extends SQLiteColumn<TProps> {
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
		if (value === null) return null;
		return Number(value);
	}

	public override mapFrom(value: unknown): this["$infer"] {
		if (value === null) return null as this["$infer"];
		if (value === 0) {
			return false;
		}
		return true;
	}
}

export default SQLiteBooleanColumn;

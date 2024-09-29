import type Table from "@/core/Table";

export interface ColumnProps {
	table: Table;
	name: string;
	datatype: "integer" | "text" | "real" | "blob";
	unique: boolean;
	notNull: boolean;
	hasDefault: boolean;
	defaultValue: unknown;
}

class Column<TProps extends ColumnProps = ColumnProps> {
	public table: TProps["table"];
	public name: TProps["name"];
	public datatype: TProps["datatype"];
	public unique: TProps["unique"];
	public notNull: TProps["notNull"];
	public hasDefault: TProps["hasDefault"];
	public defaultValue?: TProps["defaultValue"];

	declare readonly $infer: TProps["notNull"] extends true ? TProps["defaultValue"] : TProps["defaultValue"] | null;

	constructor(
		table: TProps["table"],
		name: TProps["name"],
		datatype: TProps["datatype"],
		unique: TProps["unique"],
		notNull: TProps["notNull"],
		hasDefault: TProps["hasDefault"],
		defaultValue: TProps["defaultValue"],
	) {
		this.table = table;
		this.name = name;
		this.datatype = datatype;
		this.unique = unique;
		this.notNull = notNull;
		this.hasDefault = hasDefault;
		this.defaultValue = defaultValue;
	}

	public toSQL(): string {
		const sqlChunks: string[] = [this.name, this.datatype];

		if (this.unique) {
			sqlChunks.push("unique");
		}
		if (this.notNull) {
			sqlChunks.push("not null");
		}
		if (this.defaultValue !== undefined) {
			const mappedDefaultValue = this.mapTo(this.defaultValue);
			sqlChunks.push(
				`default ${typeof mappedDefaultValue === "string" ? `'${mappedDefaultValue}'` : mappedDefaultValue}`,
			);
		}

		return sqlChunks.join(" ");
	}

	public mapTo(value: this["$infer"]) {
		return value as unknown;
	}

	public mapFrom(value: unknown) {
		return value as this["$infer"];
	}
}

export default Column;

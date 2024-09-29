import Column from "@/core/Column";

import type { ColumnProps } from "@/core/Column";
import type SQLiteTable from "@/sqlite/SQLiteTable";

export interface SQLiteColumnProps extends ColumnProps {
	table: SQLiteTable;
	references: SQLiteColumn | string;
	hasReferences: boolean;
}

class SQLiteColumn<TProps extends SQLiteColumnProps = SQLiteColumnProps> extends Column<TProps> {
	public references?: TProps["references"];
	public hasReferences: TProps["hasReferences"];

	constructor(
		table: TProps["table"],
		name: TProps["name"],
		datatype: TProps["datatype"],
		unique: TProps["unique"],
		notNull: TProps["notNull"],
		hasDefault: TProps["hasDefault"],
		defaultValue: TProps["defaultValue"],
		references: TProps["references"],
		hasReferences: TProps["hasReferences"],
	) {
		super(table, name, datatype, unique, notNull, hasDefault, defaultValue);
		this.references = references;
		this.hasReferences = hasReferences;
	}

	public override toSQL() {
		const sqlChunks = [super.toSQL()];

		if (this.references) {
			sqlChunks.push(
				`references ${typeof this.references === "string" ? this.references : `${this.references.table.name}(${this.references.name})`}`,
			);
		}

		return sqlChunks.join(" ");
	}
}

export default SQLiteColumn;

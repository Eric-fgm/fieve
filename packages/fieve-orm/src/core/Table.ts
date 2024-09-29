import type Column from "@/core/Column";
import type { Prettify } from "@/types";

export interface TableConstraints {
	primaryKeys?: Column[];
	foreignKeys?: {
		columns: Column[];
		foreignColumns: Column[];
	}[];
}

class Table<TOriginalName extends string = string, TColumns extends Record<string, Column> = Record<string, Column>> {
	public name!: string;
	public originalName: TOriginalName;
	public columns!: TColumns;
	public constraints?: TableConstraints;

	declare readonly $inferSelect: { [K in keyof TColumns]: TColumns[K]["$infer"] };
	declare readonly $inferInsert: Prettify<
		{
			[Key in keyof TColumns]?: TColumns[Key]["$infer"];
		} & {
			[Key in keyof TColumns as TColumns[Key]["hasDefault"] extends true
				? never
				: TColumns[Key]["notNull"] extends true
					? Key
					: never]-?: TColumns[Key]["$infer"];
		}
	>;

	constructor(originalName: TOriginalName) {
		this.originalName = originalName;
	}

	public toSQL(): string {
		const sqlChunks = [`CREATE TABLE IF NOT EXISTS ${this.originalName} (`];

		sqlChunks.push(
			Object.entries(this.columns)
				.map(([_, column]) => {
					return column.toSQL();
				})
				.join(", "),
		);

		if (this.constraints) {
			const { primaryKeys, foreignKeys } = this.constraints;

			if (primaryKeys?.length) {
				sqlChunks.push(`, primary key(${primaryKeys.map((column) => column.name).join(", ")})`);
			}

			if (foreignKeys?.length) {
				const foreignKeysSql = foreignKeys.map(({ columns, foreignColumns }) => {
					return `foreign key(${columns.map((column) => column.name).join(", ")}) references(${foreignColumns.map((column) => column.name).join(", ")})`;
				});
				sqlChunks.push(`, ${foreignKeysSql}`);
			}
		}

		sqlChunks.push(")");

		return sqlChunks.join("");
	}
}

export default Table;

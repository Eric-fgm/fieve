import type Column from "@/core/Column";
import type Table from "@/core/Table";
import type { Schema } from "@/types";

export abstract class Relation<TSourceTable extends Table = Table, TReferencedTable extends Table = Table> {
	public sourceTable: TSourceTable;
	public referencedTable: TReferencedTable;
	public identifier?: string;

	declare readonly $infer: unknown;

	constructor(sourceTable: TSourceTable, referencedTable: TReferencedTable, identifier?: string) {
		this.sourceTable = sourceTable;
		this.referencedTable = referencedTable;
		this.identifier = identifier;
	}

	public abstract mapFrom(data: unknown, schema: Schema): this["$infer"];

	public abstract toSQL(config: Partial<{ extraField: string; limit: number; }>): string;
}

export class One<
	TSourceTable extends Table = Table,
	TReferencedTable extends Table = Table,
	TSourceFields extends Column[] = Column[],
	TInferColumns = TReferencedTable["$inferSelect"],
> extends Relation<TSourceTable, TReferencedTable> {
	private type = "One";
	public sourceFields: TSourceFields;
	public referencedFields: Column[];

	declare readonly $infer: TInferColumns | null;

	constructor(
		sourceTable: TSourceTable,
		referencedTable: TReferencedTable,
		sourceFields: TSourceFields,
		referencedFields: Column[],
		identifier?: string,
	) {
		super(sourceTable, referencedTable, identifier);
		this.sourceFields = sourceFields;
		this.referencedFields = referencedFields;
	}

	public override mapFrom(data: unknown, schema: Schema): this["$infer"] {
		if (!data || typeof data !== "object") return null;

		const mappedData: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(data)) {
			const column = this.referencedTable.columns[key];
			if (column) {
				mappedData[key] = column.mapFrom(value);
			} else {
				if (!value) continue;

				const { relations } = schema.map[this.referencedTable.name];
				if (!relations) throw new Error("Not found relations");

				mappedData[key] = relations.fields[key].mapFrom(value, schema);
			}
		}

		return mappedData as this["$infer"];
	}

	public override toSQL({ extraField }: { extraField?: string }): string {
		const properties = Object.entries(this.referencedTable.columns).map(([key, column]) => `'${key}', ${column.name}`);
		return `(select json_object(${properties.join(", ")}${extraField ? ` , ${extraField}` : ""}) from ${this.referencedTable.originalName} where ${this.sourceFields.map((column, index) => `${column.table.originalName}.${column.name} = ${this.referencedFields[index].table.originalName}.${this.referencedFields[index].name}`).join(" and ")})`;
	}
}

export class Many<TSourceTable extends Table = Table, TReferencedTable extends Table = Table> extends Relation<
	TSourceTable,
	TReferencedTable
> {
	private type = "Many";
	public sourceFields!: Column[];
	public referencedFields!: Column[];

	declare readonly $infer: TReferencedTable["$inferSelect"][];

	public override mapFrom(data: unknown, schema: Schema): this["$infer"] {
		if (!Array.isArray(data)) return [];

		return data.map((item) => {
			const mappedItem: Record<string, unknown> = {};

			for (const [key, value] of Object.entries(item)) {
				const column = this.referencedTable.columns[key];
				if (column) {
					mappedItem[key] = column.mapFrom(value);
				} else {
					if (!value) continue;

					const { relations } = schema.map[this.referencedTable.name];
					if (!relations) throw new Error("Not found relations");

					mappedItem[key] = relations.fields[key].mapFrom(value, schema);
				}
			}

			return mappedItem;
		});
	}

	public override toSQL({ extraField, limit }: Partial<{ extraField: string; limit: number }>): string {
		const properties = Object.entries(this.referencedTable.columns).map(([key, column]) => `'${key}', ${column.name}`);
		return `(select json_group_array(json_object(${properties.join(", ")}${extraField ? ` , ${extraField}` : ""})) from (select * from ${this.referencedTable.originalName} where ${this.sourceFields.map((column, index) => `${column.table.originalName}.${column.name} = ${this.referencedFields[index].table.originalName}.${this.referencedFields[index].name}`).join(" and ")}${limit ? ` limit ${limit}` : ""}) as [${this.referencedTable.originalName}])`;
	}
}

class Relations<TTable extends Table = Table, TFields extends Record<string, Relation> = Record<string, Relation>> {
	public table: TTable;
	public fields: TFields;

	constructor(table: TTable, fields: TFields) {
		this.table = table;
		this.fields = fields;
	}
}

export default Relations;

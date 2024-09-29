import type Column from "@/core/Column";
import type Table from "@/core/Table";
import type Relations from "@/core/Relations";
import type { Many } from "@/core/Relations";
import type { Schema } from "@/types";

export type IncludeStatement<
	TTable extends Table = Table,
	TSchema extends Schema = Schema,
	TRelations extends Relations | undefined = TSchema["map"][TTable["name"]]["relations"],
> = TRelations extends Relations
	? Partial<{
		[K in keyof TRelations["fields"]]:
		| (IncludeStatement<TRelations["fields"][K]["referencedTable"], TSchema> & (TRelations["fields"][K] extends Many
			? {
				limit?: number;
			}
			: unknown))
		| boolean;
	}>
	: never;

export type JoinsStatement = Record<
	string,
	{
		table: Table;
		alias: string;
		condition: Record<string, Record<string, string>>;
	}
>;

export type FieldsStatement = Record<string, { key: string; column: Column }>;

export interface MapStatement<
	TKeys extends string = string,
	TCustomKeys extends (_: never) => string = (_: never) => string,
> extends Record<string, MapStatement<TKeys, TCustomKeys> | TKeys | TCustomKeys> { }

export type WhereStatement<T extends Record<string, unknown> = Record<string, unknown>> =
	| { $or: WhereStatement<T> }
	| { $and: WhereStatement<T> }
	| Partial<{
		[K in keyof T]: Partial<Record<"==" | "!=" | "$like" | ">" | "<", T[K]> & Record<"$in" | "$not in", T[K][]>>;
	}>;

export type SetsStatement = Record<string, unknown>;

export type ValuesStatement = Record<string, unknown> | Record<string, unknown>[];

export type ReturningStatement<Keys extends PropertyKey = string> = Partial<Record<Keys, boolean>>;

class Dialect {
	private params: unknown[] = [];

	private escapeParam(param: unknown): string {
		if (Array.isArray(param)) {
			this.params.push(...param);
			return `(${Array(param.length).fill("?").join(",")})`;
		}
		this.params.push(param);
		return "?";
	}

	private parseFilterStatement(fields: FieldsStatement, type: "or" | "and", statement: WhereStatement): string {
		return Object.entries(statement)
			.reduce<string[]>((acc, [key, subStatement]) => {
				if (!subStatement) return acc;
				if (key === "$or" || key === "$and") {
					acc.push(`(${this.parseFilterStatement(fields, key.slice(1) as never, subStatement)})`);
				} else {
					const rawOperator = Object.keys(subStatement)[0] as string;
					const operator = rawOperator[0] === '$' ? rawOperator.slice(1) : rawOperator
					const value = subStatement[rawOperator];

					if (value !== undefined) {
						const field = fields[key];
						const mappedValue = field.column.mapTo(value);
						acc.push(`${field.key} ${operator} ${this.escapeParam(mappedValue)}`);
					}
				}
				return acc;
			}, [])
			.join(` ${type} `);
	}

	private parseWhere(fields: FieldsStatement, statement: WhereStatement) {
		const parsedFilterStatement = this.parseFilterStatement(fields, "and", statement);

		return parsedFilterStatement ? `where ${parsedFilterStatement}` : "";
	}

	private parseHaving(fields: FieldsStatement, statement: WhereStatement) {
		const parsedFilterStatement = this.parseFilterStatement(fields, "and", statement);

		return parsedFilterStatement ? `having ${this.parseFilterStatement(fields, "and", statement)}` : "";
	}

	private parseValues(fields: FieldsStatement, values: ValuesStatement) {
		const sqlChunks: string[] = [];

		const filteredValues = (Array.isArray(values) ? values : [values]).map((value) =>
			Object.fromEntries(Object.entries(value).filter(([_, v]) => v !== undefined)),
		);

		const columnsNames = Object.keys(filteredValues[0]);
		sqlChunks.push(`(${columnsNames.map((columnName) => fields[columnName].key).join(", ")}) values`);
		sqlChunks.push(
			filteredValues
				.map(
					(obj) =>
						`(${columnsNames
							.map((columnName) => {
								const value = obj[columnName];
								const mappedValue = fields[columnName].column.mapTo(value);
								return this.escapeParam(mappedValue);
							})
							.join(", ")})`,
				)
				.join(", "),
		);

		return sqlChunks.join(" ");
	}

	private parseSets(fields: FieldsStatement, sets: SetsStatement) {
		return Object.entries(sets)
			.map(([key, value]) => {
				const field = fields[key];
				const mappedValue = field.column.mapTo(value);

				return `${field.key} = ${this.escapeParam(mappedValue)}`;
			})
			.join(", ");
	}

	private parseReturning(fields: FieldsStatement, statement: ReturningStatement): string {
		return `returning ${Object.entries(statement)
			.filter(([_, value]) => value === true)
			.map(([name]) => `${fields[name].key} as [${name}]`)
			.join(", ")}`;
	}

	private parseInclude(table: Table, schema: Schema, statement: IncludeStatement, withAlias = true): string {
		const relations = schema.map[table.name].relations?.fields;
		if (!relations) throw new Error("Not found relations");

		return Object.entries(statement)
			.filter(([_, substatement]) => !!substatement)
			.map(([key, substatement]) => {
				const config: { extraField?: string; limit?: number } = {};
				if (typeof substatement === "object") {
					const { limit, ...restSubstatement } = substatement;
					if (typeof limit === "number") {
						config.limit = limit;
					}
					config.extraField = this.parseInclude(relations[key].referencedTable, schema, restSubstatement, false);
				}
				return withAlias ? `${relations[key].toSQL(config)} as [${key}]` : `'${key}', ${relations[key].toSQL(config)}`;
			})
			.join(", ");
	}

	private mapToFields(fields: FieldsStatement, statement: MapStatement) {
		const resultFields: Record<string, string> = {};

		for (const key in statement) {
			const substatement = statement[key];
			if (typeof substatement === "string") {
				resultFields[substatement] = fields[substatement].key;
			} else if (typeof substatement === "function") {
				const keyAndAlias = substatement(0 as never);
				resultFields[keyAndAlias] = keyAndAlias;
			} else {
				Object.assign(resultFields, this.mapToFields(fields, substatement));
			}
		}

		return resultFields;
	}

	private columnsToFields(columns: Record<string, Column>) {
		return Object.entries(columns).reduce<FieldsStatement>((accumulator, [alias, column]) => {
			accumulator[alias] = { key: column.name, column };
			return accumulator;
		}, {});
	}

	private parseRow(fields: FieldsStatement, row: unknown) {
		if (!row || typeof row !== "object") return null;

		for (const [key, value] of Object.entries(row)) {
			const field = fields[key];
			if (!field) continue;

			const mappedValue = field.column.mapFrom(value);
			(row as Record<string, unknown>)[key] = mappedValue;
		}

		return row;
	}

	private parseIncludeRow(table: Table, schema: Schema, row: Record<string, unknown>, include?: IncludeStatement) {
		const parsedRow: Record<string, unknown> = {};

		if (!include) return parsedRow;

		const { relations } = schema.map[table.name];
		if (!relations) throw new Error("Not found relations");

		for (const [key, subinclude] of Object.entries(include)) {
			const relation = relations.fields[key];

			if (!subinclude || !relation) continue;

			parsedRow[key] = relation.mapFrom(JSON.parse(row[key] as string), schema);
		}

		return parsedRow;
	}

	private mapRow(row: Record<string, unknown>, map: MapStatement) {
		const mappedRow: Record<string, unknown> = {};

		for (const [key, name] of Object.entries(map)) {
			if (typeof name === "string") {
				mappedRow[key] = row[name];
			} else if (typeof name === "function") {
				mappedRow[key] = row[name(0 as never)];
			} else {
				mappedRow[key] = this.mapRow(row, name);
			}
		}
		return mappedRow;
	}

	public parseInsertQuery(table: Table, values: ValuesStatement, returning?: ReturningStatement) {
		const fields = this.columnsToFields(table.columns);

		const sqlChunks: string[] = [`insert into ${table.originalName}`];

		sqlChunks.push(this.parseValues(fields, values));

		if (returning) {
			sqlChunks.push(this.parseReturning(fields, returning));
		}

		return {
			sql: sqlChunks.join(" "),
			params: this.params,
			parseRow: (row: unknown) => this.parseRow(fields, row),
		};
	}

	public parseDeleteQuery(table: Table, where?: WhereStatement, returning?: ReturningStatement) {
		const fields = this.columnsToFields(table.columns);

		const sqlChunks: string[] = [`delete from ${table.originalName}`];

		if (where) {
			sqlChunks.push(this.parseWhere(fields, where));
		}

		if (returning) {
			sqlChunks.push(this.parseReturning(fields, returning));
		}

		return {
			sql: sqlChunks.join(" "),
			params: this.params,
			parseRow: (row: unknown) => this.parseRow(fields, row),
		};
	}

	public parseUpdateQuery(table: Table, sets: SetsStatement, where?: WhereStatement, returning?: ReturningStatement) {
		const fields = this.columnsToFields(table.columns);

		const sqlChunks: string[] = [`update ${table.originalName} set`];

		sqlChunks.push(this.parseSets(fields, sets));

		if (where) {
			sqlChunks.push(this.parseWhere(fields, where));
		}

		if (returning) {
			sqlChunks.push(this.parseReturning(fields, returning));
		}

		return {
			sql: sqlChunks.join(" "),
			params: this.params,
			parseRow: (row: unknown) => this.parseRow(fields, row),
		};
	}

	public parseSelectQuery(
		table: Table,
		schema: Schema,
		fields: FieldsStatement,
		map: MapStatement,
		joins?: JoinsStatement,
		include?: IncludeStatement,
		where?: WhereStatement,
		groupBy?: Record<string, boolean>,
		having?: WhereStatement,
		orderBy?: Record<string, "asc" | "desc">,
		limit?: number,
		offset?: number,
	) {
		const sqlChunks: string[] = ["select"];

		const fieldsChunks = Object.entries(this.mapToFields(fields, map)).map(([alias, key]) => `${key} as [${alias}]`);

		if (include) {
			const parsedInclude = this.parseInclude(table, schema, include);
			if (parsedInclude) fieldsChunks.push(parsedInclude);
		}

		sqlChunks.push(fieldsChunks.join(", "));
		sqlChunks.push(`from ${table.originalName}`);

		if (joins) {
			sqlChunks.push(
				Object.values(joins)
					.map(({ alias, table, condition }) => {
						const columnName = Object.keys(condition)[0];
						const operator = Object.keys(condition[columnName])[0];
						const column = table.columns[columnName];
						const referencedColumn = fields[condition[columnName][operator]].key;

						return `join ${table.originalName} as [${alias}] on ${alias}.${column.name} ${operator} ${referencedColumn}`;
					})
					.join(" "),
			);
		}

		if (where) {
			sqlChunks.push(this.parseWhere(fields, where));
		}

		if (groupBy) {
			const groupByChunk = Object.entries(groupBy)
				.filter(([_, value]) => value === true)
				.map(([key]) => `[${key}]`)
				.join(", ");

			if (groupByChunk) sqlChunks.push(`group by ${groupByChunk}`);
		}

		if (having) {
			sqlChunks.push(this.parseHaving(fields, having));
		}

		if (orderBy) {
			const orderByChunk = Object.entries(orderBy)
				.map(([key, order]) => `[${key}] ${order}`)
				.join(", ");

			sqlChunks.push(`order by ${orderByChunk}`);
		}

		if (limit !== undefined && limit > 0) {
			sqlChunks.push(`limit ${this.escapeParam(limit)}`);
		}

		if (offset !== undefined && offset >= 0) {
			sqlChunks.push(`offset ${this.escapeParam(offset)}`);
		}

		return {
			sql: sqlChunks.join(" "),
			params: this.params,
			mapRow: (row: Record<string, unknown>) => {
				this.parseRow(fields, row);
				return Object.assign(this.mapRow(row, map), this.parseIncludeRow(table, schema, row, include));
			},
		};
	}
}

export default Dialect;

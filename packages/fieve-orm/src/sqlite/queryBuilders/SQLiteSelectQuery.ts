import Dialect from "@/core/Dialect";
import QueryPromise from "@/core/QueryPromise";

import type Session from "@/core/Session";
import type Relations from "@/core/Relations";
import type Table from "@/core/Table";
import type { FieldsStatement, JoinsStatement, IncludeStatement, MapStatement, WhereStatement } from "@/core/Dialect";
import type SQLiteTable from "@/sqlite/SQLiteTable";
import type { Schema, PickOne, Prettify, UnionToIntersection, Merge, ExtractStrings } from "@/types";

type SelectQueryResult<TFields extends FieldsStatement, TMap extends MapStatement> = {
	[K in keyof TMap]: TMap[K] extends MapStatement
	? SelectQueryResult<TFields, TMap[K]>
	: TMap[K] extends keyof TFields
	? TFields[TMap[K]]["column"]["$infer"]
	: TMap[K] extends (_: infer T) => string
	? T
	: never;
}


class SQLiteSelectQuery<
	TTable extends SQLiteTable,
	TSchema extends Schema<SQLiteTable>,
	TMode extends "many" | "one",
	TFields extends FieldsStatement = TableToFields<TTable, TTable["name"]>,
	TMap extends MapStatement = { [K in keyof TTable["columns"]]: `${TTable["name"]}.${K & string}` },
	TInclude extends IncludeStatement | undefined = undefined,
	TRawResult = Prettify<
		SelectQueryResult<TFields, TMap> &
		(TInclude extends IncludeStatement<TTable, TSchema> ? IncludeQueryResult<TTable, TSchema, TInclude> : unknown)
	>,
	TResult = TMode extends "many" ? TRawResult[] : TRawResult | null,
> extends QueryPromise<TResult> {
	private dialect = new Dialect();
	private session: Session;
	private table: TTable;
	private schema: TSchema;
	private mode: TMode;
	private state: {
		fields: FieldsStatement;
		map: MapStatement;
		joins?: JoinsStatement;
		include?: IncludeStatement;
		where?: WhereStatement;
		groupBy?: Record<string, boolean>;
		having?: WhereStatement;
		orderBy?: Record<string, "asc" | "desc">;
		limit?: number;
		offset?: number;
	};

	constructor(session: Session, table: TTable, schema: TSchema, mode: TMode) {
		super();
		this.session = session;
		this.table = table;
		this.schema = schema;
		this.mode = mode;
		this.state = {
			fields: Object.entries(table.columns).reduce<FieldsStatement>((accumulator, [name, column]) => {
				accumulator[`${table.name}.${name}`] = { key: `${table.originalName}.${column.name}`, column };
				return accumulator;
			}, {}),
			map: Object.entries(table.columns).reduce<MapStatement>((accumulator, [name]) => {
				accumulator[name] = `${table.name}.${name}`;
				return accumulator;
			}, {}),
		};
	}

	public join<
		TString extends string,
		TAliasConfig extends keyof TAllTables | PickOne<Record<keyof TAllTables, TString>>,
		TAliasName extends string = TAliasConfig extends string
		? TAliasConfig
		: TAliasConfig[keyof TAliasConfig] extends string
		? TAliasConfig[keyof TAliasConfig]
		: string,
		TAllTables extends Record<string, SQLiteTable> = TSchema["tables"],
		TTableToJoin extends SQLiteTable = TAllTables[TAliasConfig extends keyof TAllTables
		? TAliasConfig
		: keyof TAliasConfig],
	>(
		alias: TAliasConfig,
		condition: PickOne<
			Record<`${keyof TTableToJoin["columns"] & string}`, PickOne<Record<"==" | "!=", keyof TFields & string>>>
		>,
	) {
		const tableName = typeof alias === "string" ? alias : Object.keys(alias)[0];
		const aliasedName = (
			typeof alias === "string" ? alias : alias[Object.keys(alias)[0] as keyof typeof alias]
		) as string;
		const tableToJoin = this.schema.tables[tableName];

		const statement = { table: tableToJoin, alias: aliasedName, condition };

		this.state.map[aliasedName] = {};

		for (const [key, column] of Object.entries(tableToJoin.columns)) {
			this.state.map[aliasedName][key] = `${aliasedName}.${key}`;

			this.state.fields[`${aliasedName}.${key}`] = {
				key: `${aliasedName}.${column.name}`,
				column,
			};
		}

		if (this.state.joins) {
			this.state.joins[aliasedName] = statement;
		} else {
			this.state.joins = { [aliasedName]: statement };
		}

		return this as SQLiteSelectQuery<
			TTable,
			TSchema,
			TMode,
			TFields & TableToFields<TTableToJoin, TAliasName>,
			TMap & Record<TAliasName, { [K in keyof TTableToJoin["columns"]]: `${TAliasName}.${K & string}` }>,
			TInclude
		>;
	}

	public include<TInclude extends IncludeStatement<TTable, TSchema>>(statement: TInclude) {
		this.state.include = statement;
		return this as SQLiteSelectQuery<TTable, TSchema, TMode, TFields, TMap, TInclude>;
	}

	public map<TMap extends MapStatement<keyof TFields & string>>(statement: TMap) {
		this.state.map = statement;
		return this as unknown as SQLiteSelectQuery<TTable, TSchema, TMode, TFields, TMap, TInclude>;
	}

	public where(statement: WhereStatement<WhereHints<TFields>>) {
		this.state.where = statement;
		return this;
	}

	public groupBy(statement: PickOne<Record<ExtractStrings<TMap>, boolean>>) {
		this.state.groupBy = statement;
		return this;
	}

	public having(statement: WhereStatement<WhereHints<TFields>>) {
		this.state.having = statement;
		return this;
	}

	public orderBy(statement: PickOne<Record<ExtractStrings<TMap>, "asc" | "desc">>) {
		this.state.orderBy = statement;
		return this;
	}

	public limit(value: number) {
		this.state.limit = value;
		return this;
	}

	public offset(value: number) {
		this.state.offset = value;
		return this;
	}

	public async execute() {
		const { sql, params, mapRow } = this.dialect.parseSelectQuery(
			this.table,
			this.schema,
			this.state.fields,
			this.state.map,
			this.state.joins,
			this.state.include,
			this.state.where,
			this.state.groupBy,
			this.state.having,
			this.state.orderBy,
			this.state.limit,
			this.state.offset,
		);

		const preparedSQL = this.session.prepare(sql, params);

		if (this.mode === "one") {
			const row = preparedSQL.get();
			const mappedRow = row ? mapRow(row) : null;
			return mappedRow as TResult;
		}

		const rows = preparedSQL.all();
		return rows.map(mapRow) as TResult;
	}
}

type WhereHints<TFields extends FieldsStatement> = {
	[K in keyof TFields]: TFields[K]["column"]["$infer"];
};

type TableToFields<TTable extends SQLiteTable, TAlias extends string> = UnionToIntersection<
	{
		[K in keyof TTable["columns"]]: Record<`${TAlias}.${string & K}`, { key: string; column: TTable["columns"][K] }>;
	}[keyof TTable["columns"]]
>

type IncludeQueryResult<
	TTable extends Table,
	TSchema extends Schema,
	TInclude extends IncludeStatement,
	TRelations extends Relations | undefined = TSchema["map"][TTable["name"]]["relations"],
> = TRelations extends Relations
	? {
		[K in keyof TInclude as TInclude[K] extends true
		? K
		: TInclude[K] extends Record<string, unknown>
		? K
		: never]: K extends keyof TRelations["fields"]
		? Merge<
			TRelations["fields"][K]["$infer"],
			TInclude[K] extends IncludeStatement<TRelations["fields"][K]["referencedTable"], TSchema>
			? IncludeQueryResult<TRelations["fields"][K]["referencedTable"], TSchema, Omit<TInclude[K], "limit">>
			: unknown
		>
		: unknown;
	}
	: never;

export default SQLiteSelectQuery;

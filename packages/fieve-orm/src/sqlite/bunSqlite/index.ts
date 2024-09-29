import SQLiteTable from "@/sqlite/SQLiteTable";
import Relations, { Many, type Relation } from "@/core/Relations";
import SQLiteIntegerColumnBuilder from "../columns/SQLiteIntegerColumnBuilder";
import SQLiteTextColumnBuilder from "../columns/SQLiteTextColumnBuilder";
import SQLiteBooleanColumnBuilder from "../columns/SQLiteBooleanColumnBuilder";
import SQLiteDateColumnBuilder from "../columns/SQLiteDateColumnBuilder";
import BunSQLiteDatabase from "@/sqlite/bunSqlite/BunSQLiteDatabase";
import { SQLiteOne } from "@/sqlite/SQLiteRelations";
import { assignFieldsToManyRelations, prepareSchema, splitSchema } from "@/utils";

import type { Database } from "bun:sqlite";
import type SQLiteColumnBuilder from "../columns/SQLiteColumnBuilder";
import type SQLiteColumn from "../columns/SQLiteColumn";
import type { RawSchema } from "@/types";
import type { TableConstraints } from "@/core/Table";

export const sqliteTable = <
	TOriginalName extends string,
	TBuilders extends Record<string, SQLiteColumnBuilder>,
	TBuiltColumns extends Record<string, SQLiteColumn> = { [K in keyof TBuilders]: ReturnType<TBuilders[K]["build"]> },
>(
	originalName: TOriginalName,
	callback: (args: {
		integer: (columnOriginalName: string) => SQLiteIntegerColumnBuilder;
		text: (columnOriginalName: string) => SQLiteTextColumnBuilder;
		boolean: (columnOriginalName: string) => SQLiteBooleanColumnBuilder;
		date: (columnOriginalName: string) => SQLiteDateColumnBuilder;
	}) => TBuilders,
	constraints?: (columns: TBuiltColumns) => TableConstraints,
) => {
	const table = new SQLiteTable<TOriginalName, TBuiltColumns>(originalName);

	const columnsBuilders = callback({
		integer: (columnOriginalName) => new SQLiteIntegerColumnBuilder(table, columnOriginalName),
		text: (columnOriginalName) => new SQLiteTextColumnBuilder(table, columnOriginalName),
		boolean: (columnOriginalName) => new SQLiteBooleanColumnBuilder(table, columnOriginalName),
		date: (columnOriginalName) => new SQLiteDateColumnBuilder(table, columnOriginalName),
	});

	const columns = Object.entries(columnsBuilders).reduce<Record<string, SQLiteColumn>>(
		(acc, [columnName, columnBuilder]) => {
			acc[columnName] = columnBuilder.build();
			return acc;
		},
		{},
	) as TBuiltColumns;

	if (!Object.keys(columns).length) {
		throw new Error("Not defined any columns");
	}
	table.columns = columns;

	if (constraints) {
		const { primaryKeys, foreignKeys } = constraints(columns);
		if ((primaryKeys && !primaryKeys.length) || (foreignKeys && !foreignKeys.length)) {
			throw new Error("Not defined any constraints");
		}
		table.constraints = constraints(columns);
	}

	return table;
};

export const relations = <TSourceTable extends SQLiteTable, TRelationsFields extends Record<string, Relation>>(
	sourceTable: TSourceTable,
	callback: (args: {
		one: <
			TReferencedTable extends SQLiteTable,
			TSourceFields extends keyof TSourceTable["columns"],
			TReferencedFields extends keyof TReferencedTable["columns"],
		>(
			table: TReferencedTable,
			config: { fields: TSourceFields[]; references: TReferencedFields[]; identifier?: string },
		) => SQLiteOne<TSourceTable, TReferencedTable, TSourceTable["columns"][TSourceFields][]>;
		many: <TReferencedTable extends SQLiteTable>(
			table: TReferencedTable,
			config?: { identifier: string },
		) => Many<TSourceTable, TReferencedTable>;
	}) => TRelationsFields,
) => {
	const relationsFields = callback({
		one: (referencedTable, config) => {
			const sourceFields = config.fields.map((field) => sourceTable.columns[field as string]) as never;
			const referencedFields = config.references.map((reference) => referencedTable.columns[reference as string]);

			return new SQLiteOne(sourceTable, referencedTable, sourceFields, referencedFields, config.identifier);
		},
		many: (referencedTable, config) => new Many(sourceTable, referencedTable, config?.identifier),
	});

	return new Relations(sourceTable, relationsFields);
};

export const createDatabase = <TRawSchema extends RawSchema<SQLiteTable>>(client: Database, schema: TRawSchema) => {
	const { tables, relations } = splitSchema<TRawSchema>(schema);

	assignFieldsToManyRelations(relations);
	const preparedSchema = prepareSchema(tables, relations);

	return new BunSQLiteDatabase(client, preparedSchema);
};

import Relations, { Many, One } from "@/core/Relations";
import Table from "@/core/Table";

import type { ExtractEntity, RawSchema, Schema, UnionToIntersection } from "@/types";

type InferTableType<T> = T extends RawSchema<infer TTableType> ? TTableType : never;

export const splitSchema = <
	TRawSchema extends RawSchema,
	TTableType extends Table = InferTableType<TRawSchema>,
	TExtractedRawTables extends Record<string, TTableType> = ExtractEntity<TRawSchema, TTableType>,
	TExtractedTables extends Record<string, TTableType> = {
		[K in keyof TExtractedRawTables]: TExtractedRawTables[K] & { name: K };
	},
	TExtractedTablesMap = UnionToIntersection<
		{
			[K in keyof TExtractedTables]: Record<TExtractedTables[K]["originalName"], TExtractedTables[K]>;
		}[keyof TExtractedTables]
	>,
	TExtractedRawRelations extends Record<string, Relations> = ExtractEntity<TRawSchema, Relations>,
	TExtractedRelations extends Record<string, Relations> = {
		[K in keyof TExtractedRawRelations]: TExtractedRawRelations[K] & {
			fields: {
				[FK in keyof TExtractedRawRelations[K]["fields"]]: TExtractedRawRelations[K]["fields"][FK] & {
					referencedTable: TExtractedTablesMap[TExtractedRawRelations[K]["fields"][FK]["referencedTable"]["originalName"] extends keyof TExtractedTablesMap
					? TExtractedRawRelations[K]["fields"][FK]["referencedTable"]["originalName"]
					: never];
				};
			};
		};
	},
>(
	schema: TRawSchema,
) => {
	const tablesByOriginalNameMap: Record<string, Table> = {};
	const relationsByTableOriginalNameMap: Record<string, Relations> = {};

	return Object.entries(schema).reduce<{
		tables: Record<string, Table>;
		relations: Record<string, Relations>;
	}>(
		(acc, [key, value]) => {
			if (value instanceof Table) {
				if (tablesByOriginalNameMap[value.originalName]) {
					throw new Error(`Table "${value.originalName}" has been already declared`);
				}
				tablesByOriginalNameMap[value.originalName] = value;
				acc.tables[key] = value;
			} else if (value instanceof Relations) {
				if (relationsByTableOriginalNameMap[value.table.originalName]) {
					throw new Error(`Relations for table "${value.table.originalName}" has been already declared`);
				}
				relationsByTableOriginalNameMap[value.table.originalName] = value;
				acc.relations[key] = value;
			} else {
				console.warn("Schema is corrupted");
			}
			return acc;
		},
		{ tables: {}, relations: {} },
	) as {
		tables: TExtractedTables;
		relations: TExtractedRelations;
	};
};

export const assignFieldsToManyRelations = (allRelations: Record<string, Relations>) => {
	for (const currentRelationsKey in allRelations) {
		const currentRelations = allRelations[currentRelationsKey];

		for (const currentRelationKey in currentRelations.fields) {
			const currentRelation = currentRelations.fields[currentRelationKey];
			if (currentRelation instanceof Many) {
				let foundTypeOneRelation = false;
				for (const otherRelationsKey in allRelations) {
					const otherRelations = allRelations[otherRelationsKey];

					if (currentRelations === otherRelations) {
						continue;
					}

					for (const otherRelationKey in otherRelations.fields) {
						const otherRelation = otherRelations.fields[otherRelationKey];
						if (
							!(otherRelation instanceof One) ||
							currentRelation.sourceTable !== otherRelation.referencedTable ||
							currentRelation.referencedTable !== otherRelation.sourceTable
						)
							continue;

						foundTypeOneRelation = true;
						currentRelation.sourceFields = otherRelation.sourceFields;
						currentRelation.referencedFields = otherRelation.referencedFields;

						if (currentRelation.identifier && currentRelation.identifier === otherRelation.identifier) {
							break;
						}
					}
				}
				if (!foundTypeOneRelation) {
					throw new Error(
						`Relation "${currentRelationKey}" in table "${currentRelations.table.originalName}" is corrupted`,
					);
				}
			}
		}
	}
};

export const prepareSchema = <
	TTableType extends Table = Table,
	TTables extends Record<string, TTableType> = Record<string, TTableType>,
	TRelations extends Record<string, Relations> = Record<string, Relations>,
	TRelationsByTableOriginalName = UnionToIntersection<
		{
			[K in keyof TRelations]: Record<TRelations[K]["table"]["originalName"], TRelations[K]>;
		}[keyof TRelations]
	>,
>(
	tables: TTables,
	allRelations: TRelations,
) => {
	const schema: Schema = { tables, relations: allRelations, map: {} };

	for (const name in tables) {
		const table = tables[name];
		table.name = name;
		schema.map[name] = { table, relations: undefined };
	}

	for (const name in allRelations) {
		const relations = allRelations[name];
		const referencedTableOriginalName = relations.table.originalName;
		for (const key in schema.map) {
			const { table } = schema.map[key];
			if (table.originalName === referencedTableOriginalName) {
				schema.map[key].relations = relations;
				break;
			}
		}
	}

	return schema as {
		tables: { [K in keyof TTables]: TTables[K] };
		relations: TRelations;
		map: {
			[K in keyof TTables]: {
				table: TTables[K];
				relations: TTables[K]["originalName"] extends keyof TRelationsByTableOriginalName
				? TRelationsByTableOriginalName[TTables[K]["originalName"]] extends Relations
				? TRelationsByTableOriginalName[TTables[K]["originalName"]]
				: undefined
				: undefined;
			};
		};
	};
};

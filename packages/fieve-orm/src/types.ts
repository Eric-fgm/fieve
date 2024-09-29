import type Table from "@/core/Table";
import type Relations from "@/core/Relations";

export type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void ? I & {} : never;

export type Merge<T, B> = T extends unknown[]
	? Prettify<T[number] & B>[]
	: T extends T
	? Prettify<T & B>
	: Prettify<(NonNullable<T> & B)> | null;

export type PickOne<T> = { [K in keyof T]: Pick<T, K> }[keyof T];

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & unknown;

export type ExtractEntity<T extends Record<string, unknown>, E> = {
	[K in keyof T as T[K] extends E ? K : never]: T[K] extends E ? T[K] : never;
};

export type ExtractStrings<T> = T extends string
	? T
	: T extends object
	? { [K in keyof T]: ExtractStrings<T[K]> }[keyof T]
	: never;

export type RawSchema<TTableType extends Table = Table> = Record<string, TTableType | Relations>;

export type Schema<TTableType extends Table = Table> = {
	tables: Record<string, TTableType>;
	relations: Record<string, Relations>;
	map: Record<string, { table: TTableType; relations?: Relations }>;
};

export type MergeSchema<
	TRawSchema extends RawSchema,
	TRawTables extends Record<string, Table> = ExtractEntity<TRawSchema, Table>,
	TTables extends Record<string, Table> = {
		[K in keyof TRawTables]: TRawTables[K] & { name: K };
	},
	TTablesMap = UnionToIntersection<
		{
			[K in keyof TTables]: Record<TTables[K]["originalName"], TTables[K]>;
		}[keyof TTables]
	>,
	TRawRelations extends Record<string, Relations> = ExtractEntity<TRawSchema, Relations>,
	TRelations extends Record<string, Relations> = {
		[K in keyof TRawRelations]: TRawRelations[K] & {
			fields: {
				[FK in keyof TRawRelations[K]["fields"]]: TRawRelations[K]["fields"][FK] & {
					referencedTable: TTablesMap[TRawRelations[K]["fields"][FK]["referencedTable"]["originalName"] extends keyof TTablesMap
					? TRawRelations[K]["fields"][FK]["referencedTable"]["originalName"]
					: never];
				};
			};
		};
	},
	TRelationsByTableOriginalName = UnionToIntersection<
		{
			[K in keyof TRelations]: Record<TRelations[K]["table"]["originalName"], TRelations[K]>;
		}[keyof TRelations]
	>,
> = {
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

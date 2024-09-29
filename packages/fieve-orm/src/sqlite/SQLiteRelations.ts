import { One } from "@/core/Relations";
import type SQLiteTable from "@/sqlite/SQLiteTable";
import type SQLiteColumn from "@/sqlite/columns/SQLiteColumn";

export class SQLiteOne<
	TSourceTable extends SQLiteTable = SQLiteTable,
	TReferencedTable extends SQLiteTable = SQLiteTable,
	TSourceFields extends SQLiteColumn[] = SQLiteColumn[],
	TInferColumns = TReferencedTable["$inferSelect"],
> extends One<TSourceTable, TReferencedTable, TSourceFields, TInferColumns> {
	declare readonly $infer: TSourceFields[number]["notNull"] extends true
		? TSourceFields[number]["hasReferences"] extends true
			? TInferColumns
			: TInferColumns | null
		: TInferColumns | null;
}

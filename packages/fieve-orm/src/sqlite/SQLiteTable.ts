import Table from "@/core/Table";
import type SQLiteColumn from "@/sqlite/columns/SQLiteColumn";

class SQLiteTable<
	TOriginalName extends string = string,
	TColumns extends Record<string, SQLiteColumn> = Record<string, SQLiteColumn>,
> extends Table<TOriginalName, TColumns> {}

export default SQLiteTable;

import Column, { type ColumnProps } from "@/core/Column";

export type NotNull<T extends ColumnBuilder> = T & {
	_: {
		notNull: true;
	};
};

export type HasDefault<T extends ColumnBuilder> = T & {
	_: {
		hasDefault: true;
	};
};

export type Unique<T extends ColumnBuilder> = T & {
	_: {
		unique: true;
	};
};

class ColumnBuilder<TProps extends ColumnProps = ColumnProps> {
	protected state: TProps;

	declare readonly _: TProps;

	constructor(table: TProps["table"], name: TProps["name"], datatype: TProps["datatype"]) {
		this.state = {
			table,
			name,
			datatype,
			unique: false,
			notNull: false,
		} as TProps;
	}

	public notNull(): NotNull<this> {
		this.state.notNull = true;
		return this as NotNull<this>;
	}

	public unique(): Unique<this> {
		this.state.unique = true;
		return this as Unique<this>;
	}

	public default(value: TProps["defaultValue"]): HasDefault<this> {
		this.state.defaultValue = value;
		this.state.hasDefault = true;
		return this as HasDefault<this>;
	}

	public build() {
		return new Column<this["_"]>(
			this.state.table,
			this.state.name,
			this.state.datatype,
			this.state.unique,
			this.state.notNull,
			this.state.hasDefault,
			this.state.defaultValue,
		);
	}
}

export default ColumnBuilder;

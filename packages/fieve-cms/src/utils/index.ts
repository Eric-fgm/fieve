import sanitizeHTML from "sanitize-html";

export default {
	sanitize: sanitizeHTML,

	clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	},

	parseInteger(
		value: number | string | null | undefined,
		options?: Partial<{ defaultValue: number; min: number; max: number }>,
	): number {
		if (!value) {
			if (options?.defaultValue !== undefined) {
				return options.defaultValue;
			}
			return Number.NaN;
		}

		const integer = typeof value === "string" ? Number.parseInt(value, 10) : value;

		if (Number.isInteger(integer)) {
			if (options) {
				const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = options;
				return this.clamp(integer, min, max);
			}
			return integer;
		}

		if (options?.defaultValue !== undefined) {
			return options.defaultValue;
		}

		return Number.NaN;
	},

	paginate(query: Record<string, string | number>): {
		offset: number;
		limit: number;
		totalCount: number;
		totalPages: number;
		currentPage: number;
		perPage: number;
	} {
		const perPage = this.parseInteger(query.perPage, { defaultValue: 50, min: 1 });
		const totalCount = this.parseInteger(query.total, { defaultValue: 0, min: 0 });

		const totalPages = this.clamp(Math.ceil(totalCount / perPage), 1, Number.POSITIVE_INFINITY);

		const currentPage = this.parseInteger(query.page, { defaultValue: 1, min: 1, max: totalPages });

		const offset = (currentPage - 1) * perPage;
		const limit = perPage;

		return { offset, limit, totalCount, totalPages, currentPage, perPage };
	},

	async hashPassword(password: string) {
		return await Bun.password.hash(password, "bcrypt");
	},

	async verifyPassword(password: string, passwordHash: string) {
		return await Bun.password.verify(password, passwordHash, "bcrypt");
	},
};

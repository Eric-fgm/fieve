import type { createDatabase } from "@/database";

export namespace Database {
	export interface Config {
		path: string;
		options?: Partial<{
			readonly: boolean;
			create: boolean;
			readwrite: boolean;
			safeInteger: boolean;
			strict: boolean;
		}>;
	}

	export type Instance = ReturnType<typeof createDatabase>;
}

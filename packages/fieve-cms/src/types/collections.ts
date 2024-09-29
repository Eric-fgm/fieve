import type { Database, Optional } from "@/types";

export namespace Collections {
	export type Entity = Database.Instance["$inferSelect"]["entities"] & { fields?: Record<string, string>; terms?: Pick<Term, "id" | "name" | "slug" | "type">[]; };
	export type CreateEntity = Omit<Optional<Database.Instance["$inferInsert"]["entities"], "modifiedAt" | "createdAt">, "type"> &
		Partial<{ fields: Record<string, string | number>; terms: Record<string, number[]> }>;
	export type UpdateEntity = Partial<CreateEntity>;
	export type EntityParams = Partial<{
		id: number | number[];
		name: string;
		slug: string;
		status: number;
		authorId: number;
		parentId: number;
		modifiedBefore: Date;
		createdBefore: Date;
		modifiedAfter: Date;
		createdAfter: Date;
		include: Partial<{ fields: boolean; terms: boolean }>;
		termId: number | number[]
	}>;

	export type Term = Database.Instance["$inferSelect"]["terms"] & { fields?: Record<string, string>; };
	export type CreateTerm = Omit<Optional<Database.Instance["$inferInsert"]["terms"], "modifiedAt" | "createdAt">, "type"> &
		Partial<{ fields: Record<string, string | number> }>;
	export type UpdateTerm = Partial<CreateTerm>;
	export type TermParams = Partial<{
		id: number | number[];
		name: string;
		slug: string;
		parentId: number;
		modifiedBefore: Date;
		createdBefore: Date;
		modifiedAfter: Date;
		createdAfter: Date;
		include: Partial<{ fields: boolean }>;
		entityId: number | number[];
	}>;

	export type Field = { id: number; entityId: number; key: string; value: string };
}

import type { Database, Optional } from "@/types";

export namespace Users {
    export type User = Omit<Database.Instance["$inferSelect"]["users"], "password">;
    export type Create = Optional<Database.Instance["$inferInsert"]["users"], "modifiedAt" | "createdAt"> & {
        roles?: number[];
    };
    export type Update = Partial<Create>;
    export type Params = Partial<{
        id: number | number[];
        name: string;
        email: string;
        modifiedBefore: Date;
        createdBefore: Date;
        modifiedAfter: Date;
        createdAfter: Date;
        include: Partial<{ roles: boolean; password: boolean }>;
    }>;

    export type Role = Database.Instance["$inferSelect"]["roles"];
}

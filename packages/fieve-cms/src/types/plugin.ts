import type { Endpoints } from "@/server";
import type { Fieve, Server } from "@/types";

export namespace Plugin {
	export type Routes =
		| {
			path: string;
			endpoints: Endpoints;
		}
		| ((app: Fieve) => {
			path: string;
			endpoints: Endpoints;
		});

	export type Setup = (app: Fieve) => (void | Promise<void>);

	export type Services = (app: Fieve) => Record<string, unknown>;

	export type Controllers = (app: Fieve) => Record<string, (ctx: Server.Context, next: Server.Next) => void>;

	export type Valid = {
		slug: string;
		name?: string;
		description?: string;
		setup?: Setup;
		services?: Services;
		controllers?: Controllers;
		routes?: Routes;
	};
}

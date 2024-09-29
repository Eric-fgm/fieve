import { Hono } from "hono";
import { validator as honoValidator } from "hono/validator";

import type { Fieve, Server } from "@/types";

export type Endpoints = (
	methods: {
		get: Server.Instance["get"];
		post: Server.Instance["post"];
		put: Server.Instance["put"];
		del: Server.Instance["delete"];
		use: Server.Instance["use"];
	},
	validator: typeof honoValidator,
) => void;

const initRouter = (fieve: Fieve) => {
	for (const plugin of Object.values(fieve.plugins)) {
		if (!plugin.routes) continue;

		const routes = typeof plugin.routes === "function" ? plugin.routes(fieve) : plugin.routes;

		const router = new Hono<Server.Env>().basePath(routes.path);

		routes.endpoints(
			{
				get: router.get,
				post: router.post,
				put: router.put,
				del: router.delete,
				use: router.use,
			},
			honoValidator,
		);

		fieve.server.route("/api", router);
	}
};

export default initRouter;

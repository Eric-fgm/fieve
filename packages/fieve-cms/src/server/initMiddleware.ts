import { serveStatic } from "hono/bun";
import cookies from "@/server/cookies";
import jwt from "@/server/jwt";

import type { Fieve } from "@/types";

const initMiddleware = (fieve: Fieve) => {
	fieve.server
		.use(async (ctx, next) => {
			ctx.set("fieve", fieve);
			ctx.set("cookies", cookies(ctx));
			ctx.set("jwt", jwt(ctx));
			ctx.set("user", await fieve.service("auth").currentUser(ctx));

			await next();
		})
		.use(
			fieve.config.uploader.path ? `/public/${fieve.config.uploader.path}/*` : "/public/*",
			serveStatic({
				root: "./",
			}),
		)
		.onError((err, ctx) =>
			ctx.json(
				{ error: { message: fieve.config.env.DEV && err.message ? err.message : "Internal Server Error" } },
				500,
			),
		);
};

export default initMiddleware;

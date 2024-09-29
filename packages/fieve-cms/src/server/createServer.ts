import { Hono } from "hono";
import { getConnInfo } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import { timeout } from "hono/timeout";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { rateLimiter } from "hono-rate-limiter";

import type { Server } from "@/types";

const createServer = (config: Server.Config): Server.Instance => {
	return new Hono<Server.Env>()
		.use(timeout(config.timeout))
		.use(cors(config.cors))
		.use(secureHeaders(config.secureHeaders))
		.use(logger(config.logger))
		.use(
			"/api/*",
			rateLimiter({
				...config.rateLimiter,
				keyGenerator: (ctx) => {
					const connInfo = getConnInfo(ctx);
					const { address } = connInfo.remote;

					if (!address) {
						throw new HTTPException(403, {
							res: ctx.json({ error: { message: "Forbidden" } }, 403),
						});
					}

					return address;
				},
			}),
		);
};

export default createServer;

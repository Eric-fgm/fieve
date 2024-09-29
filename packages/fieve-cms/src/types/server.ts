import type { Hono, Context as HonoContext, Next as HonoNext } from "hono";
import type { cors } from "hono/cors";
import type { logger } from "hono/logger";
import type { secureHeaders } from "hono/secure-headers";
import type { rateLimiter, RateLimitInfo } from "hono-rate-limiter";
import type cookies from "@/server/cookies";
import type jwt from "@/server/jwt";
import type { Users, Fieve } from "@/types";

export namespace Server {
	export type Config = {
		port: number;
		maxRequestBodySize: number;
		timeout: number;
		cors?: Parameters<typeof cors>[0];
		logger?: Parameters<typeof logger>[0];
		secureHeaders?: Parameters<typeof secureHeaders>[0];
		rateLimiter?: Omit<Parameters<typeof rateLimiter>[0], "keyGenerator">;
	};

	export type Instance = Hono<Env>;

	export type Env = {
		Variables: {
			rateLimit: RateLimitInfo;
			fieve: Fieve;
			cookies: ReturnType<typeof cookies>;
			jwt: ReturnType<typeof jwt>;
			user: Users.User | null;
		};
	};

	export type Next = HonoNext;

	export type Context<Variables = Record<string, unknown>> = HonoContext<Env & { Variables: Variables }>;
}

import { getSignedCookie, setSignedCookie, deleteCookie } from "hono/cookie";

import type { CookieOptions } from "hono/utils/cookie";
import type { Server } from "@/types";

export default (ctx: Server.Context) => {
	const fieve = ctx.get("fieve");

	return {
		get: (key: string) => getSignedCookie(ctx, fieve.config.env.SECRET, key),
		set: (name: string, value: string, options?: CookieOptions) =>
			setSignedCookie(ctx, name, value, fieve.config.env.SECRET, options),
		delete: (name: string, options?: CookieOptions) => deleteCookie(ctx, name, options),
	};
};

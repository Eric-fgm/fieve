import { decode, sign, verify } from "hono/jwt";

import type { JWTPayload } from "hono/utils/jwt/types";
import type { Server } from "@/types";

export default (ctx: Server.Context) => {
	const fieve = ctx.get("fieve");

	return {
		sign: (payload: JWTPayload) => sign(payload, fieve.config.env.SECRET),
		verify: (token: string) => verify(token, fieve.config.env.SECRET),
		decode,
	};
};

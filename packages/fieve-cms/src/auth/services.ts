import type { Plugin, Users, Server } from "@/types";

export default ((fieve) => ({
	async currentUser(ctx: Server.Context) {
		const cookies = ctx.get("cookies");

		const sessionId = await cookies.get("auth");
		if (!sessionId) return null;

		const rawUserId = await fieve.store.get(sessionId);
		const userId = rawUserId ? fieve.utils.parseInteger(rawUserId) : null;

		return userId ? await fieve.service("users").getOne({ id: userId }) : null;
	},

	async authenticate(ctx: Server.Context, userId: number) {
		const cookies = ctx.get("cookies");

		const sessionId = `auth_${crypto.randomUUID()}`;

		await fieve.store.set(sessionId, userId);
		await cookies.set("auth", sessionId);

		return userId;
	},

	async unauthenticate(ctx: Server.Context) {
		const cookies = ctx.get("cookies");
		const currentUser = ctx.get("user");

		if (!currentUser) return null;

		const sessionId = await cookies.get("auth");
		if (!sessionId) {
			throw new Error(`Not found auth session for user. User id: ${currentUser.id}`);
		}

		await fieve.store.del(sessionId);
		cookies.delete("auth");

		return currentUser;
	},

	async generateResetToken(userId: number) {
		const token = `reset_${crypto.randomUUID()}`;

		await fieve.store.set(token, userId);

		return token;
	},

	async verifyResetToken(token: string) {
		const rawUserId = await fieve.store.get(token);
		const userId = rawUserId ? fieve.utils.parseInteger(rawUserId) : null;

		if (!userId || !Number.isInteger(userId)) {
			throw new Error("Error while getting userId");
		}

		return userId;
	},

	authorize(roles: string | string[] = []) {
		return async (ctx: Server.Context<{ user: Users.User }>, next: Server.Next) => {
			const currentUser = ctx.get("user");

			if (!currentUser) {
				return ctx.json({ error: { message: "Forbidden" } }, 403);
			}

			const userRoles = (await fieve.service("users").getRoles(currentUser.id)).map(({ name }) => name);

			if (userRoles.includes("admin")) {
				return await next();
			}

			const permissionRoles = typeof roles === "string" ? [roles] : roles;

			const hasPermission = permissionRoles.reduce(
				(accumulator, currentRole) => accumulator || userRoles.includes(currentRole),
				false,
			);

			if (!hasPermission) {
				return ctx.json({ error: { message: "Forbidden" } }, 403);
			}

			await next();
		};
	},
})) satisfies Plugin.Services;

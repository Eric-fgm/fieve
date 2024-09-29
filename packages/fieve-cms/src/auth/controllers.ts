import type { Plugin } from "@/types";

export default ((fieve) => ({
	async signUp(ctx) {
		const { email, password, name } = await ctx.req.json();

		const createdUser = await fieve.service("users").create({ email, password, name });

		return ctx.json({ data: createdUser });
	},

	async signIn(ctx) {
		const { email, password } = await ctx.req.json();

		const foundUser = await fieve.service("users").getOne({ email, include: { password: true } });
		if (!foundUser || !foundUser.password) {
			return ctx.json({ error: { message: "Unauthorized" } }, 401);
		}

		const verifiedPassword = await fieve.utils.verifyPassword(password, foundUser.password);
		if (!verifiedPassword) {
			return ctx.json({ error: { message: "Unauthorized" } }, 401);
		}

		await fieve.service("auth").authenticate(ctx, foundUser.id);

		const { password: _, ...restUser } = foundUser;

		return ctx.json({ data: restUser });
	},

	async signOut(ctx) {
		const currentUser = await fieve.service("auth").unauthenticate(ctx);
		if (!currentUser) {
			return ctx.json({ error: { message: "Unauthorized" } }, 401);
		}

		return ctx.json({ data: currentUser });
	},

	async getMe(ctx) {
		const currentUser = ctx.get("user");
		if (!currentUser) {
			return ctx.json({ error: { message: "Unauthorized" } }, 401);
		}

		return ctx.json({ data: currentUser });
	},

	async updateMe(ctx) {
		const { name } = await ctx.req.json();

		const currentUser = ctx.get("user");
		if (!currentUser) {
			return ctx.json({ error: { message: "Unauthorized" } }, 401);
		}

		const updatedUser = await fieve.service("users").update(currentUser.id, { name });

		return ctx.json({ data: updatedUser });
	},

	async forgotPassword(ctx) {
		const { email } = await ctx.req.json();

		const foundUser = await fieve.service("users").getOne({ email });
		if (!foundUser) {
			return ctx.json({ error: { message: `Not found user. User email: ${email}` } }, 404);
		}

		const token = await fieve.service("auth").generateResetToken(foundUser.id);

		await fieve.service("emailer").send({
			subject: "Password Reset",
			to: foundUser.email,
			text: `Reset token: ${token}`,
		});

		return ctx.json({ data: foundUser });
	},

	async resetPassword(ctx) {
		const { token, password } = await ctx.req.json();

		const userId = await fieve.service("auth").verifyResetToken(token);

		const foundUser = await fieve.service("users").getOne({ id: userId });
		if (!foundUser) {
			return ctx.json({ error: { message: `Not found user. User id: ${userId}` } }, 404);
		}

		const updatedUser = await fieve.service("users").update(userId, { password });
		await fieve.store.del(token)

		return ctx.json({ data: updatedUser });
	},
})) satisfies Plugin.Controllers;

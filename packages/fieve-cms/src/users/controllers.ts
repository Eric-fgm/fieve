import type { Plugin } from "@/types";

export default ((fieve) => ({
	async getOne(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const foundUser = await fieve.service("users").getOne({ id, include: { roles: true } });
		if (!foundUser) {
			return ctx.json({ error: { message: `Not found post. Post id: ${id}` } }, 404);
		}

		return ctx.json({ data: foundUser });
	},

	async getAll(ctx) {
		const query = ctx.req.query();

		const userCount = await fieve.service("users").count(query);

		const { offset, limit, ...pagination } = fieve.utils.paginate({ ...query, total: userCount });

		const foundUsers = await fieve.service("users").getAll({ ...query, offset, limit, include: { roles: true } });

		return ctx.json({
			data: foundUsers,
			meta: { pagination },
		});
	},

	async create(ctx) {
		const { email, password, name, roles } = await ctx.req.json();

		const createdUser = await fieve.service("users").create({ email, password, name, roles }, { include: { roles: true } });

		return ctx.json({ data: createdUser });
	},

	async update(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));
		const { name, roles } = await ctx.req.json();

		const userToUpdate = await fieve.service("users").getOne({ id });
		if (!userToUpdate) {
			return ctx.json({ error: { message: `Not found user. User id: ${id}` } }, 404);
		}

		const updatedUser = await fieve.service("users").update(id, { name, roles }, { include: { roles: true } });

		return ctx.json({ data: updatedUser });
	},
})) satisfies Plugin.Controllers;

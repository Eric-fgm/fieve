import type { Plugin } from "@/types";

export default ((fieve) => ({
	async getOne(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const foundUpload = await fieve.service("uploader").getOne({ id, include: { fields: true } });
		if (!foundUpload) {
			return ctx.json({ error: { message: `Not found upload. Upload id: ${id}` } }, 404);
		}

		return ctx.json({ data: foundUpload });
	},

	async getAll(ctx) {
		const query = ctx.req.query();

		const uploadCount = await fieve.service("uploader").count(query);

		const { offset, limit, ...pagination } = fieve.utils.paginate({ ...query, total: uploadCount });

		const foundUploads = await fieve.service("uploader").getAll({
			...query,
			offset,
			limit,
			include: { fields: true },
		});

		return ctx.json({
			data: foundUploads,
			meta: { pagination },
		});
	},

	async upload(ctx) {
		const currentUser = ctx.get("user");

		if (!currentUser) {
			return ctx.json({ error: { message: "Unauthorized" } }, 401);
		}

		const { file } = await ctx.req.parseBody();

		if (!(file instanceof File)) {
			return ctx.json({ error: { message: 'Unsupported media type. Field "file" should be instance of File' } }, 415);
		}

		const createdUpload = await fieve.service("uploader").upload({ file, name: file.name, authorId: currentUser.id }, { include: { fields: true } });

		return ctx.json({ data: createdUpload });
	},

	async update(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));
		const { parentId, description, status, fields } = await ctx.req.json();

		const uploadToUpdate = await fieve.service("uploader").getOne({ id });
		if (!uploadToUpdate) {
			return ctx.json({ error: { message: `Not found upload. Upload id: ${id}` } }, 404);
		}

		const updatedUpload = await fieve.service("uploader").update(id, { parentId, description, fields, status }, { include: { fields: true } });

		return ctx.json({ data: updatedUpload });
	},

	async remove(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const uploadToRemove = await fieve.service("uploader").getOne({ id, include: { fields: true } });
		if (!uploadToRemove) {
			return ctx.json({ error: { message: "Not Found" } }, 404);
		}

		await fieve.service("uploader").remove(id);

		return ctx.json({ data: uploadToRemove });
	},
})) satisfies Plugin.Controllers;

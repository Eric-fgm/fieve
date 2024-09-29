import type { Plugin } from "@fieve/cms/src/types";

export default ((fieve) => ({
	/*
		- PUBLIC
	*/

	async getPublicPost(ctx) {
		const slug = ctx.req.param("slug");

		const foundPost = await fieve.service("blog").getPost({ slug, status: 1, include: { fields: true, terms: true } });
		if (!foundPost) {
			return ctx.json({ error: { message: `Not found post. Post slug: ${slug}` } }, 404);
		}

		return ctx.json({ data: foundPost });
	},

	async getPublicPosts(ctx) {
		const query = { ...ctx.req.query(), status: 1 };

		const postCount = await fieve.service("blog").countPosts(query);

		const { offset, limit, ...pagination } = fieve.utils.paginate({ ...query, total: postCount });

		const foundPosts = await fieve.service("blog").getPosts({ ...query, offset, limit, include: { fields: true } });

		return ctx.json({
			data: foundPosts,
			meta: { pagination },
		});
	},

	/*
		- ADMIN
	*/

	async getPost(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const foundPost = await fieve.service("blog").getPost({ id, include: { fields: true, terms: true } });
		if (!foundPost) {
			return ctx.json({ error: { message: `Not found post. Post id: ${id}` } }, 404);
		}

		return ctx.json({ data: foundPost });
	},

	async getPosts(ctx) {
		const query = ctx.req.query();

		const postCount = await fieve.service("blog").countPosts(query);

		const { offset, limit, ...pagination } = fieve.utils.paginate({ ...query, total: postCount });

		const foundPosts = await fieve
			.service("blog")
			.getPosts({ ...query, offset, limit, include: { fields: true, terms: true } });

		return ctx.json({
			data: foundPosts,
			meta: { pagination },
		});
	},

	async createPost(ctx) {
		const { parentId, name, slug, description, fields, status, categories, tags } = await ctx.req.json();

		const currentUser = ctx.get("user");
		if (!currentUser) {
			return ctx.json({ error: { message: "Unauthorized" } }, 401);
		}

		const createdPost = await fieve
			.service("blog")
			.createPost({ parentId, authorId: currentUser.id, name, slug, description, status, fields, categories, tags }, { include: { fields: true, terms: true } });

		return ctx.json({ data: createdPost });
	},

	async updatePost(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));
		const { parentId, name, slug, description, fields, status, categories, tags } = await ctx.req.json();

		const foundPost = await fieve.service("blog").getPost({ id });
		if (!foundPost) {
			return ctx.json({ error: { message: `Not found post. Post id: ${id}` } }, 404);
		}

		const updatedPost = await fieve
			.service("blog")
			.updatePost(id, { parentId, name, slug, description, fields, status, categories, tags }, { include: { fields: true, terms: true } });

		return ctx.json({ data: updatedPost });
	},

	async removePost(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const postToRemove = await fieve.service("blog").getPost({ id, include: { fields: true, terms: true } });
		if (!postToRemove) {
			return ctx.json({ error: { message: `Not found post. Post id: ${id}` } }, 404);
		}

		await fieve.service("blog").removePost(id);

		return ctx.json(postToRemove);
	},

	/* 
		-- CATEGORIES
	*/

	async getCategory(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const foundCategory = await fieve.service("blog").getCategory({ id, include: { fields: true } });
		if (!foundCategory) {
			return ctx.json({ error: { message: `Not found category. Category id: ${id}` } }, 404);
		}

		return ctx.json({ data: foundCategory });
	},

	async getCategories(ctx) {
		const query = ctx.req.query();

		const categoryCount = await fieve.service("blog").countCategories(query);

		const { offset, limit, ...pagination } = fieve.utils.paginate({ ...query, total: categoryCount });

		const foundCategories = await fieve
			.service("blog")
			.getCategories({ ...query, offset, limit, include: { fields: true } });

		return ctx.json({
			data: foundCategories,
			meta: { pagination },
		});
	},

	async createCategory(ctx) {
		const { parentId, name, slug, fields } = await ctx.req.json();

		const createdCategory = await fieve.service("blog").createCategory({ parentId, name, slug, fields }, { include: { fields: true } });

		return ctx.json({ data: createdCategory });
	},

	async updateCategory(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));
		const { parentId, name, slug, fields } = await ctx.req.json();

		const categoryToUpdate = await fieve.service("blog").getCategory({ id });
		if (!categoryToUpdate) {
			return ctx.json({ error: { message: `Not found category. Category id: ${id}` } }, 404);
		}

		const updatedCategory = await fieve.service("blog").updateCategory(id, { parentId, name, slug, fields }, { include: { fields: true } });

		return ctx.json({ data: updatedCategory });
	},

	async removeCategory(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const categoryToRemove = await fieve.service("blog").getCategory({ id, include: { fields: true } });
		if (!categoryToRemove) {
			return ctx.json({ error: { message: `Not found category. Category id: ${id}` } }, 404);
		}

		await fieve.service("blog").removeCategory(id);

		return ctx.json(categoryToRemove);
	},

	/* 
		-- TAGS
	*/

	async getTag(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const foundTag = await fieve.service("blog").getTag({ id, include: { fields: true } });
		if (!foundTag) {
			return ctx.json({ error: { message: `Not found tag. Tag id: ${id}` } }, 404);
		}

		return ctx.json({ data: foundTag });
	},

	async getTags(ctx) {
		const query = ctx.req.query();

		const tagCount = await fieve.service("blog").countTags(query);

		const { offset, limit, ...pagination } = fieve.utils.paginate({ ...query, total: tagCount });

		const foundTags = await fieve.service("blog").getTags({ ...query, offset, limit, include: { fields: true } });

		return ctx.json({
			data: foundTags,
			meta: { pagination },
		});
	},

	async createTag(ctx) {
		const { parentId, name, slug, fields } = await ctx.req.json();

		const createdTag = await fieve.service("blog").createTag({ parentId, name, slug, fields }, { include: { fields: true } });

		return ctx.json({ data: createdTag });
	},

	async updateTag(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));
		const { parentId, name, slug, fields } = await ctx.req.json();

		const tagToUpdate = await fieve.service("blog").getTag({ id });
		if (!tagToUpdate) {
			return ctx.json({ error: { message: `Not found tag. Tag id: ${id}` } }, 404);
		}

		const updatedTag = await fieve.service("blog").updateTag(id, { parentId, name, slug, fields }, { include: { fields: true } });

		return ctx.json({ data: updatedTag });
	},

	async removeTag(ctx) {
		const id = fieve.utils.parseInteger(ctx.req.param("id"));

		const tagToRemove = await fieve.service("blog").getTag({ id, include: { fields: true } });
		if (!tagToRemove) {
			return ctx.json({ error: { message: `Not found tag. Tag id: ${id}` } }, 404);
		}

		await fieve.service("blog").removeTag(id);

		return ctx.json({ data: tagToRemove });
	},
})) satisfies Plugin.Controllers;

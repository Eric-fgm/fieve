import type { Collections, Plugin } from "@fieve/cms/src/types";

type PostParams = Collections.EntityParams
type CreatePost = Omit<Collections.CreateEntity, "terms"> & { categories?: number[]; tags?: number[] };
type UpdatePost = Partial<CreatePost>;

type TermParams = Omit<Collections.TermParams, "entityId"> & { postId?: number };
type CreateTerm = Collections.CreateTerm
type UpdateTerm = Partial<CreateTerm>;

const POST_UID = 'post'
const CATEGORY_UID = 'post-category'
const TAG_UID = 'post-tag'

const parsePostPayload = <T extends UpdatePost>(payload: T) => ({
	...payload,
	terms: {
		...(payload.categories && { [CATEGORY_UID]: payload.categories }),
		...(payload.tags && { [TAG_UID]: payload.tags }),
	}
})

const parseCategoryParams = (params: TermParams) => ({ ...params, entityId: params?.postId })

const parseTagParams = (params: TermParams) => ({ ...params, entityId: params?.postId })

export default ((fieve) => {
	const getThumbnail = async (postId: number, thumbnailId?: number) => {
		let _thumbnailId = thumbnailId;

		if (!_thumbnailId) {
			const rawThumbnailId = await fieve.collections.entity(POST_UID).getField(postId, "thumbnailId");
			_thumbnailId = fieve.utils.parseInteger(rawThumbnailId);
		}

		if (!Number.isInteger(_thumbnailId)) {
			return null;
		}

		const thumbnail = await fieve.collections.entity("uploader").getOne({ id: _thumbnailId });
		if (!thumbnail) {
			return null;
		}

		return { id: thumbnail.id, name: thumbnail.name, src: thumbnail.slug, alt: thumbnail.description ?? "" };
	};

	const preparePost = async ({
		fields,
		terms,
		...restPost
	}: Collections.Entity) => {
		const { thumbnailId, ...restFields } = fields ?? {}

		return {
			...restPost,
			...(fields && { fields: restFields, thumbail: await getThumbnail(restPost.id, fieve.utils.parseInteger(thumbnailId)) }),
			...(terms && { categories: terms.filter(({ type }) => type === CATEGORY_UID), tags: terms.filter(({ type }) => type === TAG_UID), }
			),
		};
	};

	return {
		getThumbnail,

		async setThumbnail(postId: number, thumbnailId: number | null) {
			await fieve.collections.entity(POST_UID).setField(postId, "thumbnailId", thumbnailId ?? "");
		},

		async getPost(params: PostParams) {
			const post = await fieve.collections.entity(POST_UID).getOne(params);

			if (!post) {
				return null;
			}

			return await preparePost(post);
		},

		async getPosts(params: PostParams & { offset?: number; limit?: number } = {}) {
			const posts = await fieve.collections.entity(POST_UID).getAll(params);

			return await Promise.all(posts.map(preparePost));
		},

		async countPosts(params: PostParams = {}) {
			return await fieve.collections.entity(POST_UID).count(params);
		},

		async createPost(payload: CreatePost, params: PostParams = {}) {
			const createdPost = await fieve.collections.entity(POST_UID).create(parsePostPayload(payload), params);

			return preparePost(createdPost);
		},

		async updatePost(id: number, payload: UpdatePost, params: PostParams = {}) {
			const updatedPost = await fieve.collections.entity(POST_UID).update(id, parsePostPayload(payload), params);

			return preparePost(updatedPost);
		},

		async removePost(id: number) {
			await fieve.collections.entity(POST_UID).remove(id);
		},

		async getCategory(params: TermParams) {
			return await fieve.collections.term(CATEGORY_UID).getOne(parseCategoryParams(params));
		},

		async getCategories(params: TermParams & { offset?: number; limit?: number } = {}) {
			return await fieve.collections.term(CATEGORY_UID).getAll(parseCategoryParams(params));
		},

		async countCategories(params: TermParams = {}) {
			return await fieve.collections.term(CATEGORY_UID).count(parseCategoryParams(params));
		},

		async createCategory(payload: CreateTerm, params: TermParams = {}) {
			return await fieve.collections.term(CATEGORY_UID).create(payload, parseCategoryParams(params));
		},

		async updateCategory(id: number, payload: UpdateTerm, params: TermParams = {}) {
			return await fieve.collections.term(CATEGORY_UID).update(id, payload, parseCategoryParams(params));
		},

		async removeCategory(id: number) {
			await fieve.collections.term(CATEGORY_UID).remove(id);
		},

		async getTag(params: TermParams) {
			return await fieve.collections.term(TAG_UID).getOne(parseTagParams(params));
		},

		async getTags(params: TermParams & { offset?: number; limit?: number } = {}) {
			return await fieve.collections.term(TAG_UID).getAll(parseTagParams(params));
		},

		async countTags(params: TermParams = {}) {
			return await fieve.collections.term(TAG_UID).count(parseTagParams(params));
		},

		async createTag(payload: CreateTerm, params: TermParams = {}) {
			return await fieve.collections.term(TAG_UID).create(payload, parseTagParams(params));
		},

		async updateTag(id: number, payload: UpdateTerm, params: TermParams = {}) {
			return await fieve.collections.term(TAG_UID).update(id, payload, parseTagParams(params));
		},

		async removeTag(id: number) {
			await fieve.collections.term(TAG_UID).remove(id);
		},
	};
}) satisfies Plugin.Services;

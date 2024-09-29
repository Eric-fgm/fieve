import type { Plugin } from "@fieve/cms/src/types";

export default ((fieve) => ({
	path: "/v1",
	endpoints({ get, put, post, del }) {
		/*
            - PUBLIC
        */

		get("/posts/:slug", fieve.controller("blog").getPublicPost);

		get("/posts", fieve.controller("blog").getPublicPosts);

		/*
            - ADMIN
        */

		get("/admin/posts/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").getPost);

		get("/admin/posts", fieve.service("auth").authorize("admin"), fieve.controller("blog").getPosts);

		post("/admin/posts", fieve.service("auth").authorize("admin"), fieve.controller("blog").createPost);

		put("/admin/posts/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").updatePost);

		del("/admin/posts/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").removePost);

		/*
            -- CATEGORIES
        */

		get("/admin/categories/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").getCategory);

		get("/admin/categories", fieve.service("auth").authorize("admin"), fieve.controller("blog").getCategories);

		post("/admin/categories", fieve.service("auth").authorize("admin"), fieve.controller("blog").createCategory);

		put("/admin/categories/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").updateCategory);

		del("/admin/categories/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").removeCategory);

		/*
            -- TAGS
        */

		get("/admin/tags/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").getTag);

		get("/admin/tags", fieve.service("auth").authorize("admin"), fieve.controller("blog").getTags);

		post("/admin/tags", fieve.service("auth").authorize("admin"), fieve.controller("blog").createTag);

		put("/admin/tags/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").updateTag);

		del("/admin/tags/:id", fieve.service("auth").authorize("admin"), fieve.controller("blog").removeTag);
	},
})) satisfies Plugin.Routes;

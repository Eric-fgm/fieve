import type { Plugin } from "@/types";

export default ((fieve) => ({
	path: "/v1/admin/uploads",
	endpoints({ get, put, post, del }) {
		get("/:id", fieve.service("auth").authorize("admin"), fieve.controller("uploader").getOne);

		get("/", fieve.service("auth").authorize("admin"), fieve.controller("uploader").getAll);

		post("/", fieve.service("auth").authorize("admin"), fieve.controller("uploader").upload);

		put("/:id", fieve.service("auth").authorize("admin"), fieve.controller("uploader").update);

		del("/:id", fieve.service("auth").authorize("admin"), fieve.controller("uploader").remove);
	},
})) satisfies Plugin.Routes;

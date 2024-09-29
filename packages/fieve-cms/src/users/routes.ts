import type { Plugin } from "@/types";

export default ((fieve) => ({
	path: "/v1/admin/users",
	endpoints({ get, post, put }) {
		get("/:id", fieve.service("auth").authorize("admin"), fieve.controller("users").getOne);

		get("/", fieve.service("auth").authorize("admin"), fieve.controller("users").getAll);

		post("/", fieve.service("auth").authorize("admin"), fieve.controller("users").create);

		put("/:id", fieve.service("auth").authorize("admin"), fieve.controller("users").update);
	},
})) satisfies Plugin.Routes;

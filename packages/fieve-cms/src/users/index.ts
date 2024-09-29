import setup from "@/users/setup";
import routes from "@/users/routes";
import services from "@/users/services";
import controllers from "@/users/controllers";

import type { Plugin } from "@/types";

export default {
	slug: "users",
	setup,
	routes,
	services,
	controllers,
} satisfies Plugin.Valid;

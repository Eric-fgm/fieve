import routes from "@/auth/routes";
import services from "@/auth/services";
import controllers from "@/auth/controllers";

import type { Plugin } from "@/types";

// [TO DO] Ability to clear user session programmatically by user id (Problem with redis - getByValue)
//   ->    Clear session after password reset

export default {
	slug: "auth",
	routes,
	services,
	controllers,
} satisfies Plugin.Valid;

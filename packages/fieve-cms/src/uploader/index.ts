import routes from "@/uploader/routes";
import services from "@/uploader/services";
import controllers from "@/uploader/controllers";

import type { Plugin } from "@/types";

export default {
	slug: "uploader",
	routes,
	services,
	controllers,
} satisfies Plugin.Valid;

import routes from "./routes";
import services from "./services";
import controllers from "./controllers";

import type { Plugin } from "@fieve/cms/src/types";

const plugin = { slug: "blog", routes, services, controllers } satisfies Plugin.Valid;

export type BlogPlugin = typeof plugin;

export default plugin;

declare module "@fieve/cms/src/types" {
	export interface GeneratedPlugins {
		blog: BlogPlugin;
	}
}

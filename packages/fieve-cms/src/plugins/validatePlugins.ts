import type { Plugin } from "@/types";

const validateSlug = (plugin: Record<string, unknown>): plugin is { slug: string } => {
	return "slug" in plugin && typeof plugin.slug === "string" && !!plugin.slug.length;
};

const validatePlugins = (plugins: Record<string, unknown>[]): Record<string, Plugin.Valid> => {
	return plugins.reduce<Record<string, Plugin.Valid>>((accumulator, currentPlugin) => {
		if (!validateSlug(currentPlugin)) {
			throw new Error("Invalid plugin. Plugin must contain slug property");
		}
		accumulator[currentPlugin.slug] = currentPlugin;
		return accumulator;
	}, {});
};

export default validatePlugins;

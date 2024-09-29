import services from "@/emailer/services";

import type { Plugin } from "@/types";

export { default as createEmailer } from "@/emailer/createEmailer";

export default {
	slug: "emailer",
	services,
} satisfies Plugin.Valid;

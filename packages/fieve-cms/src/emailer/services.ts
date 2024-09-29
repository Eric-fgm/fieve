import type { Plugin, Emailer } from "@/types";

export default ((fieve) => ({
	async send(options: Emailer.Options) {
		const { from, sender, replyTo, inReplyTo } = fieve.config.emailer.metadata;

		const sentMail = await fieve.emailer.sendMail({ ...options, from, sender, replyTo, inReplyTo });

		if (!sentMail.accepted.length) {
			throw new Error("Error while sending email")
		}

		return sentMail
	},
})) satisfies Plugin.Services;

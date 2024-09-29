import type { Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export namespace Emailer {
	export type Config = Partial<SMTPTransport.Options> & {
		metadata: {
			from: string;
			sender: string;
			replyTo: string;
			inReplyTo: string;
		};
	};

	export type Instance = Transporter<SMTPTransport.SentMessageInfo>;

	export type Options = Omit<Mail.Options, "from" | "sender" | "replyTo" | "inReplyTo">;
}

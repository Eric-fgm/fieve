import createFieve from "@fieve/cms";
import blogPlugin from "@fieve/plugin-blog";

const app = await createFieve({
	config: {
		admin: {
			email: "admin@example.com",
			url: "http://localhost:8080",
		},
		emailer: {
			host: "smtp.email",
			port: 587,
			secure: false,
			auth: {
				user: "email@example.com",
				pass: "",
			},
			metadata: {
				from: "",
				sender: "",
				replyTo: "",
				inReplyTo: ""
			}
		},
		env: { SECRET: "your-secret", DEV: true },
	},
	plugins: [blogPlugin],
});

export default {
	port: app.config.server.port,
	maxRequestBodySize: app.config.server.maxRequestBodySize,
	fetch: app.server.fetch,
};
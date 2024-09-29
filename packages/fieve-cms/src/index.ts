import { createDatabase, initTables } from "@/database";
import { createStore } from "@/store";
import { createServer, initMiddleware, initRouter } from "@/server";
import collections from "@/collections";
import { validatePlugins } from "@/plugins";
import utils from "@/utils";
import emailer, { createEmailer } from "@/emailer";
import uploader from "@/uploader";
import auth from "@/auth";
import users from "@/users";

import type { Database, Store, Server, Emailer, Optional, Plugin, GeneratedPlugins } from "@/types";

type Config = {
	env: { SECRET: string; DEV: boolean };
	admin: { email: string; url: string };
	db: Database.Config;
	store?: Store.Config;
	emailer: Emailer.Config;
	server: Server.Config;
	uploader: { path: string; tmpPath: string; maxSize: number; chunkSize: number };
};

export class Fieve {
	public config!: Config;
	public db!: Database.Instance;
	public store!: Store.Instance;
	public emailer!: Emailer.Instance;
	public server!: Server.Instance;
	public plugins!: GeneratedPlugins;
	public collections = collections(this)
	public utils = utils;

	private initDatabase() {
		initTables(this);
	}

	private initServer() {
		initMiddleware(this);
		initRouter(this);
	}

	private async initPlugins() {
		await Promise.all(Object.values(this.plugins).map((plugin) => plugin.setup?.(this)))
	}

	public async boot({ config, plugins }: { config: Config; plugins: Plugin.Valid[] }) {
		this.config = config;
		this.db = createDatabase(config.db);
		this.store = createStore(config.store ?? { db: this.db });
		this.server = createServer(config.server);
		this.emailer = await createEmailer(config.emailer)
		this.plugins = {
			auth,
			users,
			emailer,
			uploader,
			...validatePlugins(plugins),
		};

		this.initDatabase();
		this.initServer();
		await this.initPlugins();

		return this;
	}

	public plugin<K extends keyof GeneratedPlugins>(name: K) {
		if (!this.plugins[name]) {
			throw new Error(`Plugin "${name}" not found`);
		}

		return this.plugins[name];
	}

	public service<K extends keyof GeneratedPlugins>(name: K) {
		if (!("services" in this.plugins[name])) {
			throw new Error(`Services of plugin "${name}" not found`);
		}

		return this.plugins[name].services?.(this) as ReturnType<
			GeneratedPlugins[K] extends { services: Plugin.Services } ? GeneratedPlugins[K]["services"] : never
		>;
	}

	public controller<K extends keyof GeneratedPlugins>(name: K) {
		if (!("controllers" in this.plugins[name])) {
			throw new Error(`Controllers of plugin "${name}" not found`);
		}

		return this.plugins[name].controllers?.(this) as ReturnType<
			GeneratedPlugins[K] extends { controllers: Plugin.Controllers } ? GeneratedPlugins[K]["controllers"] : never
		>;
	}
}

export default ({
	config,
	plugins = [],
}: { config: Optional<Config, "db" | "server" | "uploader">; plugins?: Plugin.Valid[] }) => {
	const defaultConfig = {
		db: { path: "./private/database.db" },
		server: {
			port: 8080,
			maxRequestBodySize: 1024 * 1024 * 100,
			timeout: 5000,
			rateLimiter: {
				limit: 100,
			},
		},
		uploader: {
			path: "uploads",
			tmpPath: "tmp",
			maxSize: 1024 * 1024 * 20,
			chunkSize: 1024 * 1024,
		},
	};

	return new Fieve().boot({
		config: { ...defaultConfig, ...config },
		plugins,
	});
};

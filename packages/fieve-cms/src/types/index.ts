import type emailer from "@/emailer";
import type uploader from "@/uploader";
import type auth from "@/auth";
import type users from "@/users";

export interface GeneratedPlugins {
	emailer: typeof emailer;
	uploader: typeof uploader;
	auth: typeof auth;
	users: typeof users;
}

export type { Fieve } from "@/index";
export type { Database } from "@/types/database";
export type { Emailer } from "@/types/emailer";
export type { Server } from "@/types/server";
export type { Store } from "@/types/store";
export type { Plugin } from "@/types/plugin";
export type { Collections } from "@/types/collections";
export type { Users } from "@/types/users";

export * from "@/types/helpers";

import { sqliteTable, relations } from "@fieve/orm";

export const users = sqliteTable("users", ({ integer, text, date }) => ({
	id: integer("id").primaryKey(),
	email: text("email").unique().notNull(),
	password: text("password").notNull(),
	name: text("name"),
	modifiedAt: date("modified_at").notNull(),
	createdAt: date("created_at").notNull(),
}));

export const roles = sqliteTable("roles", ({ integer, text }) => ({
	id: integer("id").primaryKey(),
	name: text("name").unique().notNull(),
}));

export const rolesRelationships = sqliteTable(
	"roles_relationships",
	({ integer }) => ({
		roleId: integer("role_id").references(roles.columns.id).notNull(),
		userId: integer("user_id").references(users.columns.id).notNull(),
	}),
	(t) => ({ primaryKeys: [t.roleId, t.userId] }),
);

export const entities = sqliteTable("entities", ({ integer, text, date }) => ({
	id: integer("id").primaryKey(),
	authorId: integer("author_id").references(users.columns.id).notNull(),
	parentId: integer("parent_id").references("entities(id)"),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	description: text("description"),
	status: integer("status").notNull(),
	type: text("type").notNull(),
	modifiedAt: date("modified_at").notNull(),
	createdAt: date("created_at").notNull(),
}));

export const entityFields = sqliteTable("entity_fields", ({ integer, text }) => ({
	id: integer("id").primaryKey(),
	entityId: integer("entity_id").references(entities.columns.id).notNull(),
	key: text("key").notNull(),
	value: text("value").notNull(),
}));

export const terms = sqliteTable("terms", ({ integer, text, date }) => ({
	id: integer("id").primaryKey(),
	parentId: integer("parent_id").references("terms(id)"),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	type: text("type").notNull(),
	modifiedAt: date("modified_at").notNull(),
	createdAt: date("created_at").notNull(),
}));

export const termFields = sqliteTable("term_fields", ({ integer, text }) => ({
	id: integer("id").primaryKey(),
	termId: integer("term_id").references(terms.columns.id).notNull(),
	key: text("key").notNull(),
	value: text("value").notNull(),
}));

export const termsRelationships = sqliteTable(
	"terms_relationships",
	({ integer }) => ({
		termId: integer("term_id").references(terms.columns.id).notNull(),
		entityId: integer("entity_id").references(entities.columns.id).notNull(),
	}),
	(t) => ({ primaryKeys: [t.termId, t.entityId] }),
);

export const store = sqliteTable("store", ({ text }) => ({
	key: text("key").unique().notNull(),
	value: text("value").notNull(),
}));

export const usersRelations = relations(users, ({ many }) => ({
	entities: many(entities),
	roles: many(rolesRelationships),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	users: many(rolesRelationships),
}));

export const rolesRelationshipsRelations = relations(rolesRelationships, ({ one }) => ({
	role: one(roles, { fields: ["roleId"], references: ["id"] }),
	user: one(users, { fields: ["userId"], references: ["id"] }),
}));

export const entitiesRelations = relations(entities, ({ one, many }) => ({
	author: one(users, { fields: ["authorId"], references: ["id"] }),
	parent: one(entities, { fields: ["parentId"], references: ["id"] }),
	terms: many(termsRelationships),
	fields: many(entityFields),
}));

export const entityFieldsRelations = relations(entityFields, ({ one }) => ({
	entity: one(entities, { fields: ["entityId"], references: ["id"] }),
}));

export const termsRelations = relations(terms, ({ many }) => ({
	entities: many(termsRelationships),
	fields: many(termFields),
}));

export const termFieldsRelations = relations(termFields, ({ one }) => ({
	term: one(terms, { fields: ["termId"], references: ["id"] }),
}));

export const termsRelationshipsRelations = relations(termsRelationships, ({ one }) => ({
	entity: one(entities, { fields: ["entityId"], references: ["id"] }),
	term: one(terms, { fields: ["termId"], references: ["id"] }),
}));

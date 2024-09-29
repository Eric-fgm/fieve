import * as schema from "@/database/schema";

import type { Fieve } from "@/types";

const initTables = ({ db }: Fieve) => {
	db.raw(schema.users.toSQL());
	db.raw(schema.roles.toSQL());
	db.raw(schema.rolesRelationships.toSQL());
	db.raw(schema.entities.toSQL());
	db.raw(schema.entityFields.toSQL());
	db.raw(schema.terms.toSQL());
	db.raw(schema.termFields.toSQL());
	db.raw(schema.termsRelationships.toSQL());
	db.raw(schema.store.toSQL());
};

export default initTables;

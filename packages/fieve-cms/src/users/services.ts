import type { Plugin, Users } from "@/types";

const parseParams = (params: Users.Params) => ({
	"users.id": typeof params.id === "number" ? { "==": params.id } : { in: params.id },
	"users.name": { "==": params.name },
	"users.email": { "==": params.email },
	"users.modifiedAt": params.modifiedBefore ? { "<": params.modifiedBefore } : { ">": params.modifiedAfter },
	"users.createdAt": params.createdBefore ? { "<": params.createdBefore } : { ">": params.createdAfter },
});

const prepareUser = <T extends Users.User & { password: string; roles?: { role: Users.Role }[] }>(
	{ password, roles, ...restUser }: T,
	withPassword = false,
) => {
	const preparedRoles = (roles ?? []).map(({ role }) => role);

	return {
		...restUser,
		...(roles && { roles: preparedRoles }),
		...(withPassword && { password }),
	};
};

export default ((fieve) => {
	const getOne = async (params: Users.Params) => {
		const user = await fieve.db
			.findOne("users")
			.include({ roles: params.include?.roles ? { role: true } : false })
			.where(parseParams(params));

		if (!user) {
			return null;
		}

		return prepareUser(user, params.include?.password);
	};

	const setRoles = async (userId: number, roleIds: number[]) => {
		const rolesToSet = await fieve.db.findAll('roles').where({ 'roles.id': { $in: roleIds } })

		await Promise.all([
			fieve.db.delete("rolesRelationships").where({ userId: { "==": userId } }),
			!!rolesToSet.length && fieve.db.insert("rolesRelationships").values(rolesToSet.map((role) => ({ userId, roleId: role.id })))
		])

		return rolesToSet.map(({ id }) => id);
	};

	return {
		getOne,

		async getAll(params: Users.Params & { limit?: number; offset?: number } = {}) {
			const users = await fieve.db
				.findAll("users")
				.include({ roles: params.include?.roles ? { role: true } : false })
				.where(parseParams(params))
				.offset(params.offset ?? 0)
				.limit(params.limit ?? 50);

			return users.map((user) => prepareUser(user, params.include?.password));
		},

		async count(params: Users.Params = {}) {
			const result = await fieve.db
				.findOne("users")
				.map({ count: (_: number) => "count(*)" })
				.where(parseParams(params));

			return result?.count ?? 0;
		},

		async getRoles(userId: number) {
			return await fieve.db
				.findAll("rolesRelationships")
				.join("roles", { id: { "==": "rolesRelationships.roleId" } })
				.map({ id: "roles.id", name: "roles.name" })
				.where({ "rolesRelationships.userId": { "==": userId } });
		},

		setRoles,

		async create(payload: Users.Create, params?: Users.Params) {
			const currentDate = new Date();
			const { email, name, password, roles, modifiedAt = currentDate, createdAt = currentDate } = payload;

			if (!email || !name || !password) {
				throw new Error("Bad payload")
			}

			if (await getOne({ email })) {
				throw new Error("Already exists");
			}

			const result = await fieve.db
				.insert("users")
				.values({
					email: fieve.utils.sanitize(email),
					name: name && fieve.utils.sanitize(name),
					password: await fieve.utils.hashPassword(password),
					modifiedAt,
					createdAt,
				})
				.returning({ id: true });

			if (roles) {
				await setRoles(result.id, roles);
			}

			const createdUser = await getOne({ ...params, id: result.id })

			if (!createdUser) {
				throw new Error("Database error");
			}

			return createdUser
		},

		async update(id: number, payload: Users.Update, params?: Users.Params) {
			const { email, name, password, roles, modifiedAt = new Date(), createdAt } = payload;

			if (email === "" || name === "" || password === "") {
				throw new Error("Bad payload")
			}

			if (email && (await getOne({ email }))) {
				throw new Error("Already exists");
			}

			const result = await fieve.db
				.update("users")
				.sets({
					email: email && fieve.utils.sanitize(email),
					name: name && fieve.utils.sanitize(name),
					password: password && (await fieve.utils.hashPassword(password)),
					modifiedAt,
					createdAt
				})
				.where({ id: { "==": id } })
				.returning({ id: true });

			if (roles) {
				await setRoles(result.id, roles);
			}

			const updatedUser = await getOne({ ...params, id: result.id })

			if (!updatedUser) {
				throw new Error("Database error");
			}

			return updatedUser
		},

		async remove(id: number) {
			await fieve.db.delete("users").where({ id: { "==": id } });
		},
	};
}) satisfies Plugin.Services;

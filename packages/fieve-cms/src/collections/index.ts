import type { Fieve, Collections } from "@/types";

export default (fieve: Fieve) => {
    const prepareFields = (fields: Collections.Field[]) => fields.reduce<Record<string, string>>((accumulator, { key, value }) => {
        accumulator[key] = value
        return accumulator
    }, {})

    return {
        entity: (uid: string) => {
            const parseParams = (params: Collections.EntityParams) => ({
                "entities.id": typeof params.id === "number" ? { "==": params.id } : { $in: params.id },
                "entities.type": { "==": uid },
                "entities.name": { "==": params.name },
                "entities.slug": { "==": params.slug },
                "entities.status": { "==": params.status },
                "entities.authorId": { "==": params.authorId },
                "entities.parentId": { "==": params.parentId },
                "entities.modifiedAt": params.modifiedBefore ? { "<": params.modifiedBefore } : { ">": params.modifiedAfter },
                "entities.createdAt": params.createdBefore ? { "<": params.createdBefore } : { ">": params.createdAfter },
            })

            const prepareEntity = ({ fields, terms, ...restEntity }: Omit<Collections.Entity, "fields" | "terms"> & { fields?: Collections.Field[]; terms?: { term: Collections.Term }[] }): Collections.Entity => ({
                ...restEntity,
                ...(fields && { fields: prepareFields(fields) }),
                ...(terms && { terms: terms.map(({ term: { id, name, slug, type } }) => ({ id, name, slug, type })) }),
            })

            return {
                async getField(entityId: number, key: string) {
                    const field = await fieve.db.findOne("entityFields").where({
                        "entityFields.entityId": { "==": entityId },
                        "entityFields.key": { "==": key },
                    });

                    return field ? field.value : null;
                },

                async setField(entityId: number, key: string, value: string | number) {
                    if (typeof value === "number" && Number.isNaN(value)) return;

                    const sanitizedValue = typeof value === "string" ? fieve.utils.sanitize(value) : value.toString();

                    const field = await this.getField(entityId, key);

                    if (field !== null) {
                        await fieve.db
                            .update("entityFields")
                            .sets({ value: sanitizedValue })
                            .where({
                                entityId: { "==": entityId },
                                key: { "==": key },
                            });
                    } else {
                        await fieve.db.insert("entityFields").values({ entityId, key, value: sanitizedValue });
                    }
                },

                async getOne(params: Collections.EntityParams) {
                    const entityQuery = params.termId
                        ? fieve.db
                            .findOne('entities')
                            .join('termsRelationships', { entityId: { '==': "entities.id" } })
                            .map({
                                id: 'entities.id',
                                authorId: 'entities.authorId',
                                parentId: 'entities.parentId',
                                name: 'entities.name',
                                slug: 'entities.slug',
                                status: 'entities.status',
                                type: 'entities.type',
                                description: 'entities.description',
                                modifiedAt: 'entities.modifiedAt',
                                createdAt: 'entities.createdAt',
                            })
                            .where({ ...parseParams(params), 'termsRelationships.termId': typeof params.termId === 'number' ? { "==": params.termId } : { $in: params.termId } })
                        : fieve.db.findOne("entities").where(parseParams(params))

                    const entity = await entityQuery
                        .include({ ...params.include, terms: params.include?.terms ? { term: true } : false })

                    return entity ? prepareEntity(entity) : entity
                },

                async getAll(params: Collections.EntityParams & { offset?: number; limit?: number } = {}) {
                    const entitiesQuery = params.termId
                        ? fieve.db
                            .findAll('entities')
                            .join('termsRelationships', { entityId: { '==': "entities.id" } })
                            .map({
                                id: 'entities.id',
                                authorId: 'entities.authorId',
                                parentId: 'entities.parentId',
                                name: 'entities.name',
                                slug: 'entities.slug',
                                status: 'entities.status',
                                type: 'entities.type',
                                description: 'entities.description',
                                modifiedAt: 'entities.modifiedAt',
                                createdAt: 'entities.createdAt',
                            })
                            .where({ ...parseParams(params), 'termsRelationships.termId': typeof params.termId === 'number' ? { "==": params.termId } : { $in: params.termId } })
                        : fieve.db.findAll("entities").where(parseParams(params))

                    const entities = await entitiesQuery
                        .include({ ...params.include, terms: params.include?.terms ? { term: true } : false })
                        .offset(params.offset ?? 0)
                        .limit(params.limit ?? 50);

                    return entities.map(prepareEntity)
                },

                async setTerms(entityId: number, termIds: number[], type: string) {
                    const termsToSet = await fieve.db.findAll('terms').where({ 'terms.id': { $in: termIds }, 'terms.type': { '==': type } }).map({ id: 'terms.id' })
                    const termsToUnset = await fieve.db.findAll('terms').join('termsRelationships', { termId: { '==': 'terms.id' } }).where({ 'termsRelationships.entityId': { '==': entityId }, 'terms.type': { '==': type } }).map(({ id: 'terms.id' }))

                    await Promise.all([
                        fieve.db.delete('termsRelationships').where({ entityId: { '==': entityId }, termId: { $in: termsToUnset.map(({ id }) => id) } }),
                        !!termsToSet.length && fieve.db.insert('termsRelationships').values(termsToSet.map(({ id }) => ({ entityId, termId: id })))
                    ])

                    return termsToSet.map(({ id }) => id)
                },

                async count(params: Collections.EntityParams) {
                    const entitiesCountQuery = params.termId
                        ? fieve.db
                            .findOne('entities')
                            .join('termsRelationships', { entityId: { '==': "entities.id" } })
                            .map({ count: (_: number) => "count(*)" })
                            .where({ ...parseParams(params), 'termsRelationships.termId': typeof params.termId === 'number' ? { "==": params.termId } : { $in: params.termId } })
                        : fieve.db.findOne("entities").map({ count: (_: number) => "count(*)" }).where(parseParams(params))

                    const result = await entitiesCountQuery

                    return result?.count ?? 0;
                },

                async create(payload: Collections.CreateEntity, params?: Collections.EntityParams) {
                    const currentDate = new Date();
                    const {
                        parentId,
                        authorId,
                        name,
                        slug,
                        status,
                        description,
                        fields = {},
                        terms = {},
                        modifiedAt = currentDate,
                        createdAt = currentDate,
                    } = payload;

                    if (!slug || !name || status < 0) {
                        throw new Error('Bad payload')
                    }

                    if (await this.getOne({ slug })) {
                        throw new Error("Already exists");
                    }

                    const result = await fieve.db
                        .insert("entities")
                        .values({
                            parentId,
                            authorId,
                            type: uid,
                            status: Math.max(status, 0),
                            name: fieve.utils.sanitize(name),
                            slug: fieve.utils.sanitize(slug),
                            description: description && fieve.utils.sanitize(description),
                            modifiedAt,
                            createdAt,
                        })
                        .returning({
                            id: true,
                        });

                    await Promise.all([
                        ...Object.entries(fields).map(([key, value]) => this.setField(result.id, key, value)),
                        ...Object.entries(terms).map(([type, ids]) => this.setTerms(result.id, ids, type))
                    ]);

                    const createdEntity = await this.getOne({ ...params, id: result.id })

                    if (!createdEntity) {
                        throw new Error('Database error')
                    }

                    return createdEntity
                },

                async update(id: number, payload: Collections.UpdateEntity, params?: Collections.EntityParams) {
                    const { parentId, authorId, name, slug, status, description, fields = {}, terms = {}, modifiedAt = new Date(), createdAt } = payload;

                    if (slug === "" || name === "" || (status !== undefined && status < 0)) {
                        throw new Error('Bad payload')
                    }

                    if (slug && (await this.getOne({ slug }))) {
                        throw new Error("Already exists");
                    }

                    const result = await fieve.db
                        .update("entities")
                        .sets({
                            parentId,
                            authorId,
                            status: status && status >= 0 ? status : undefined,
                            name: name && fieve.utils.sanitize(name),
                            slug: slug && fieve.utils.sanitize(slug),
                            description: description && fieve.utils.sanitize(description),
                            modifiedAt,
                            createdAt
                        })
                        .where({ id: { "==": id } })
                        .returning({
                            id: true,
                        });

                    await Promise.all([
                        ...Object.entries(fields).map(([key, value]) => this.setField(result.id, key, value)),
                        ...Object.entries(terms).map(([type, ids]) => this.setTerms(result.id, ids, type))
                    ]);

                    const updatedEntity = await this.getOne({ ...params, id: result.id })

                    if (!updatedEntity) {
                        throw new Error('Database error')
                    }

                    return updatedEntity
                },

                async remove(id: number) {
                    await Promise.all([
                        fieve.db.delete("termsRelationships").where({ entityId: { "==": id } }),
                        fieve.db.delete("entityFields").where({ entityId: { "==": id } }),
                    ]);
                    await fieve.db.delete("entities").where({ id: { "==": id } });
                },
            }
        },

        term: (uid: string) => {
            const parseParams = (params: Collections.TermParams) => ({
                "terms.id": typeof params.id === "number" ? { "==": params.id } : { in: params.id },
                "terms.type": { "==": uid },
                "terms.name": { "==": params.name },
                "terms.slug": { "==": params.slug },
                "terms.parentId": { "==": params.parentId },
                "terms.modifiedAt": params.modifiedBefore ? { "<": params.modifiedBefore } : { ">": params.modifiedAfter },
                "terms.createdAt": params.createdBefore ? { "<": params.createdBefore } : { ">": params.createdAfter },
            })

            const prepareTerm = ({ fields, ...restTerm }: Omit<Collections.Term, "fields"> & { fields?: Collections.Field[] }): Collections.Term => ({
                ...restTerm,
                ...(fields && { fields: prepareFields(fields) })
            })

            return {
                async getField(termId: number, key: string) {
                    const field = await fieve.db.findOne("termFields").where({
                        "termFields.termId": { "==": termId },
                        "termFields.key": { "==": key },
                    });

                    return field ? field.value : null;
                },

                async setField(termId: number, key: string, value: string | number) {
                    if (typeof value === "number" && !Number.isInteger(value)) return;

                    const sanitizedValue = typeof value === "string" ? fieve.utils.sanitize(value) : value.toString();

                    const field = await this.getField(termId, key);

                    if (field !== null) {
                        await fieve.db
                            .update("termFields")
                            .sets({ value: sanitizedValue })
                            .where({
                                termId: { "==": termId },
                                key: { "==": key },
                            });
                    } else {
                        await fieve.db.insert("termFields").values({ termId, key, value: sanitizedValue });
                    }
                },

                async getOne(params: Collections.TermParams) {
                    const termsQuery = params.entityId
                        ? fieve.db
                            .findOne("terms")
                            .join("termsRelationships", { termId: { "==": "terms.id" } })
                            .map({
                                id: "terms.id",
                                parentId: "terms.parentId",
                                name: "terms.name",
                                slug: "terms.slug",
                                type: "terms.type",
                                modifiedAt: "terms.modifiedAt",
                                createdAt: "terms.createdAt",
                            })
                            .where({ ...parseParams(params), "termsRelationships.entityId": typeof params.entityId === 'number' ? { "==": params.entityId } : { $in: params.entityId } })
                        : fieve.db.findOne("terms").where(parseParams(params));

                    const term = await termsQuery
                        .include(params.include ?? {})

                    return term ? prepareTerm(term) : null
                },

                async getAll(params: Collections.TermParams & { offset?: number; limit?: number } = {}) {
                    const termsQuery = params.entityId
                        ? fieve.db
                            .findAll("terms")
                            .join("termsRelationships", { termId: { "==": "terms.id" } })
                            .map({
                                id: "terms.id",
                                parentId: "terms.parentId",
                                name: "terms.name",
                                slug: "terms.slug",
                                type: "terms.type",
                                modifiedAt: "terms.modifiedAt",
                                createdAt: "terms.createdAt",
                            })
                            .where({ ...parseParams(params), "termsRelationships.entityId": typeof params.entityId === 'number' ? { "==": params.entityId } : { $in: params.entityId } })
                        : fieve.db.findAll("terms").where(parseParams(params));

                    const terms = await termsQuery
                        .include(params.include ?? {})
                        .offset(params.offset ?? 0)
                        .limit(params.limit ?? 50);

                    return terms.map(prepareTerm)
                },

                async count(params: Collections.TermParams) {
                    const termsCountQuery = params.entityId
                        ? fieve.db
                            .findOne("terms")
                            .join("termsRelationships", { termId: { "==": "terms.id" } })
                            .map({ count: (_: number) => "count(*)" })
                            .where({ ...parseParams(params), "termsRelationships.entityId": typeof params.entityId === 'number' ? { "==": params.entityId } : { $in: params.entityId } })
                        : fieve.db
                            .findOne("terms")
                            .where(parseParams(params))
                            .map({ count: (_: number) => "count(*)" });

                    const result = await termsCountQuery;

                    return result?.count ?? 0;
                },

                async create(payload: Collections.CreateTerm, params?: Collections.TermParams) {
                    const currentDate = new Date();
                    const { parentId, name, slug, fields = {}, modifiedAt = currentDate, createdAt = currentDate } = payload;

                    if (!slug || !name) {
                        throw new Error('Bad payload')
                    }

                    if (await this.getOne({ slug })) {
                        throw new Error("Already exists");
                    }

                    const result = await fieve.db
                        .insert("terms")
                        .values({
                            parentId,
                            type: uid,
                            name: fieve.utils.sanitize(name),
                            slug: fieve.utils.sanitize(slug),
                            modifiedAt,
                            createdAt,
                        })
                        .returning({
                            id: true,
                        });

                    await Promise.all(Object.entries(fields).map(([key, value]) => this.setField(result.id, key, value)));

                    const createdTerm = await this.getOne({ ...params, id: result.id })

                    if (!createdTerm) {
                        throw new Error('Database error')
                    }

                    return createdTerm
                },

                async update(id: number, payload: Collections.UpdateTerm, params?: Collections.TermParams) {
                    const { parentId, name, slug, fields = {}, modifiedAt = new Date(), createdAt } = payload;

                    if (slug === "" || name === "") {
                        throw new Error('Bad payload')
                    }

                    if (slug && (await this.getOne({ slug }))) {
                        throw new Error("Already exists");
                    }

                    const result = await fieve.db
                        .update("terms")
                        .sets({
                            parentId,
                            name: name && fieve.utils.sanitize(name),
                            slug: slug && fieve.utils.sanitize(slug),
                            modifiedAt,
                            createdAt
                        })
                        .where({ id: { "==": id } })
                        .returning({
                            id: true,
                        });

                    await Promise.all(Object.entries(fields).map(([key, value]) => this.setField(result.id, key, value)));

                    const updatedTerm = await this.getOne({ ...params, id: result.id })

                    if (!updatedTerm) {
                        throw new Error('Database error')
                    }

                    return updatedTerm
                },

                async remove(id: number) {
                    await Promise.all([
                        fieve.db.delete("termsRelationships").where({ termId: { "==": id } }),
                        fieve.db.delete("termFields").where({ termId: { "==": id } }),
                    ]);
                    await fieve.db.delete("terms").where({ id: { "==": id } });
                },
            }
        }
    }
}
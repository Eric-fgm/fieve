import { unlink } from "node:fs/promises";
import isValidFilename from "valid-filename";

import type { Collections, Plugin } from "@/types";

type UploadParams = Collections.EntityParams
type CreateUpload = Omit<Collections.CreateEntity, "slug" | "type" | "status"> & { file: File; status?: number };
type UpdateUpload = Omit<Partial<CreateUpload>, "name" | "file">;

const UPLOADER_UID = 'uploader'

export default ((fieve) => {
	const validateFilename = isValidFilename;

	const getDestination = (filename: string, { tmp }: { tmp?: boolean } = { tmp: false }) => {
		return `./public/${tmp ? fieve.config.uploader.tmpPath : fieve.config.uploader.path}/${filename}`;
	};

	const getPublicPath = (filename: string) => {
		return `${fieve.config.admin.url}/public/${fieve.config.uploader.path}/${filename}`;
	};

	const getUniqueFilename = async (filename: string) => {
		if (!validateFilename(filename)) {
			throw new Error(`Invalid filename "${filename}"`);
		}

		const destination = getDestination(filename);
		const tmpDestination = getDestination(filename, { tmp: true });

		if (!(await Bun.file(destination).exists()) && !(await Bun.file(tmpDestination).exists())) {
			return filename;
		}

		const extentions = filename.split(".").filter(Boolean).slice(1).join(".");
		const rawName = filename.split(".").shift();

		let newFilename = `${rawName}-1-.${extentions}`;
		let number = 2;

		while (
			(await Bun.file(getDestination(newFilename)).exists()) ||
			(await Bun.file(getDestination(newFilename, { tmp: true })).exists())
		) {
			newFilename = newFilename.replace(new RegExp(`-[1-9]-.${extentions}`), `-${number}-.${extentions}`);

			if (++number >= 10) {
				throw new Error(`Could not create unique filename for "${filename}"`);
			}
		}

		return newFilename;
	};

	const getFileSize = async (id: number, filesize?: string) => {
		const rawSize = filesize ? filesize : await fieve.collections.entity(UPLOADER_UID).getField(id, "fileSize")
		return fieve.utils.parseInteger(rawSize, { defaultValue: 0 });
	};

	const setFileSize = async (id: number, value: number) => {
		await fieve.collections.entity(UPLOADER_UID).setField(id, "fileSize", value);
	};

	const getOne = async (params: UploadParams) => {
		const upload = await fieve.collections.entity(UPLOADER_UID).getOne(params);

		if (!upload) {
			return null;
		}

		return await prepareUpload(upload);
	};

	const prepareUpload = async <T extends Collections.Entity & { fields?: Record<string, string> }>({
		fields,
		...restUpload
	}: T) => {
		const { filesize, ...restFields } = fields ?? {}

		return {
			...restUpload,
			...(fields && { fields: restFields, filesize: await getFileSize(restUpload.id, filesize) }),
		};
	};

	return {
		validateFilename,

		getDestination,

		getPublicPath,

		getUniqueFilename,

		getFileSize,

		setFileSize,

		getOne,

		async getAll(params: UploadParams & { offset?: number; limit?: number } = {}) {
			const uploads = await fieve.collections.entity(UPLOADER_UID).getAll(params);

			return await Promise.all(uploads.map(prepareUpload));
		},

		async count(params: UploadParams = {}) {
			return await fieve.collections.entity(UPLOADER_UID).count(params);
		},

		async upload(payload: CreateUpload, params: UploadParams = {}) {
			const { file, name, authorId, fields = {} } = payload;

			if (file.size > fieve.config.uploader.maxSize) {
				throw new Error("File size limit exceeded");
			}

			const filename = await getUniqueFilename(name);
			const destination = getDestination(filename);

			await Bun.write(destination, file);

			const createdUpload = await fieve.collections.entity(UPLOADER_UID).create({
				name: filename,
				authorId,
				status: 1,
				slug: getPublicPath(filename),
				fields: { ...fields, filesize: file.size },
			}, params);

			return prepareUpload(createdUpload)

		},

		async update(id: number, payload: UpdateUpload, params: UploadParams = {}) {
			const updatedUpload = await fieve.collections.entity(UPLOADER_UID).update(id, payload, params);

			return prepareUpload(updatedUpload)
		},

		async remove(id: number) {
			const uploadToRemove = await getOne({ id });
			if (!uploadToRemove) {
				throw new Error("Not found");
			}

			const { name } = uploadToRemove;

			const destination = getDestination(name);

			await unlink(destination);

			if (await Bun.file(destination).exists()) {
				throw new Error(`Could not remove "${name}"`);
			}

			await fieve.collections.entity(UPLOADER_UID).remove(id);
		},
	};
}) satisfies Plugin.Services;

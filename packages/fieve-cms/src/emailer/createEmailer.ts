import { createTransport } from "nodemailer";

import type { Emailer } from "@/types";

const createEmailer = async (config: Emailer.Config): Promise<Emailer.Instance> => {
	const transporter = createTransport(config);

	if (!(await transporter.verify())) throw new Error("Could not connect to SMTP");

	return transporter;
};

export default createEmailer;

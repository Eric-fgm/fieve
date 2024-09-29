import inquirer from 'inquirer';

import type { Plugin } from "@/types";

export default (async (fieve) => {
    const firstExistingUser = await fieve.service('users').getOne({ id: 1 })

    if (!firstExistingUser) {
        const { email } = await inquirer.prompt<{
            email: string;
        }>([
            {
                type: 'input',
                default: '',
                name: 'email',
                message: 'What is your root email?',
            },
        ]);

        const { password } = await inquirer.prompt<{
            password: string;
        }>([
            {
                type: 'input',
                default: '',
                name: 'password',
                message: 'What is your root password?',
            },
        ]);

        await fieve.service('users').create({ email, password })
    }


    const firstExistingRole = await fieve.db.findOne('roles').where({ 'roles.name': { '==': 'admin' } })

    if (!firstExistingRole) {
        const { id: roleId } = await fieve.db.insert('roles').values({ name: 'admin' }).returning({ id: true })
        await fieve.service('users').setRoles(1, [roleId])
    }
}) satisfies Plugin.Setup
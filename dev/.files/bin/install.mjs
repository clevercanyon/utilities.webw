#!/usr/bin/env node
/**
 * Prepare CLI.
 *
 * @note PLEASE DO NOT EDIT THIS FILE!
 * @note This entire file will be updated automatically.
 * @note Instead of editing here, please review <https://github.com/clevercanyon/skeleton>.
 */

import fs from 'node:fs';
import path from 'node:path';
import { $chalk, $yargs } from '../../../node_modules/@clevercanyon/utilities.node/dist/index.js';
import u from '../resources/utilities.mjs';

/**
 * Project command.
 */
class Project {
    /**
     * Constructor.
     */
    constructor(args) {
        this.args = args;
    }

    /**
     * Runs CMD.
     */
    async run() {
        await this.#install();

        if (this.args.dryRun) {
            u.log($chalk.cyanBright('Dry run. This was all a simulation.'));
        }
    }

    /**
     * Runs install.
     */
    async #install() {
        /**
         * Checks if git repo is dirty.
         */

        if ((await u.isGitRepo()) && (await u.isGitRepoDirty())) {
            // We will allow a single `package-lock.json` change to exist as the only difference.
            // e.g., In case of `npm install` having been run vs. `npm ci`, which does better.
            if ('M ' + path.relative(u.projDir, u.pkgLockFile) !== u.gitStatus({ short: true })) {
                throw new Error('Git repo is dirty.');
            }
        }

        /**
         * Installs NPM packages; populating `./node_modules`.
         */

        if (fs.existsSync(u.pkgLockFile)) {
            u.log($chalk.green('Running a clean install of NPM packages.'));
            if (!this.args.dryRun) {
                await u.npmCleanInstall();
            }
        } else {
            u.log($chalk.green('Running an install of NPM packages.'));
            if (!this.args.dryRun) {
                await u.npmInstall();
            }
        }

        /**
         * Installs Dotenv Vault variables.
         */

        if (await u.isEnvsVault()) {
            u.log($chalk.green('Installing Dotenv Vault variables.'));
            if (!this.args.dryRun) {
                await u.envsInstallOrDecrypt({ mode: this.args.mode });
            }
        }

        /**
         * Builds the app using Vite in given mode.
         */

        if (await u.isViteBuild()) {
            u.log($chalk.green('Building with Vite; `' + this.args.mode + '` mode.'));
            if (!this.args.dryRun) {
                await u.viteBuild({ mode: this.args.mode });
            }
        }

        /**
         * Signals completion with success.
         */

        u.log(await u.finaleBox('Success', 'Project install complete.'));
    }
}

/**
 * Yargs ⛵🏴‍☠.
 */
await (async () => {
    await u.propagateUserEnvVars();
    await (
        await $yargs.cli({
            scriptName: 'madrun install',
            version: u.pkgVersion,
        })
    )
        .command({
            command: ['project'],
            describe: 'Installs NPM packages, envs, and builds distro.',
            builder: (yargs) => {
                return yargs
                    .options({
                        mode: {
                            type: 'string',
                            requiresArg: true,
                            demandOption: false,
                            default: 'prod',
                            choices: ['dev', 'ci', 'stage', 'prod'],
                            description: 'Build and env mode.',
                        },
                        dryRun: {
                            type: 'boolean',
                            requiresArg: false,
                            demandOption: false,
                            default: false,
                            description: 'Dry run?',
                        },
                    })
                    .check(async (/* args */) => {
                        return true;
                    });
            },
            handler: async (args) => {
                await new Project(args).run();
            },
        })
        .parse();
})();

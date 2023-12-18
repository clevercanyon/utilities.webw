#!/usr/bin/env node
/**
 * Madrun config file.
 *
 * Madrun is not aware of this config file's location.
 *
 * @note PLEASE DO NOT EDIT THIS FILE!
 * @note This entire file will be updated automatically.
 * @note Instead of editing here, please review <https://github.com/clevercanyon/skeleton>.
 *
 * @see https://github.com/clevercanyon/madrun
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { $chalk, $cmd } from '../../../node_modules/@clevercanyon/utilities.node/dist/index.js';
import u from '../bin/includes/utilities.mjs';
import wranglerSettings from '../wrangler/settings.mjs';
import events from './includes/events.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projDir = path.resolve(__dirname, '../../..');
const distDir = path.resolve(__dirname, '../../../dist');

const nodeIncludeFile = path.resolve(__dirname, './includes/node.cjs');
const nodeEnvVars = { NODE_OPTIONS: $cmd.quote([`--require ${$cmd.esc(nodeIncludeFile)}`].join(' ')) };
const cloudflareEnvVars = { CLOUDFLARE_API_TOKEN: process.env.USER_CLOUDFLARE_TOKEN || '' };

/**
 * Defines madrun configuration.
 */
export default async () => {
    /**
     * Composition.
     */
    return {
        /**
         * Our own commands.
         */
        'envs': async () => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['./dev/.files/bin/envs.mjs', '{{@}}']],
            };
        },
        'install': async () => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['./dev/.files/bin/install.mjs', '{{@}}']],
            };
        },
        'update': async () => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['./dev/.files/bin/update.mjs', '{{@}}']],
            };
        },

        /**
         * Vite-powered commands.
         */
        'dev': async ({ args }) => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['npx', 'vite', 'dev', '{{@}}', ...(args.mode ? [] : ['--mode', 'dev'])]],
            };
        },
        'dev:prefresh': async ({ args }) => {
            return {
                env: { ...nodeEnvVars, VITE_PREFRESH_ENABLE: 'true' },
                cmds: [['npx', 'vite', 'dev', '{{@}}', ...(args.mode ? [] : ['--mode', 'dev'])]],
            };
        },
        'preview': async ({ args }) => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['npx', 'vite', 'preview', '{{@}}', ...(args.mode ? [] : ['--mode', 'dev'])]],
            };
        },
        'build': async ({ args }) => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['npx', 'vite', 'build', '{{@}}', ...(args.mode ? [] : ['--mode', 'prod'])]],
            };
        },

        /**
         * Test-related commands.
         */
        'jest': async () => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['npx', 'jest', '{{@}}']],
            };
        },
        'vitest': async ({ args }) => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['npx', 'vitest', '{{@}}', ...(args.mode ? [] : ['--mode', 'dev'])]],
            };
        },
        'tests': async ({ args }) => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['npx', 'vitest', '{{@}}', ...(args.mode ? [] : ['--mode', 'dev'])]],
            };
        },
        'tests:bench': async ({ args }) => {
            return {
                env: { ...nodeEnvVars },
                cmds: [['npx', 'vitest', 'bench', '{{@}}', ...(args.mode ? [] : ['--mode', 'dev'])]],
            };
        },
        'tests:sandbox': async ({ args }) => {
            return {
                env: { ...nodeEnvVars, VITEST_SANDBOX_ENABLE: 'true' },
                cmds: [['npx', 'vitest', '{{@}}', ...(args.mode ? [] : ['--mode', 'dev'])]],
            };
        },
        'tests:examples': async ({ args }) => {
            return {
                env: { ...nodeEnvVars, VITEST_EXAMPLES_ENABLE: 'true' },
                cmds: [['npx', 'vitest', '{{@}}', ...(args.mode ? [] : ['--mode', 'dev'])]],
            };
        },

        /**
         * Wrangler commands.
         */
        'wrangler': async ({ args }) => {
            const settings = await wranglerSettings();
            return {
                env: { ...nodeEnvVars, ...cloudflareEnvVars },
                opts: { ...('pages' === args._?.[0] ? { cwd: distDir } : {}) },
                // Setting `cwd` is a bug workaround; see: <https://o5p.me/k9Fqml>.
                cmds: [
                    // `$ madrun wrangler dev|pages`.
                    ...('dev' === args._?.[0] || 'pages' === args._?.[0]
                        ? [
                              async () => {
                                  if (!(await fs.existsSync(settings.osDir))) return;

                                  // Ensure `~/.wrangler/local-cert` directory exists.
                                  await fsp.mkdir(settings.osSSLCertDir, { recursive: true, mode: 0o700 });

                                  // Link our custom SSL key to that used by Wrangler.
                                  await fsp.rm(settings.osSSLKeyFile, { recursive: true, force: true });
                                  await fsp.symlink(settings.customSSLKeyFile, settings.osSSLKeyFile);

                                  // Link our custom SSL certificate to that used by Wrangler.
                                  await fsp.rm(settings.osSSLCertFile, { recursive: true, force: true });
                                  await fsp.symlink(settings.customSSLCertFile, settings.osSSLCertFile);
                              },
                          ]
                        : []),
                    ...('dev' === args._?.[0]
                        ? // `$ madrun wrangler dev`.
                          // Config pulled from `./wrangler.toml` in this case.
                          [['npx', 'wrangler', '{{@}}', ...(args.env ? [] : ['--env', 'dev'])]]
                        : //
                          // `$ madrun wrangler pages`.
                          // Config is not pulled from `./wrangler.toml` in this case.
                          // Therefore, we must configure everything at command line.
                          'pages' === args._?.[0]
                          ? [
                                // `$ madrun wrangler pages dev`.
                                ...('dev' === args._?.[1] && !args.help
                                    ? [
                                          {
                                              opts: { cwd: projDir },
                                              env: { VITE_WRANGLER_MODE: 'dev', ...nodeEnvVars, ...cloudflareEnvVars },
                                              cmd: ['npx', 'vite', 'build', '--mode', 'dev'],
                                          },
                                      ]
                                    : []),
                                // `$ madrun wrangler pages deploy|publish`.
                                ...(['deploy', 'publish'].includes(args._?.[1]) && !args.help
                                    ? [
                                          {
                                              opts: { cwd: projDir },
                                              cmd: ['npx', 'vite', 'build', '--mode', // Mode can only be `prod` or `stage` when deploying remotely.
                                                args.branch && args.branch !== settings.defaultPagesProductionBranch ? 'stage' : 'prod'], // prettier-ignore
                                          },
                                      ]
                                    : []),
                                // `$ madrun wrangler pages *`.
                                [
                                    'npx',
                                    'wrangler',
                                    '{{@}}',

                                    // Default `project` command args.
                                    ...('project' === args._?.[1] && 'create' === args._?.[2] ? (args._?.[3] ? [] : [settings.defaultPagesProjectName]) : []),
                                    ...('project' === args._?.[1] && 'create' === args._?.[2]
                                        ? args.productionBranch
                                            ? [] // This is the production branch on the Cloudflare side.
                                            : ['--production-branch', settings.defaultPagesProductionBranch]
                                        : []),

                                    // Default `dev` command args.
                                    ...('dev' === args._?.[1] ? (args._?.[2] ? [] : [distDir]) : []),
                                    ...('dev' === args._?.[1] ? (args.ip ? [] : ['--ip', settings.defaultLocalIP]) : []),
                                    ...('dev' === args._?.[1] ? (args.port ? [] : ['--port', settings.defaultLocalPort]) : []),
                                    ...('dev' === args._?.[1] ? (args.localProtocol ? [] : ['--local-protocol', settings.defaultLocalProtocol]) : []),
                                    ...('dev' === args._?.[1] ? (args.compatibilityDate ? [] : ['--compatibility-date', settings.compatibilityDate]) : []),
                                    ...('dev' === args._?.[1]
                                        ? args.compatibilityFlag || args.compatibilityFlags
                                            ? [] // `--compatibility-flag` is an alias of `--compatibility-flags`.
                                            : settings.compatibilityFlags.map((f) => ['--compatibility-flag', f]).flat()
                                        : []),
                                    ...('dev' === args._?.[1] ? (args.logLevel ? [] : ['--log-level', settings.defaultDevLogLevel]) : []),
                                    ...('dev' === args._?.[1] ? ['--binding', settings.miniflareEnvVarAsString] : []), // Always on for `dev`. Note: `--binding` can be passed multiple times.

                                    // Default `deploy|publish` command args.
                                    ...(['deploy', 'publish'].includes(args._?.[1]) ? (args._?.[2] ? [] : [distDir]) : []),
                                    ...(['deploy', 'publish'].includes(args._?.[1]) ? (args.projectName ? [] : ['--project-name', settings.defaultPagesProjectName]) : []),
                                    ...(['deploy', 'publish'].includes(args._?.[1]) ? (args.branch ? [] : ['--branch', settings.defaultPagesProductionBranch]) : []),
                                    ...(['deploy', 'publish'].includes(args._?.[1]) ? (args.commitDirty ? [] : ['--commit-dirty', 'true']) : []), // Let’s not nag ourselves.

                                    // Default `deployment` command args.
                                    ...('deployment' === args._?.[1] && 'list' === args._?.[2]
                                        ? args.projectName
                                            ? []
                                            : ['--project-name', settings.defaultPagesProjectName]
                                        : []),
                                    ...('deployment' === args._?.[1] && 'tail' === args._?.[2]
                                        ? args.projectName
                                            ? []
                                            : ['--project-name', settings.defaultPagesProjectName]
                                        : []),
                                    ...('deployment' === args._?.[1] && 'tail' === args._?.[2]
                                        ? args.environment
                                            ? []
                                            : ['--environment', settings.defaultPagesProductionEnvironment]
                                        : []),
                                ],
                            ]
                          : // `$ madrun wrangler *`.
                            [['npx', 'wrangler', '{{@}}']]),
                ],
            };
        },
        'wrangler:flush': async () => {
            const settings = await wranglerSettings();
            return {
                env: { ...nodeEnvVars, ...cloudflareEnvVars },
                cmds: [
                    async () => {
                        u.log($chalk.green('Flushing Wrangler state.'));
                        await fsp.rm(settings.projStateDir, { recursive: true, force: true });
                    },
                ],
            };
        },

        /**
         * Event-driven commands.
         */
        ...events, // e.g., `on::madrun:default:new`.
    };
};
